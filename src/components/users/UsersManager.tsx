import React, { useState, useEffect } from 'react';
import { Store, User } from '../../types';
import { api } from '../../services/api';
import { toast } from '../../context/ToastContext';
import {
  UserCheck,
  Plus,
  ShieldCheck,
  Store as StoreIcon,
  Lock,
  Key,
  CheckCircle,
  Phone,
} from 'lucide-react';

interface UsersManagerProps {
  stores: Store[];
}

export const UsersManager: React.FC<UsersManagerProps> = ({ stores }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [role, setRole] = useState<'admin' | 'cashier'>('cashier');
  const [storeId, setStoreId] = useState(stores[0]?.id || '');
  const [phone, setPhone] = useState('');

  // Edit PIN Modal
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newPin, setNewPin] = useState('');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await api.getUsers();
      setUsers(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !pin.trim() || !name.trim()) {
      toast('الرجاء استكمال جميع الحقول الأساسية', 'error');
      return;
    }

    try {
      await api.createUser({
        username: username.trim(),
        name: name.trim(),
        pin: pin.trim(),
        role,
        storeId: role === 'cashier' ? storeId : undefined,
        phone: phone.trim(),
      });

      setStatusMsg(`تم إنشاء حساب ${name} بنجاح!`);
      setShowAddModal(false);
      setUsername('');
      setName('');
      setPin('');
      setPhone('');
      loadUsers();
      toast('تم إنشاء حساب المستخدم بنجاح', 'success');
      setTimeout(() => setStatusMsg(null), 4000);
    } catch (err: any) {
      toast(err.message || 'فشل إنشاء الحساب', 'error');
    }
  };

  const handleUpdatePin = async () => {
    if (!editingUser || !newPin.trim()) return;
    try {
      await api.updateUser(editingUser.id, { pin: newPin.trim() });
      setStatusMsg(`تم تحديث رمز PIN للمستخدم ${editingUser.name}`);
      setEditingUser(null);
      setNewPin('');
      loadUsers();
      toast('تم تحديث رمز PIN بنجاح', 'success');
      setTimeout(() => setStatusMsg(null), 4000);
    } catch (err: any) {
      toast(err.message || 'فشل تحديث الـ PIN', 'error');
    }
  };

  const handleToggleActive = async (u: User) => {
    try {
      await api.updateUser(u.id, { isActive: !u.isActive });
      loadUsers();
      toast(`تم ${!u.isActive ? 'تفعيل' : 'تعطيل'} الحساب بنجاح`, 'info');
    } catch (err: any) {
      toast(err.message || 'فشل تحديث الحالة', 'error');
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-teal-600" />
            <span>إدارة المستخدمين والكاشيرات والصلاحيات</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            فصل الأدوار بين الإدارة العامة وكاشيرات الفروع، تعيين المحل لكل موظف، وإعادة تعيين الـ PIN.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة مستخدم جديد</span>
        </button>
      </div>

      {statusMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        {loading ? (
          <div className="text-center py-12 text-slate-400 text-xs">جاري تحميل قائمة المستخدمين...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                  <th className="py-3 px-4">اسم الموظف</th>
                  <th className="py-3 px-4">اسم الدخول</th>
                  <th className="py-3 px-4">الدور / الصلاحية</th>
                  <th className="py-3 px-4">المحل المخصص له</th>
                  <th className="py-3 px-4">رقم الهاتف</th>
                  <th className="py-3 px-4">حالة الحساب</th>
                  <th className="py-3 px-4 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map(u => {
                  const st = stores.find(s => s.id === u.storeId);
                  const isAdmin = u.role === 'admin';

                  return (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">{u.name}</td>
                      <td className="py-3 px-4 font-mono text-slate-700">{u.username}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                            isAdmin ? 'bg-purple-100 text-purple-800' : 'bg-teal-100 text-teal-800'
                          }`}
                        >
                          {isAdmin ? 'مدير نظام (كامل الصلاحيات)' : 'كاشير فرع'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {isAdmin ? (
                          <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold">
                            جميع المحلات
                          </span>
                        ) : (
                          <span
                            className="text-[10px] px-2 py-0.5 rounded-md font-bold text-white whitespace-nowrap"
                            style={{ backgroundColor: st?.color || '#0d9488' }}
                          >
                            {st?.name || 'غير محدد'}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500">{u.phone || '-'}</td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleToggleActive(u)}
                          className={`text-[10px] px-2 py-0.5 rounded font-bold transition-colors ${
                            u.isActive ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'
                          }`}
                        >
                          {u.isActive ? 'نشط' : 'معطل'}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => {
                            setEditingUser(u);
                            setNewPin(u.pin);
                          }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors"
                        >
                          تغيير الـ PIN
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

      {/* Edit PIN Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 border border-slate-200">
            <h2 className="text-base font-black text-slate-900 mb-1">تغيير رمز الدخول (PIN)</h2>
            <p className="text-xs text-slate-500 mb-4">للمستخدم: {editingUser.name}</p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">الرمز الجديد:</label>
              <input
                type="password"
                value={newPin}
                onChange={e => setNewPin(e.target.value)}
                placeholder="••••"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-center text-lg font-mono tracking-widest font-black"
              />
            </div>

            <div className="mt-5 pt-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleUpdatePin}
                className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
              >
                حفظ الـ PIN
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <h2 className="text-base font-black text-slate-900 mb-3">إضافة موظف / كاشير جديد</h2>
            <form onSubmit={handleCreateUser} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم الموظف الكامل:</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="مثال: يوسف أحمد"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم الدخول (Username):</label>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="مثال: cashier_new"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">رمز الدخول السريع (PIN):</label>
                <input
                  type="password"
                  value={pin}
                  onChange={e => setPin(e.target.value)}
                  placeholder="مثال: 4444"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono tracking-widest font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الصلاحية / الدور:</label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
                >
                  <option value="cashier">كاشير (يفتح شاشة البيع للفرع فقط)</option>
                  <option value="admin">مدير نظام (كامل الصلاحيات لجميع الفروع)</option>
                </select>
              </div>

              {role === 'cashier' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الفرع / المحل التابع له:</label>
                  <select
                    value={storeId}
                    onChange={e => setStoreId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
                  >
                    {stores.map(st => (
                      <option key={st.id} value={st.id}>
                        {st.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">رقم الهاتف:</label>
                <input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="010..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono"
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
                  className="px-5 py-2 bg-teal-600 text-white rounded-xl text-xs font-bold"
                >
                  حفظ الموظف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
