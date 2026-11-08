import React, { useState, useEffect, useRef } from 'react';
import { Store, Category, SuggestedProduct } from '../../types';
import { api } from '../../services/api';
import {
  Search,
  Plus,
  Sparkles,
  Barcode,
  Package,
  X,
  Check,
  Camera,
  FileSpreadsheet,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

interface SmartProductAddModalProps {
  stores: Store[];
  defaultStoreId?: string;
  onClose: () => void;
  onProductAdded: () => void;
}

export const SmartProductAddModal: React.FC<SmartProductAddModalProps> = ({
  stores,
  defaultStoreId,
  onClose,
  onProductAdded,
}) => {
  const [selectedStoreId, setSelectedStoreId] = useState<string>(
    defaultStoreId && defaultStoreId !== 'all' ? defaultStoreId : stores[0]?.id || ''
  );
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');

  // Mode: 'suggested' or 'manual' or 'ai_scan' or 'csv_import'
  const [activeTab, setActiveTab] = useState<'suggested' | 'manual' | 'ai_scan'>('suggested');

  // Suggested products
  const [suggestedItems, setSuggestedItems] = useState<SuggestedProduct[]>([]);
  const [suggestedSearch, setSuggestedSearch] = useState('');
  const [loadingSuggested, setLoadingSuggested] = useState(false);
  const [selectedSuggested, setSelectedSuggested] = useState<SuggestedProduct | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [barcode, setBarcode] = useState('');
  const [unit, setUnit] = useState('قطعة');
  const [costPrice, setCostPrice] = useState<number>(0);
  const [sellingPrice, setSellingPrice] = useState<number>(0);
  const [currentStock, setCurrentStock] = useState<number>(10);
  const [minStockAlert, setMinStockAlert] = useState<number>(5);
  const [expiryDate, setExpiryDate] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [origin, setOrigin] = useState('');

  // AI Scan state
  const [isScanningImage, setIsScanningImage] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const selectedStore = stores.find(s => s.id === selectedStoreId);

  // Load categories when store changes
  useEffect(() => {
    if (selectedStoreId) {
      api.getCategories(selectedStoreId).then(cats => {
        setCategories(cats);
        if (cats.length > 0 && !selectedCategoryId) {
          setSelectedCategoryId(cats[0].id);
        }
      });
    }
  }, [selectedStoreId]);

  // Load suggested products based on store type
  useEffect(() => {
    if (selectedStore) {
      setLoadingSuggested(true);
      api
        .getSuggestedProducts({ storeType: selectedStore.type, search: suggestedSearch })
        .then(items => setSuggestedItems(items))
        .catch(err => console.error(err))
        .finally(() => setLoadingSuggested(false));
    }
  }, [selectedStore?.type, suggestedSearch]);

  // Select a suggested product to prefill
  const handleSelectSuggested = (item: SuggestedProduct) => {
    setSelectedSuggested(item);
    setName(item.name);
    setBrand(item.brand);
    setUnit(item.unit);
    setCostPrice(item.defaultCostPrice);
    setSellingPrice(item.defaultSellingPrice);
    setBarcode(`622${Date.now().toString().slice(-9)}`); // auto-generate standard Egyptian barcode
    if (item.origin) setOrigin(item.origin);

    // Auto-match category if possible
    const matchCat = categories.find(c => c.name.includes(item.categoryName) || item.categoryName.includes(c.name));
    if (matchCat) {
      setSelectedCategoryId(matchCat.id);
    }
  };

  // Generate random unique barcode
  const handleGenerateBarcode = () => {
    const code = `622${Math.floor(100000000 + Math.random() * 900000000)}`;
    setBarcode(code);
  };

  // Handle Image AI Scan (gemini-3.8-flash multimodal)
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsScanningImage(true);
      setErrorMsg(null);
      setScanResult('جاري تحليل صورة المنتج وقراءة الباركود والبيانات عبر الذكاء الاصطناعي...');

      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        try {
          const res = await api.analyzeImage(base64, 'product', file.type);
          if (res.data) {
            const d = res.data;
            if (d.name) setName(d.name);
            if (d.brand) setBrand(d.brand);
            if (d.barcode) setBarcode(d.barcode);
            if (d.unit) setUnit(d.unit);
            if (d.estimatedPrice) setSellingPrice(d.estimatedPrice);
            if (d.expiryDate) setExpiryDate(d.expiryDate);
            setScanResult(`تم استخراج بيانات المنتج بنجاح: ${d.name || ''} - باركود: ${d.barcode || 'مقترح'}`);
            setActiveTab('manual');
          }
        } catch (err: any) {
          setErrorMsg(err.message || 'فشل تحليل الصورة بالذكاء الاصطناعي');
          setScanResult(null);
        } finally {
          setIsScanningImage(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setErrorMsg(err.message || 'فشل قراءة الملف');
      setIsScanningImage(false);
    }
  };

  // Save Product to Database
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStoreId || !name.trim() || !barcode.trim()) {
      setErrorMsg('المحل واسم المنتج والباركود بيانات مطلوبة');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);

      const catId = selectedCategoryId || categories[0]?.id || 'cat_general';

      await api.createProduct({
        storeId: selectedStoreId,
        categoryId: catId,
        name: name.trim(),
        brand: brand.trim(),
        barcode: barcode.trim(),
        unit: unit.trim() || 'قطعة',
        costPrice: Number(costPrice) || 0,
        sellingPrice: Number(sellingPrice) || 0,
        currentStock: Number(currentStock) || 0,
        minStockAlert: Number(minStockAlert) || 5,
        expiryDate: expiryDate || undefined,
        batchNumber: batchNumber || undefined,
        origin: origin || undefined,
      });

      setSuccessMsg(`تمت إضافة المنتج "${name}" إلى مخزن ${selectedStore?.name} بنجاح!`);
      onProductAdded();
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || 'فشل حفظ المنتج');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black">إضافة منتج إلى المخزن (نظام ذكي)</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                اختر من الكتالوج الجاهز أو أدخل البيانات يدوياً أو استخدم التعرف بالصورة
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab selection */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 pt-3 flex items-center gap-2">
          <button
            onClick={() => setActiveTab('suggested')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'suggested'
                ? 'bg-white text-teal-700 border-t-2 border-teal-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>الكتالوج المقترح والمنتجات الشهيرة ({suggestedItems.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('manual')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'manual'
                ? 'bg-white text-teal-700 border-t-2 border-teal-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>إدخال بيانات منتج يدوياً</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('ai_scan');
              fileInputRef.current?.click();
            }}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'ai_scan'
                ? 'bg-white text-teal-700 border-t-2 border-teal-600 shadow-xs'
                : 'text-teal-700 hover:text-teal-900 bg-teal-50/60'
            }`}
          >
            <Camera className="w-4 h-4 text-teal-600" />
            <span>مسح صورة المنتج بالذكاء الاصطناعي</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />
        </div>

        {/* Status messages */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}
        {scanResult && (
          <div className="mx-6 mt-4 p-3 bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold rounded-xl flex items-center gap-2">
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>{scanResult}</span>
          </div>
        )}

        <div className="p-6 overflow-y-auto flex-1">
          {/* TAB 1: SUGGESTED PRODUCTS CATALOG */}
          {activeTab === 'suggested' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="text-xs font-bold text-slate-700 shrink-0">المحل المستهدف:</span>
                  <select
                    value={selectedStoreId}
                    onChange={e => setSelectedStoreId(e.target.value)}
                    className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold focus:ring-2 focus:ring-teal-500"
                  >
                    {stores.map(st => (
                      <option key={st.id} value={st.id}>
                        {st.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="relative w-full sm:w-72">
                  <input
                    type="text"
                    value={suggestedSearch}
                    onChange={e => setSuggestedSearch(e.target.value)}
                    placeholder="ابحث في الكتالوج المقترح..."
                    className="w-full pl-8 pr-8 py-1.5 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-teal-500"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5" />
                </div>
              </div>

              {loadingSuggested ? (
                <div className="text-center py-12 text-slate-400 text-xs">جاري تحميل الكتالوج...</div>
              ) : suggestedItems.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  لا توجد منتجات مقترحة مطابقة لبحثك في هذا المحل
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-72 overflow-y-auto p-1">
                  {suggestedItems.map(item => (
                    <div
                      key={item.id}
                      onClick={() => {
                        handleSelectSuggested(item);
                        setActiveTab('manual');
                      }}
                      className="p-3 bg-white border border-slate-200 hover:border-teal-500 hover:bg-teal-50/30 rounded-2xl cursor-pointer transition-all flex flex-col justify-between group shadow-2xs"
                    >
                      <div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                          <span className="font-bold text-teal-700">{item.categoryName}</span>
                          <span>{item.unit}</span>
                        </div>
                        <h4 className="font-bold text-xs text-slate-900 group-hover:text-teal-700 leading-snug">
                          {item.name}
                        </h4>
                        <span className="text-[10px] text-slate-500 mt-0.5 block">{item.brand}</span>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                        <div className="text-xs font-mono font-bold text-slate-800">
                          {item.defaultSellingPrice} ج.م
                          <span className="text-[10px] text-slate-400 font-normal mr-1">
                            (تكلفة {item.defaultCostPrice})
                          </span>
                        </div>
                        <span className="text-[10px] bg-teal-600 text-white px-2 py-0.5 rounded-lg font-bold group-hover:bg-teal-500">
                          اعتماد الصنف ←
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2 & FORM: MANUAL PRODUCT SPECIFICATION */}
          {(activeTab === 'manual' || activeTab === 'ai_scan') && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {selectedSuggested && (
                <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-xs text-teal-900 flex items-center justify-between">
                  <span>تم سحب البيانات من المنتج المقترح: <strong>{selectedSuggested.name}</strong></span>
                  <button
                    type="button"
                    onClick={() => setSelectedSuggested(null)}
                    className="text-teal-700 hover:underline font-bold"
                  >
                    إلغاء الربط
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {/* Store Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">المحل / الفرع:</label>
                  <select
                    value={selectedStoreId}
                    onChange={e => setSelectedStoreId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-teal-500"
                  >
                    {stores.map(st => (
                      <option key={st.id} value={st.id}>
                        {st.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Category Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">القسم / التصنيف:</label>
                  <select
                    value={selectedCategoryId}
                    onChange={e => setSelectedCategoryId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-teal-500"
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Barcode */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">رقم الباركود:</label>
                    <button
                      type="button"
                      onClick={handleGenerateBarcode}
                      className="text-[10px] text-teal-700 font-bold hover:underline"
                    >
                      توليد تلقائي
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={barcode}
                      onChange={e => setBarcode(e.target.value)}
                      placeholder="امسح بالباركود أو اكتب..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs font-bold focus:ring-2 focus:ring-teal-500"
                    />
                    <Barcode className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                  </div>
                </div>

                {/* Product Name */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">اسم المنتج التجاري الكامل:</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="مثال: أرز مصري الضحى 1 كجم"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                {/* Brand */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الماركة / الشركة المصنعة:</label>
                  <input
                    type="text"
                    value={brand}
                    onChange={e => setBrand(e.target.value)}
                    placeholder="مثال: الضحى، فيري، كيندر..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                {/* Unit of measure */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">وحدة البيع:</label>
                  <input
                    type="text"
                    value={unit}
                    onChange={e => setUnit(e.target.value)}
                    placeholder="قطعة، كجم، لتر، عبوة، كيس..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                {/* Cost Price */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">سعر الشراء (التكلفة) ج.م:</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={costPrice}
                    onChange={e => setCostPrice(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs font-bold focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                {/* Selling Price */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">سعر البيع للمستهلك ج.م:</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={sellingPrice}
                    onChange={e => setSellingPrice(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 border border-teal-500 rounded-xl font-mono text-sm font-black text-teal-800 focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                {/* Current Stock */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الرصيد الافتتاحي في المخزن:</label>
                  <input
                    type="number"
                    min="0"
                    value={currentStock}
                    onChange={e => setCurrentStock(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs font-bold focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                {/* Min stock alert */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">حد التنبيه بنقص المخزون:</label>
                  <input
                    type="number"
                    min="1"
                    value={minStockAlert}
                    onChange={e => setMinStockAlert(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                {/* Expiry Date */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">تاريخ انتهاء الصلاحية (إن وجد):</label>
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={e => setExpiryDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                {/* Batch number / origin */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">بلد المنشأ / رقم التشغيلة:</label>
                  <input
                    type="text"
                    value={origin}
                    onChange={e => setOrigin(e.target.value)}
                    placeholder="مصر، إيطاليا، ألمانيا، إلخ..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* Bottom Submit */}
              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-600/20 disabled:opacity-50"
                >
                  {isSubmitting ? 'جاري الحفظ...' : 'حفظ المنتج في المخزن'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
