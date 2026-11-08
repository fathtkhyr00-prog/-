import React, { useState, useEffect } from 'react';
import { Store, Product, Supplier, Purchase } from '../../types';
import { api } from '../../services/api';
import { toast } from '../../context/ToastContext';
import {
  ShoppingCart,
  Users,
  Plus,
  Search,
  CheckCircle,
  PackagePlus,
  Phone,
  MapPin,
  DollarSign,
  FileText,
} from 'lucide-react';

interface PurchasesManagerProps {
  stores: Store[];
  selectedStoreId: string;
}

export const PurchasesManager: React.FC<PurchasesManagerProps> = ({
  stores,
  selectedStoreId,
}) => {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Tabs: 'purchases' or 'suppliers'
  const [activeTab, setActiveTab] = useState<'purchases' | 'suppliers'>('purchases');

  // New Purchase Modal
  const [showNewPurchaseModal, setShowNewPurchaseModal] = useState(false);
  const [targetStoreId, setTargetStoreId] = useState(selectedStoreId !== 'all' ? selectedStoreId : stores[0]?.id || '');
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [purchaseNotes, setPurchaseNotes] = useState('');
  const [purchaseItems, setPurchaseItems] = useState<{ productId: string; quantity: number; unitCost: number; sellingPrice: number }[]>([]);

  // New Supplier Modal
  const [showNewSupplierModal, setShowNewSupplierModal] = useState(false);
  const [supplierName, setSupplierName] = useState('');
  const [supplierPhone, setSupplierPhone] = useState('');
  const [supplierAddress, setSupplierAddress] = useState('');
  const [supplierProducts, setSupplierProducts] = useState('');

  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [purs, sups, prods] = await Promise.all([
        api.getPurchases(selectedStoreId),
        api.getSuppliers(selectedStoreId),
        api.getProducts({ storeId: selectedStoreId }),
      ]);
      setPurchases(purs);
      setSuppliers(sups);
      setProducts(prods);
      if (sups.length > 0 && !selectedSupplierId) {
        setSelectedSupplierId(sups[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedStoreId]);

  // Add Item to purchase form
  const handleAddItemToPurchase = (prod: Product) => {
    setPurchaseItems(prev => {
      const existing = prev.find(i => i.productId === prod.id);
      if (existing) {
        return prev.map(i => (i.productId === prod.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [
        ...prev,
        {
          productId: prod.id,
          quantity: 10,
          unitCost: prod.costPrice,
          sellingPrice: prod.sellingPrice,
        },
      ];
    });
  };

  const handleUpdateItem = (productId: string, field: string, val: number) => {
    setPurchaseItems(prev =>
      prev.map(item => (item.productId === productId ? { ...item, [field]: val } : item))
    );
  };

  const handleRemoveItem = (productId: string) => {
    setPurchaseItems(prev => prev.filter(i => i.productId !== productId));
  };

  // Submit Purchase
  const handleSubmitPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplierId || purchaseItems.length === 0) {
      toast('الرجاء اختيار المورد وإضافة منتجات للفاتورة', 'error');
      return;
    }

    const sup = suppliers.find(s => s.id === selectedSupplierId);

    try {
      await api.createPurchase({
        storeId: targetStoreId,
        supplierId: selectedSupplierId,
        supplierName: sup?.name || 'مورد عام',
        items: purchaseItems,
        paidAmount,
        notes: purchaseNotes,
      });

      setStatusMsg('تم تسجيل فاتورة الشراء بنجاح وزيادة كميات المخزون فوراً!');
      setShowNewPurchaseModal(false);
      setPurchaseItems([]);
      setPaidAmount(0);
      setPurchaseNotes('');
      loadData();
      toast('تم تسجيل فاتورة الشراء بنجاح وتحديث الأرصدة', 'success');
      setTimeout(() => setStatusMsg(null), 4000);
    } catch (err: any) {
      toast(err.message || 'فشل حفظ فاتورة الشراء', 'error');
    }
  };

  // Submit Supplier
  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierName.trim()) {
      toast('اسم المورد مطلوب', 'error');
      return;
    }

    try {
      await api.createSupplier({
        name: supplierName.trim(),
        phone: supplierPhone.trim(),
        address: supplierAddress.trim(),
        storeId: targetStoreId,
        productsSupplied: supplierProducts.trim(),
      });

      setStatusMsg(`تمت إضافة المورد "${supplierName}" بنجاح`);
      setShowNewSupplierModal(false);
      setSupplierName('');
      setSupplierPhone('');
      setSupplierAddress('');
      setSupplierProducts('');
      loadData();
      toast('تمت إضافة المورد بنجاح', 'success');
      setTimeout(() => setStatusMsg(null), 4000);
    } catch (err: any) {
      toast(err.message || 'فشل إضافة المورد', 'error');
    }
  };

  const totalPurchaseCost = purchaseItems.reduce((sum, item) => sum + item.quantity * item.unitCost, 0);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-teal-600" />
            <span>المشتريات وفواتير التوريد ودليل الموردين</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            تسجيل البضاعة الواردة من الموردين، زيادة المخزون تلقائياً، وتحديث تكلفة الشراء.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNewSupplierModal(true)}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <Users className="w-4 h-4" />
            <span>إضافة مورد جديد</span>
          </button>
          <button
            onClick={() => setShowNewPurchaseModal(true)}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <PackagePlus className="w-4 h-4" />
            <span>تسجيل فاتورة شراء واردة</span>
          </button>
        </div>
      </div>

      {statusMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setActiveTab('purchases')}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'purchases'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          فواتير المشتريات ({purchases.length})
        </button>
        <button
          onClick={() => setActiveTab('suppliers')}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'suppliers'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          دليل الموردين ({suppliers.length})
        </button>
      </div>

      {/* TAB 1: Purchases Table */}
      {activeTab === 'purchases' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          {loading ? (
            <div className="text-center py-12 text-slate-400 text-xs">جاري تحميل فواتير الشراء...</div>
          ) : purchases.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">لا توجد فواتير شراء مسجلة</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                    <th className="py-3 px-4">رقم الفاتورة</th>
                    <th className="py-3 px-4">المحل المستلم</th>
                    <th className="py-3 px-4">المورد</th>
                    <th className="py-3 px-4">عدد الأصناف</th>
                    <th className="py-3 px-4">إجمالي التكلفة</th>
                    <th className="py-3 px-4">المدفوع</th>
                    <th className="py-3 px-4">حالة السداد</th>
                    <th className="py-3 px-4">التاريخ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {purchases.map(pur => {
                    const st = stores.find(s => s.id === pur.storeId);
                    return (
                      <tr key={pur.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">{pur.invoiceNumber}</td>
                        <td className="py-3 px-4">
                          <span
                            className="text-[10px] px-2 py-0.5 rounded-md font-bold text-white"
                            style={{ backgroundColor: st?.color || '#0d9488' }}
                          >
                            {st?.name.split(' ')[1] || 'المحل'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-800">{pur.supplierName}</td>
                        <td className="py-3 px-4">{pur.items.length} أصناف</td>
                        <td className="py-3 px-4 font-mono font-black text-slate-950 text-sm">
                          {pur.totalCost.toLocaleString()} ج.م
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-700">{pur.paidAmount.toLocaleString()} ج.م</td>
                        <td className="py-3 px-4">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                              pur.paymentStatus === 'paid'
                                ? 'bg-emerald-50 text-emerald-800'
                                : pur.paymentStatus === 'partial'
                                ? 'bg-amber-50 text-amber-800'
                                : 'bg-red-50 text-red-800'
                            }`}
                          >
                            {pur.paymentStatus === 'paid' ? 'مدفوع بالكامل' : pur.paymentStatus === 'partial' ? 'سداد جزئي' : 'آجل'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-400">
                          {new Date(pur.createdAt).toLocaleDateString('ar-EG')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Suppliers Directory */}
      {activeTab === 'suppliers' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {suppliers.map(sup => (
            <div key={sup.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-900">{sup.name}</h3>
                <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-bold">
                  مورد معتمد
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-mono">{sup.phone || 'غير مسجل'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{sup.address || 'العنوان غير محدد'}</span>
                </div>
                {sup.productsSupplied && (
                  <div className="text-[11px] text-teal-700 bg-teal-50 p-2 rounded-lg mt-1 font-medium">
                    الأصناف: {sup.productsSupplied}
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">المديونية / الرصيد:</span>
                <span className="font-mono font-bold text-slate-900">{sup.balance.toLocaleString()} ج.م</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL: Register Inbound Purchase */}
      {showNewPurchaseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 border border-slate-200 max-h-[90vh] overflow-y-auto">
            <h2 className="text-base font-black text-slate-900 mb-3">تسجيل فاتورة شراء واردة وتحديث المخزون</h2>

            <form onSubmit={handleSubmitPurchase} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">المحل المستلم:</label>
                  <select
                    value={targetStoreId}
                    onChange={e => setTargetStoreId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
                  >
                    {stores.map(st => (
                      <option key={st.id} value={st.id}>
                        {st.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">المورد:</label>
                  <select
                    value={selectedSupplierId}
                    onChange={e => setSelectedSupplierId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
                  >
                    {suppliers.map(sup => (
                      <option key={sup.id} value={sup.id}>
                        {sup.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Add item to invoice */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اختر الصنف لإضافته للفاتورة:</label>
                <select
                  onChange={e => {
                    const prod = products.find(p => p.id === e.target.value);
                    if (prod) handleAddItemToPurchase(prod);
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-teal-500 rounded-xl text-xs font-bold text-teal-900"
                >
                  <option value="">-- اضغط لاختيار منتج من المحل المستلم --</option>
                  {products
                    .filter(p => p.storeId === targetStoreId)
                    .map(p => (
                      <option key={p.id} value={p.id}>
                        + {p.name} (التكلفة السابقة: {p.costPrice} ج.م)
                      </option>
                    ))}
                </select>
              </div>

              {/* Items List in purchase */}
              {purchaseItems.length > 0 && (
                <div className="space-y-2 border border-slate-200 p-3 rounded-2xl bg-slate-50">
                  <h4 className="text-xs font-bold text-slate-800">أصناف الفاتورة ({purchaseItems.length}):</h4>
                  {purchaseItems.map(item => {
                    const prod = products.find(p => p.id === item.productId);
                    return (
                      <div key={item.productId} className="flex items-center justify-between gap-2 bg-white p-2.5 rounded-xl border border-slate-200 text-xs">
                        <div className="font-bold text-slate-900 flex-1 truncate">{prod?.name}</div>
                        <div className="flex items-center gap-2">
                          <div>
                            <span className="text-[10px] text-slate-400 block">الكمية:</span>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={e => handleUpdateItem(item.productId, 'quantity', Number(e.target.value))}
                              className="w-16 px-1.5 py-1 border border-slate-300 rounded font-mono text-center"
                            />
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block">سعر التكلفة:</span>
                            <input
                              type="number"
                              min="0"
                              step="0.5"
                              value={item.unitCost}
                              onChange={e => handleUpdateItem(item.productId, 'unitCost', Number(e.target.value))}
                              className="w-18 px-1.5 py-1 border border-slate-300 rounded font-mono text-center"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.productId)}
                            className="text-red-500 hover:text-red-700 font-bold px-1"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  <div className="flex justify-between pt-2 border-t border-slate-200 text-sm font-black text-slate-900">
                    <span>إجمالي الفاتورة:</span>
                    <span className="font-mono text-teal-700">{totalPurchaseCost.toLocaleString()} ج.م</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">المبلغ المسدد الآن (ج.م):</label>
                  <input
                    type="number"
                    min="0"
                    value={paidAmount}
                    onChange={e => setPaidAmount(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ملاحظات الفاتورة:</label>
                  <input
                    type="text"
                    value={purchaseNotes}
                    onChange={e => setPurchaseNotes(e.target.value)}
                    placeholder="رقم إذن الاستلام، رقم سيارة الشحن..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewPurchaseModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={purchaseItems.length === 0}
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold disabled:opacity-50"
                >
                  اعتماد الشراء وتحديث المخزن
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: New Supplier */}
      {showNewSupplierModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <h2 className="text-base font-black text-slate-900 mb-3">إضافة مورد جديد</h2>
            <form onSubmit={handleCreateSupplier} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم المورد / الشركة:</label>
                <input
                  type="text"
                  value={supplierName}
                  onChange={e => setSupplierName(e.target.value)}
                  placeholder="مثال: شركة الضحى للصناعات..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">رقم الهاتف:</label>
                <input
                  type="text"
                  value={supplierPhone}
                  onChange={e => setSupplierPhone(e.target.value)}
                  placeholder="010..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">العنوان والموقع:</label>
                <input
                  type="text"
                  value={supplierAddress}
                  onChange={e => setSupplierAddress(e.target.value)}
                  placeholder="المنطقة الصناعية..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الأصناف الموردة:</label>
                <input
                  type="text"
                  value={supplierProducts}
                  onChange={e => setSupplierProducts(e.target.value)}
                  placeholder="أرز، منظفات، شوكولاتة..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewSupplierModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
                >
                  حفظ المورد
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
