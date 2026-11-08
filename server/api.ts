import express from 'express';
import { db, Product, Sale, Shift, ShiftCashMovement, User, InventoryMovement, ReturnRecord, DailyClosing, Expense, Supplier, Purchase, TransferRecord } from './db.js';
import { GoogleGenAI } from '@google/genai';

export const apiRouter = express.Router();

// Initialize Gemini Client with v1alpha for TTS and multimodal features
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    apiVersion: 'v1alpha',
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Middleware for parsing json is already set in server.ts

// ==========================================
// 1. AUTHENTICATION & USERS
// ==========================================

apiRouter.post('/auth/login', (req, res) => {
  const { username, pin } = req.body;
  const users = db.get('users');

  // Match by username and pin, or if username not provided match by pin
  const user = users.find(u => {
    if (!u.isActive) return false;
    if (username) {
      return (u.username.toLowerCase() === username.toLowerCase() || u.name.toLowerCase() === username.toLowerCase()) && u.pin === pin;
    }
    return u.pin === pin;
  });

  if (!user) {
    return res.status(401).json({ error: 'بيانات الدخول غير صحيحة أو الحساب غير نشط' });
  }

  // Find store details if assigned
  const stores = db.get('stores');
  const userStore = user.storeId ? stores.find(s => s.id === user.storeId) : null;

  // If cashier, check for active open shift
  const shifts = db.get('shifts');
  const activeShift = shifts.find(s => s.cashierId === user.id && s.status === 'open');

  db.logAudit(user.id, user.name, 'تسجيل دخول', `قام المستخدم بتسجيل الدخول كـ ${user.role === 'admin' ? 'مدير' : 'كاشير'}`, user.storeId);

  return res.json({
    user,
    store: userStore,
    activeShift,
  });
});

apiRouter.get('/auth/users', (req, res) => {
  const users = db.get('users').map(u => ({
    id: u.id,
    username: u.username,
    name: u.name,
    role: u.role,
    storeId: u.storeId,
    phone: u.phone,
    isActive: u.isActive,
    createdAt: u.createdAt,
  }));
  res.json(users);
});

apiRouter.post('/auth/users', (req, res) => {
  const { username, pin, name, role, storeId, phone } = req.body;
  if (!username || !pin || !name || !role) {
    return res.status(400).json({ error: 'جميع الحقول الأساسية مطلوبة' });
  }

  const users = db.get('users');
  if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
    return res.status(400).json({ error: 'اسم المستخدم مسجل مسبقاً' });
  }

  const newUser: User = {
    id: `usr_${Date.now()}`,
    username,
    pin,
    name,
    role: role as 'admin' | 'cashier',
    storeId: role === 'cashier' ? storeId : undefined,
    phone: phone || '',
    isActive: true,
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  db.save();
  db.logAudit('usr_admin', 'المدير العام', 'إضافة مستخدم', `تم إنشاء حساب ${name} (${role})`, storeId);

  res.json(newUser);
});

apiRouter.patch('/auth/users/:id', (req, res) => {
  const { id } = req.params;
  const { name, pin, storeId, isActive, phone } = req.body;
  const users = db.get('users');
  const user = users.find(u => u.id === id);

  if (!user) {
    return res.status(404).json({ error: 'المستخدم غير موجود' });
  }

  if (name !== undefined) user.name = name;
  if (pin !== undefined && pin.trim()) user.pin = pin;
  if (storeId !== undefined) user.storeId = storeId;
  if (isActive !== undefined) user.isActive = isActive;
  if (phone !== undefined) user.phone = phone;

  db.save();
  res.json(user);
});

// ==========================================
// 2. STORES & BRANCHES
// ==========================================

apiRouter.get('/stores', (req, res) => {
  res.json(db.get('stores'));
});

apiRouter.patch('/stores/:id', (req, res) => {
  const { id } = req.params;
  const stores = db.get('stores');
  const store = stores.find(s => s.id === id);
  if (!store) return res.status(404).json({ error: 'المحل غير موجود' });

  const { name, phone, address, taxNumber, receiptFooter, color } = req.body;
  if (name) store.name = name;
  if (phone) store.phone = phone;
  if (address) store.address = address;
  if (taxNumber) store.taxNumber = taxNumber;
  if (receiptFooter) store.receiptFooter = receiptFooter;
  if (color) store.color = color;

  db.save();
  res.json(store);
});

// ==========================================
// 3. CATEGORIES
// ==========================================

apiRouter.get('/categories', (req, res) => {
  const { storeId } = req.query;
  let categories = db.get('categories');
  if (storeId) {
    categories = categories.filter(c => c.storeId === storeId);
  }
  res.json(categories);
});

apiRouter.post('/categories', (req, res) => {
  const { storeId, name, icon } = req.body;
  if (!storeId || !name) {
    return res.status(400).json({ error: 'المحل واسم القسم مطلوبان' });
  }
  const categories = db.get('categories');
  const newCat = {
    id: `cat_${Date.now()}`,
    storeId,
    name,
    icon: icon || 'Folder',
    displayOrder: categories.length + 1,
  };
  categories.push(newCat);
  db.save();
  res.json(newCat);
});

// ==========================================
// 4. PRODUCTS & SUGGESTIONS CATALOG
// ==========================================

apiRouter.get('/products', (req, res) => {
  const { storeId, search, categoryId, lowStock, expiringSoon } = req.query;
  let products = db.get('products').filter(p => p.isActive);

  if (storeId && storeId !== 'all') {
    products = products.filter(p => p.storeId === storeId);
  }

  if (categoryId) {
    products = products.filter(p => p.categoryId === categoryId);
  }

  if (search) {
    const q = (search as string).toLowerCase().trim();
    products = products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.barcode.includes(q) ||
      p.brand.toLowerCase().includes(q)
    );
  }

  if (lowStock === 'true') {
    products = products.filter(p => p.currentStock <= p.minStockAlert);
  }

  if (expiringSoon === 'true') {
    const nextWeek = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0];
    products = products.filter(p => p.expiryDate && p.expiryDate <= nextWeek);
  }

  res.json(products);
});

