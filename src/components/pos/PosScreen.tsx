import React, { useState, useEffect, useRef } from 'react';
import { Store, User, Product, Category, Shift, Sale } from '../../types';
import { api } from '../../services/api';
import {
  Search,
  Barcode,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Banknote,
  Receipt,
  LogOut,
  AlertCircle,
  Clock,
  DollarSign,
  ArrowDownRight,
  ArrowUpLeft,
  XCircle,
  Volume2,
  RefreshCw,
  RotateCcw,
  Store as StoreIcon,
} from 'lucide-react';
import { ThermalReceiptModal } from '../common/ThermalReceiptModal';

interface PosScreenProps {
  user: User;
  store: Store;
  activeShift: Shift | null;
  onLogout: () => void;
  onShiftChange: (shift: Shift | null) => void;
}

interface CartItem {
  product: Product;
  quantity: number;
}

export const PosScreen: React.FC<PosScreenProps> = ({
  user,
  store,
  activeShift,
  onLogout,
  onShiftChange,
}) => {
  // Products & Categories
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'split'>('cash');
  const [cashPaid, setCashPaid] = useState<number>(0);
  const [cardPaid, setCardPaid] = useState<number>(0);
  const [customerName, setCustomerName] = useState('عميل نقدي');

  // Completed sale modal
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);

  // Shifts modals
  const [showOpenShiftModal, setShowOpenShiftModal] = useState(false);
  const [showCloseShiftModal, setShowCloseShiftModal] = useState(false);
  const [showDrawerMovementModal, setShowDrawerMovementModal] = useState(false);
  const [openingFloatInput, setOpeningFloatInput] = useState<number>(500);
  const [actualCashInput, setActualCashInput] = useState<number>(0);
  const [closingNotes, setClosingNotes] = useState('');
  const [drawerMovementType, setDrawerMovementType] = useState<'in' | 'out'>('in');
  const [drawerAmount, setDrawerAmount] = useState<number>(100);
  const [drawerReason, setDrawerReason] = useState('');

  // Status / error / audio messages
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Returns modal
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnInvoiceNumber, setReturnInvoiceNumber] = useState('');
  const [returnReason, setReturnReason] = useState('استبدال / استرجاع من العميل');
  const [returnItems, setReturnItems] = useState<{ productId: string; name: string; quantity: number; unitPrice: number }[]>([]);

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Load products & categories for this specific store
  const loadStoreData = async () => {
    try {
      setLoadingProducts(true);
      const [prods, cats] = await Promise.all([
        api.getProducts({ storeId: store.id }),
        api.getCategories(store.id),
      ]);
      setProducts(prods);
      setCategories(cats);
    } catch (err: any) {
      setErrorMsg(err.message || 'فشل تحميل بيانات المحل');
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    loadStoreData();
  }, [store.id]);

  // Keep barcode input focused for physical scanners
  useEffect(() => {
    if (!showOpenShiftModal && !showCloseShiftModal && !completedSale && !showReturnModal) {
      barcodeInputRef.current?.focus();
    }
  }, [showOpenShiftModal, showCloseShiftModal, completedSale, showReturnModal]);

  // Auto show open shift modal if no active shift
  useEffect(() => {
    if (!activeShift) {
      setShowOpenShiftModal(true);
    }
  }, [activeShift]);

  // Totals calculations
  const subtotal = cart.reduce((sum, item) => sum + item.product.sellingPrice * item.quantity, 0);
  const total = Math.max(0, subtotal - discount);
  const changeAmount = paymentMethod === 'cash' ? Math.max(0, cashPaid - total) : 0;

  // Update default cashPaid when total changes
  useEffect(() => {
    if (paymentMethod === 'cash') {
      setCashPaid(total);
    } else if (paymentMethod === 'card') {
      setCardPaid(total);
      setCashPaid(0);
    }
  }, [total, paymentMethod]);

  // Filter products by category & search
  const filteredProducts = products.filter(p => {
    if (selectedCategory !== 'all' && p.categoryId !== selectedCategory) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase().trim();
    return p.name.toLowerCase().includes(q) || p.barcode.includes(q) || p.brand.toLowerCase().includes(q);
  });

  // Handle adding product to cart
  const addToCart = (product: Product) => {
    if (product.currentStock <= 0) {
      setErrorMsg(`عذراً، المنتج "${product.name}" نفد من المخزون تماماً!`);
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        if (existing.quantity + 1 > product.currentStock) {
          setErrorMsg(`لا يمكن تجاوز المخزون المتاح (${product.currentStock} ${product.unit})`);
          return prev;
        }
        return prev.map(item =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    setErrorMsg(null);
  };

  // Barcode enter key handler
  const handleBarcodeSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      e.preventDefault();
      const code = searchQuery.trim();
      const found = products.find(p => p.barcode === code);
      if (found) {
        addToCart(found);
        setSearchQuery('');
      } else {
        // Try finding single match by name
        const matches = products.filter(p => p.name.toLowerCase().includes(code.toLowerCase()));
        if (matches.length === 1) {
          addToCart(matches[0]);
          setSearchQuery('');
        } else {
          setErrorMsg(`لم يتم العثور على منتج بالباركود: ${code}`);
        }
      }
    }
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => {
      return prev
        .map(item => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            if (newQty > item.product.currentStock) {
              setErrorMsg(`الكمية المطلوبة تتجاوز المخزون المتاح (${item.product.currentStock})`);
              return item;
            }
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
    setErrorMsg(null);
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setDiscount(0);
    setCashPaid(0);
    setCardPaid(0);
    setErrorMsg(null);
  };

  // Submit Sale
  const handleCompleteSale = async () => {
    if (!activeShift) {
      setErrorMsg('يجب فتح الوردية أولاً لإتمام عمليات البيع');
      setShowOpenShiftModal(true);
      return;
    }

    if (cart.length === 0) {
      setErrorMsg('سلة البيع فارغة! أضف منتجات أولاً.');
      return;
    }

    if (paymentMethod === 'cash' && cashPaid < total) {
      setErrorMsg(`المبلغ المدفوع نقداً (${cashPaid} ج.م) أقل من إجمالي الفاتورة (${total} ج.م)`);
      return;
    }

    if (paymentMethod === 'split' && (cashPaid + cardPaid < total)) {
      setErrorMsg('إجمالي المبالغ المدفوعة (كاش + فيزا) أقل من قيمة الفاتورة');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);

      const payload = {
        storeId: store.id,
        cashierId: user.id,
        cashierName: user.name,
        shiftId: activeShift.id,
        items: cart.map(item => ({
          productId: item.product.id,
          name: item.product.name,
          quantity: item.quantity,
        })),
        discount,
        paymentMethod,
        cashPaid: paymentMethod === 'card' ? 0 : cashPaid,
        cardPaid: paymentMethod === 'cash' ? 0 : cardPaid,
        customerName,
      };

      const res = await api.createSale(payload);
      setCompletedSale(res.sale);
      clearCart();

      // Refresh products stock & shift
      loadStoreData();
      const updatedShift = await api.getActiveShift(user.id, store.id);
      onShiftChange(updatedShift);

      // Play voice announcement via Gemini TTS
      try {
        setIsSpeaking(true);
        const voiceText = `إجمالي الفاتورة ${res.sale.total} جنيه. شكراً لزيارتكم ${store.name}`;
        const tts = await api.textToSpeech(voiceText);
        if (tts.audioBase64) {
          const audio = new Audio(`data:${tts.mimeType || 'audio/wav'};base64,${tts.audioBase64}`);
          await audio.play().catch(() => {});
        } else if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(voiceText);
          utterance.lang = 'ar-SA';
          window.speechSynthesis.speak(utterance);
        }
      } catch (e) {
        // Voice is supplementary, ignore if silent
      } finally {
        setIsSpeaking(false);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'فشل إتمام عملية البيع');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Shift
  const handleOpenShift = async () => {
    try {
      setIsSubmitting(true);
      setErrorMsg(null);
      const shift = await api.openShift({
        storeId: store.id,
        cashierId: user.id,
        cashierName: user.name,
        openingFloat: Number(openingFloatInput) || 0,
        notes: 'بدء وردية جديدة',
      });
      onShiftChange(shift);
      setShowOpenShiftModal(false);
      setSuccessMsg(`تم فتح الوردية بنجاح برصيد بداية ${shift.openingFloat} ج.م`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'فشل فتح الوردية');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Close Shift (الجرد وحساب العجز والزيادة)
  const handleCloseShift = async () => {
    if (!activeShift) return;
    try {
      setIsSubmitting(true);
      setErrorMsg(null);

      const res = await api.closeShift({
        shiftId: activeShift.id,
        actualCash: Number(actualCashInput) || 0,
        notes: closingNotes,
        userId: user.id,
        userName: user.name,
      });

      onShiftChange(null);
      setShowCloseShiftModal(false);

      const diff = res.shift.cashDifference || 0;
      const diffText = diff === 0 ? 'مطابق تماماً (لا يوجد عجز أو زيادة)' : diff > 0 ? `زيادة بمقدار +${diff} ج.م` : `عجز بمقدار ${Math.abs(diff)} ج.م`;
      setSuccessMsg(`تم إغلاق الوردية وحفظ الجرد بنجاح! نتيجة الدرج: ${diffText}`);
    } catch (err: any) {
      setErrorMsg(err.message || 'فشل إغلاق الوردية');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Record Drawer Movement (إيداع / سحب)
  const handleDrawerMovement = async () => {
    if (!activeShift) return;
    try {
      setIsSubmitting(true);
      const res = await api.shiftCashMovement({
        shiftId: activeShift.id,
        type: drawerMovementType,
        amount: Number(drawerAmount) || 0,
        reason: drawerReason || (drawerMovementType === 'in' ? 'إيداع نقدي' : 'سحب نقدي'),
        userId: user.id,
        userName: user.name,
      });
      onShiftChange(res.shift);
      setShowDrawerMovementModal(false);
      setDrawerAmount(100);
      setDrawerReason('');
      setSuccessMsg('تم تسجيل حركة الدرج بنجاح');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'فشل تسجيل حركة الدرج');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-100 overflow-hidden font-['Cairo',sans-serif] text-slate-800 select-none">
      {/* 1. TOP HEADER (Store branding & Cashier shift info) */}
      <header className="bg-slate-900 text-white px-4 py-2.5 flex items-center justify-between border-b border-slate-800 shadow-md">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-inner"
            style={{ backgroundColor: store.color }}
          >
            <StoreIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-base tracking-wide text-white">{store.name}</h1>
              <span
                className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider text-white"
                style={{ backgroundColor: store.color }}
              >
                شاشة الكاشير
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{store.address}</p>
          </div>
        </div>

        {/* Center: Shift status pill */}
        <div className="hidden md:flex items-center gap-3 bg-slate-800/80 px-4 py-1.5 rounded-2xl border border-slate-700/80">
          <Clock className="w-4 h-4 text-teal-400" />
          {activeShift ? (
            <div className="text-xs">
              <span className="text-slate-400">الوردية الحالية: </span>
              <span className="text-teal-300 font-bold">مفتوحة</span>
              <span className="text-slate-400 mr-2">| البداية: </span>
              <span className="font-mono text-white font-bold">{activeShift.openingFloat} ج.م</span>
              <span className="text-slate-400 mr-2">| المبيعات: </span>
              <span className="font-mono text-emerald-400 font-bold">{activeShift.cashSales + activeShift.cardSales} ج.م</span>
            </div>
          ) : (
            <div className="text-xs text-amber-300 font-bold flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>لا توجد وردية مفتوحة حالياً</span>
            </div>
          )}
        </div>

        {/* Left actions: Shift Controls, Voice, Logout */}
        <div className="flex items-center gap-2">
          {activeShift ? (
            <>
              <button
                onClick={() => setShowDrawerMovementModal(true)}
                title="سحب أو إيداع نقدي بالدرج"
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
              >
                <Banknote className="w-3.5 h-3.5 text-teal-400" />
                <span className="hidden sm:inline">حركة درج</span>
              </button>

              <button
                onClick={() => {
                  setActualCashInput(activeShift.expectedCash);
                  setShowCloseShiftModal(true);
                }}
                className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border border-amber-500/30"
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>إغلاق الوردية والجرد</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => setShowOpenShiftModal(true)}
              className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>فتح وردية جديدة</span>
            </button>
          )}

          <div className="h-6 w-px bg-slate-700 mx-1" />

          {/* Cashier user badge */}
          <div className="flex items-center gap-2 text-right">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-teal-300">
              {user.name.slice(0, 1)}
            </div>
            <div className="hidden lg:block text-xs">
              <div className="font-bold text-slate-200 leading-tight">{user.name}</div>
              <div className="text-[10px] text-slate-400">كاشير الفرع</div>
            </div>
          </div>

          <button
            onClick={onLogout}
            title="تسجيل الخروج"
            className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-xl transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Notifications bar */}
      {errorMsg && (
        <div className="bg-red-600 text-white px-4 py-2 text-xs font-semibold flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="p-0.5 hover:bg-red-700 rounded">
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}
      {successMsg && (
        <div className="bg-emerald-600 text-white px-4 py-2 text-xs font-semibold flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-white" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="p-0.5 hover:bg-emerald-700 rounded">
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. MAIN POS WORKSPACE (Catalog & Cart) */}
      <div className="flex-1 flex overflow-hidden">
        {/* RIGHT PANEL: Products Browser (70% width on desktop) */}
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 border-l border-slate-200">
          {/* Search bar & Barcode Reader */}
          <div className="p-3 bg-white border-b border-slate-200 shadow-xs flex items-center gap-3">
            <div className="relative flex-1">
              <input
                ref={barcodeInputRef}
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={handleBarcodeSubmit}
                placeholder="امسح الباركود أو ابحث باسم المنتج (اضغط Enter للإضافة المباشرة)..."
                className="w-full pl-10 pr-10 py-2.5 bg-slate-100 hover:bg-slate-50 focus:bg-white border border-slate-300 focus:border-teal-500 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-all"
              />
              <Barcode className="w-5 h-5 text-teal-600 absolute right-3 top-2.5" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute left-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              )}
            </div>

            <button
              onClick={loadStoreData}
              title="تحديث قائمة الأصناف والأسعار"
              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors border border-slate-200"
            >
              <RefreshCw className={`w-4 h-4 ${loadingProducts ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Categories Horizontal Pills */}
          <div className="px-3 py-2 bg-white border-b border-slate-200 flex items-center gap-2 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              جميع الأقسام ({products.length})
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Products Grid */}
          <div className="flex-1 p-3 overflow-y-auto">
            {loadingProducts ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                جاري تحميل منتجات المحل...
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm">
                <StoreIcon className="w-12 h-12 mb-2 opacity-30" />
                <p>لا توجد منتجات مطابقة للبحث أو القسم المحدد</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5">
                {filteredProducts.map(prod => {
                  const isOutOfStock = prod.currentStock <= 0;
                  const isLowStock = prod.currentStock <= prod.minStockAlert && !isOutOfStock;

                  return (
                    <button
                      key={prod.id}
                      onClick={() => addToCart(prod)}
                      disabled={isOutOfStock}
                      className={`relative flex flex-col justify-between p-2.5 rounded-2xl border text-right transition-all transform active:scale-95 group ${
                        isOutOfStock
                          ? 'bg-slate-100 border-slate-200 opacity-60 cursor-not-allowed'
                          : 'bg-white hover:bg-teal-50/50 border-slate-200 hover:border-teal-400 shadow-xs hover:shadow-md'
                      }`}
                    >
                      {/* Top Badges */}
                      <div className="flex items-center justify-between w-full mb-1">
                        <span className="text-[10px] text-slate-500 font-mono tracking-tight">
                          {prod.unit}
                        </span>
                        {isOutOfStock ? (
                          <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-md font-bold">
                            نافد
                          </span>
                        ) : isLowStock ? (
                          <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-md font-bold">
                            باقي {prod.currentStock}
                          </span>
                        ) : (
                          <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-md font-semibold">
                            {prod.currentStock}
                          </span>
                        )}
                      </div>

                      {/* Product Name & Brand */}
                      <div className="my-1">
                        <div className="text-xs font-bold text-slate-900 group-hover:text-teal-700 line-clamp-2 leading-snug">
                          {prod.name}
                        </div>
                        {prod.brand && (
                          <div className="text-[10px] text-slate-400 truncate mt-0.5">
                            {prod.brand}
                          </div>
                        )}
                      </div>

                      {/* Price & Barcode */}
                      <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-baseline justify-between w-full">
                        <div className="text-sm font-black text-slate-950 font-mono">
                          {prod.sellingPrice} <span className="text-[10px] font-normal text-slate-500">ج.م</span>
                        </div>
                        <div className="text-[9px] text-slate-400 font-mono">
                          {prod.barcode.slice(-4)}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* LEFT PANEL: POS Bill / Cart (30% width on desktop) */}
        <div className="w-80 md:w-96 lg:w-[420px] bg-white flex flex-col border-r border-slate-200 shadow-xl z-10">
          {/* Cart Header */}
          <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-teal-600" />
              <span className="font-bold text-sm text-slate-900">سلة الفاتورة</span>
              <span className="bg-teal-100 text-teal-800 text-xs px-2 py-0.5 rounded-full font-bold">
                {cart.reduce((s, i) => s + i.quantity, 0)} قطعة
              </span>
            </div>

            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs text-red-600 hover:text-red-700 font-semibold flex items-center gap-1 hover:bg-red-50 px-2 py-1 rounded-lg transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>إفراغ</span>
              </button>
            )}
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 divide-y divide-slate-100">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm">
                <ShoppingCart className="w-12 h-12 mb-2 opacity-25" />
                <p>الفاتورة فارغة حالياً</p>
                <p className="text-xs text-slate-400 mt-1">اختر الأصناف أو امسح الباركود للبدء</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.product.id} className="pt-2 first:pt-0 flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-slate-900 truncate">
                      {item.product.name}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                      {item.product.sellingPrice} ج.م × {item.quantity} ={' '}
                      <span className="font-bold text-slate-900">
                        {(item.product.sellingPrice * item.quantity).toFixed(2)} ج.م
                      </span>
                    </div>
                  </div>

                  {/* Quantity controls */}
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                    <button
                      onClick={() => updateQuantity(item.product.id, -1)}
                      className="w-6 h-6 rounded-lg bg-white hover:bg-slate-200 flex items-center justify-center text-slate-700 shadow-xs"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-7 text-center font-bold text-xs font-mono text-slate-900">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.product.id, 1)}
                      className="w-6 h-6 rounded-lg bg-white hover:bg-slate-200 flex items-center justify-center text-slate-700 shadow-xs"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Payment & Totals Summary */}
          <div className="p-3.5 bg-slate-50 border-t border-slate-200 space-y-3">
            {/* Discount input */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">خصم إضافي (ج.م):</span>
              <div className="flex items-center gap-1">
                {[0, 5, 10, 20].map(val => (
                  <button
                    key={val}
                    onClick={() => setDiscount(val)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      discount === val ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {val === 0 ? 'لا يوجد' : `${val}`}
                  </button>
                ))}
                <input
                  type="number"
                  min="0"
                  max={subtotal}
                  value={discount}
                  onChange={e => setDiscount(Math.max(0, Number(e.target.value) || 0))}
                  className="w-16 px-2 py-1 text-center bg-white border border-slate-300 rounded-lg font-mono text-xs"
                />
              </div>
            </div>

            {/* Payment Method selector */}
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`py-2 px-1 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                  paymentMethod === 'cash'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Banknote className="w-4 h-4" />
                <span>نقدي (كاش)</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`py-2 px-1 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                  paymentMethod === 'card'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>بطاقة / فيزا</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('split')}
                className={`py-2 px-1 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                  paymentMethod === 'split'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <DollarSign className="w-4 h-4" />
                <span>دفع مختلط</span>
              </button>
            </div>

            {/* Cash Tendered & Change Calculation */}
            {paymentMethod !== 'card' && (
              <div className="p-2.5 bg-white rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-bold">المبلغ المدفوع كاش:</span>
                  <input
                    type="number"
                    min={total}
                    value={cashPaid}
                    onChange={e => setCashPaid(Number(e.target.value) || 0)}
                    className="w-24 px-2 py-1 text-center bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>

                {/* Quick Cash Buttons */}
                <div className="flex items-center justify-between gap-1">
                  {[total, Math.ceil(total / 50) * 50, Math.ceil(total / 100) * 100, 200, 500].map(
                    (val, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setCashPaid(val)}
                        className="flex-1 py-1 bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-700 rounded-lg text-[10px] font-mono font-bold transition-colors"
                      >
                        {val}
                      </button>
                    )
                  )}
                </div>

                <div className="flex items-center justify-between text-xs font-bold pt-1 border-t border-slate-100">
                  <span className="text-slate-700">الباقي للعميل:</span>
                  <span className="font-mono text-sm text-teal-700">{changeAmount.toFixed(2)} ج.م</span>
                </div>
              </div>
            )}

            {/* Big Total & Checkout Button */}
            <div className="pt-2 border-t border-slate-200">
              <div className="flex items-baseline justify-between mb-3">
                <span className="text-sm font-bold text-slate-600">المبلغ المطلوب:</span>
                <div className="text-2xl font-black text-slate-950 font-mono">
                  {total.toFixed(2)}{' '}
                  <span className="text-xs font-bold text-teal-700">ج.م</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCompleteSale}
                disabled={isSubmitting || cart.length === 0}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-2xl text-base font-black flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSubmitting ? (
                  <span>جاري تسجيل البيع وخصم المخزون...</span>
                ) : (
                  <>
                    <Receipt className="w-5 h-5" />
                    <span>إتمام وطباعة الفاتورة</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. MODAL: Open Shift (فتح الوردية) */}
      {showOpenShiftModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center mb-4">
              <Clock className="w-6 h-6" />
            </div>

            <h2 className="text-xl font-black text-slate-900">فتح وردية عمل جديدة</h2>
            <p className="text-xs text-slate-500 mt-1">
              مرحباً {user.name}، للبدء في إجراء المبيعات يجب تسجيل رصيد بداية الدرج النقدي (الفكة / العهدة).
            </p>

            <div className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  رصيد بداية الوردية (العهدة النقدية بالجنيه):
                </label>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={openingFloatInput}
                  onChange={e => setOpeningFloatInput(Number(e.target.value) || 0)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl font-mono text-lg font-bold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              {/* Quick float buttons */}
              <div className="flex gap-2">
                {[0, 200, 300, 500, 1000].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setOpeningFloatInput(val)}
                    className="flex-1 py-1.5 bg-slate-100 hover:bg-teal-50 hover:text-teal-700 rounded-lg text-xs font-bold font-mono transition-colors"
                  >
                    {val} ج.م
                  </button>
                ))}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onLogout}
                  className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-xl text-xs font-semibold"
                >
                  تسجيل خروج
                </button>
                <button
                  type="button"
                  onClick={handleOpenShift}
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-sm font-bold shadow-md shadow-teal-600/20 disabled:opacity-50"
                >
                  {isSubmitting ? 'جاري الفتح...' : 'تأكيد وفتح الوردية'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. MODAL: Close Shift (إغلاق الوردية وحساب العجز أو الزيادة) */}
      {showCloseShiftModal && activeShift && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-amber-600" />
                <h2 className="text-lg font-black text-slate-900">إغلاق الوردية وجرد الخزينة</h2>
              </div>
              <button
                onClick={() => setShowCloseShiftModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Shift Calculations Summary Table */}
            <div className="my-4 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between text-slate-600">
                <span>اسم الكاشير:</span>
                <span className="font-bold text-slate-900">{activeShift.cashierName}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>المحل والفرع:</span>
                <span className="font-bold text-slate-900">{store.name}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>وقت فتح الوردية:</span>
                <span>{new Date(activeShift.openedAt).toLocaleString('ar-EG')}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>رصيد بداية الوردية (العهدة):</span>
                <span className="font-mono font-bold text-slate-900">{activeShift.openingFloat.toFixed(2)} ج.م</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>إجمالي المبيعات النقدية:</span>
                <span className="font-mono font-bold text-emerald-700">+{activeShift.cashSales.toFixed(2)} ج.م</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>إجمالي المبيعات بالبطاقة:</span>
                <span className="font-mono text-sky-700">{activeShift.cardSales.toFixed(2)} ج.م</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>عدد الفواتير المنفذة:</span>
                <span className="font-bold text-slate-900">{activeShift.billsCount} فاتورة</span>
              </div>
              {activeShift.returnsAmount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>إجمالي المرتجعات النقدية:</span>
                  <span className="font-mono font-bold">-{activeShift.returnsAmount.toFixed(2)} ج.م</span>
                </div>
              )}
              {activeShift.cashIn > 0 && (
                <div className="flex justify-between text-teal-700">
                  <span>إيداعات نقدية أثناء الوردية:</span>
                  <span className="font-mono">+{activeShift.cashIn.toFixed(2)} ج.م</span>
                </div>
              )}
              {activeShift.cashOut > 0 && (
                <div className="flex justify-between text-red-700">
                  <span>سحوبات نقدية أثناء الوردية:</span>
                  <span className="font-mono">-{activeShift.cashOut.toFixed(2)} ج.م</span>
                </div>
              )}

              <div className="pt-2 border-t border-slate-300 flex justify-between text-sm font-black text-slate-950">
                <span>النقدية المتوقع وجودها بالدرج:</span>
                <span className="font-mono text-teal-800">{activeShift.expectedCash.toFixed(2)} ج.م</span>
              </div>
            </div>

            {/* Actual cash count input */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  النقدية الفعلية بعد العد (المبلغ الموجود فعلياً بالدرج):
                </label>
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={actualCashInput}
                  onChange={e => setActualCashInput(Number(e.target.value) || 0)}
                  className="w-full px-4 py-3 bg-white border-2 border-slate-300 focus:border-teal-500 rounded-xl font-mono text-xl font-black text-slate-900 focus:outline-none"
                />
              </div>

              {/* Difference calculation result */}
              {(() => {
                const diff = actualCashInput - activeShift.expectedCash;
                return (
                  <div
                    className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-between ${
                      diff === 0
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : diff > 0
                        ? 'bg-sky-50 border-sky-200 text-sky-800'
                        : 'bg-red-50 border-red-200 text-red-800'
                    }`}
                  >
                    <span>حالة الدرج والجرد:</span>
                    <span className="font-mono text-sm">
                      {diff === 0
                        ? 'متطابق تماماً (٠.٠٠ ج.م)'
                        : diff > 0
                        ? `زيادة (+${diff.toFixed(2)} ج.م)`
                        : `عجز (${Math.abs(diff).toFixed(2)} ج.م)`}
                    </span>
                  </div>
                );
              })()}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ملاحظات الكاشير قبل الإغلاق:
                </label>
                <textarea
                  value={closingNotes}
                  onChange={e => setClosingNotes(e.target.value)}
                  placeholder="سجل أي ملاحظات أو أسباب أي عجز أو زيادة..."
                  rows={2}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCloseShiftModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
              >
                إلغاء والعودة
              </button>
              <button
                type="button"
                onClick={handleCloseShift}
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md disabled:opacity-50"
              >
                {isSubmitting ? 'جاري الإغلاق...' : 'تأكيد إغلاق الوردية نهائياً'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. MODAL: Drawer Movement (سحب / إيداع نقدي) */}
      {showDrawerMovementModal && activeShift && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h2 className="text-base font-bold text-slate-900">تسجيل حركة نقدية بالدرج</h2>
              <button onClick={() => setShowDrawerMovementModal(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDrawerMovementType('in')}
                  className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 ${
                    drawerMovementType === 'in'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  <ArrowDownRight className="w-4 h-4" />
                  <span>إيداع نقدية</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDrawerMovementType('out')}
                  className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 ${
                    drawerMovementType === 'out'
                      ? 'bg-red-600 text-white'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  <ArrowUpLeft className="w-4 h-4" />
                  <span>سحب نقدية</span>
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">المبلغ (ج.م):</label>
                <input
                  type="number"
                  min="1"
                  value={drawerAmount}
                  onChange={e => setDrawerAmount(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-base font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">السبب:</label>
                <input
                  type="text"
                  value={drawerReason}
                  onChange={e => setDrawerReason(e.target.value)}
                  placeholder="مثال: إضافة فكة، سحب لمصروف عاجل..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowDrawerMovementModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-semibold"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleDrawerMovement}
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-teal-600 text-white rounded-xl text-xs font-bold"
                >
                  تسجيل الحركة
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. MODAL: Thermal Receipt Print */}
      {completedSale && (
        <ThermalReceiptModal
          sale={completedSale}
          store={store}
          onClose={() => setCompletedSale(null)}
        />
      )}
    </div>
  );
};
