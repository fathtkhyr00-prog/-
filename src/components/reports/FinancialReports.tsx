import React, { useState, useEffect } from 'react';
import { Store, Sale, Product, Expense, Shift } from '../../types';
import { api } from '../../services/api';
import {
  BarChart3,
  TrendingUp,
  Download,
  Printer,
  DollarSign,
  Package,
  Calendar,
  Store as StoreIcon,
  ArrowUpRight,
} from 'lucide-react';

interface FinancialReportsProps {
  stores: Store[];
  selectedStoreId: string;
}

export const FinancialReports: React.FC<FinancialReportsProps> = ({
  stores,
  selectedStoreId,
}) => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);

  // Time filter
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'year' | 'all'>('month');

  const loadData = async () => {
    try {
      setLoading(true);
      const [sList, pList, eList, shList] = await Promise.all([
        api.getSales({ storeId: selectedStoreId }),
        api.getProducts({ storeId: selectedStoreId }),
        api.getExpenses({ storeId: selectedStoreId }),
        api.getShiftsHistory({ storeId: selectedStoreId }),
      ]);
      setSales(sList);
      setProducts(pList);
      setExpenses(eList);
      setShifts(shList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedStoreId]);

  // Calculations
  const totalSales = sales.reduce((sum, s) => sum + s.total, 0);

  let totalCOGS = 0;
  sales.forEach(s => {
    s.items.forEach(it => {
      totalCOGS += it.costPrice * it.quantity;
    });
  });

  const grossProfit = totalSales - totalCOGS;
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = grossProfit - totalExpenses;
  const profitMarginPercent = totalSales > 0 ? ((netProfit / totalSales) * 100).toFixed(1) : '0';

  // Top Selling Products Calculation
  const productSalesMap: Record<string, { name: string; quantity: number; revenue: number }> = {};
  sales.forEach(s => {
    s.items.forEach(it => {
      if (!productSalesMap[it.productId]) {
        productSalesMap[it.productId] = { name: it.name, quantity: 0, revenue: 0 };
      }
      productSalesMap[it.productId].quantity += it.quantity;
      productSalesMap[it.productId].revenue += it.total;
    });
  });

  const topProducts = Object.values(productSalesMap)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // Cashier Performance
  const cashierSalesMap: Record<string, { name: string; count: number; total: number }> = {};
  sales.forEach(s => {
    if (!cashierSalesMap[s.cashierId]) {
      cashierSalesMap[s.cashierId] = { name: s.cashierName, count: 0, total: 0 };
    }
    cashierSalesMap[s.cashierId].count += 1;
    cashierSalesMap[s.cashierId].total += s.total;
  });

  // Export report to CSV
  const handleExportReportCSV = () => {
    const lines = [
      'تقرير الأرباح والخسائر والمؤشرات المالية',
      `تاريخ التصدير: ${new Date().toLocaleDateString('ar-EG')}`,
      '',
      `إجمالي المبيعات,${totalSales} ج.م`,
      `تكلفة البضاعة المباعة (COGS),${totalCOGS} ج.م`,
      `مجمل الربح التجاري,${grossProfit} ج.م`,
      `المصروفات التشغيلية,${totalExpenses} ج.م`,
      `صافي الأرباح النهائي,${netProfit} ج.م`,
      `نسبة صافي الربح,${profitMarginPercent}%`,
      '',
      'أعلى المنتجات مبيعاً:',
      'اسم المنتج,الكمية المباعة,إجمالي الإيراد',
      ...topProducts.map(tp => `"${tp.name}",${tp.quantity},${tp.revenue}`),
    ];

    const csvContent = '\uFEFF' + lines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `تقرير_الأرباح_المالي_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-teal-600" />
            <span>التقارير المالية وقائمة الدخل والأرباح والمقارنات</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            حسابات محاسبية حقيقية تفصل بين مجمل الربح، تكلفة البضاعة، والمصروفات، ومقارنة فروع المتاجر.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة التقرير</span>
          </button>
          <button
            onClick={handleExportReportCSV}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>تصدير Excel/CSV</span>
          </button>
        </div>
      </div>

      {/* Income Statement (قائمة الدخل والأرباح الحقيقية) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <h2 className="text-base font-black text-slate-900 mb-4 pb-2 border-b border-slate-200">
          قائمة الدخل والأرباح المحاسبية (P&L Statement)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <span className="text-xs font-bold text-slate-500 block">إجمالي الإيرادات (المبيعات)</span>
            <div className="text-2xl font-black text-slate-950 font-mono mt-1">
              {totalSales.toLocaleString()} <span className="text-xs font-normal">ج.م</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1">من واقع فواتير الكاشير</div>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <span className="text-xs font-bold text-slate-500 block">تكلفة البضاعة المباعة (COGS)</span>
            <div className="text-2xl font-black text-amber-700 font-mono mt-1">
              -{totalCOGS.toLocaleString()} <span className="text-xs font-normal">ج.م</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1">تكلفة الشراء الفعلية للأصناف المباعة</div>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <span className="text-xs font-bold text-slate-500 block">المصروفات التشغيلية</span>
            <div className="text-2xl font-black text-red-600 font-mono mt-1">
              -{totalExpenses.toLocaleString()} <span className="text-xs font-normal">ج.م</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1">إيجارات، كهرباء، صيانة، رواتب</div>
          </div>

          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200">
            <span className="text-xs font-bold text-emerald-800 block">صافي الربح النهائي (Net Profit)</span>
            <div className="text-2xl font-black text-emerald-900 font-mono mt-1">
              {netProfit.toLocaleString()} <span className="text-xs font-normal">ج.م</span>
            </div>
            <div className="text-[10px] text-emerald-700 font-bold mt-1">
              هامش صافي الربح: {profitMarginPercent}%
            </div>
          </div>
        </div>
      </div>

      {/* 3 Stores Performance Comparison Grid */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <h2 className="text-base font-black text-slate-900 mb-4 pb-2 border-b border-slate-200">
          مقارنة ربحية ونشاط المحلات الثلاثة
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stores.map(st => {
            const stSales = sales.filter(s => s.storeId === st.id);
            const stTotal = stSales.reduce((s, it) => s + it.total, 0);
            let stCogs = 0;
            stSales.forEach(s => s.items.forEach(it => (stCogs += it.costPrice * it.quantity)));
            const stExp = expenses.filter(e => e.storeId === st.id).reduce((s, it) => s + it.amount, 0);
            const stNet = stTotal - stCogs - stExp;

            return (
              <div
                key={st.id}
                className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3 relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-1.5" style={{ backgroundColor: st.color }} />
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-slate-900">{st.name}</h3>
                  <span
                    className="text-[10px] px-2 py-0.5 rounded font-bold text-white"
                    style={{ backgroundColor: st.color }}
                  >
                    {st.type}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 font-mono">
                  <div className="flex justify-between">
                    <span>إجمالي المبيعات:</span>
                    <span className="font-bold text-slate-900">{stTotal.toLocaleString()} ج.م</span>
                  </div>
                  <div className="flex justify-between">
                    <span>تكلفة البضاعة:</span>
                    <span className="text-amber-700">-{stCogs.toLocaleString()} ج.م</span>
                  </div>
                  <div className="flex justify-between">
                    <span>المصروفات:</span>
                    <span className="text-red-600">-{stExp.toLocaleString()} ج.م</span>
                  </div>
                  <div className="flex justify-between font-bold pt-2 border-t border-slate-200 text-sm text-slate-950">
                    <span>صافي الربح:</span>
                    <span className="text-emerald-700 font-black">{stNet.toLocaleString()} ج.م</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top Products & Cashier Performance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Top Selling Products */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <h2 className="text-sm font-black text-slate-900 mb-3">أعلى ٥ منتجات مبيعاً وتحقيقاً للإيراد</h2>
          {topProducts.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">لا توجد بيانات مبيعات كافية بعد</div>
          ) : (
            <div className="space-y-2">
              {topProducts.map((p, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 font-bold flex items-center justify-center text-[10px]">
                      {idx + 1}
                    </span>
                    <span className="font-bold text-slate-900">{p.name}</span>
                  </div>
                  <div className="font-mono text-left">
                    <div className="font-black text-slate-900">{p.revenue.toLocaleString()} ج.م</div>
                    <div className="text-[10px] text-slate-400">{p.quantity} قطعة مباعة</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cashier Performance */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <h2 className="text-sm font-black text-slate-900 mb-3">أداء وإنتاجية الكاشيرات</h2>
          {Object.keys(cashierSalesMap).length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">لا توجد مبيعات مسجلة للكاشيرات</div>
          ) : (
            <div className="space-y-2">
              {Object.entries(cashierSalesMap).map(([id, info]) => (
                <div key={id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl text-xs">
                  <div className="font-bold text-slate-900">{info.name}</div>
                  <div className="font-mono text-left">
                    <div className="font-black text-emerald-800">{info.total.toLocaleString()} ج.م</div>
                    <div className="text-[10px] text-slate-500">{info.count} فاتورة منفذة</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
