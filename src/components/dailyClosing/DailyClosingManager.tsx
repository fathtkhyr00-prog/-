import React, { useState, useEffect } from 'react';
import { Store, DailyClosing } from '../../types';
import { api } from '../../services/api';
import {
  CalendarCheck2,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  TrendingUp,
  Receipt,
  FileText,
} from 'lucide-react';

interface DailyClosingManagerProps {
  stores: Store[];
  selectedStoreId: string;
}

export const DailyClosingManager: React.FC<DailyClosingManagerProps> = ({
  stores,
  selectedStoreId,
}) => {
  const [closings, setClosings] = useState<DailyClosing[]>([]);
  const [loading, setLoading] = useState(true);
  const [closingDate, setClosingDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadClosings = async () => {
    try {
      setLoading(true);
      const res = await api.getDailyClosings(selectedStoreId);
      setClosings(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClosings();
  }, [selectedStoreId]);

  const handleExecuteDailyClosing = async (force: boolean = false) => {
    try {
      setIsSubmitting(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      const res = await api.createDailyClosing({
        storeId: selectedStoreId,
        date: closingDate,
        forceClose: force,
        notes,
      });

      setSuccessMsg(`تم إغلاق يومية تاريخ ${closingDate} بنجاح! صافي ربح اليوم المحقق: ${res.closing.netProfit.toLocaleString()} ج.م`);
      setNotes('');
      loadClosings();
    } catch (err: any) {
      setErrorMsg(err.message || 'فشل إغلاق اليومية');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <CalendarCheck2 className="w-5 h-5 text-teal-600" />
            <span>نظام إغلاق اليومية وتصفية الحسابات</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            إغلاق يومية الفرع أو المحلات الثلاثة مع مراجعة الورديات والمبيعات والمصروفات وصافي الأرباح.
          </p>
        </div>
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-800 space-y-2">
          <div className="font-bold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => handleExecuteDailyClosing(true)}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold"
            >
              تجاوز وإغلاق اليومية إجبارياً
            </button>
          </div>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 font-bold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Action Card: Perform Closing */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <h2 className="text-sm font-black text-slate-900 mb-3">تنفيذ إغلاق اليومية</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">تاريخ اليومية:</label>
            <input
              type="date"
              value={closingDate}
              onChange={e => setClosingDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">ملاحظات إغلاق اليومية:</label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="سجل أي ملاحظات خاصة باليوم..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
            />
          </div>

          <div>
            <button
              onClick={() => handleExecuteDailyClosing(false)}
              disabled={isSubmitting}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'جاري الحساب والإغلاق...' : 'تأكيد وإغلاق اليومية'}
            </button>
          </div>
        </div>
      </div>

      {/* Closings History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <h2 className="text-xs font-bold text-slate-800">سجل الإغلاقات اليومية السابقة</h2>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-400 text-xs">جاري تحميل سجل اليوميات...</div>
        ) : closings.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">لا توجد إغلاقات يومية سابقة مسجلة</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                  <th className="py-3 px-4">تاريخ اليومية</th>
                  <th className="py-3 px-4">المحل</th>
                  <th className="py-3 px-4">إجمالي المبيعات</th>
                  <th className="py-3 px-4">النقدية (كاش)</th>
                  <th className="py-3 px-4">الفيزا</th>
                  <th className="py-3 px-4">المرتجعات</th>
                  <th className="py-3 px-4">المصروفات</th>
                  <th className="py-3 px-4">صافي الأرباح</th>
                  <th className="py-3 px-4">عدد الورديات</th>
                  <th className="py-3 px-4">أُغلقت بواسطة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {closings.map(c => {
                  const st = stores.find(s => s.id === c.storeId);
                  return (
                    <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{c.date}</td>
                      <td className="py-3 px-4">
                        <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-slate-200 text-slate-800">
                          {c.storeId === 'all' ? 'جميع المحلات' : st?.name || c.storeId}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-black text-slate-900">{c.totalSales.toLocaleString()} ج.م</td>
                      <td className="py-3 px-4 font-mono text-emerald-700">{c.totalCash.toLocaleString()} ج.م</td>
                      <td className="py-3 px-4 font-mono text-sky-700">{c.totalCard.toLocaleString()} ج.م</td>
                      <td className="py-3 px-4 font-mono text-red-600">-{c.totalReturns.toLocaleString()} ج.م</td>
                      <td className="py-3 px-4 font-mono text-red-700">-{c.totalExpenses.toLocaleString()} ج.م</td>
                      <td className="py-3 px-4 font-mono font-black text-emerald-800 text-sm">
                        {c.netProfit.toLocaleString()} ج.م
                      </td>
                      <td className="py-3 px-4">{c.shiftsCount} وردية</td>
                      <td className="py-3 px-4 text-slate-600">{c.closedBy}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