apiRouter.get('/products/suggested', (req, res) => {
  const { storeType, categoryName, search } = req.query;
  let items = db.get('suggestedProducts');

  if (storeType) {
    items = items.filter(s => s.storeType === storeType);
  }
  if (categoryName) {
    items = items.filter(s => s.categoryName === categoryName);
  }
  if (search) {
    const q = (search as string).toLowerCase().trim();
    items = items.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.brand.toLowerCase().includes(q) ||
      s.categoryName.toLowerCase().includes(q)
    );
  }

  res.json(items);
});

apiRouter.post('/products', (req, res) => {
  const {
    storeId,
    categoryId,
    name,
    brand,
    barcode,
    unit,
    costPrice,
    sellingPrice,
    currentStock,
    minStockAlert,
    expiryDate,
    productionDate,
    batchNumber,
    origin,
    notes,
    userId,
    userName,
  } = req.body;

  if (!storeId || !categoryId || !name || !barcode) {
    return res.status(400).json({ error: 'المحل والقسم واسم المنتج والباركود بيانات مطلوبة' });
  }

  const products = db.get('products');
  // Check barcode uniqueness in the same store
  if (products.some(p => p.storeId === storeId && p.barcode === barcode && p.isActive)) {
    return res.status(400).json({ error: 'الباركود مستخدم بالفعل داخل هذا المحل لمنتج آخر' });
  }

  const newProduct: Product = {
    id: `prod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    storeId,
    categoryId,
    name,
    brand: brand || '',
    barcode: barcode.trim(),
    unit: unit || 'قطعة',
    costPrice: Number(costPrice) || 0,
    sellingPrice: Number(sellingPrice) || 0,
    currentStock: Number(currentStock) || 0,
    minStockAlert: Number(minStockAlert) || 5,
    expiryDate: expiryDate || undefined,
    productionDate: productionDate || undefined,
    batchNumber: batchNumber || undefined,
    origin: origin || undefined,
    notes: notes || undefined,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  products.push(newProduct);

  // If initial stock > 0, log movement
  if (newProduct.currentStock > 0) {
    const movs = db.get('inventoryMovements');
    movs.push({
      id: `mov_${Date.now()}`,
      storeId,
      productId: newProduct.id,
      productName: newProduct.name,
      type: 'adjustment',
      quantity: newProduct.currentStock,
      previousStock: 0,
      newStock: newProduct.currentStock,
      notes: 'رصيد افتتاحي عند إضافة المنتج',
      userId: userId || 'admin',
      userName: userName || 'المدير العام',
      createdAt: new Date().toISOString(),
    });
  }

  db.save();
  db.logAudit(userId || 'admin', userName || 'المدير العام', 'إضافة منتج', `تمت إضافة المنتج: ${name} بسعر ${sellingPrice} ج.م`, storeId);

  res.json(newProduct);
});

apiRouter.post('/products/adopt-suggested', (req, res) => {
  const {
    suggestedId,
    storeId,
    categoryId,
    barcode,
    costPrice,
    sellingPrice,
    currentStock,
    minStockAlert,
    expiryDate,
    batchNumber,
    userId,
    userName,
  } = req.body;

  const suggested = db.get('suggestedProducts').find(s => s.id === suggestedId);
  if (!suggested) {
    return res.status(404).json({ error: 'المنتج المقترح غير موجود' });
  }

  const generatedBarcode = barcode || `622${Date.now().toString().slice(-9)}`;
  const products = db.get('products');

  if (products.some(p => p.storeId === storeId && p.barcode === generatedBarcode && p.isActive)) {
    return res.status(400).json({ error: 'الباركود مستخدم بالفعل' });
  }

  const newProduct: Product = {
    id: `prod_${Date.now()}`,
    storeId,
    categoryId: categoryId || 'cat_auto',
    name: suggested.name,
    brand: suggested.brand,
    barcode: generatedBarcode,
    unit: suggested.unit,
    costPrice: Number(costPrice ?? suggested.defaultCostPrice),
    sellingPrice: Number(sellingPrice ?? suggested.defaultSellingPrice),
    currentStock: Number(currentStock ?? 10),
    minStockAlert: Number(minStockAlert ?? 5),
    expiryDate: expiryDate || undefined,
    batchNumber: batchNumber || undefined,
    origin: suggested.origin || undefined,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  products.push(newProduct);

  if (newProduct.currentStock > 0) {
    db.get('inventoryMovements').push({
      id: `mov_${Date.now()}`,
      storeId,
      productId: newProduct.id,
      productName: newProduct.name,
      type: 'adjustment',
      quantity: newProduct.currentStock,
      previousStock: 0,
      newStock: newProduct.currentStock,
      notes: 'رصيد أولي لاعتماد منتج من القائمة المقترحة',
      userId: userId || 'admin',
      userName: userName || 'المدير العام',
      createdAt: new Date().toISOString(),
    });
  }

  db.save();
  db.logAudit(userId || 'admin', userName || 'المدير العام', 'اعتماد منتج مقترح', `تم اعتماد ${newProduct.name} في المخزن`, storeId);

  res.json(newProduct);
});

apiRouter.patch('/products/:id', (req, res) => {
  const { id } = req.params;
  const products = db.get('products');
  const prod = products.find(p => p.id === id);
  if (!prod) return res.status(404).json({ error: 'المنتج غير موجود' });

  const {
    name,
    brand,
    barcode,
    unit,
    costPrice,
    sellingPrice,
    minStockAlert,
    categoryId,
    expiryDate,
    batchNumber,
    origin,
    notes,
    userId,
    userName,
  } = req.body;

  if (name !== undefined) prod.name = name;
  if (brand !== undefined) prod.brand = brand;
  if (barcode !== undefined) prod.barcode = barcode;
  if (unit !== undefined) prod.unit = unit;
  if (costPrice !== undefined) prod.costPrice = Number(costPrice);
  if (sellingPrice !== undefined) prod.sellingPrice = Number(sellingPrice);
  if (minStockAlert !== undefined) prod.minStockAlert = Number(minStockAlert);
  if (categoryId !== undefined) prod.categoryId = categoryId;
  if (expiryDate !== undefined) prod.expiryDate = expiryDate;
  if (batchNumber !== undefined) prod.batchNumber = batchNumber;
  if (origin !== undefined) prod.origin = origin;
  if (notes !== undefined) prod.notes = notes;
  prod.updatedAt = new Date().toISOString();

  db.save();
  db.logAudit(userId || 'admin', userName || 'المدير العام', 'تعديل منتج', `تعديل بيانات المنتج ${prod.name}`, prod.storeId);

  res.json(prod);
});

apiRouter.delete('/products/:id', (req, res) => {
  const { id } = req.params;
  const products = db.get('products');
  const prod = products.find(p => p.id === id);
  if (!prod) return res.status(404).json({ error: 'المنتج غير موجود' });

  prod.isActive = false;
  prod.updatedAt = new Date().toISOString();

  db.save();
  db.logAudit('usr_admin', 'المدير العام', 'حذف منتج', `تم حذف المنتج ${prod.name}`, prod.storeId);

  res.json({ success: true, message: 'تم تعطيل/حذف المنتج بنجاح' });
});

// Inventory stock adjustment (جرد / تسوية رصيد)
apiRouter.post('/inventory/adjust', (req, res) => {
  const { productId, actualCount, reason, userId, userName } = req.body;
  const products = db.get('products');
  const prod = products.find(p => p.id === productId);
  if (!prod) return res.status(404).json({ error: 'المنتج غير موجود' });

  const prev = prod.currentStock;
  const target = Number(actualCount);
  const diff = target - prev;

  prod.currentStock = target;
  prod.updatedAt = new Date().toISOString();

  db.get('inventoryMovements').push({
    id: `mov_${Date.now()}`,
    storeId: prod.storeId,
    productId: prod.id,
    productName: prod.name,
    type: 'adjustment',
    quantity: diff,
    previousStock: prev,
    newStock: target,
    notes: reason || `تسوية جردية: ${diff >= 0 ? `زيادة (+${diff})` : `عجز (${diff})`}`,
    userId: userId || 'admin',
    userName: userName || 'المدير العام',
    createdAt: new Date().toISOString(),
  });

  db.save();
  db.logAudit(userId || 'admin', userName || 'المدير', 'تسوية جردية', `تعديل مخزون ${prod.name} من ${prev} إلى ${target} (${reason})`, prod.storeId);

  res.json({ success: true, product: prod, diff });
});

// Inter-store product transfer (تحويل منتجات بين المحلات)
apiRouter.post('/inventory/transfer', (req, res) => {
  const { fromStoreId, toStoreId, productId, quantity, notes, userId, userName } = req.body;
  if (!fromStoreId || !toStoreId || !productId || !quantity || quantity <= 0) {
    return res.status(400).json({ error: 'بيانات التحويل غير مكتملة' });
  }

  if (fromStoreId === toStoreId) {
    return res.status(400).json({ error: 'لا يمكن التحويل لنفس المحل' });
  }

  const products = db.get('products');
  const sourceProd = products.find(p => p.id === productId && p.storeId === fromStoreId);
  if (!sourceProd) return res.status(404).json({ error: 'المنتج غير موجود بالمحل المصدر' });

  if (sourceProd.currentStock < quantity) {
    return res.status(400).json({ error: `الكمية المتاحة في المصدر (${sourceProd.currentStock}) غير كافية للتحويل` });
  }

  // Deduct from source
  const prevSrc = sourceProd.currentStock;
  sourceProd.currentStock -= quantity;

  // Find or create in destination
  let destProd = products.find(p => p.storeId === toStoreId && p.barcode === sourceProd.barcode && p.isActive);
  let prevDest = 0;

  if (destProd) {
    prevDest = destProd.currentStock;
    destProd.currentStock += quantity;
  } else {
    // Create copy in destination store
    const categories = db.get('categories').filter(c => c.storeId === toStoreId);
    const destCatId = categories[0]?.id || 'cat_transfer';
    destProd = {
      id: `prod_${Date.now()}_dest`,
      storeId: toStoreId,
      categoryId: destCatId,
      name: sourceProd.name,
      brand: sourceProd.brand,
      barcode: sourceProd.barcode,
      unit: sourceProd.unit,
      costPrice: sourceProd.costPrice,
      sellingPrice: sourceProd.sellingPrice,
      currentStock: quantity,
      minStockAlert: sourceProd.minStockAlert,
      expiryDate: sourceProd.expiryDate,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    products.push(destProd);
  }

  // Record transfer record
  const transfer: TransferRecord = {
    id: `tr_${Date.now()}`,
    fromStoreId,
    toStoreId,
    productId,
    productName: sourceProd.name,
    quantity,
    notes: notes || 'تحويل بضاعة بين الفروع',
    createdBy: userName || 'المدير العام',
    createdAt: new Date().toISOString(),
  };
  db.get('transfers').push(transfer);

  // Record movements for both stores
  const movs = db.get('inventoryMovements');
  movs.push({
    id: `mov_${Date.now()}_out`,
    storeId: fromStoreId,
    productId: sourceProd.id,
    productName: sourceProd.name,
    type: 'transfer_out',
    quantity: -quantity,
    previousStock: prevSrc,
    newStock: sourceProd.currentStock,
    notes: `تحويل صادر إلى فرع آخر (${notes || ''})`,
    userId: userId || 'admin',
    userName: userName || 'المدير',
    createdAt: new Date().toISOString(),
  });

  movs.push({
    id: `mov_${Date.now()}_in`,
    storeId: toStoreId,
    productId: destProd.id,
    productName: destProd.name,
    type: 'transfer_in',
    quantity: quantity,
    previousStock: prevDest,
    newStock: destProd.currentStock,
    notes: `تحويل وارد من فرع آخر (${notes || ''})`,
    userId: userId || 'admin',
    userName: userName || 'المدير',
    createdAt: new Date().toISOString(),
  });

  db.save();
  db.logAudit(userId || 'admin', userName || 'المدير', 'تحويل مخزني', `تحويل ${quantity} ${sourceProd.unit} من ${sourceProd.name}`, fromStoreId);

  res.json({ success: true, transfer });
});

apiRouter.get('/inventory/movements', (req, res) => {
  const { storeId, productId } = req.query;
  let movs = db.get('inventoryMovements');
  if (storeId && storeId !== 'all') {
    movs = movs.filter(m => m.storeId === storeId);
  }
  if (productId) {
    movs = movs.filter(m => m.productId === productId);
  }
  res.json(movs.slice(0, 100)); // last 100 movements
});

// ==========================================
// 5. SHIFTS & CASH DRAWER (الورديات والجرد)
// ==========================================

apiRouter.get('/shifts/active', (req, res) => {
  const { cashierId, storeId } = req.query;
  const shifts = db.get('shifts');
  const active = shifts.find(s => {
    if (s.status !== 'open') return false;
    if (cashierId && s.cashierId !== cashierId) return false;
    if (storeId && s.storeId !== storeId) return false;
    return true;
  });
  res.json(active || null);
});

apiRouter.post('/shifts/open', (req, res) => {
  const { storeId, cashierId, cashierName, openingFloat, notes } = req.body;
  if (!storeId || !cashierId) {
    return res.status(400).json({ error: 'المحل والكاشير مطلوبان' });
  }

  const shifts = db.get('shifts');
  // Check if cashier already has an open shift
  const existing = shifts.find(s => s.cashierId === cashierId && s.status === 'open');
  if (existing) {
    return res.status(400).json({ error: 'يوجد بالفعل وردية مفتوحة لهذا الكاشير، يجب إغلاقها أولاً' });
  }

  const floatVal = Number(openingFloat) || 0;

  const newShift: Shift = {
    id: `shift_${Date.now()}`,
    storeId,
    cashierId,
    cashierName: cashierName || 'الكاشير',
    status: 'open',
    openedAt: new Date().toISOString(),
    openingFloat: floatVal,
    cashSales: 0,
    cardSales: 0,
    returnsAmount: 0,
    cashIn: 0,
    cashOut: 0,
    expectedCash: floatVal,
    billsCount: 0,
    notes: notes || '',
  };

  shifts.unshift(newShift);
  db.save();
  db.logAudit(cashierId, cashierName, 'فتح وردية', `تم فتح وردية جديدة برصيد بداية ${floatVal} ج.م`, storeId);

  res.json(newShift);
});

apiRouter.post('/shifts/movement', (req, res) => {
  const { shiftId, type, amount, reason, userId, userName } = req.body;
  const shifts = db.get('shifts');
  const shift = shifts.find(s => s.id === shiftId);

  if (!shift || shift.status !== 'open') {
    return res.status(400).json({ error: 'الوردية غير موجودة أو مغلقة' });
  }

  const numAmount = Number(amount);
  if (!numAmount || numAmount <= 0) {
    return res.status(400).json({ error: 'المبلغ غير صالح' });
  }

  if (type === 'out') {
    shift.cashOut += numAmount;
    shift.expectedCash -= numAmount;
  } else {
    shift.cashIn += numAmount;
    shift.expectedCash += numAmount;
  }

  const mov: ShiftCashMovement = {
    id: `sc_${Date.now()}`,
    shiftId,
    type,
    amount: numAmount,
    reason: reason || (type === 'in' ? 'إيداع نقدي بالدرج' : 'سحب نقدي من الدرج'),
    createdAt: new Date().toISOString(),
    createdBy: userName || 'الكاشير',
  };

  db.get('shiftCashMovements').push(mov);
  db.save();
  res.json({ success: true, shift, movement: mov });
});

apiRouter.post('/shifts/close', (req, res) => {
  const { shiftId, actualCash, notes, userId, userName } = req.body;
  const shifts = db.get('shifts');
  const shift = shifts.find(s => s.id === shiftId);

  if (!shift) {
    return res.status(404).json({ error: 'الوردية غير موجودة' });
  }
  if (shift.status === 'closed') {
    return res.status(400).json({ error: 'الوردية مغلقة بالفعل' });
  }

  const actual = Number(actualCash);
  const diff = actual - shift.expectedCash; // positive = surplus, negative = deficit

  shift.status = 'closed';
  shift.closedAt = new Date().toISOString();
  shift.actualCash = actual;
  shift.cashDifference = diff;
  if (notes) shift.notes = `${shift.notes ? shift.notes + ' | ' : ''}${notes}`;

  db.save();
  db.logAudit(
    userId || shift.cashierId,
    userName || shift.cashierName,
    'إغلاق وردية',
    `تم إغلاق الوردية. المتوقع: ${shift.expectedCash}، الفعلي: ${actual}، ${diff >= 0 ? `زيادة: ${diff}` : `عجز: ${Math.abs(diff)}`}`,
    shift.storeId
  );

  res.json({ success: true, shift });
});

apiRouter.get('/shifts/history', (req, res) => {
  const { storeId, cashierId } = req.query;
  let list = db.get('shifts');
  if (storeId && storeId !== 'all') {
    list = list.filter(s => s.storeId === storeId);
  }
  if (cashierId) {
    list = list.filter(s => s.cashierId === cashierId);
  }
  res.json(list);
});

// ==========================================
// 6. SALES & POS
// ==========================================

apiRouter.post('/sales', (req, res) => {
  const {
    storeId,
    cashierId,
    cashierName,
    shiftId,
    items,
    discount,
    paymentMethod,
    cashPaid,
    cardPaid,
    customerName,
  } = req.body;

  if (!storeId || !cashierId || !shiftId || !items || !items.length) {
    return res.status(400).json({ error: 'بيانات الفاتورة غير مكتملة' });
  }

  // Verify shift is open
  const shifts = db.get('shifts');
  const shift = shifts.find(s => s.id === shiftId);
  if (!shift || shift.status !== 'open') {
    return res.status(400).json({ error: 'لا يمكن إتمام البيع، الوردية مغلقة أو غير صالحة. يرجى فتح وردية أولاً.' });
  }

  const products = db.get('products');
  const movs = db.get('inventoryMovements');

  // Verify items and check stock availability
  const saleItems: any[] = [];
  let subtotal = 0;

  for (const item of items) {
    const prod = products.find(p => p.id === item.productId && p.storeId === storeId && p.isActive);
    if (!prod) {
      return res.status(400).json({ error: `المنتج (${item.name || item.productId}) غير متوفر في هذا المحل` });
    }

    const qty = Number(item.quantity) || 1;
    if (prod.currentStock < qty) {
      return res.status(400).json({
        error: `الكمية المطلوبة من "${prod.name}" (${qty}) غير متوفرة في المخزون! المتاح حالياً: ${prod.currentStock} فقط.`,
      });
    }

    const itemTotal = prod.sellingPrice * qty;
    subtotal += itemTotal;

    saleItems.push({
      productId: prod.id,
      name: prod.name,
      barcode: prod.barcode,
      unit: prod.unit,
      quantity: qty,
      unitPrice: prod.sellingPrice,
      costPrice: prod.costPrice,
      total: itemTotal,
    });
  }

  const disc = Number(discount) || 0;
  const total = Math.max(0, subtotal - disc);

  const cPaid = Number(cashPaid) || 0;
  const cdPaid = Number(cardPaid) || 0;
  const change = Math.max(0, (cPaid + cdPaid) - total);

  // Generate unique invoice number
  const store = db.get('stores').find(s => s.id === storeId);
  const prefix = store ? store.code.slice(0, 3) : 'INV';
  const invoiceNumber = `${prefix}-${Date.now().toString().slice(-6)}`;

  const sale: Sale = {
    id: `sale_${Date.now()}`,
    invoiceNumber,
    storeId,
    cashierId,
    cashierName,
    shiftId,
    items: saleItems,
    subtotal,
    discount: disc,
    total,
    paymentMethod: paymentMethod || 'cash',
    cashPaid: paymentMethod === 'card' ? 0 : cPaid,
    cardPaid: paymentMethod === 'cash' ? 0 : cdPaid,
    changeAmount: change,
    customerName: customerName || 'عميل نقدي',
    status: 'completed',
    createdAt: new Date().toISOString(),
  };

  // Deduct stock safely and record movements
  for (const sItem of saleItems) {
    const prod = products.find(p => p.id === sItem.productId)!;
    const prevStock = prod.currentStock;
    prod.currentStock -= sItem.quantity;
    prod.updatedAt = new Date().toISOString();

    movs.push({
      id: `mov_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      storeId,
      productId: prod.id,
      productName: prod.name,
      type: 'sale',
      quantity: -sItem.quantity,
      previousStock: prevStock,
      newStock: prod.currentStock,
      referenceId: sale.id,
      notes: `فاتورة بيع ${invoiceNumber}`,
      userId: cashierId,
      userName: cashierName,
      createdAt: new Date().toISOString(),
    });
  }

  // Update shift figures
  shift.billsCount += 1;
  if (sale.paymentMethod === 'cash') {
    shift.cashSales += total;
    shift.expectedCash += total;
  } else if (sale.paymentMethod === 'card') {
    shift.cardSales += total;
  } else if (sale.paymentMethod === 'split') {
    shift.cashSales += (total - cdPaid);
    shift.cardSales += cdPaid;
    shift.expectedCash += (total - cdPaid);
  }

  db.get('sales').unshift(sale);
  db.save();

  db.logAudit(cashierId, cashierName, 'فاتورة بيع', `فاتورة #${invoiceNumber} بقيمة ${total} ج.م`, storeId);

  res.json({ success: true, sale, store });
});

