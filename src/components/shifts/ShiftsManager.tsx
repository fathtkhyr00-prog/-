import React, { useState, useEffect } from 'react';
import { Store, Shift } from '../../types';
import { api } from '../../services/api';
import {
  Clock,
  CheckCircle,
  AlertCircle,
  Receipt,
  Search,
  DollarSign,
  TrendingDown,
  TrendingUp,
  Minus,
} from 'lucide-react';

interface ShiftsManagerProps {
  stores: Store[];
  selectedStoreId: string;
}

export const ShiftsManager: React.FC<ShiftsManagerProps> = ({
  stores,
  selectedStoreId,
}) => {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'closed'>('all');
  const [selectedShiftDetails, setSelectedShiftDetails] = useState<Shift | null>(null);

  const loadShifts = async () => {
    try {
      setLoading(true);
      const res = await api.getShiftsHistory({ storeId: selectedStoreId });
      setShifts(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShifts();
  }, [selectedStoreId]);

  const filteredShifts = shifts.filter(s => {
    if (statusFilter === 'open' && s.status !== 'open') return false;
    if (statusFilter === 'closed' && s.status !== 'closed') return false;
    return true;
  });

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-teal-600" />
            <span>سجل ومراجعة ورديات الكاشيرات وجرد الخزينة</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            متابعة حركة الدرج النقدي، المبيعات النقدية والإلكترونية، ومراجعة العجز والزيادة لكل وردية.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            جميع الورديات ({shifts.length})
          </button>
          <button
            onClick={() => setStatusFilter('open')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              statusFilter === 'open'
                ? 'bg-teal-600 text-white'
                : 'bg-teal-50 text-teal-800 hover:bg-teal-100'
            }`}
          >
            المفتوحة الآن ({shifts.filter(s => s.status === 'open').length})
          </button>
          <button
            onClick={() => setStatusFilter('closed')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              statusFilter === 'closed'
                ? 'bg-slate-800 text-white'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            المغلقة ({shifts.filter(s => s.status === 'closed').length})
          </button>
        </div>
      </div>

      {/* Shifts Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        {loading ? (
          <div className="text-center py-12 text-slate-400 text-xs">جاري تحميل سجل الورديات...</div>
        ) : filteredShifts.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">لا توجد ورديات مسجلة</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                  <th className="py-3 px-4">الحالة</th>
                  <th className="py-3 px-4">اسم الكاشير</th>
                  <th className="py-3 px-4">المحل</th>
                  <th className="py-3 px-4">وقت الفتح</th>
                  <th className="py-3 px-4">وقت الإغلاق</th>
                  <th className="py-3 px-4">العهدة الافتتاحية</th>
                  <th className="py-3 px-4">المبيعات نقدية</th>
                  <th className="py-3 px-4">المبيعات إلكترونية</th>
                  <th className="py-3 px-4">المتوقع بالدرج</th>
                  <th className="py-3 px-4">الفعلي بالعد</th>
                  <th className="py-3 px-4">العجز / الزيادة</th>
                  <th className="py-3 px-4 text-center">التفاصيل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredShifts.map(s => {
                  const st = stores.find(store => store.id === s.storeId);
                  const isOpen = s.status === 'open';
                  const diff = s.cashDifference ?? 0;

                  return (
                    <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        {isOpen ? (
                          <span className="inline-flex items-center gap-1 bg-teal-50 text-teal-800 border border-teal-200 font-bold px-2 py-0.5 rounded-md text-[10px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
                            مفتوحة الآن
                          </span>
                        ) : (
                          <span className="bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-md text-[10px]">
                            مغلقة نهائياً
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">{s.cashierName}</td>
                      <td className="py-3 px-4">
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-md font-bold text-white whitespace-nowrap"
                          style={{ backgroundColor: st?.color || '#0d9488' }}
                        >
                          {st?.name.split(' ')[1] || 'المحل'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {new Date(s.openedAt).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {s.closedAt
                          ? new Date(s.closedAt).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' })
                          : '-'}
                      </td>
                      <td className="py-3 px-4 font-mono font-medium text-slate-800">{s.openingFloat.toFixed(2)} ج.م</td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-700">{s.cashSales.toFixed(2)} ج.م</td>
                      <td className="py-3 px-4 font-mono text-sky-700">{s.cardSales.toFixed(2)} ج.م</td>
                      <td className="py-3 px-4 font-mono font-black text-slate-900">{s.expectedCash.toFixed(2)} ج.م</td>
                      <td className="py-3 px-4 font-mono font-black text-slate-900">
                        {s.actualCash !== undefined ? `${s.actualCash.toFixed(2)} ج.م` : '-'}
                      </td>
                      <td className="py-3 px-4">
                        {isOpen ? (
                          <span className="text-slate-400 font-mono text-[11px]">-</span>
                        ) : diff === 0 ? (
                          <span className="text-[10px] bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded">
                            متطابق
                          </span>
                        ) : diff > 0 ? (
                          <span className="text-[10px] bg-sky-50 text-sky-800 font-bold px-2 py-0.5 rounded font-mono">
                            +{diff.toFixed(2)} زيادة
                          </span>
                        ) : (
                          <span className="text-[10px] bg-red-50 text-red-800 font-bold px-2 py-0.5 rounded font-mono">
                            {diff.toFixed(2)} عجز
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => setSelectedShiftDetails(s)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors"
                        >
                          عرض التقرير
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: Shift Details Report */}
      {selectedShiftDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 font-['Cairo',sans-serif]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-teal-600" />
                <h2 className="text-base font-black text-slate-900">تقرير جرد الوردية المفصل</h2>
              </div>
              <button
                onClick={() => setSelectedShiftDetails(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="my-4 space-y-2.5 text-xs text-slate-700 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div className="flex justify-between">
                <span>اسم الكاشير:</span>
                <span className="font-bold text-slate-900">{selectedShiftDetails.cashierName}</span>
              </div>
              <div className="flex justify-between">
                <span>الفرع / المحل:</span>
                <span className="font-bold text-slate-900">
                  {stores.find(s => s.id === selectedShiftDetails.storeId)?.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span>حالة الوردية:</span>
                <span className="font-bold">
                  {selectedShiftDetails.status === 'open' ? 'نشطة مفتوحة' : 'مغلقة ومؤكدة'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>توقيت الفتح:</span>
                <span className="font-mono">{new Date(selectedShiftDetails.openedAt).toLocaleString('ar-EG')}</span>
              </div>
              {selectedShiftDetails.closedAt && (
                <div className="flex justify-between">
                  <span>توقيت الإغلاق:</span>
                  <span className="font-mono">{new Date(selectedShiftDetails.closedAt).toLocaleString('ar-EG')}</span>
                </div>
              )}

              <div className="pt-2 border-t border-slate-300 space-y-1.5 font-mono">
                <div className="flex justify-between">
                  <span>رصيد بداية الوردية (العهدة):</span>
                  <span className="font-bold">{selectedShiftDetails.openingFloat.toFixed(2)} ج.م</span>
                </div>
                <div className="flex justify-between text-emerald-700">
                  <span>إجمالي المبيعات النقدية:</span>
                  <span className="font-bold">+{selectedShiftDetails.cashSales.toFixed(2)} ج.م</span>
                </div>
                <div className="flex justify-between text-sky-700">
                  <span>إجمالي المبيعات الإلكترونية:</span>
                  <span className="font-bold">{selectedShiftDetails.cardSales.toFixed(2)} ج.م</span>
                </div>
                <div className="flex justify-between text-slate-800">
                  <span>عدد الفواتير الصادرة:</span>
                  <span>{selectedShiftDetails.billsCount} فاتورة</span>
                </div>
                <div className="flex justify-between text-red-600">
                  <span>إجمالي المرتجعات:</span>
                  <span>-{selectedShiftDetails.returnsAmount.toFixed(2)} ج.م</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>إيداعات نقدية أثناء العمل:</span>
                  <span>+{selectedShiftDetails.cashIn.toFixed(2)} ج.م</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>سحوبات نقدية أثناء العمل:</span>
                  <span>-{selectedShiftDetails.cashOut.toFixed(2)} ج.م</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-300 flex justify-between font-black text-sm text-slate-950 font-mono">
                <span>النقدية المتوقع وجودها بالدرج:</span>
                <span className="text-teal-700">{selectedShiftDetails.expectedCash.toFixed(2)} ج.م</span>
              </div>

              {selectedShiftDetails.actualCash !== undefined && (
                <div className="flex justify-between font-black text-sm text-slate-950 font-mono">
                  <span>النقدية الفعلية بعد العد:</span>
                  <span>{selectedShiftDetails.actualCash.toFixed(2)} ج.م</span>
                </div>
              )}

              {selectedShiftDetails.cashDifference !== undefined && (
                <div
                  className={`p-2.5 rounded-xl text-xs font-bold flex justify-between ${
                    selectedShiftDetails.cashDifference === 0
                      ? 'bg-emerald-100 text-emerald-900'
                      : selectedShiftDetails.cashDifference > 0
                      ? 'bg-sky-100 text-sky-900'
                      : 'bg-red-100 text-red-900'
                  }`}
                >
                  <span>نتيجة الجرد:</span>
                  <span className="font-mono text-sm">
                    {selectedShiftDetails.cashDifference === 0
                      ? 'متطابق (لا يوجد عجز أو زيادة)'
                      : selectedShiftDetails.cashDifference > 0
                      ? `زيادة بمقدار +${selectedShiftDetails.cashDifference.toFixed(2)} ج.م`
                      : `عجز بمقدار ${Math.abs(selectedShiftDetails.cashDifference).toFixed(2)} ج.م`}
                  </span>
                </div>
              )}

              {selectedShiftDetails.notes && (
                <div className="mt-2 text-xs text-slate-500 bg-white p-2 rounded-lg border border-slate-200">
                  <strong>ملاحظات الوردية:</strong> {selectedShiftDetails.notes}
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setSelectedShiftDetails(null)}
                className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
