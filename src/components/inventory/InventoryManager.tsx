import React, { useState, useEffect } from 'react';
import { Store, Product, InventoryMovement } from '../../types';
import { api } from '../../services/api';
import { toast } from '../../context/ToastContext';
import {
  Boxes,
  ArrowLeftRight,
  ClipboardList,
  Search,
  CheckCircle,
  AlertTriangle,
  History,
  FileText,
  User,
} from 'lucide-react';

interface InventoryManagerProps {
  stores: Store[];
  selectedStoreId: string;
}

export const InventoryManager: React.FC<InventoryManagerProps> = ({
  stores,
  selectedStoreId,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'stock' | 'movements' | 'reconciliation'>('stock');

  // Stock Adjustment Modal
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [actualCountInput, setActualCountInput] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState('جرد دوري بالمخزن');

  // Inter-store transfer modal
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [fromStoreId, setFromStoreId] = useState(stores[0]?.id || '');
  const [toStoreId, setToStoreId] = useState(stores[1]?.id || '');
  const [transferProductId, setTransferProductId] = useState('');
  const [transferQuantity, setTransferQuantity] = useState<number>(5);
  const [transferNotes, setTransferNotes] = useState('');
  const [transferSubmitting, setTransferSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [prods, movs] = await Promise.all([
        api.getProducts({ storeId: selectedStoreId }),
        api.getInventoryMovements({ storeId: selectedStoreId }),
      ]);
      setProducts(prods);
      setMovements(movs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedStoreId]);

  // Handle Adjustment (جرد وتسوية)
  const handleSaveAdjustment = async () => {
    if (!adjustingProduct) return;
    try {
      const res = await api.adjustInventory({
        productId: adjustingProduct.id,
        actualCount: actualCountInput,
        reason: adjustReason,
      });
      setStatusMsg(`تمت تسوية مخزون ${adjustingProduct.name} بنجاح (${res.diff >= 0 ? `زيادة +${res.diff}` : `عجز ${res.diff}`})`);
      setAdjustingProduct(null);
      loadData();
      toast('تمت تسوية رصيد الصنف بنجاح', 'success');
      setTimeout(() => setStatusMsg(null), 4000);
    } catch (err: any) {
      toast(err.message || 'فشل تسوية الرصيد', 'error');
    }
  };

  // Handle Transfer
  const handleExecuteTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromStoreId || !toStoreId || !transferProductId || transferQuantity <= 0) {
      toast('الرجاء استكمال بيانات التحويل', 'error');
      return;
    }
    if (fromStoreId === toStoreId) {
      toast('لا يمكن التحويل لنفس المحل', 'error');
      return;
    }

    try {
      setTransferSubmitting(true);
      await api.transferInventory({
        fromStoreId,
        toStoreId,
        productId: transferProductId,
        quantity: transferQuantity,
        notes: transferNotes,
      });

      setStatusMsg('تم تنفيذ التحويل المخزني بين الفروع بنجاح وتحديث الأرصدة');
      setShowTransferModal(false);
      loadData();
      toast('تم تنفيذ التحويل المخزني بنجاح', 'success');
      setTimeout(() => setStatusMsg(null), 4000);
    } catch (err: any) {
      toast(err.message || 'فشل إجراء التحويل المخزني', 'error');
    } finally {
      setTransferSubmitting(false);
    }
  };

  const filteredProducts = products.filter(p => {
    if (!search) return true;
    const q = search.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.barcode.includes(q);
  });

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Boxes className="w-5 h-5 text-teal-600" />
            <span>إدارة المخازن والجرد الفعلي وحركات البضاعة</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            تسجيل العجز والزيادة الجردية، تتبع حركة الصادر والوارد، وتحويل البضاعة بين المحلات الثلاثة.
          </p>
        </div>

        <button
          onClick={() => setShowTransferModal(true)}
          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-colors"
        >
          <ArrowLeftRight className="w-4 h-4 text-teal-400" />
          <span>تحويل بضاعة بين المحلات</span>
        </button>
      </div>

      {statusMsg && (
        <div className="p-3.5 bg-teal-50 border border-teal-200 text-teal-800 rounded-xl text-xs font-bold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setActiveTab('stock')}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'stock'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          الأرصدة الحالية في المخزن
        </button>
        <button
          onClick={() => setActiveTab('movements')}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'movements'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          سجل حركات المخزون اللحظية ({movements.length})
        </button>
      </div>

      {/* TAB 1: Current Stock & Reconciliation Actions */}
      {activeTab === 'stock' && (
        <div className="space-y-4">
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="ابحث بالاسم أو الباركود..."
              className="w-full pl-9 pr-9 py-2 bg-white border border-slate-200 rounded-xl text-xs"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <table className="w-full text-xs text-right">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                  <th className="py-3 px-4">المنتج</th>
                  <th className="py-3 px-4">المحل</th>
                  <th className="py-3 px-4">الباركود</th>
                  <th className="py-3 px-4">الرصيد الدفتري</th>
                  <th className="py-3 px-4">قيمة المخزون بسعر الشراء</th>
                  <th className="py-3 px-4">الحالة</th>
                  <th className="py-3 px-4 text-center">إجراء الجرد والتسوية</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map(p => {
                  const st = stores.find(s => s.id === p.storeId);
                  const isOutOfStock = p.currentStock <= 0;
                  const isLow = p.currentStock <= p.minStockAlert && !isOutOfStock;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {p.name}
                        <span className="text-[10px] text-slate-400 font-normal mr-1">({p.unit})</span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-md font-bold text-white"
                          style={{ backgroundColor: st?.color || '#0d9488' }}
                        >
                          {st?.name.split(' ')[1] || 'المحل'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">{p.barcode}</td>
                      <td className="py-3 px-4 font-mono font-black text-sm text-slate-900">
                        {p.currentStock} {p.unit}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-700">
                        {(p.currentStock * p.costPrice).toLocaleString()} ج.م
                      </td>
                      <td className="py-3 px-4">
                        {isOutOfStock ? (
                          <span className="text-[10px] bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded">
                            نافد
                          </span>
                        ) : isLow ? (
                          <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded">
                            منخفض
                          </span>
                        ) : (
                          <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded">
                            متوفر
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => {
                            setAdjustingProduct(p);
                            setActualCountInput(p.currentStock);
                          }}
                          className="px-3 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-lg text-xs font-bold transition-colors border border-teal-200"
                        >
                          تسجيل الجرد الفعلي
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Inventory Movements Log */}
      {activeTab === 'movements' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <table className="w-full text-xs text-right">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                <th className="py-3 px-4">نوع الحركة</th>
                <th className="py-3 px-4">المنتج</th>
                <th className="py-3 px-4">المحل</th>
                <th className="py-3 px-4">الكمية</th>
                <th className="py-3 px-4">الرصيد قبل</th>
                <th className="py-3 px-4">الرصيد بعد</th>
                <th className="py-3 px-4">البيان والسبب</th>
                <th className="py-3 px-4">المستخدم</th>
                <th className="py-3 px-4">التاريخ والوقت</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {movements.map(m => {
                const st = stores.find(s => s.id === m.storeId);
                const isPositive = m.quantity > 0;

                const typeLabels: Record<string, { label: string; color: string }> = {
                  sale: { label: 'مبيعات', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
                  purchase: { label: 'شراء وارد', color: 'bg-sky-50 text-sky-800 border-sky-200' },
                  return: { label: 'مرتجع', color: 'bg-purple-50 text-purple-800 border-purple-200' },
                  adjustment: { label: 'تسوية جرد', color: 'bg-amber-50 text-amber-800 border-amber-200' },
                  transfer_in: { label: 'تحويل وارد', color: 'bg-teal-50 text-teal-800 border-teal-200' },
                  transfer_out: { label: 'تحويل صادر', color: 'bg-rose-50 text-rose-800 border-rose-200' },
                };

                const typeInfo = typeLabels[m.type] || { label: m.type, color: 'bg-slate-100 text-slate-800' };

                return (
                  <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4">
                      <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold border ${typeInfo.color}`}>
                        {typeInfo.label}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">{m.productName}</td>
                    <td className="py-3 px-4">
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-md font-bold text-white"
                        style={{ backgroundColor: st?.color || '#0d9488' }}
                      >
                        {st?.name.split(' ')[1] || 'المحل'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-black text-sm">
                      <span className={isPositive ? 'text-emerald-700' : 'text-red-600'}>
                        {isPositive ? `+${m.quantity}` : m.quantity}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500">{m.previousStock}</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{m.newStock}</td>
                    <td className="py-3 px-4 text-slate-700">{m.notes}</td>
                    <td className="py-3 px-4 text-slate-600">{m.userName}</td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                      {new Date(m.createdAt).toLocaleString('ar-EG')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL: Stock Adjustment (جرد وتسوية رصيد الصنف) */}
      {adjustingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <h2 className="text-base font-black text-slate-900 mb-1">تسجيل جرد فعلي وتسوية المخزون</h2>
            <p className="text-xs text-slate-500 mb-4">{adjustingProduct.name}</p>

            <div className="space-y-3">
              <div className="flex justify-between p-3 bg-slate-50 rounded-xl text-xs border border-slate-200">
                <span className="text-slate-600">الرصيد الدفتري الحالي في النظام:</span>
                <span className="font-mono font-bold text-slate-900">
                  {adjustingProduct.currentStock} {adjustingProduct.unit}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  العدد الفعلي بعد الجرد في الرف/المخزن:
                </label>
                <input
                  type="number"
                  min="0"
                  value={actualCountInput}
                  onChange={e => setActualCountInput(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2.5 bg-white border-2 border-teal-500 rounded-xl font-mono text-lg font-black text-slate-900 focus:outline-none"
                />
              </div>

              {/* Difference preview */}
              {(() => {
                const diff = actualCountInput - adjustingProduct.currentStock;
                return (
                  <div
                    className={`p-2.5 rounded-xl border text-xs font-bold flex justify-between ${
                      diff === 0
                        ? 'bg-slate-50 border-slate-200 text-slate-700'
                        : diff > 0
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : 'bg-red-50 border-red-200 text-red-800'
                    }`}
                  >
                    <span>فارق الجرد:</span>
                    <span className="font-mono">
                      {diff === 0 ? 'مطابق تماماً' : diff > 0 ? `زيادة (+${diff})` : `عجز (${diff})`}
                    </span>
                  </div>
                );
              })()}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">سبب التسوية / ملاحظات:</label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={e => setAdjustReason(e.target.value)}
                  placeholder="مثال: تلف عبوة، خطأ إدخال سابق، جرد شهري..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setAdjustingProduct(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSaveAdjustment}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold"
              >
                تأكيد واعتماد الجرد
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Inter-store Transfer (تحويل بضاعة بين المحلات الثلاثة) */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 border border-slate-200">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-200">
              <ArrowLeftRight className="w-5 h-5 text-teal-600" />
              <h2 className="text-base font-black text-slate-900">تحويل بضاعة بين المحلات الثلاثة</h2>
            </div>

            <form onSubmit={handleExecuteTransfer} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">من محل (المصدر):</label>
                  <select
                    value={fromStoreId}
                    onChange={e => {
                      setFromStoreId(e.target.value);
                      setTransferProductId('');
                    }}
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
                  <label className="block text-xs font-bold text-slate-700 mb-1">إلى محل (الوجهة):</label>
                  <select
                    value={toStoreId}
                    onChange={e => setToStoreId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
                  >
                    {stores
                      .filter(st => st.id !== fromStoreId)
                      .map(st => (
                        <option key={st.id} value={st.id}>
                          {st.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">المنتج المراد تحويله:</label>
                <select
                  value={transferProductId}
                  onChange={e => setTransferProductId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
                >
                  <option value="">-- اختر الصنف من المحل المصدر --</option>
                  {products
                    .filter(p => p.storeId === fromStoreId)
                    .map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} (المتاح: {p.currentStock} {p.unit})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الكمية المحولة:</label>
                <input
                  type="number"
                  min="1"
                  value={transferQuantity}
                  onChange={e => setTransferQuantity(Number(e.target.value) || 1)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-sm font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ملاحظات التحويل:</label>
                <input
                  type="text"
                  value={transferNotes}
                  onChange={e => setTransferNotes(e.target.value)}
                  placeholder="مثال: تغطية نقص صنف، طلب إدارة الفرع..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={transferSubmitting}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold"
                >
                  {transferSubmitting ? 'جاري التحويل...' : 'تنفيذ التحويل المخزني'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