apiRouter.get('/sales', (req, res) => {
  const { storeId, shiftId, date, limit } = req.query;
  let sales = db.get('sales');

  if (storeId && storeId !== 'all') {
    sales = sales.filter(s => s.storeId === storeId);
  }
  if (shiftId) {
    sales = sales.filter(s => s.shiftId === shiftId);
  }
  if (date) {
    sales = sales.filter(s => s.createdAt.startsWith(date as string));
  }

  const max = Number(limit) || 100;
  res.json(sales.slice(0, max));
});

apiRouter.get('/sales/:id', (req, res) => {
  const sale = db.get('sales').find(s => s.id === req.params.id || s.invoiceNumber === req.params.id);
  if (!sale) return res.status(404).json({ error: 'الفاتورة غير موجودة' });
  const store = db.get('stores').find(s => s.id === sale.storeId);
  res.json({ sale, store });
});

// ==========================================
// 7. RETURNS (المرتجعات)
// ==========================================

apiRouter.post('/returns', (req, res) => {
  const {
    storeId,
    cashierId,
    cashierName,
    shiftId,
    originalInvoiceNumber,
    items,
    reason,
    refundMethod,
  } = req.body;

  if (!storeId || !cashierId || !items || !items.length) {
    return res.status(400).json({ error: 'بيانات المرتجع غير مكتملة' });
  }

  const products = db.get('products');
  const returnItems: any[] = [];
  let totalRefund = 0;

  for (const it of items) {
    const prod = products.find(p => p.id === it.productId);
    if (!prod) continue;
    const qty = Number(it.quantity) || 1;
    const price = Number(it.unitPrice) || prod.sellingPrice;
    const lineTotal = qty * price;
    totalRefund += lineTotal;

    returnItems.push({
      productId: prod.id,
      productName: prod.name,
      quantity: qty,
      unitPrice: price,
      totalRefund: lineTotal,
    });

    // Restock product
    const prev = prod.currentStock;
    prod.currentStock += qty;
    prod.updatedAt = new Date().toISOString();

    db.get('inventoryMovements').push({
      id: `mov_${Date.now()}_ret`,
      storeId,
      productId: prod.id,
      productName: prod.name,
      type: 'return',
      quantity: qty,
      previousStock: prev,
      newStock: prod.currentStock,
      notes: `مرتجع بضاعة (${reason || 'بدون سبب'})`,
      userId: cashierId,
      userName: cashierName,
      createdAt: new Date().toISOString(),
    });
  }

  // Adjust shift if cash refund
  if (shiftId) {
    const shift = db.get('shifts').find(s => s.id === shiftId);
    if (shift && shift.status === 'open') {
      shift.returnsAmount += totalRefund;
      if (refundMethod === 'cash') {
        shift.expectedCash -= totalRefund;
      }
    }
  }

  const retRecord: ReturnRecord = {
    id: `ret_${Date.now()}`,
    returnNumber: `RET-${Date.now().toString().slice(-6)}`,
    storeId,
    originalInvoiceNumber: originalInvoiceNumber || undefined,
    shiftId,
    cashierId,
    cashierName,
    items: returnItems,
    totalRefund,
    refundMethod: refundMethod || 'cash',
    reason: reason || 'طلب العميل',
    restock: true,
    createdAt: new Date().toISOString(),
  };

  db.get('returns').unshift(retRecord);
  db.save();
  db.logAudit(cashierId, cashierName, 'مرتجع مبيعات', `مرتجع #${retRecord.returnNumber} بقيمة ${totalRefund} ج.م`, storeId);

  res.json({ success: true, returnRecord: retRecord });
});

