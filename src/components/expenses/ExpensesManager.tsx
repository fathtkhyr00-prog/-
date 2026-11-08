import React, { useState, useEffect } from 'react';
import { Store, Expense } from '../../types';
import { api } from '../../services/api';
import { toast } from '../../context/ToastContext';
import {
  Wallet,
  Plus,
  TrendingDown,
  Building,
  Zap,
  Droplets,
  Users,
  Truck,
  Wrench,
  MoreHorizontal,
  CheckCircle,
} from 'lucide-react';

interface ExpensesManagerProps {
  stores: Store[];
  selectedStoreId: string;
}

export const ExpensesManager: React.FC<ExpensesManagerProps> = ({
  stores,
  selectedStoreId,
}) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form
  const [targetStoreId, setTargetStoreId] = useState(selectedStoreId !== 'all' ? selectedStoreId : stores[0]?.id || '');
  const [category, setCategory] = useState<string>('rent');
  const [amount, setAmount] = useState<number>(500);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const loadExpenses = async () => {
    try {
      setLoading(true);
      const res = await api.getExpenses({ storeId: selectedStoreId });
      setExpenses(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, [selectedStoreId]);

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0) {
      toast('الرجاء إدخال مبلغ صحيح', 'error');
      return;
    }

    try {
      await api.createExpense({
        storeId: targetStoreId,
        category,
        amount,
        date,
        notes,
      });

      setStatusMsg('تم تسجيل المصروف بنجاح وخصمه من أرباح المحل');
      setShowAddModal(false);
      setNotes('');
      setAmount(500);
      loadExpenses();
      toast('تم تسجيل المصروف بنجاح', 'success');
      setTimeout(() => setStatusMsg(null), 4000);
    } catch (err: any) {
      toast(err.message || 'فشل تسجيل المصروف', 'error');
    }
  };

  const categoryIcons: Record<string, any> = {
    rent: Building,
    electricity: Zap,
    water: Droplets,
    salaries: Users,
    transport: Truck,
    maintenance: Wrench,
    other: MoreHorizontal,
  };

  const totalExpensesAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-teal-600" />
            <span>إدارة المصروفات التشغيلية والتكاليف</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            تسجيل الإيجار، الرواتب، فواتير الكهرباء والمياه، والصيانة لكل محل لحساب صافي الربح الحقيقي بدقة.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>تسجيل مصروف جديد</span>
        </button>
      </div>

      {statusMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* Expense Categories Breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { key: 'rent', label: 'الإيجار', icon: Building, color: 'bg-blue-50 text-blue-700' },
          { key: 'salaries', label: 'المرتبات', icon: Users, color: 'bg-emerald-50 text-emerald-700' },
          { key: 'electricity', label: 'كهرباء وإنارة', icon: Zap, color: 'bg-amber-50 text-amber-700' },
          { key: 'maintenance', label: 'صيانة ومرافق', icon: Wrench, color: 'bg-purple-50 text-purple-700' },
        ].map(cat => {
          const sum = expenses.filter(e => e.category === cat.key).reduce((s, e) => s + e.amount, 0);
          const Icon = cat.icon;
          return (
            <div key={cat.key} className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-500">{cat.label}</span>
                <div className="text-lg font-black text-slate-900 font-mono mt-0.5">{sum.toLocaleString()} ج.م</div>
              </div>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${cat.color}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <h2 className="text-xs font-bold text-slate-800">سجل المصروفات المسجلة</h2>
          <span className="text-xs font-mono font-bold text-red-600">
            الإجمالي: {totalExpensesAmount.toLocaleString()} ج.م
          </span>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-400 text-xs">جاري تحميل المصروفات...</div>
        ) : expenses.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">لا توجد مصروفات مسجلة</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                  <th className="py-3 px-4">نوع المصروف</th>
                  <th className="py-3 px-4">المحل</th>
                  <th className="py-3 px-4">المبلغ</th>
                  <th className="py-3 px-4">البيان والتفاصيل</th>
                  <th className="py-3 px-4">سجل بواسطة</th>
                  <th className="py-3 px-4">التاريخ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expenses.map(exp => {
                  const st = stores.find(s => s.id === exp.storeId);
                  const Icon = categoryIcons[exp.category] || Wallet;

                  return (
                    <tr key={exp.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800">
                          <Icon className="w-4 h-4 text-slate-400" />
                          <span>{exp.categoryLabel}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-md font-bold text-white"
                          style={{ backgroundColor: st?.color || '#0d9488' }}
                        >
                          {st?.name.split(' ')[1] || 'المحل'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-black text-red-600 text-sm">
                        {exp.amount.toLocaleString()} ج.م
                      </td>
                      <td className="py-3 px-4 text-slate-700">{exp.notes || '-'}</td>
                      <td className="py-3 px-4 text-slate-600">{exp.createdBy}</td>
                      <td className="py-3 px-4 font-mono text-slate-400">{exp.date}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Expense Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <h2 className="text-base font-black text-slate-900 mb-3">تسجيل مصروف تشغيلي جديد</h2>
            <form onSubmit={handleCreateExpense} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">المحل المعني:</label>
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
                <label className="block text-xs font-bold text-slate-700 mb-1">بند المصروف:</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
                >
                  <option value="rent">إيجار المحل</option>
                  <option value="electricity">كهرباء وإنارة</option>
                  <option value="water">مياه ومرافق</option>
                  <option value="salaries">رواتب الموظفين والكاشيرات</option>
                  <option value="transport">شحن ونقل بضائع</option>
                  <option value="maintenance">صيانة وتبريد وتجهيزات</option>
                  <option value="other">مصروفات إدارية ونثرية أخرى</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">المبلغ (ج.م):</label>
                <input
                  type="number"
                  min="1"
                  step="10"
                  value={amount}
                  onChange={e => setAmount(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-base font-black text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">التاريخ:</label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">البيان والملاحظات:</label>
                <input
                  type="text"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="مثال: فاتورة كهرباء شهر نوفمبر، راتب عامل النظافة..."
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
                  className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
                >
                  حفظ المصروف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
