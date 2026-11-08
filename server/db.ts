import fs from 'fs';
import path from 'path';

export interface Store {
  id: string;
  name: string;
  code: string;
  type: 'grocery' | 'detergents' | 'sweets_imported';
  description: string;
  phone: string;
  address: string;
  color: string;
  currency: string;
  taxNumber: string;
  receiptFooter: string;
}

export interface User {
  id: string;
  username: string;
  pin: string;
  name: string;
  role: 'admin' | 'cashier';
  storeId?: string; // null for admin
  phone?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Category {
  id: string;
  storeId: string;
  name: string;
  icon?: string;
  displayOrder: number;
}

export interface SuggestedProduct {
  id: string;
  storeType: 'grocery' | 'detergents' | 'sweets_imported';
  categoryName: string;
  name: string;
  brand: string;
  unit: string;
  defaultCostPrice: number;
  defaultSellingPrice: number;
  origin?: string;
  description?: string;
}

export interface Product {
  id: string;
  storeId: string;
  categoryId: string;
  name: string;
  brand: string;
  barcode: string;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  currentStock: number;
  minStockAlert: number;
  expiryDate?: string;
  productionDate?: string;
  batchNumber?: string;
  origin?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Shift {
  id: string;
  storeId: string;
  cashierId: string;
  cashierName: string;
  status: 'open' | 'closed';
  openedAt: string;
  closedAt?: string;
  openingFloat: number;
  cashSales: number;
  cardSales: number;
  returnsAmount: number;
  cashIn: number;
  cashOut: number;
  expectedCash: number;
  actualCash?: number;
  cashDifference?: number;
  billsCount: number;
  notes?: string;
}

export interface ShiftCashMovement {
  id: string;
  shiftId: string;
  type: 'in' | 'out';
  amount: number;
  reason: string;
  createdAt: string;
  createdBy: string;
}

export interface SaleItem {
  productId: string;
  name: string;
  barcode: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  costPrice: number;
  total: number;
}

export interface Sale {
  id: string;
  invoiceNumber: string;
  storeId: string;
  cashierId: string;
  cashierName: string;
  shiftId: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: 'cash' | 'card' | 'split';
  cashPaid: number;
  cardPaid: number;
  changeAmount: number;
  customerName?: string;
  status: 'completed' | 'refunded' | 'partially_refunded';
  createdAt: string;
}

export interface InventoryMovement {
  id: string;
  storeId: string;
  productId: string;
  productName: string;
  type: 'sale' | 'purchase' | 'return' | 'adjustment' | 'transfer_in' | 'transfer_out';
  quantity: number;
  previousStock: number;
  newStock: number;
  referenceId?: string;
  notes: string;
  userId: string;
  userName: string;
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  address: string;
  storeId: string;
  productsSupplied: string;
  balance: number;
  createdAt: string;
}

export interface PurchaseItem {
  productId: string;
  productName: string;
  quantity: number;
  unitCost: number;
  sellingPrice: number;
  total: number;
}

export interface Purchase {
  id: string;
  invoiceNumber: string;
  storeId: string;
  supplierId: string;
  supplierName: string;
  items: PurchaseItem[];
  totalCost: number;
  paidAmount: number;
  paymentStatus: 'paid' | 'partial' | 'credit';
  notes?: string;
  createdAt: string;
  createdBy: string;
}

export interface ReturnItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalRefund: number;
}

export interface ReturnRecord {
  id: string;
  returnNumber: string;
  storeId: string;
  originalSaleId?: string;
  originalInvoiceNumber?: string;
  shiftId?: string;
  cashierId: string;
  cashierName: string;
  items: ReturnItem[];
  totalRefund: number;
  refundMethod: 'cash' | 'card';
  reason: string;
  restock: boolean;
  createdAt: string;
}

export interface Expense {
  id: string;
  storeId: string;
  category: 'rent' | 'electricity' | 'water' | 'salaries' | 'transport' | 'maintenance' | 'other';
  categoryLabel: string;
  amount: number;
  date: string;
  notes: string;
  createdAt: string;
  createdBy: string;
}

export interface DailyClosing {
  id: string;
  storeId: string; // 'all' or specific storeId
  date: string;
  totalSales: number;
  totalCash: number;
  totalCard: number;
  totalReturns: number;
  totalExpenses: number;
  netSales: number;
  cogs: number;
  grossProfit: number;
  netProfit: number;
  shiftsCount: number;
  openShiftsCount: number;
  totalDifference: number;
  closedBy: string;
  createdAt: string;
  status: 'closed';
  notes?: string;
}

export interface Promotion {
  id: string;
  storeId: string;
  title: string;
  type: 'percentage' | 'fixed' | 'buy_x_get_y';
  value: number;
  targetType: 'all' | 'category' | 'product';
  targetId?: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface TransferRecord {
  id: string;
  fromStoreId: string;
  toStoreId: string;
  productId: string;
  productName: string;
  quantity: number;
  notes: string;
  createdBy: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  storeId?: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  createdAt: string;
}

export interface DatabaseSchema {
  stores: Store[];
  users: User[];
  categories: Category[];
  suggestedProducts: SuggestedProduct[];
  products: Product[];
  shifts: Shift[];
  shiftCashMovements: ShiftCashMovement[];
  sales: Sale[];
  inventoryMovements: InventoryMovement[];
  suppliers: Supplier[];
  purchases: Purchase[];
  returns: ReturnRecord[];
  expenses: Expense[];
  dailyClosings: DailyClosing[];
  promotions: Promotion[];
  transfers: TransferRecord[];
  auditLogs: AuditLog[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial default seed
function getInitialData(): DatabaseSchema {
  const stores: Store[] = [
    {
      id: 'store_grocery',
      name: 'محل البقالة والمواد الغذائية',
      code: 'GROCERY',
      type: 'grocery',
      description: 'قسم المواد الغذائية، الأرز، السكر، الزيوت، الألبان، المشروبات، والمعلبات',
      phone: '01012345678',
      address: 'القاهرة - الفرع الأول (السوق المركزي)',
      color: '#0d9488', // teal
      currency: 'ج.م',
      taxNumber: '100-245-891',
      receiptFooter: 'شكراً لزيارتكم محل البقالة - البضاعة المباعة ترد وتستبدل خلال 14 يوماً بالفاتورة',
    },
    {
      id: 'store_detergents',
      name: 'محل المنظفات والورقيات',
      code: 'DETERGENTS',
      type: 'detergents',
      description: 'مساحيق الغسيل، الصابون، المعطرات، المطهرات، الكلور والمنتجات المنزلية',
      phone: '01098765432',
      address: 'القاهرة - الفرع الثاني (شارع النصر)',
      color: '#0284c7', // sky
      currency: 'ج.م',
      taxNumber: '100-245-892',
      receiptFooter: 'شكراً لتسوقكم من محل المنظفات - نسعد دائماً بخدمتكم',
    },
    {
      id: 'store_sweets',
      name: 'محل المستورد والجاتوه والحلويات',
      code: 'SWEETS',
      type: 'sweets_imported',
      description: 'الشوكولاتة والبسكويت المستورد، التورت، الجاتوه الفاخر والحلويات الغربية والشرقية',
      phone: '01155443322',
      address: 'القاهرة - الفرع الثالث (المول التجاري)',
      color: '#d97706', // amber
      currency: 'ج.م',
      taxNumber: '100-245-893',
      receiptFooter: 'شكراً لاختياركم محل المستورد والجاتوه - بألف صحة وهنا',
    },
  ];

  const users: User[] = [
    {
      id: 'usr_admin',
      username: 'admin',
      pin: 'admin123',
      name: 'أحمد الإدريسي (المدير العام)',
      role: 'admin',
      phone: '01000000001',
      isActive: true,
      createdAt: '2026-01-01T08:00:00Z',
    },
    {
      id: 'usr_cashier_grocery',
      username: 'cashier1',
      pin: '1111',
      name: 'محمد فتحي (كاشير البقالة)',
      role: 'cashier',
      storeId: 'store_grocery',
      phone: '01011112222',
      isActive: true,
      createdAt: '2026-01-01T08:00:00Z',
    },
    {
      id: 'usr_cashier_detergents',
      username: 'cashier2',
      pin: '2222',
      name: 'كريم محمود (كاشير المنظفات)',
      role: 'cashier',
      storeId: 'store_detergents',
      phone: '01022223333',
      isActive: true,
      createdAt: '2026-01-01T08:00:00Z',
    },
    {
      id: 'usr_cashier_sweets',
      username: 'cashier3',
      pin: '3333',
      name: 'سارة عبد الله (كاشير المستورد والجاتوه)',
      role: 'cashier',
      storeId: 'store_sweets',
      phone: '01033334444',
      isActive: true,
      createdAt: '2026-01-01T08:00:00Z',
    },
  ];

  const categories: Category[] = [
    // Grocery
    { id: 'cat_gr_1', storeId: 'store_grocery', name: 'الأرز والحبوب', icon: 'Wheat', displayOrder: 1 },
    { id: 'cat_gr_2', storeId: 'store_grocery', name: 'السكر والتحلية', icon: 'Candy', displayOrder: 2 },
    { id: 'cat_gr_3', storeId: 'store_grocery', name: 'المكرونة والصلصات', icon: 'Utensils', displayOrder: 3 },
    { id: 'cat_gr_4', storeId: 'store_grocery', name: 'الزيوت والسمن', icon: 'Droplet', displayOrder: 4 },
    { id: 'cat_gr_5', storeId: 'store_grocery', name: 'الشاي والقهوة', icon: 'Coffee', displayOrder: 5 },
    { id: 'cat_gr_6', storeId: 'store_grocery', name: 'الألبان والجبن', icon: 'Milk', displayOrder: 6 },
    { id: 'cat_gr_7', storeId: 'store_grocery', name: 'العصائر والمشروبات', icon: 'CupSoda', displayOrder: 7 },
    { id: 'cat_gr_8', storeId: 'store_grocery', name: 'المياه المعدنية', icon: 'Waves', displayOrder: 8 },
    { id: 'cat_gr_9', storeId: 'store_grocery', name: 'المعلبات والبقوليات', icon: 'Package', displayOrder: 9 },
    { id: 'cat_gr_10', storeId: 'store_grocery', name: 'البسكويت والسناكس', icon: 'Cookie', displayOrder: 10 },
    { id: 'cat_gr_11', storeId: 'store_grocery', name: 'المجمدات', icon: 'Snowflake', displayOrder: 11 },

    // Detergents
    { id: 'cat_det_1', storeId: 'store_detergents', name: 'مساحيق الغسيل', icon: 'Sparkles', displayOrder: 1 },
    { id: 'cat_det_2', storeId: 'store_detergents', name: 'سائل غسيل الأطباق', icon: 'Droplets', displayOrder: 2 },
    { id: 'cat_det_3', storeId: 'store_detergents', name: 'منظفات ومطهرات الأرضيات', icon: 'ShieldCheck', displayOrder: 3 },
    { id: 'cat_det_4', storeId: 'store_detergents', name: 'الكلور والمبيضات', icon: 'Flame', displayOrder: 4 },
    { id: 'cat_det_5', storeId: 'store_detergents', name: 'المعطرات الجوية والمفروشات', icon: 'Wind', displayOrder: 5 },
    { id: 'cat_det_6', storeId: 'store_detergents', name: 'الصابون والشامبو', icon: 'Smile', displayOrder: 6 },
    { id: 'cat_det_7', storeId: 'store_detergents', name: 'الورقيات ومستلزمات الحمام', icon: 'Layers', displayOrder: 7 },
    { id: 'cat_det_8', storeId: 'store_detergents', name: 'أدوات ومنظفات الزجاج', icon: 'Sparkle', displayOrder: 8 },

    // Sweets & Imported
    { id: 'cat_sw_1', storeId: 'store_sweets', name: 'الشوكولاتة المستوردة', icon: 'Heart', displayOrder: 1 },
    { id: 'cat_sw_2', storeId: 'store_sweets', name: 'البسكويت والويفر المستورد', icon: 'Cookie', displayOrder: 2 },
    { id: 'cat_sw_3', storeId: 'store_sweets', name: 'السناكس والشيبسي المستورد', icon: 'Flame', displayOrder: 3 },
    { id: 'cat_sw_4', storeId: 'store_sweets', name: 'المشروبات الغازية المستوردة', icon: 'CupSoda', displayOrder: 4 },
    { id: 'cat_sw_5', storeId: 'store_sweets', name: 'جاتوه سوبر فخم', icon: 'Cake', displayOrder: 5 },
    { id: 'cat_sw_6', storeId: 'store_sweets', name: 'تورت المناسبات', icon: 'Crown', displayOrder: 6 },
    { id: 'cat_sw_7', storeId: 'store_sweets', name: 'تشيز كيك وتارت', icon: 'PieChart', displayOrder: 7 },
    { id: 'cat_sw_8', storeId: 'store_sweets', name: 'حلويات شرقية فاخرة', icon: 'Award', displayOrder: 8 },
  ];

  // Suggested products catalog (for quick adoption by store manager)
  const suggestedProducts: SuggestedProduct[] = [
    // Grocery
    { id: 'sug_gr_1', storeType: 'grocery', categoryName: 'الأرز والحبوب', name: 'أرز مصري الضحى 1 كجم', brand: 'الضحى', unit: 'كيس 1 كجم', defaultCostPrice: 34, defaultSellingPrice: 40 },
    { id: 'sug_gr_2', storeType: 'grocery', categoryName: 'الأرز والحبوب', name: 'أرز بسمتي هندي أبو كاس 1 كجم', brand: 'أبو كاس', unit: 'كيس 1 كجم', defaultCostPrice: 95, defaultSellingPrice: 115 },
    { id: 'sug_gr_3', storeType: 'grocery', categoryName: 'السكر والتحلية', name: 'سكر أبيض ناعم الأسرة 1 كجم', brand: 'الأسرة', unit: 'كيس 1 كجم', defaultCostPrice: 32, defaultSellingPrice: 38 },
    { id: 'sug_gr_4', storeType: 'grocery', categoryName: 'الزيوت والسمن', name: 'زيت عباد الشمس كريستال 800 مل', brand: 'كريستال', unit: 'زجاجة 800 مل', defaultCostPrice: 72, defaultSellingPrice: 85 },
    { id: 'sug_gr_5', storeType: 'grocery', categoryName: 'الزيوت والسمن', name: 'زيت ذرة عافية 1.6 لتر', brand: 'عافية', unit: 'زجاجة 1.6 لتر', defaultCostPrice: 175, defaultSellingPrice: 205 },
    { id: 'sug_gr_6', storeType: 'grocery', categoryName: 'المكرونة والصلصات', name: 'مكرونة إيطاليانو أقلام 400 جم', brand: 'إيطاليانو', unit: 'كيس 400 جم', defaultCostPrice: 15, defaultSellingPrice: 19 },
    { id: 'sug_gr_7', storeType: 'grocery', categoryName: 'المكرونة والصلصات', name: 'مكرونة الملكة إسباجيتي 400 جم', brand: 'الملكة', unit: 'كيس 400 جم', defaultCostPrice: 11, defaultSellingPrice: 14 },
    { id: 'sug_gr_8', storeType: 'grocery', categoryName: 'الألبان والجبن', name: 'حليب جهينة كامل الدسم 1 لتر', brand: 'جهينة', unit: 'علبة 1 لتر', defaultCostPrice: 42, defaultSellingPrice: 48 },
    { id: 'sug_gr_9', storeType: 'grocery', categoryName: 'الألبان والجبن', name: 'جبنة دومتي فيتا بلس 500 جم', brand: 'دومتي', unit: 'علبة 500 جم', defaultCostPrice: 33, defaultSellingPrice: 40 },
    { id: 'sug_gr_10', storeType: 'grocery', categoryName: 'الشاي والقهوة', name: 'شاي ليبتون ناعم أحمر 250 جم', brand: 'ليبتون', unit: 'علبة 250 جم', defaultCostPrice: 65, defaultSellingPrice: 78 },
    { id: 'sug_gr_11', storeType: 'grocery', categoryName: 'الشاي والقهوة', name: 'شاي العروسة ناعم 250 جم', brand: 'العروسة', unit: 'باكت 250 جم', defaultCostPrice: 52, defaultSellingPrice: 62 },
    { id: 'sug_gr_12', storeType: 'grocery', categoryName: 'المياه المعدنية', name: 'مياه كرتونة داساني 1.5 لتر (12 زجاجة)', brand: 'داساني', unit: 'كرتونة', defaultCostPrice: 68, defaultSellingPrice: 85 },
    { id: 'sug_gr_13', storeType: 'grocery', categoryName: 'البسكويت والسناكس', name: 'شيبسي عائلي بطعم الجبنة المتبلة', brand: 'شيبسي', unit: 'كيس كبير', defaultCostPrice: 16, defaultSellingPrice: 20 },

    // Detergents
    { id: 'sug_det_1', storeType: 'detergents', categoryName: 'مساحيق الغسيل', name: 'مسحوق أريال أوتوماتيك لافندر 4 كجم', brand: 'أريال', unit: 'شيكارة 4 كجم', defaultCostPrice: 240, defaultSellingPrice: 285 },
    { id: 'sug_det_2', storeType: 'detergents', categoryName: 'مساحيق الغسيل', name: 'برسيل جل للغسالات الأوتوماتيك 3.9 لتر', brand: 'برسيل', unit: 'جركن 3.9 لتر', defaultCostPrice: 215, defaultSellingPrice: 260 },
    { id: 'sug_det_3', storeType: 'detergents', categoryName: 'مساحيق الغسيل', name: 'تايد بودرة يدوي بالليمون 1 كجم', brand: 'تايد', unit: 'كيس 1 كجم', defaultCostPrice: 48, defaultSellingPrice: 58 },
    { id: 'sug_det_4', storeType: 'detergents', categoryName: 'سائل غسيل الأطباق', name: 'سائل فيري بلس ليمون مركز 650 مل', brand: 'فيري', unit: 'زجاجة 650 مل', defaultCostPrice: 44, defaultSellingPrice: 55 },
    { id: 'sug_det_5', storeType: 'detergents', categoryName: 'سائل غسيل الأطباق', name: 'بريل سائل صحون بالليمون 2.5 لتر', brand: 'بريل', unit: 'جركن 2.5 لتر', defaultCostPrice: 62, defaultSellingPrice: 78 },
    { id: 'sug_det_6', storeType: 'detergents', categoryName: 'الكلور والمبيضات', name: 'كلوركس أبيض أصلي 1 لتر', brand: 'كلوركس', unit: 'زجاجة 1 لتر', defaultCostPrice: 22, defaultSellingPrice: 28 },
    { id: 'sug_det_7', storeType: 'detergents', categoryName: 'الكلور والمبيضات', name: 'كلوركس ألوان للملابس الملونة 2 لتر', brand: 'كلوركس', unit: 'جركن 2 لتر', defaultCostPrice: 55, defaultSellingPrice: 70 },
    { id: 'sug_det_8', storeType: 'detergents', categoryName: 'منظفات ومطهرات الأرضيات', name: 'مطهر ديتول الأصلي للبكتيريا 500 مل', brand: 'ديتول', unit: 'زجاجة 500 مل', defaultCostPrice: 95, defaultSellingPrice: 120 },
    { id: 'sug_det_9', storeType: 'detergents', categoryName: 'منظفات ومطهرات الأرضيات', name: 'منظف أرضيات جنرال نسيم الجبل 3 لتر', brand: 'جنرال', unit: 'جركن 3 لتر', defaultCostPrice: 75, defaultSellingPrice: 95 },
    { id: 'sug_det_10', storeType: 'detergents', categoryName: 'الصابون والشامبو', name: 'صابون دوف مرطب للبشرة 135 جم', brand: 'دوف', unit: 'قطعة', defaultCostPrice: 28, defaultSellingPrice: 35 },
    { id: 'sug_det_11', storeType: 'detergents', categoryName: 'الصابون والشامبو', name: 'شامبو هيد آند شولدرز كلاسيك 400 مل', brand: 'هيد آند شولدرز', unit: 'زجاجة 400 مل', defaultCostPrice: 85, defaultSellingPrice: 110 },
    { id: 'sug_det_12', storeType: 'detergents', categoryName: 'المعطرات الجوية والمفروشات', name: 'معطر جو فريدا نسيم الورد 460 مل', brand: 'فريدا', unit: 'بخاخ 460 مل', defaultCostPrice: 45, defaultSellingPrice: 60 },

    // Sweets & Imported
    { id: 'sug_sw_1', storeType: 'sweets_imported', categoryName: 'الشوكولاتة المستوردة', name: 'برطمان نوتيلا فيريرو إيطالي 750 جم', brand: 'Nutella', unit: 'برطمان 750 جم', defaultCostPrice: 260, defaultSellingPrice: 320, origin: 'إيطاليا' },
    { id: 'sug_sw_2', storeType: 'sweets_imported', categoryName: 'الشوكولاتة المستوردة', name: 'فيريرو روشيه بوكس ذهبي 16 قطعة', brand: 'Ferrero Rocher', unit: 'علبة 16 قطعة', defaultCostPrice: 280, defaultSellingPrice: 350, origin: 'إيطاليا' },
    { id: 'sug_sw_3', storeType: 'sweets_imported', categoryName: 'الشوكولاتة المستوردة', name: 'كيندر بوينو شوكولاتة ويفر بالبندق', brand: 'Kinder', unit: 'باكت 2 قطعة', defaultCostPrice: 35, defaultSellingPrice: 45, origin: 'بولندا' },
    { id: 'sug_sw_4', storeType: 'sweets_imported', categoryName: 'الشوكولاتة المستوردة', name: 'شوكولاتة ميلكا ألبين بالحليب 100 جم', brand: 'Milka', unit: 'قطعة 100 جم', defaultCostPrice: 65, defaultSellingPrice: 85, origin: 'ألمانيا' },
    { id: 'sug_sw_5', storeType: 'sweets_imported', categoryName: 'البسكويت والويفر المستورد', name: 'بسكويت لوتس بيسكوف بلجيكي 250 جم', brand: 'Lotus Biscoff', unit: 'باكت 250 جم', defaultCostPrice: 110, defaultSellingPrice: 140, origin: 'بلجيكا' },
    { id: 'sug_sw_6', storeType: 'sweets_imported', categoryName: 'السناكس والشيبسي المستورد', name: 'برينجلز أصلي سادة أسطوانة 165 جم', brand: 'Pringles', unit: 'علبة 165 جم', defaultCostPrice: 90, defaultSellingPrice: 120, origin: 'أمريكا' },
    { id: 'sug_sw_7', storeType: 'sweets_imported', categoryName: 'السناكس والشيبسي المستورد', name: 'برينجلز بابريكا حار 165 جم', brand: 'Pringles', unit: 'علبة 165 جم', defaultCostPrice: 90, defaultSellingPrice: 120, origin: 'أمريكا' },
    { id: 'sug_sw_8', storeType: 'sweets_imported', categoryName: 'جاتوه سوبر فخم', name: 'قطعة جاتوه بلاك فورست فاخرة', brand: 'شيف الحلواني', unit: 'قطعة', defaultCostPrice: 28, defaultSellingPrice: 45 },
    { id: 'sug_sw_9', storeType: 'sweets_imported', categoryName: 'جاتوه سوبر فخم', name: 'قطعة جاتوه ريد فيلفيت كريمة جبن', brand: 'شيف الحلواني', unit: 'قطعة', defaultCostPrice: 30, defaultSellingPrice: 48 },
    { id: 'sug_sw_10', storeType: 'sweets_imported', categoryName: 'جاتوه سوبر فخم', name: 'قطعة إكلير شوكولاتة بلجيكي غنية', brand: 'شيف الحلواني', unit: 'قطعة', defaultCostPrice: 26, defaultSellingPrice: 42 },
    { id: 'sug_sw_11', storeType: 'sweets_imported', categoryName: 'تشيز كيك وتارت', name: 'شريحة تشيز كيك لوتس فريش', brand: 'شيف الحلواني', unit: 'شريحة', defaultCostPrice: 40, defaultSellingPrice: 65 },
    { id: 'sug_sw_12', storeType: 'sweets_imported', categoryName: 'تورت المناسبات', name: 'تورتة فور سيزون 4 فصول شوكولاتة وفواكه مقاس 24', brand: 'شيف الحلواني', unit: 'تورتة كاملة', defaultCostPrice: 260, defaultSellingPrice: 390 },
  ];

  // Pre-seed active products for each store (with realistic stock and barcodes)
  const products: Product[] = [
    // Grocery Store products
    {
      id: 'prod_gr_1',
      storeId: 'store_grocery',
      categoryId: 'cat_gr_1',
      name: 'أرز مصري الضحى 1 كجم',
      brand: 'الضحى',
      barcode: '622100010001',
      unit: 'كيس',
      costPrice: 34,
      sellingPrice: 40,
      currentStock: 45,
      minStockAlert: 10,
      expiryDate: '2027-06-01',
      productionDate: '2026-01-10',
      batchNumber: 'DZ-2026-01',
      isActive: true,
      createdAt: '2026-01-01T08:00:00Z',
      updatedAt: '2026-01-01T08:00:00Z',
    },
    {
      id: 'prod_gr_2',
      storeId: 'store_grocery',
      categoryId: 'cat_gr_2',
      name: 'سكر أبيض ناعم الأسرة 1 كجم',
      brand: 'الأسرة',
      barcode: '622100010002',
      unit: 'كيس',
      costPrice: 32,
      sellingPrice: 38,
      currentStock: 60,
      minStockAlert: 15,
      expiryDate: '2028-01-01',
      batchNumber: 'OSR-99',
      isActive: true,
      createdAt: '2026-01-01T08:00:00Z',
      updatedAt: '2026-01-01T08:00:00Z',
    },
    {
      id: 'prod_gr_3',
      storeId: 'store_grocery',
      categoryId: 'cat_gr_4',
      name: 'زيت عباد الشمس كريستال 800 مل',
      brand: 'كريستال',
      barcode: '622100010003',
      unit: 'زجاجة',
      costPrice: 72,
      sellingPrice: 85,
      currentStock: 32,
      minStockAlert: 8,
      expiryDate: '2027-10-15',
      batchNumber: 'CR-881',
      isActive: true,
      createdAt: '2026-01-01T08:00:00Z',
      updatedAt: '2026-01-01T08:00:00Z',
    },
    {
      id: 'prod_gr_4',
      storeId: 'store_grocery',
      categoryId: 'cat_gr_3',
      name: 'مكرونة إيطاليانو أقلام 400 جم',
      brand: 'إيطاليانو',
      barcode: '622100010004',
      unit: 'كيس',
      costPrice: 15,
      sellingPrice: 19,
      currentStock: 80,
      minStockAlert: 20,
      expiryDate: '2027-12-01',
      batchNumber: 'IT-400',
      isActive: true,
      createdAt: '2026-01-01T08:00:00Z',
      updatedAt: '2026-01-01T08:00:00Z',
    },
    {
      id: 'prod_gr_5',
      storeId: 'store_grocery',
      categoryId: 'cat_gr_6',
      name: 'حليب جهينة كامل الدسم 1 لتر',
      brand: 'جهينة',
      barcode: '622100010005',
      unit: 'علبة',
      costPrice: 42,
      sellingPrice: 48,
      currentStock: 25,
      minStockAlert: 10,
      expiryDate: '2026-12-25',
      batchNumber: 'JH-101',
      isActive: true,
      createdAt: '2026-01-01T08:00:00Z',
      updatedAt: '2026-01-01T08:00:00Z',
    },
    {
      id: 'prod_gr_6',
      storeId: 'store_grocery',
      categoryId: 'cat_gr_5',
      name: 'شاي ليبتون ناعم أحمر 250 جم',
      brand: 'ليبتون',
      barcode: '622100010006',
      unit: 'علبة',
      costPrice: 65,
      sellingPrice: 78,
      currentStock: 40,
      minStockAlert: 8,
      expiryDate: '2028-04-10',
      batchNumber: 'LIP-250',
      isActive: true,
      createdAt: '2026-01-01T08:00:00Z',
      updatedAt: '2026-01-01T08:00:00Z',
    },
    {
      id: 'prod_gr_7',
      storeId: 'store_grocery',
      categoryId: 'cat_gr_7',
      name: 'عصير بيتي برتقال طبيعي 1 لتر',
      brand: 'بيتي',
      barcode: '622100010007',
      unit: 'علبة',
      costPrice: 28,
      sellingPrice: 35,
      currentStock: 4, // low stock alert!
      minStockAlert: 10,
      expiryDate: '2026-11-20',
      batchNumber: 'BY-10',
      isActive: true,
      createdAt: '2026-01-01T08:00:00Z',
      updatedAt: '2026-01-01T08:00:00Z',
    },

    // Detergent Store products
    {
      id: 'prod_det_1',
      storeId: 'store_detergents',
      categoryId: 'cat_det_1',
      name: 'مسحوق أريال أوتوماتيك لافندر 4 كجم',
      brand: 'أريال',
      barcode: '622200020001',
      unit: 'شيكارة',
      costPrice: 240,
      sellingPrice: 285,
      currentStock: 22,
      minStockAlert: 5,
      batchNumber: 'AR-4KG',
      isActive: true,
      createdAt: '2026-01-01T08:00:00Z',
      updatedAt: '2026-01-01T08:00:00Z',
    },
    {
      id: 'prod_det_2',
      storeId: 'store_detergents',
      categoryId: 'cat_det_1',
      name: 'برسيل جل أوتوماتيك لافندر 3.9 لتر',
      brand: 'برسيل',
      barcode: '622200020002',
      unit: 'جركن 3.9 لتر',
      costPrice: 215,
      sellingPrice: 260,
      currentStock: 18,
      minStockAlert: 6,
      batchNumber: 'PR-39L',
      isActive: true,
      createdAt: '2026-01-01T08:00:00Z',
      updatedAt: '2026-01-01T08:00:00Z',
    },
    {
      id: 'prod_det_3',
      storeId: 'store_detergents',
      categoryId: 'cat_det_2',
      name: 'سائل فيري بلس ليمون مركز 650 مل',
      brand: 'فيري',
      barcode: '622200020003',
      unit: 'زجاجة 650 مل',
      costPrice: 44,
      sellingPrice: 55,
      currentStock: 35,
      minStockAlert: 10,
      batchNumber: 'FA-650',
      isActive: true,
      createdAt: '2026-01-01T08:00:00Z',
      updatedAt: '2026-01-01T08:00:00Z',
    },
    {
      id: 'prod_det_4',
      storeId: 'store_detergents',
      categoryId: 'cat_det_2',
      name: 'بريل سائل صحون بالليمون 2.5 لتر',
      brand: 'بريل',
      barcode: '622200020004',
      unit: 'جركن 2.5 لتر',
      costPrice: 62,
      sellingPrice: 78,
      currentStock: 28,
      minStockAlert: 8,
      batchNumber: 'PR-25L',
      isActive: true,
      createdAt: '2026-01-01T08:00:00Z',
      updatedAt: '2026-01-01T08:00:00Z',
    },
    {
      id: 'prod_det_5',
      storeId: 'store_detergents',
      categoryId: 'cat_det_4',
      name: 'كلوركس أبيض أصلي 1 لتر',
      brand: 'كلوركس',
      barcode: '622200020005',
      unit: 'زجاجة 1 لتر',
      costPrice: 22,
      sellingPrice: 28,
      currentStock: 50,
      minStockAlert: 12,
      batchNumber: 'CL-1L',
      isActive: true,
      createdAt: '2026-01-01T08:00:00Z',
      updatedAt: '2026-01-01T08:00:00Z',
    },
    {
      id: 'prod_det_6',
      storeId: 'store_detergents',
      categoryId: 'cat_det_3',
      name: 'مطهر ديتول الأصلي 500 مل',
      brand: 'ديتول',
      barcode: '622200020006',
      unit: 'زجاجة 500 مل',
      costPrice: 95,
      sellingPrice: 120,
      currentStock: 2, // low stock!
      minStockAlert: 8,
      batchNumber: 'DET-500',
      isActive: true,
      createdAt: '2026-01-01T08:00:00Z',
      updatedAt: '2026-01-01T08:00:00Z',
    },
    {
      id: 'prod_det_7',
      storeId: 'store_detergents',
      categoryId: 'cat_det_6',
      name: 'صابون دوف كلاسيك مرطب 135 جم',
      brand: 'دوف',
      barcode: '622200020007',
      unit: 'قطعة',
      costPrice: 28,
      sellingPrice: 35,
      currentStock: 64,
      minStockAlert: 15,
      batchNumber: 'DV-135',
      isActive: true,
      createdAt: '2026-01-01T08:00:00Z',
      updatedAt: '2026-01-01T08:00:00Z',
    },

    // Sweets & Imported products
    {
      id: 'prod_sw_1',
      storeId: 'store_sweets',
      categoryId: 'cat_sw_1',
      name: 'برطمان نوتيلا فيريرو إيطالي 750 جم',
      brand: 'Nutella',
      barcode: '622300030001',
      unit: 'برطمان',
      costPrice: 260,
      sellingPrice: 320,
      currentStock: 16,
      minStockAlert: 5,
      origin: 'إيطاليا',
      expiryDate: '2027-02-15',
      batchNumber: 'NUT-750',
      isActive: true,
      createdAt: '2026-01-01T08:00:00Z',
      updatedAt: '2026-01-01T08:00:00Z',
    },
    {
      id: 'prod_sw_2',
      storeId: 'store_sweets',
      categoryId: 'cat_sw_1',
      name: 'فيريرو روشيه بوكس ذهبي 16 قطعة',
      brand: 'Ferrero Rocher',
      barcode: '622300030002',
      unit: 'علبة',
      costPrice: 280,
      sellingPrice: 350,
      currentStock: 12,
      minStockAlert: 4,
      origin: 'إيطاليا',
      expiryDate: '2027-04-10',
      batchNumber: 'FR-16',
      isActive: true,
      createdAt: '2026-01-01T08:00:00Z',
      updatedAt: '2026-01-01T08:00:00Z',
    },
    {
      id: 'prod_sw_3',
      storeId: 'store_sweets',
      categoryId: 'cat_sw_1',
      name: 'كيندر بوينو ويفر بالبندق 43 جم',
      brand: 'Kinder',
      barcode: '622300030003',
      unit: 'باكت',
      costPrice: 35,
      sellingPrice: 45,
      currentStock: 50,
      minStockAlert: 15,
      origin: 'بولندا',
      expiryDate: '2027-01-01',
      batchNumber: 'KB-43',
      isActive: true,
      createdAt: '2026-01-01T08:00:00Z',
      updatedAt: '2026-01-01T08:00:00Z',
    },
    {
      id: 'prod_sw_4',
      storeId: 'store_sweets',
      categoryId: 'cat_sw_3',
      name: 'برينجلز بطاطس أصلي 165 جم',
      brand: 'Pringles',
      barcode: '622300030004',
      unit: 'علبة أسطوانية',
      costPrice: 90,
      sellingPrice: 120,
      currentStock: 25,
      minStockAlert: 6,
      origin: 'أمريكا',
      expiryDate: '2027-05-30',
      batchNumber: 'PR-165',
      isActive: true,
      createdAt: '2026-01-01T08:00:00Z',
      updatedAt: '2026-01-01T08:00:00Z',
    },
    {
      id: 'prod_sw_5',
      storeId: 'store_sweets',
      categoryId: 'cat_sw_5',
      name: 'قطعة جاتوه بلاك فورست فاخرة',
      brand: 'حلواني الدار',
      barcode: '622300030005',
      unit: 'قطعة',
      costPrice: 28,
      sellingPrice: 45,
      currentStock: 24,
      minStockAlert: 5,
      productionDate: '2026-11-08',
      expiryDate: '2026-11-10', // expires soon!
      batchNumber: 'BF-TODAY',
      isActive: true,
      createdAt: '2026-01-01T08:00:00Z',
      updatedAt: '2026-01-01T08:00:00Z',
    },
    {
      id: 'prod_sw_6',
      storeId: 'store_sweets',
      categoryId: 'cat_sw_5',
      name: 'قطعة جاتوه ريد فيلفيت كريمة سويسرية',
      brand: 'حلواني الدار',
      barcode: '622300030006',
      unit: 'قطعة',
      costPrice: 30,
      sellingPrice: 48,
      currentStock: 18,
      minStockAlert: 5,
      productionDate: '2026-11-08',
      expiryDate: '2026-11-10',
      batchNumber: 'RV-TODAY',
      isActive: true,
      createdAt: '2026-01-01T08:00:00Z',
      updatedAt: '2026-01-01T08:00:00Z',
    },
    {
      id: 'prod_sw_7',
      storeId: 'store_sweets',
      categoryId: 'cat_sw_6',
      name: 'تورتة فور سيزون ميكس شوكولاتة وفواكه مقاس 24',
      brand: 'حلواني الدار',
      barcode: '622300030007',
      unit: 'تورتة',
      costPrice: 260,
      sellingPrice: 390,
      currentStock: 4,
      minStockAlert: 2,
      productionDate: '2026-11-08',
      expiryDate: '2026-11-11',
      batchNumber: 'TRT-24',
      isActive: true,
      createdAt: '2026-01-01T08:00:00Z',
      updatedAt: '2026-01-01T08:00:00Z',
    },
    {
      id: 'prod_sw_8',
      storeId: 'store_sweets',
      categoryId: 'cat_sw_7',
      name: 'شريحة تشيز كيك باللوتس فريش',
      brand: 'حلواني الدار',
      barcode: '622300030008',
      unit: 'شريحة',
      costPrice: 40,
      sellingPrice: 65,
      currentStock: 15,
      minStockAlert: 4,
      productionDate: '2026-11-08',
      expiryDate: '2026-11-10',
      batchNumber: 'CC-LOTUS',
      isActive: true,
      createdAt: '2026-01-01T08:00:00Z',
      updatedAt: '2026-01-01T08:00:00Z',
    },
  ];

  // Active shifts (Cashier 1 has an active open shift right now)
  const shifts: Shift[] = [
    {
      id: 'shift_init_1',
      storeId: 'store_grocery',
      cashierId: 'usr_cashier_grocery',
      cashierName: 'محمد فتحي (كاشير البقالة)',
      status: 'open',
      openedAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
      openingFloat: 500,
      cashSales: 1650,
      cardSales: 450,
      returnsAmount: 0,
      cashIn: 0,
      cashOut: 0,
      expectedCash: 2150, // 500 + 1650
      billsCount: 14,
      notes: 'وردية صباحية منتظمة',
    },
  ];

  const shiftCashMovements: ShiftCashMovement[] = [];

  const suppliers: Supplier[] = [
    {
      id: 'sup_1',
      name: 'شركة الضحى للصناعات الغذائية',
      phone: '01001122334',
      address: 'المنطقة الصناعية، 6 أكتوبر',
      storeId: 'store_grocery',
      productsSupplied: 'أرز، بقوليات، دقيق',
      balance: 14500,
      createdAt: '2026-01-01T08:00:00Z',
    },
    {
      id: 'sup_2',
      name: 'مجموعة النصر للمنظفات والكيماويات',
      phone: '01223344556',
      address: 'مدينة بدر الصناعية',
      storeId: 'store_detergents',
      productsSupplied: 'برسيل، فيري، كلوركس، ديتول',
      balance: 22000,
      createdAt: '2026-01-01T08:00:00Z',
    },
    {
      id: 'sup_3',
      name: 'المؤسسة العالمية لاستيراد الحلويات والشوكولاتة',
      phone: '01122334488',
      address: 'مصر الجديدة، القاهرة',
      storeId: 'store_sweets',
      productsSupplied: 'نوتيلا، فيريرو، كيندر، لوتس، برينجلز',
      balance: 38000,
      createdAt: '2026-01-01T08:00:00Z',
    },
  ];

  const expenses: Expense[] = [
    {
      id: 'exp_1',
      storeId: 'store_grocery',
      category: 'rent',
      categoryLabel: 'إيجار المحل',
      amount: 4500,
      date: new Date().toISOString().split('T')[0],
      notes: 'إيجار فرع البقالة لشهر نوفمبر',
      createdAt: new Date().toISOString(),
      createdBy: 'أحمد الإدريسي (المدير العام)',
    },
    {
      id: 'exp_2',
      storeId: 'store_detergents',
      category: 'electricity',
      categoryLabel: 'كهرباء ومرافق',
      amount: 1100,
      date: new Date().toISOString().split('T')[0],
      notes: 'فاتورة الكهرباء والإنارة',
      createdAt: new Date().toISOString(),
      createdBy: 'أحمد الإدريسي (المدير العام)',
    },
    {
      id: 'exp_3',
      storeId: 'store_sweets',
      category: 'maintenance',
      categoryLabel: 'صيانة وتبريد',
      amount: 850,
      date: new Date().toISOString().split('T')[0],
      notes: 'صيانة ثلاجات عرض الجاتوه والتورت',
      createdAt: new Date().toISOString(),
      createdBy: 'أحمد الإدريسي (المدير العام)',
    },
  ];

  const sales: Sale[] = [
    {
      id: 'sale_demo_1',
      invoiceNumber: 'INV-GR-1001',
      storeId: 'store_grocery',
      cashierId: 'usr_cashier_grocery',
      cashierName: 'محمد فتحي (كاشير البقالة)',
      shiftId: 'shift_init_1',
      items: [
        {
          productId: 'prod_gr_1',
          name: 'أرز مصري الضحى 1 كجم',
          barcode: '622100010001',
          unit: 'كيس',
          quantity: 2,
          unitPrice: 40,
          costPrice: 34,
          total: 80,
        },
        {
          productId: 'prod_gr_4',
          name: 'مكرونة إيطاليانو أقلام 400 جم',
          barcode: '622100010004',
          unit: 'كيس',
          quantity: 3,
          unitPrice: 19,
          costPrice: 15,
          total: 57,
        },
      ],
      subtotal: 137,
      discount: 7,
      total: 130,
      paymentMethod: 'cash',
      cashPaid: 150,
      cardPaid: 0,
      changeAmount: 20,
      customerName: 'عميل نقدي',
      status: 'completed',
      createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    },
  ];

  const inventoryMovements: InventoryMovement[] = [
    {
      id: 'mov_init_1',
      storeId: 'store_grocery',
      productId: 'prod_gr_1',
      productName: 'أرز مصري الضحى 1 كجم',
      type: 'sale',
      quantity: -2,
      previousStock: 47,
      newStock: 45,
      referenceId: 'sale_demo_1',
      notes: 'مبيعات فاتورة رقم INV-GR-1001',
      userId: 'usr_cashier_grocery',
      userName: 'محمد فتحي (كاشير البقالة)',
      createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    },
  ];

  const purchases: Purchase[] = [];
  const returns: ReturnRecord[] = [];
  const dailyClosings: DailyClosing[] = [];
  const promotions: Promotion[] = [
    {
      id: 'promo_1',
      storeId: 'store_sweets',
      title: 'خصم نهاية الأسبوع 10% على الشوكولاتة المستوردة',
      type: 'percentage',
      value: 10,
      targetType: 'category',
      targetId: 'cat_sw_1',
      startDate: '2026-11-01',
      endDate: '2026-11-30',
      isActive: true,
    },
    {
      id: 'promo_2',
      storeId: 'store_grocery',
      title: 'خصم 5 ج.م عند شراء 2 زيت كريستال أو أكثر',
      type: 'fixed',
      value: 5,
      targetType: 'product',
      targetId: 'prod_gr_3',
      startDate: '2026-11-01',
      endDate: '2026-11-30',
      isActive: true,
    },
  ];
  const transfers: TransferRecord[] = [];
  const auditLogs: AuditLog[] = [
    {
      id: 'log_init_1',
      storeId: 'store_grocery',
      userId: 'usr_admin',
      userName: 'أحمد الإدريسي (المدير العام)',
      action: 'تهيئة النظام',
      details: 'تم إطلاق نظام إدارة المحلات الثلاثة بنجاح مع الفروع وقواعد البيانات الأولية',
      createdAt: '2026-01-01T08:00:00Z',
    },
  ];

  return {
    stores,
    users,
    categories,
    suggestedProducts,
    products,
    shifts,
    shiftCashMovements,
    sales,
    inventoryMovements,
    suppliers,
    purchases,
    returns,
    expenses,
    dailyClosings,
    promotions,
    transfers,
    auditLogs,
  };
}

// Database helper class with atomic disk writes
class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.load();
  }

  private load(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.error('Failed to load database.json, initializing fresh data:', err);
    }
    const initial = getInitialData();
    this.saveData(initial);
    return initial;
  }

  private saveData(data: DatabaseSchema): void {
    const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  }

  public save(): void {
    this.saveData(this.data);
  }

  public get<K extends keyof DatabaseSchema>(key: K): DatabaseSchema[K] {
    return this.data[key];
  }

  public getAll(): DatabaseSchema {
    return this.data;
  }

  public logAudit(userId: string, userName: string, action: string, details: string, storeId?: string): void {
    const log: AuditLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      storeId,
      userId,
      userName,
      action,
      details,
      createdAt: new Date().toISOString(),
    };
    this.data.auditLogs.unshift(log);
    // Keep max 1000 logs
    if (this.data.auditLogs.length > 1000) {
      this.data.auditLogs = this.data.auditLogs.slice(0, 1000);
    }
    this.save();
  }
}

export const db = new Database();