apiRouter.get('/returns', (req, res) => {
  const { storeId } = req.query;
  let rets = db.get('returns');
  if (storeId && storeId !== 'all') {
    rets = rets.filter(r => r.storeId === storeId);
  }
  res.json(rets);
});

// ==========================================
// 8. PURCHASES & SUPPLIERS (المشتريات والموردون)
// ==========================================

apiRouter.get('/suppliers', (req, res) => {
  const { storeId } = req.query;
  let sups = db.get('suppliers');
  if (storeId && storeId !== 'all') {
    sups = sups.filter(s => s.storeId === storeId);
  }
  res.json(sups);
});

apiRouter.post('/suppliers', (req, res) => {
  const { name, phone, address, storeId, productsSupplied, balance } = req.body;
  if (!name || !storeId) return res.status(400).json({ error: 'اسم المورد والمحل مطلوبان' });

  const newSup: Supplier = {
    id: `sup_${Date.now()}`,
    name,
    phone: phone || '',
    address: address || '',
    storeId,
    productsSupplied: productsSupplied || '',
    balance: Number(balance) || 0,
    createdAt: new Date().toISOString(),
  };

  db.get('suppliers').push(newSup);
  db.save();
  res.json(newSup);
});

apiRouter.post('/purchases', (req, res) => {
  const {
    storeId,
    supplierId,
    supplierName,
    items,
    paidAmount,
    notes,
    userId,
    userName,
  } = req.body;

  if (!storeId || !supplierId || !items || !items.length) {
    return res.status(400).json({ error: 'بيانات فاتورة الشراء غير مكتملة' });
  }

  const products = db.get('products');
  const movs = db.get('inventoryMovements');
  const purchaseItems: any[] = [];
  let totalCost = 0;

  for (const it of items) {
    const prod = products.find(p => p.id === it.productId);
    if (!prod) continue;

    const qty = Number(it.quantity) || 1;
    const unitCost = Number(it.unitCost) || prod.costPrice;
    const sellingPrice = Number(it.sellingPrice) || prod.sellingPrice;
    const lineTotal = qty * unitCost;
    totalCost += lineTotal;

    purchaseItems.push({
      productId: prod.id,
      productName: prod.name,
      quantity: qty,
      unitCost,
      sellingPrice,
      total: lineTotal,
    });

    // Update product stock and cost price
    const prevStock = prod.currentStock;
    prod.currentStock += qty;
    prod.costPrice = unitCost; // Update latest cost
    if (sellingPrice > 0) prod.sellingPrice = sellingPrice;
    prod.updatedAt = new Date().toISOString();

    movs.push({
      id: `mov_${Date.now()}_pur`,
      storeId,
      productId: prod.id,
      productName: prod.name,
      type: 'purchase',
      quantity: qty,
      previousStock: prevStock,
      newStock: prod.currentStock,
      notes: `فاتورة شراء من ${supplierName}`,
      userId: userId || 'admin',
      userName: userName || 'المدير العام',
      createdAt: new Date().toISOString(),
    });
  }

  const pPaid = Number(paidAmount) || 0;
  const paymentStatus = pPaid >= totalCost ? 'paid' : pPaid > 0 ? 'partial' : 'credit';

  // Update supplier balance if credit/partial
  const supplier = db.get('suppliers').find(s => s.id === supplierId);
  if (supplier) {
    supplier.balance += (totalCost - pPaid);
  }

  const purchase: Purchase = {
    id: `pur_${Date.now()}`,
    invoiceNumber: `PUR-${Date.now().toString().slice(-6)}`,
    storeId,
    supplierId,
    supplierName: supplierName || 'مورد عام',
    items: purchaseItems,
    totalCost,
    paidAmount: pPaid,
    paymentStatus,
    notes: notes || '',
    createdAt: new Date().toISOString(),
    createdBy: userName || 'المدير العام',
  };

  db.get('purchases').unshift(purchase);
  db.save();
  db.logAudit(userId || 'admin', userName || 'المدير العام', 'فاتورة شراء', `شراء بضاعة بقيمة ${totalCost} ج.م من ${supplierName}`, storeId);

  res.json({ success: true, purchase });
});

