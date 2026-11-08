import React, { useState, useEffect } from 'react';
import { Store, Promotion } from '../../types';
import { api } from '../../services/api';
import { toast } from '../../context/ToastContext';
import { Tag, Plus, CheckCircle, Calendar, Percent } from 'lucide-react';

interface PromotionsManagerProps {
  stores: Store[];
  selectedStoreId: string;
}

export const PromotionsManager: React.FC<PromotionsManagerProps> = ({
  stores,
  selectedStoreId,
}) => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form
  const [targetStoreId, setTargetStoreId] = useState(selectedStoreId !== 'all' ? selectedStoreId : stores[0]?.id || '');
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'percentage' | 'fixed' | 'buy_x_get_y'>('percentage');
  const [value, setValue] = useState<number>(10);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const loadPromotions = async () => {
    try {
      setLoading(true);
      const res = await api.getPromotions(selectedStoreId);
      setPromotions(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPromotions();
  }, [selectedStoreId]);

  const handleCreatePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !value) {
      toast('الرجاء إدخال اسم العرض وقيمته', 'error');
      return;
    }

    try {
      await api.createPromotion({
        storeId: targetStoreId,
        title: title.trim(),
        type,
        value,
        startDate,
        endDate,
      });

      setStatusMsg('تم إنشاء العرض الترويجي بنجاح!');
      setShowAddModal(false);
      setTitle('');
      setValue(10);
      loadPromotions();
      toast('تم حفظ العرض الترويجي بنجاح', 'success');
      setTimeout(() => setStatusMsg(null), 4000);
    } catch (err: any) {
      toast(err.message || 'فشل حفظ العرض', 'error');
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await api.togglePromotion(id);
      loadPromotions();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Tag className="w-5 h-5 text-teal-600" />
            <span>إدارة العروض الترويجية والخصومات</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            إنشاء خصومات مئوية أو مبالغ ثابتة أو عروض الباقات للمحلات الثلاثة.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>إنشاء عرض جديد</span>
        </button>
      </div>

      {statusMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* Promotions Grid */}
      {loading ? (
        <div className="text-center py-12 text-slate-400 text-xs">جاري تحميل العروض...</div>
      ) : promotions.length === 0 ? (
        <div className="text-center py-12 text-slate-400 text-xs">لا توجد عروض ترويجية مسجلة حالياً</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {promotions.map(promo => {
            const st = stores.find(s => s.id === promo.storeId);
            return (
              <div
                key={promo.id}
                className={`p-5 rounded-2xl border transition-all ${
                  promo.isActive
                    ? 'bg-white border-teal-200 shadow-xs'
                    : 'bg-slate-50 border-slate-200 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className="text-[10px] px-2 py-0.5 rounded-md font-bold text-white"
                    style={{ backgroundColor: st?.color || '#0d9488' }}
                  >
                    {st?.name || 'جميع الفروع'}
                  </span>
                  <button
                    onClick={() => handleToggle(promo.id)}
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold transition-colors ${
                      promo.isActive
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {promo.isActive ? 'مفعل نشط' : 'معطل'}
                  </button>
                </div>

                <h3 className="font-bold text-sm text-slate-900 leading-snug my-2">{promo.title}</h3>

                <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1 font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-500">نوع الخصم:</span>
                    <span className="font-bold text-slate-900">
                      {promo.type === 'percentage' ? `خصم ${promo.value}%` : `خصم ثابت ${promo.value} ج.م`}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>فترة السريان:</span>
                    <span>{promo.startDate} إلى {promo.endDate}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Promo Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <h2 className="text-base font-black text-slate-900 mb-3">إنشاء عرض أو خصم ترويجي</h2>
            <form onSubmit={handleCreatePromo} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">المحل المستهدف:</label>
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
                <label className="block text-xs font-bold text-slate-700 mb-1">عنوان العرض:</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="مثال: خصم 10% بمناسبة نهاية الأسبوع"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">نوع العرض:</label>
                  <select
                    value={type}
                    onChange={e => setType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                  >
                    <option value="percentage">نسبة مئوية (%)</option>
                    <option value="fixed">مبلغ مالي ثابت (ج.م)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">القيمة:</label>
                  <input
                    type="number"
                    min="1"
                    value={value}
                    onChange={e => setValue(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">تاريخ البدء:</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">تاريخ الانتهاء:</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                  />
                </div>
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
                  className="px-5 py-2 bg-teal-600 text-white rounded-xl text-xs font-bold"
                >
                  حفظ وتفعيل العرض
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
