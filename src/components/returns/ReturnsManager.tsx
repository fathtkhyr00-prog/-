import React, { useState, useEffect } from 'react';
import { Store, ReturnRecord, Product } from '../../types';
import { api } from '../../services/api';
import { toast } from '../../context/ToastContext';
import {
  Undo2,
  Plus,
  Search,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';

interface ReturnsManagerProps {
  stores: Store[];
  selectedStoreId: string;
}

export const ReturnsManager: React.FC<ReturnsManagerProps> = ({
  stores,
  selectedStoreId,
}) => {
  const [returns, setReturns] = useState<ReturnRecord[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form
  const [targetStoreId, setTargetStoreId] = useState(selectedStoreId !== 'all' ? selectedStoreId : stores[0]?.id || '');
  const [originalInvoice, setOriginalInvoice] = useState('');
  const [reason, setReason] = useState('طلب العميل / صنف تالف');
  const [refundMethod, setRefundMethod] = useState<'cash' | 'card'>('cash');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [returnQty, setReturnQty] = useState<number>(1);
  const [returnUnitPrice, setReturnUnitPrice] = useState<number>(0);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [rList, pList] = await Promise.all([
        api.getReturns(selectedStoreId),
        api.getProducts({ storeId: selectedStoreId }),
      ]);
      setReturns(rList);
      setProducts(pList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedStoreId]);

  const handleCreateReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || returnQty <= 0) {
      toast('الرجاء اختيار الصنف وتحديد الكمية المرتجعة', 'error');
      return;
    }

    const prod = products.find(p => p.id === selectedProductId);

    try {
      await api.createReturn({
        storeId: targetStoreId,
        cashierId: 'usr_admin',
        cashierName: 'المدير العام',
        originalInvoiceNumber: originalInvoice,
        reason,
        refundMethod,
        items: [
          {
            productId: selectedProductId,
            productName: prod?.name || '',
            quantity: returnQty,
            unitPrice: returnUnitPrice || prod?.sellingPrice || 0,
          },
        ],
      });

      setStatusMsg('تم تسجيل عملية المرتجع بنجاح وإعادة الصنف لرصيد المخزن!');
      setShowAddModal(false);
      setSelectedProductId('');
      setReturnQty(1);
      loadData();
      toast('تم تسجيل المرتجع وإعادة الصنف للمخزن بنجاح', 'success');
      setTimeout(() => setStatusMsg(null), 4000);
    } catch (err: any) {
      toast(err.message || 'فشل تسجيل المرتجع', 'error');
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Undo2 className="w-5 h-5 text-teal-600" />
            <span>إدارة المرتجعات واسترداد البضاعة</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            تسجيل البضاعة المسترجعة من العملاء، إعادة البضاعة للمخزون، وتحديث الخزينة والتقارير.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>تسجيل مرتجع جديد</span>
        </button>
      </div>

      {statusMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* Returns Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        {loading ? (
          <div className="text-center py-12 text-slate-400 text-xs">جاري تحميل المرتجعات...</div>
        ) : returns.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">لا توجد مرتجعات مسجلة</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                  <th className="py-3 px-4">رقم المرتجع</th>
                  <th className="py-3 px-4">المحل</th>
                  <th className="py-3 px-4">رقم الفاتورة الأصلية</th>
                  <th className="py-3 px-4">الأصناف المرتجعة</th>
                  <th className="py-3 px-4">قيمة المسترد</th>
                  <th className="py-3 px-4">طريقة الرد</th>
                  <th className="py-3 px-4">السبب</th>
                  <th className="py-3 px-4">التاريخ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {returns.map(ret => {
                  const st = stores.find(s => s.id === ret.storeId);
                  return (
                    <tr key={ret.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{ret.returnNumber}</td>
                      <td className="py-3 px-4">
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-md font-bold text-white whitespace-nowrap"
                          style={{ backgroundColor: st?.color || '#0d9488' }}
                        >
                          {st?.name.split(' ')[1] || 'المحل'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {ret.originalInvoiceNumber || 'بدون فاتورة'}
                      </td>
                      <td className="py-3 px-4">
                        {ret.items.map((it, idx) => (
                          <div key={idx} className="font-bold text-slate-800">
                            {it.productName} ({it.quantity} قطعة)
                          </div>
                        ))}
                      </td>
                      <td className="py-3 px-4 font-mono font-black text-red-600 text-sm">
                        -{ret.totalRefund.toFixed(2)} ج.م
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded font-bold">
                          {ret.refundMethod === 'cash' ? 'نقدي' : 'فيزا'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{ret.reason}</td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                        {new Date(ret.createdAt).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Return Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <h2 className="text-base font-black text-slate-900 mb-3">تسجيل عملية مرتجع</h2>
            <form onSubmit={handleCreateReturn} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">المحل:</label>
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
                <label className="block text-xs font-bold text-slate-700 mb-1">رقم الفاتورة الأصلية (اختياري):</label>
                <input
                  type="text"
                  value={originalInvoice}
                  onChange={e => setOriginalInvoice(e.target.value)}
                  placeholder="مثال: GRO-1001"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">المنتج المرتجع:</label>
                <select
                  value={selectedProductId}
                  onChange={e => {
                    setSelectedProductId(e.target.value);
                    const p = products.find(prod => prod.id === e.target.value);
                    if (p) setReturnUnitPrice(p.sellingPrice);
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
                >
                  <option value="">-- اختر الصنف --</option>
                  {products
                    .filter(p => p.storeId === targetStoreId)
                    .map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.sellingPrice} ج.م)
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الكمية المرتجعة:</label>
                  <input
                    type="number"
                    min="1"
                    value={returnQty}
                    onChange={e => setReturnQty(Number(e.target.value) || 1)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">سعر الوحدة المسترد:</label>
                  <input
                    type="number"
                    step="0.5"
                    value={returnUnitPrice}
                    onChange={e => setReturnUnitPrice(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">سبب المرتجع:</label>
                <input
                  type="text"
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="صنف تالف، طلب العميل، تبديل..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold"
                >
                  اعتماد المرتجع وإعادة المخزون
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