apiRouter.get('/purchases', (req, res) => {
  const { storeId } = req.query;
  let purs = db.get('purchases');
  if (storeId && storeId !== 'all') {
    purs = purs.filter(p => p.storeId === storeId);
  }
  res.json(purs);
});

// ==========================================
// 9. EXPENSES (المصروفات)
// ==========================================

apiRouter.get('/expenses', (req, res) => {
  const { storeId, month } = req.query;
  let exps = db.get('expenses');
  if (storeId && storeId !== 'all') {
    exps = exps.filter(e => e.storeId === storeId);
  }
  if (month) {
    exps = exps.filter(e => e.date.startsWith(month as string));
  }
  res.json(exps);
});

apiRouter.post('/expenses', (req, res) => {
  const { storeId, category, amount, notes, date, userId, userName } = req.body;
  if (!storeId || !category || !amount) {
    return res.status(400).json({ error: 'المحل ونوع المصروف والمبلغ بيانات مطلوبة' });
  }

  const categoryLabels: Record<string, string> = {
    rent: 'إيجار المحل',
    electricity: 'كهرباء وإنارة',
    water: 'مياه ومرافق',
    salaries: 'رواتب موظفين',
    transport: 'شحن ونقل بضائع',
    maintenance: 'صيانة وتصليح',
    other: 'مصروفات متنوعة',
  };

  const exp: Expense = {
    id: `exp_${Date.now()}`,
    storeId,
    category,
    categoryLabel: categoryLabels[category] || 'مصروفات عامة',
    amount: Number(amount) || 0,
    date: date || new Date().toISOString().split('T')[0],
    notes: notes || '',
    createdAt: new Date().toISOString(),
    createdBy: userName || 'المدير العام',
  };

  db.get('expenses').unshift(exp);
  db.save();
  db.logAudit(userId || 'admin', userName || 'المدير', 'تسجيل مصروف', `مصروف ${exp.categoryLabel}: ${exp.amount} ج.م`, storeId);

  res.json(exp);
});

