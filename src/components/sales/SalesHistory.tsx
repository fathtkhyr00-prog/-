import React, { useState, useEffect } from 'react';
import { Store, Sale } from '../../types';
import { api } from '../../services/api';
import {
  Receipt,
  Search,
  Printer,
  Calendar,
  CreditCard,
  Banknote,
  DollarSign,
  Download,
} from 'lucide-react';
import { ThermalReceiptModal } from '../common/ThermalReceiptModal';

interface SalesHistoryProps {
  stores: Store[];
  selectedStoreId: string;
}

export const SalesHistory: React.FC<SalesHistoryProps> = ({
  stores,
  selectedStoreId,
}) => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'cash' | 'card' | 'split'>('all');
  const [viewingSale, setViewingSale] = useState<Sale | null>(null);

  const loadSales = async () => {
    try {
      setLoading(true);
      const res = await api.getSales({ storeId: selectedStoreId, limit: 150 });
      setSales(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSales();
  }, [selectedStoreId]);

  const filteredSales = sales.filter(s => {
    if (paymentFilter !== 'all' && s.paymentMethod !== paymentFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.invoiceNumber.toLowerCase().includes(q) ||
      s.cashierName.toLowerCase().includes(q) ||
      s.customerName?.toLowerCase().includes(q)
    );
  });

  const totalFilteredAmount = filteredSales.reduce((sum, s) => sum + s.total, 0);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-teal-600" />
            <span>سجل الفواتير وعمليات البيع POS</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            البحث في فواتير المحلات الثلاثة، إعادة طباعة الإيصالات، وتفاصيل الدفع.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-teal-50 text-teal-900 px-3.5 py-1.5 rounded-xl border border-teal-200 text-xs font-bold font-mono">
            إجمالي المعروض: {totalFilteredAmount.toLocaleString()} ج.م
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="ابحث برقم الفاتورة أو اسم الكاشير..."
            className="w-full pl-9 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
        </div>

        <div className="flex gap-2">
          {(['all', 'cash', 'card', 'split'] as const).map(method => (
            <button
              key={method}
              onClick={() => setPaymentFilter(method)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                paymentFilter === method
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {method === 'all' ? 'جميع طرق الدفع' : method === 'cash' ? 'نقدي' : method === 'card' ? 'فيزا' : 'مختلط'}
            </button>
          ))}
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        {loading ? (
          <div className="text-center py-12 text-slate-400 text-xs">جاري تحميل الفواتير...</div>
        ) : filteredSales.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">لا توجد فواتير مطابقة للبحث</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                  <th className="py-3 px-4">رقم الفاتورة</th>
                  <th className="py-3 px-4">المحل</th>
                  <th className="py-3 px-4">الكاشير</th>
                  <th className="py-3 px-4">العميل</th>
                  <th className="py-3 px-4">عدد الأصناف</th>
                  <th className="py-3 px-4">طريقة الدفع</th>
                  <th className="py-3 px-4">الخصم</th>
                  <th className="py-3 px-4">الإجمالي الصافي</th>
                  <th className="py-3 px-4">التاريخ والوقت</th>
                  <th className="py-3 px-4 text-center">الإيصال</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSales.map(sale => {
                  const st = stores.find(s => s.id === sale.storeId);
                  return (
                    <tr key={sale.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{sale.invoiceNumber}</td>
                      <td className="py-3 px-4">
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-md font-bold text-white whitespace-nowrap"
                          style={{ backgroundColor: st?.color || '#0d9488' }}
                        >
                          {st?.name.split(' ')[1] || 'المحل'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-800 font-medium">{sale.cashierName}</td>
                      <td className="py-3 px-4 text-slate-600">{sale.customerName || 'نقدي'}</td>
                      <td className="py-3 px-4 text-slate-700">{sale.items.length} أصناف</td>
                      <td className="py-3 px-4">
                        <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold">
                          {sale.paymentMethod === 'cash' ? 'نقدي' : sale.paymentMethod === 'card' ? 'فيزا' : 'مختلط'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500">
                        {sale.discount > 0 ? `-${sale.discount} ج.م` : '-'}
                      </td>
                      <td className="py-3 px-4 font-mono font-black text-slate-950 text-sm">
                        {sale.total.toFixed(2)} ج.م
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                        {new Date(sale.createdAt).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => setViewingSale(sale)}
                          className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1 mx-auto"
                        >
                          <Printer className="w-3 h-3" />
                          <span>عرض وطباعة</span>
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

      {/* Printable Receipt Modal */}
      {viewingSale && (
        <ThermalReceiptModal
          sale={viewingSale}
          store={stores.find(s => s.id === viewingSale.storeId) || stores[0]}
          onClose={() => setViewingSale(null)}
        />
      )}
    </div>
  );
};
