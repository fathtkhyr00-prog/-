import React, { useState } from 'react';
import { Store, User, Shift } from '../../types';
import { api } from '../../services/api';
import { Lock, Store as StoreIcon, ShieldCheck, User as UserIcon, Sparkles, ArrowLeft } from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: (user: User, store: Store | null, activeShift: Shift | null) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e?: React.FormEvent, customCredentials?: { username: string; pin: string }) => {
    if (e) e.preventDefault();
    const creds = customCredentials || { username, pin };

    if (!creds.pin) {
      setError('الرجاء إدخال رمز الدخول (PIN)');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await api.login(creds);
      onLoginSuccess(res.user, res.store, res.activeShift);
    } catch (err: any) {
      setError(err.message || 'فشل تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  const quickLogins = [
    {
      title: 'مدير النظام (كامل الصلاحيات)',
      subtitle: 'تحكم في المحلات الثلاثة والتقارير والمخازن',
      username: 'admin',
      pin: 'admin123',
      color: 'bg-emerald-600 hover:bg-emerald-700 text-white',
      badge: 'المدير العام',
      icon: ShieldCheck,
    },
    {
      title: 'كاشير محل البقالة',
      subtitle: 'شاشة نقاط البيع لمحل المواد الغذائية',
      username: 'cashier1',
      pin: '1111',
      color: 'bg-teal-600 hover:bg-teal-700 text-white',
      badge: 'محل البقالة',
      icon: StoreIcon,
    },
    {
      title: 'كاشير محل المنظفات',
      subtitle: 'شاشة نقاط البيع لمحل المنظفات والمنزلية',
      username: 'cashier2',
      pin: '2222',
      color: 'bg-sky-600 hover:bg-sky-700 text-white',
      badge: 'محل المنظفات',
      icon: StoreIcon,
    },
    {
      title: 'كاشير المستورد والجاتوه',
      subtitle: 'شاشة نقاط البيع للشوكولاتة والتورت والحلويات',
      username: 'cashier3',
      pin: '3333',
      color: 'bg-amber-600 hover:bg-amber-700 text-white',
      badge: 'المستورد والجاتوه',
      icon: StoreIcon,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden font-['Cairo',sans-serif]">
      {/* Decorative background glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 z-10">
        {/* Left side: System branding and presentation */}
        <div className="lg:col-span-5 flex flex-col justify-center text-white p-6 sm:p-8 bg-slate-800/60 backdrop-blur-md rounded-3xl border border-slate-700/60 shadow-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-500/20 text-teal-300 rounded-full text-xs font-semibold w-max mb-4 border border-teal-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>نظام الإدارة المركزي المتكامل v2.5</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
            إدارة ٣ محلات تجارية
            <span className="block text-teal-400 font-extrabold text-xl sm:text-2xl mt-1">
              (بقالة • منظفات • مستورد وجاتوه)
            </span>
          </h1>

          <p className="text-slate-300 text-sm mt-3 leading-relaxed">
            نظام موحد لنقاط البيع السريعة POS، مراقبة المخزون اللحظي، إدارة الورديات والجرد النقدي، إغلاق اليومية، ومقارنة أرباح المحلات الثلاثة.
          </p>

          <div className="mt-6 pt-6 border-t border-slate-700/60 space-y-3 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-400" />
              <span>فصل تام لصلاحيات الكاشير عن الإدارة</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-sky-400" />
              <span>جرد دقيق للدرج النقدي وحساب العجز والزيادة</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>مدعوم بالذكاء الاصطناعي لأسعار السوق والتعرف على الفواتير والصوت</span>
            </div>
          </div>
        </div>

        {/* Right side: Login form and Quick Test Access */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 flex flex-col justify-center">
          <div className="mb-6">
            <h2 className="text-xl font-black text-slate-900">تسجيل الدخول للنظام</h2>
            <p className="text-slate-500 text-xs mt-1">اختر حساباً للتجربة السريعة بنقرة واحدة، أو أدخل الرمز الخاص بك</p>
          </div>

          {error && (
            <div className="mb-4 p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick 1-click test buttons */}
          <div className="space-y-2.5 mb-6">
            <span className="text-xs font-bold text-slate-700 block">تسجيل دخول سريع للتجربة والتقييم:</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {quickLogins.map((acc, idx) => {
                const Icon = acc.icon;
                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={loading}
                    onClick={() => handleLogin(undefined, { username: acc.username, pin: acc.pin })}
                    className={`p-3 rounded-xl text-right transition-all transform active:scale-98 shadow-sm flex flex-col justify-between ${acc.color}`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className="text-[10px] bg-black/20 px-2 py-0.5 rounded-md font-semibold tracking-wide">
                        {acc.badge}
                      </span>
                      <Icon className="w-4 h-4 opacity-80" />
                    </div>
                    <div>
                      <div className="font-bold text-xs leading-snug">{acc.title}</div>
                      <div className="text-[10px] text-white/80 mt-0.5">رمز PIN: {acc.pin}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-slate-400 font-medium">أو أدخل بيانات الحساب يدوياً</span>
            </div>
          </div>

          {/* Manual Login Form */}
          <form onSubmit={handleLogin} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">اسم المستخدم (أو اتركه فارغاً للدخول بالـ PIN فقط)</label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="مثال: admin أو cashier1"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all text-slate-800"
                />
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">رمز الدخول السريع (PIN)</label>
              <div className="relative">
                <input
                  type="password"
                  value={pin}
                  onChange={e => setPin(e.target.value)}
                  placeholder="••••"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm tracking-widest focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all text-slate-800"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-md disabled:opacity-50"
            >
              {loading ? (
                <span>جاري التحقق...</span>
              ) : (
                <>
                  <span>تسجيل الدخول</span>
                  <ArrowLeft className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