// ==========================================
// 10. DAILY CLOSING (إغلاق اليومية)
// ==========================================

apiRouter.get('/daily-closings', (req, res) => {
  const { storeId } = req.query;
  let list = db.get('dailyClosings');
  if (storeId && storeId !== 'all') {
    list = list.filter(d => d.storeId === storeId);
  }
  res.json(list);
});

apiRouter.post('/daily-closings', (req, res) => {
  const { storeId, date, forceClose, userId, userName, notes } = req.body;
  const targetDate = date || new Date().toISOString().split('T')[0];

  // Check open shifts
  const shifts = db.get('shifts').filter(s => {
    const shiftDate = s.openedAt.split('T')[0];
    if (storeId && storeId !== 'all' && s.storeId !== storeId) return false;
    return shiftDate === targetDate && s.status === 'open';
  });

  if (shifts.length > 0 && !forceClose) {
    return res.status(400).json({
      error: `يوجد ${shifts.length} وردية لا تزال مفتوحة في هذا التاريخ. يجب إغلاق جميع الورديات قبل إغلاق اليومية.`,
      openShifts: shifts,
    });
  }

  // Calculate day stats
  const sales = db.get('sales').filter(s => {
    if (storeId && storeId !== 'all' && s.storeId !== storeId) return false;
    return s.createdAt.startsWith(targetDate) && s.status === 'completed';
  });

  const returns = db.get('returns').filter(r => {
    if (storeId && storeId !== 'all' && r.storeId !== storeId) return false;
    return r.createdAt.startsWith(targetDate);
  });

  const expenses = db.get('expenses').filter(e => {
    if (storeId && storeId !== 'all' && e.storeId !== storeId) return false;
    return e.date === targetDate;
  });

  const totalSales = sales.reduce((acc, s) => acc + s.total, 0);
  const totalCash = sales.reduce((acc, s) => acc + (s.cashPaid - s.changeAmount), 0);
  const totalCard = sales.reduce((acc, s) => acc + s.cardPaid, 0);
  const totalReturns = returns.reduce((acc, r) => acc + r.totalRefund, 0);
  const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
  const netSales = Math.max(0, totalSales - totalReturns);

  // Calculate COGS (Cost of goods sold)
  let cogs = 0;
  for (const s of sales) {
    for (const item of s.items) {
      cogs += (item.costPrice * item.quantity);
    }
  }

  const grossProfit = netSales - cogs;
  const netProfit = grossProfit - totalExpenses;

  // Calculate shifts difference
  const closedShifts = db.get('shifts').filter(s => {
    if (storeId && storeId !== 'all' && s.storeId !== storeId) return false;
    return s.openedAt.startsWith(targetDate) && s.status === 'closed';
  });
  const totalDifference = closedShifts.reduce((acc, s) => acc + (s.cashDifference || 0), 0);

  const closing: DailyClosing = {
    id: `dc_${Date.now()}`,
    storeId: storeId || 'all',
    date: targetDate,
    totalSales,
    totalCash,
    totalCard,
    totalReturns,
    totalExpenses,
    netSales,
    cogs,
    grossProfit,
    netProfit,
    shiftsCount: closedShifts.length,
    openShiftsCount: shifts.length,
    totalDifference,
    closedBy: userName || 'المدير العام',
    createdAt: new Date().toISOString(),
    status: 'closed',
    notes,
  };

  db.get('dailyClosings').unshift(closing);
  db.save();
  db.logAudit(userId || 'admin', userName || 'المدير', 'إغلاق اليومية', `إغلاق يومية ${targetDate} بصافي ربح ${netProfit} ج.م`, storeId);

  res.json({ success: true, closing });
});

