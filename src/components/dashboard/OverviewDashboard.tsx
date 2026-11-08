import React, { useEffect, useState } from 'react';
import { DashboardSummary, Store, Sale } from '../../types';
import { api } from '../../services/api';
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Package,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Store as StoreIcon,
  CheckCircle2,
  Receipt,
  XCircle,
} from 'lucide-react';

interface OverviewDashboardProps {
  selectedStoreId: string;
  stores: Store[];
  onNavigateTab: (tab: any) => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  selectedStoreId,
  stores,
  onNavigateTab,
}) => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [sum, sales] = await Promise.all([
        api.getDashboardSummary(selectedStoreId),
        api.getSales({ storeId: selectedStoreId, limit: 6 }),
      ]);
      setSummary(sum);
      setRecentSales(sales);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedStoreId]);

  if (loading || !summary) {
    return (
      <div className="p-8 text-center text-slate-500 font-semibold text-sm">
        جاري تحميل مؤشرات الأداء والبيانات اللحظية للمحلات...
      </div>
    );
  }

  const currentStore = stores.find(s => s.id === selectedStoreId);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Welcome banner with active store indicator */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900">
              {selectedStoreId === 'all'
                ? 'لوحة المؤشرات المجمعة لجميع المحلات'
                : `لوحة تحكم: ${currentStore?.name}`}
            </h1>
            <span className="bg-teal-50 text-teal-700 text-xs px-2.5 py-0.5 rounded-full font-bold border border-teal-200">
              بيانات حية
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            متابعة دقيقة للمبيعات اليومية والشهرية، حركة المخزون، المصروفات التشغيلية، وصافي الأرباح.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateTab('smart_add')}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
          >
            + إضافة منتج جديد
          </button>
          <button
            onClick={() => onNavigateTab('daily_closing')}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
          >
            إغلاق اليومية
          </button>
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Sales */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500">مبيعات اليوم</span>
            <div className="text-2xl font-black text-slate-950 font-mono mt-1">
              {summary.todaySales.toLocaleString()} <span className="text-xs font-bold text-teal-700">ج.م</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1 font-medium">
              عدد الفواتير: <span className="font-bold text-slate-800">{summary.totalBillsToday}</span> فاتورة
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Month Sales */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500">مبيعات الشهر الحالي</span>
            <div className="text-2xl font-black text-slate-950 font-mono mt-1">
              {summary.monthSales.toLocaleString()} <span className="text-xs font-bold text-sky-700">ج.م</span>
            </div>
            <div className="text-[11px] text-emerald-600 font-bold mt-1 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>نمو متصاعد في المبيعات</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        {/* Net Profit */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500">صافي الأرباح للشهر</span>
            <div className="text-2xl font-black text-emerald-700 font-mono mt-1">
              {summary.netMonthProfit.toLocaleString()} <span className="text-xs font-bold">ج.م</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              بعد خصم تكلفة البضاعة والمصروفات
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Operational Expenses */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500">إجمالي المصروفات (الشهر)</span>
            <div className="text-2xl font-black text-red-600 font-mono mt-1">
              {summary.monthExpenses.toLocaleString()} <span className="text-xs font-bold">ج.م</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              مصروف اليوم: <span className="font-bold">{summary.todayExpenses} ج.م</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
            <ArrowDownRight className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Secondary Status & Alerts Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div
          onClick={() => onNavigateTab('products')}
          className="bg-white p-3.5 rounded-xl border border-slate-200 hover:border-teal-500 cursor-pointer transition-all"
        >
          <span className="text-[11px] font-bold text-slate-500 block">إجمالي المنتجات</span>
          <div className="text-xl font-black text-slate-900 font-mono mt-1">{summary.productsCount}</div>
          <span className="text-[10px] text-slate-400">صنف مسجل</span>
        </div>

        <div
          onClick={() => onNavigateTab('products')}
          className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
            summary.lowStockCount > 0 ? 'bg-amber-50/60 border-amber-200 text-amber-900' : 'bg-white border-slate-200'
          }`}
        >
          <span className="text-[11px] font-bold block">منخفض المخزون</span>
          <div className="text-xl font-black font-mono mt-1 text-amber-700">{summary.lowStockCount}</div>
          <span className="text-[10px] text-amber-600 font-medium">بحاجة لإعادة طلب</span>
        </div>

        <div
          onClick={() => onNavigateTab('products')}
          className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
            summary.outOfStockCount > 0 ? 'bg-red-50/60 border-red-200 text-red-900' : 'bg-white border-slate-200'
          }`}
        >
          <span className="text-[11px] font-bold block">منتجات نافدة</span>
          <div className="text-xl font-black font-mono mt-1 text-red-700">{summary.outOfStockCount}</div>
          <span className="text-[10px] text-red-600 font-medium">رصيد المخزن 0</span>
        </div>

        <div
          onClick={() => onNavigateTab('products')}
          className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
            summary.expiringSoonCount > 0 ? 'bg-orange-50/60 border-orange-200 text-orange-900' : 'bg-white border-slate-200'
          }`}
        >
          <span className="text-[11px] font-bold block">قريب انتهاء الصلاحية</span>
          <div className="text-xl font-black font-mono mt-1 text-orange-700">{summary.expiringSoonCount}</div>
          <span className="text-[10px] text-orange-600 font-medium">خلال ٧ أيام</span>
        </div>

        <div
          onClick={() => onNavigateTab('shifts')}
          className="bg-white p-3.5 rounded-xl border border-slate-200 hover:border-teal-500 cursor-pointer transition-all"
        >
          <span className="text-[11px] font-bold text-slate-500 block">ورديات مفتوحة الآن</span>
          <div className="text-xl font-black text-teal-700 font-mono mt-1">{summary.openShifts}</div>
          <span className="text-[10px] text-slate-400">كاشيرات نشطين</span>
        </div>

        <div
          onClick={() => onNavigateTab('returns')}
          className="bg-white p-3.5 rounded-xl border border-slate-200 hover:border-teal-500 cursor-pointer transition-all"
        >
          <span className="text-[11px] font-bold text-slate-500 block">مرتجعات اليوم</span>
          <div className="text-xl font-black text-slate-900 font-mono mt-1">{summary.todayReturns} ج.م</div>
          <span className="text-[10px] text-slate-400">مسجلة بالفواتير</span>
        </div>
      </div>

      {/* 3 Stores Performance Comparison Section */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-black text-slate-900">مقارنة أداء المحلات الثلاثة</h2>
            <p className="text-xs text-slate-500">المبيعات، المصروفات، وصافي الأرباح التقديرية لكل محل</p>
          </div>
          <button
            onClick={() => onNavigateTab('reports')}
            className="text-xs text-teal-700 font-bold hover:underline"
          >
            عرض التقرير التفصيلي ←
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {summary.storesComparison.map(st => (
            <div
              key={st.id}
              className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white transition-all shadow-2xs relative overflow-hidden"
            >
              <div
                className="absolute top-0 left-0 right-0 h-1.5"
                style={{ backgroundColor: st.color }}
              />
              <div className="flex items-center justify-between mb-3">
                <span className="font-extrabold text-sm text-slate-900">{st.name}</span>
                <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md font-bold">
                  {st.productsCount} صنف
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>إجمالي المبيعات:</span>
                  <span className="font-mono font-bold text-slate-900">{st.totalSales.toLocaleString()} ج.م</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>المصروفات:</span>
                  <span className="font-mono text-red-600">{st.expenses.toLocaleString()} ج.م</span>
                </div>
                <div className="flex justify-between font-bold pt-2 border-t border-slate-200 text-slate-900">
                  <span>صافي الأرباح:</span>
                  <span className="font-mono text-emerald-700 font-extrabold">{st.profit.toLocaleString()} ج.م</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Sales Table */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-black text-slate-900">أحدث عمليات البيع والفواتير</h2>
            <p className="text-xs text-slate-500">الفواتير المنفذة عبر كاشيرات المحلات</p>
          </div>
          <button
            onClick={() => onNavigateTab('sales')}
            className="text-xs text-teal-700 font-bold hover:underline"
          >
            سجل المبيعات الكامل ←
          </button>
        </div>

        {recentSales.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">لا توجد عمليات بيع مسجلة حتى الآن</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold">
                  <th className="py-2.5 px-3">رقم الفاتورة</th>
                  <th className="py-2.5 px-3">المحل</th>
                  <th className="py-2.5 px-3">الكاشير</th>
                  <th className="py-2.5 px-3">عدد الأصناف</th>
                  <th className="py-2.5 px-3">طريقة الدفع</th>
                  <th className="py-2.5 px-3">الإجمالي</th>
                  <th className="py-2.5 px-3">التاريخ والوقت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentSales.map(sale => {
                  const st = stores.find(s => s.id === sale.storeId);
                  return (
                    <tr key={sale.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">{sale.invoiceNumber}</td>
                      <td className="py-3 px-3">
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-md font-bold text-white"
                          style={{ backgroundColor: st?.color || '#0d9488' }}
                        >
                          {st?.name.split(' ')[1] || 'المحل'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-700">{sale.cashierName}</td>
                      <td className="py-3 px-3 text-slate-700">{sale.items.length} صنف</td>
                      <td className="py-3 px-3">
                        <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-medium">
                          {sale.paymentMethod === 'cash' ? 'نقدي' : sale.paymentMethod === 'card' ? 'فيزا' : 'مختلط'}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono font-black text-slate-950 text-sm">
                        {sale.total.toFixed(2)} ج.م
                      </td>
                      <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">
                        {new Date(sale.createdAt).toLocaleTimeString('ar-EG')}
                      </td>
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