// ==========================================
// 11. PROMOTIONS (العروض والخصومات)
// ==========================================

apiRouter.get('/promotions', (req, res) => {
  const { storeId } = req.query;
  let promos = db.get('promotions');
  if (storeId && storeId !== 'all') {
    promos = promos.filter(p => p.storeId === storeId);
  }
  res.json(promos);
});

apiRouter.post('/promotions', (req, res) => {
  const { storeId, title, type, value, targetType, targetId, startDate, endDate } = req.body;
  if (!storeId || !title || !value) {
    return res.status(400).json({ error: 'بيانات العرض غير مكتملة' });
  }

  const promo: any = {
    id: `promo_${Date.now()}`,
    storeId,
    title,
    type,
    value: Number(value),
    targetType: targetType || 'all',
    targetId: targetId || undefined,
    startDate: startDate || new Date().toISOString().split('T')[0],
    endDate: endDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    isActive: true,
  };

  db.get('promotions').push(promo);
  db.save();
  res.json(promo);
});

apiRouter.patch('/promotions/:id/toggle', (req, res) => {
  const promo = db.get('promotions').find(p => p.id === req.params.id);
  if (!promo) return res.status(404).json({ error: 'العرض غير موجود' });
  promo.isActive = !promo.isActive;
  db.save();
  res.json(promo);
});

// ==========================================
// 12. REPORTS & ANALYTICS
// ==========================================

apiRouter.get('/reports/summary', (req, res) => {
  const { storeId } = req.query;
  const today = new Date().toISOString().split('T')[0];
  const thisMonth = today.slice(0, 7);

  const filterStore = (item: { storeId?: string }) => {
    if (!storeId || storeId === 'all') return true;
    return item.storeId === storeId;
  };

  const sales = db.get('sales').filter(s => filterStore(s) && s.status === 'completed');
  const todaySales = sales.filter(s => s.createdAt.startsWith(today));
  const monthSales = sales.filter(s => s.createdAt.startsWith(thisMonth));

  const totalSalesToday = todaySales.reduce((acc, s) => acc + s.total, 0);
  const totalSalesMonth = monthSales.reduce((acc, s) => acc + s.total, 0);

  const expenses = db.get('expenses').filter(e => filterStore(e));
  const todayExpenses = expenses.filter(e => e.date === today).reduce((acc, e) => acc + e.amount, 0);
  const monthExpenses = expenses.filter(e => e.date.startsWith(thisMonth)).reduce((acc, e) => acc + e.amount, 0);

  const returns = db.get('returns').filter(r => filterStore(r));
  const todayReturns = returns.filter(r => r.createdAt.startsWith(today)).reduce((acc, r) => acc + r.totalRefund, 0);

  // COGS for this month
  let monthCogs = 0;
  for (const s of monthSales) {
    for (const item of s.items) {
      monthCogs += (item.costPrice * item.quantity);
    }
  }

  const netMonthProfit = (totalSalesMonth - monthCogs) - monthExpenses;

  // Products stock stats
  const products = db.get('products').filter(p => filterStore(p) && p.isActive);
  const lowStockCount = products.filter(p => p.currentStock > 0 && p.currentStock <= p.minStockAlert).length;
  const outOfStockCount = products.filter(p => p.currentStock <= 0).length;

  const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
  const expiringSoonCount = products.filter(p => p.expiryDate && p.expiryDate <= nextWeek).length;

  // Shifts stats
  const shifts = db.get('shifts').filter(s => filterStore(s));
  const openShifts = shifts.filter(s => s.status === 'open').length;
  const closedShifts = shifts.filter(s => s.status === 'closed').length;

  // Compare 3 stores performance
  const stores = db.get('stores');
  const storesComparison = stores.map(st => {
    const stSales = db.get('sales').filter(s => s.storeId === st.id && s.status === 'completed');
    const stTotal = stSales.reduce((acc, s) => acc + s.total, 0);
    const stExp = db.get('expenses').filter(e => e.storeId === st.id).reduce((acc, e) => acc + e.amount, 0);
    let stCogs = 0;
    stSales.forEach(s => s.items.forEach(it => stCogs += it.costPrice * it.quantity));
    const stProfit = (stTotal - stCogs) - stExp;
    const stProdCount = db.get('products').filter(p => p.storeId === st.id && p.isActive).length;

    return {
      id: st.id,
      name: st.name,
      type: st.type,
      color: st.color,
      totalSales: stTotal,
      expenses: stExp,
      profit: stProfit,
      productsCount: stProdCount,
    };
  });

  res.json({
    todaySales: totalSalesToday,
    monthSales: totalSalesMonth,
    todayExpenses,
    monthExpenses,
    todayReturns,
    netMonthProfit,
    totalBillsToday: todaySales.length,
    productsCount: products.length,
    lowStockCount,
    outOfStockCount,
    expiringSoonCount,
    openShifts,
    closedShifts,
    storesComparison,
  });
});

// ==========================================
// 13. GEMINI AI CAPABILITIES
// ==========================================

// A. Text to Speech using gemini-3.8-flash-tts
apiRouter.post('/ai/tts', async (req, res) => {
  try {
    const { text, voice } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'النص المطلوب تحويله لصوت غير موجود' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.json({
        success: false,
        fallback: true,
        text,
        message: 'مفتاح GEMINI_API_KEY غير متوفر، استخدام النطق المحلي',
      });
    }

    const voiceName = voice || 'Kore'; // 'Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash-lite-tts',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: text,
              },
            ],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        return res.json({
          success: true,
          audioBase64: base64Audio,
          mimeType: 'audio/wav',
        });
      }
    } catch (genError: any) {
      console.warn('Gemini 3.8 Flash Lite TTS call notice:', genError?.message || genError);
      return res.json({
        success: false,
        fallback: true,
        text,
        error: genError?.message,
      });
    }

    return res.json({
      success: false,
      fallback: true,
      text,
    });
  } catch (err: any) {
    console.warn('TTS handler error:', err);
    res.json({ success: false, fallback: true, text: req.body?.text, error: err?.message });
  }
});

// B. Search Grounding using gemini-3.8-flash with googleSearch
apiRouter.post('/ai/market-price', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ error: 'الرجاء إدخال اسم السلعة أو السؤال للبحث عن الأسعار' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'مفتاح GEMINI_API_KEY غير متوفر في الخادم' });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `أنت خبير أسعار سلع التجزئة وسوق المتاجر في مصر. ابحث وقدم أحدث متوسطات أسعار السلعة التالية في المحلات والسوبرماركت المصرية بالجنيه المصري (EGP)، مع نصائح تسعير للتاجر وتحديد متوسط سعر الجملة وسعر البيع للمستهلك:\n"${query}"`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || '';
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    res.json({
      answer: text,
      sources: groundingChunks,
    });
  } catch (err: any) {
    console.error('Error in /api/ai/market-price:', err);
    res.status(500).json({ error: err.message || 'فشل البحث والتحقق من الأسعار' });
  }
});

// C. Image Analysis for Receipt / Product barcode using Gemini
apiRouter.post('/ai/analyze-image', async (req, res) => {
  try {
    const { imageBase64, mimeType, task } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'الصورة غير متوفرة' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'مفتاح GEMINI_API_KEY غير متوفر في الخادم' });
    }

    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    const promptText = task === 'receipt'
      ? `حلل صورة فاتورة الشراء أو إيصال المورد المرفق. استخرج كل المنتجات والكميات والأسعار والإجمالي، ورجع النتيجة بتنسيق JSON حصراً يحتوي على:
{
  "supplierName": string,
  "invoiceNumber": string,
  "totalAmount": number,
  "items": [
    {
      "name": string,
      "quantity": number,
      "unitPrice": number,
      "total": number
    }
  ]
}`
      : `حلل صورة المنتج أو الباركود المرفق. استخرج بدقة:
1. اسم المنتج بالعربي
2. الماركة
3. الحجم أو الوزن (الوحدة)
4. رقم الباركود إن وجد أو اقترح باركود
5. تاريخ الإنتاج والصلاحية إن ظهر
ورجع النتيجة بتنسيق JSON:
{
  "name": string,
  "brand": string,
  "unit": string,
  "barcode": string,
  "expiryDate": string,
  "estimatedPrice": number
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType || 'image/jpeg',
              data: cleanBase64,
            },
          },
          { text: promptText },
        ],
      },
      config: {
        responseMimeType: 'application/json',
      },
    });

    const jsonText = response.text || '{}';
    let parsed = {};
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      parsed = { rawText: jsonText };
    }

    res.json({ success: true, data: parsed });
  } catch (err: any) {
    console.error('Error in /api/ai/analyze-image:', err);
    res.status(500).json({ error: err.message || 'فشل تحليل الصورة' });
  }
});
