import React, { useState } from 'react';
import { Store, User } from '../../types';
import { api } from '../../services/api';
import {
  Store as StoreIcon,
  LogOut,
  Volume2,
  ChevronDown,
  Sparkles,
  ShieldCheck,
  Building2,
  RefreshCw,
  Download,
} from 'lucide-react';

interface NavbarProps {
  user: User;
  stores: Store[];
  selectedStoreId: string; // 'all' or specific storeId
  onSelectStore: (id: string) => void;
  onLogout: () => void;
  onRefreshData?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  stores,
  selectedStoreId,
  onSelectStore,
  onLogout,
  onRefreshData,
}) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const selectedStore = stores.find(s => s.id === selectedStoreId);

  const handleVoiceSummary = async () => {
    try {
      setIsPlayingAudio(true);
      const summary = await api.getDashboardSummary(selectedStoreId);
      const text = `مرحباً بك يا مدير. إجمالي مبيعات اليوم حتى الآن هو ${summary.todaySales} جنيه مصري بعدد ${summary.totalBillsToday} فاتورة، وصافي أرباح الشهر ${summary.netMonthProfit} جنيه. لديك ${summary.lowStockCount} أصناف منخفضة المخزون، و ${summary.openShifts} ورديات عمل مفتوحة.`;

      const res = await api.textToSpeech(text);
      if (res.audioBase64) {
        const audio = new Audio(`data:${res.mimeType || 'audio/wav'};base64,${res.audioBase64}`);
        await audio.play().catch(() => {});
      } else if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ar-SA';
        utterance.rate = 0.95;
        window.speechSynthesis.speak(utterance);
      }
    } catch (err) {
      console.warn('Audio summary notice:', err);
    } finally {
      setIsPlayingAudio(false);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between z-30 sticky top-0 shadow-xs">
      {/* Right side: System logo & Store filter selector */}
      <div className="flex items-center gap-4 sm:gap-6">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-700 to-teal-500 text-white flex items-center justify-center shadow-sm">
            <Building2 className="w-5 h-5" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-sm font-black text-slate-900 tracking-tight leading-tight">
              نظام إدارة ٣ محلات تجارية
            </h1>
            <p className="text-[10px] text-slate-400 font-medium">اللوحة المركزية الموحدة ERP</p>
          </div>
        </div>

        {/* Global Store Switcher */}
        <div className="relative">
          <select
            value={selectedStoreId}
            onChange={e => onSelectStore(e.target.value)}
            className="appearance-none bg-slate-100 hover:bg-slate-200/80 text-slate-900 text-xs font-bold py-2 pl-8 pr-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 cursor-pointer transition-colors"
          >
            <option value="all">🏢 جميع المحلات الثلاثة (رؤية موحدة)</option>
            {stores.map(st => (
              <option key={st.id} value={st.id}>
                📍 {st.name}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-3 pointer-events-none" />
        </div>

        {selectedStore && (
          <span
            className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold text-white shadow-xs"
            style={{ backgroundColor: selectedStore.color }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            <span>الفرع النشط: {selectedStore.name}</span>
          </span>
        )}
      </div>

      {/* Left side: AI voice summary, user badge, refresh & logout */}
      <div className="flex items-center gap-2 sm:gap-3">
        {onRefreshData && (
          <button
            onClick={onRefreshData}
            title="تحديث البيانات اللحظية"
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}

        {/* AI Voice Briefing Button */}
        <button
          onClick={handleVoiceSummary}
          disabled={isPlayingAudio}
          title="استمع للملخص الصوتي اليومي بالذكاء الاصطناعي (Gemini TTS)"
          className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border border-teal-200 disabled:opacity-50"
        >
          <Volume2 className="w-3.5 h-3.5 text-teal-600" />
          <span className="hidden sm:inline">{isPlayingAudio ? 'جاري التوليد...' : 'ملخص صوتي ذكي'}</span>
        </button>

        {/* Download Project ZIP */}
        <a
          href="/api/download-zip"
          download="multi-store-system.zip"
          title="تحميل كود المشروع الكامل بصيغة ZIP لرفعه على أي استضافة خاصة"
          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
        >
          <Download className="w-3.5 h-3.5 text-teal-400" />
          <span className="hidden sm:inline">تحميل كود الموقع (ZIP)</span>
        </a>

        {/* User profile */}
        <div className="flex items-center gap-2 pr-2 border-r border-slate-200">
          <div className="w-8 h-8 rounded-full bg-slate-900 text-teal-400 flex items-center justify-center font-bold text-xs shadow-xs">
            {user.name.slice(0, 1)}
          </div>
          <div className="hidden lg:block text-right">
            <div className="text-xs font-bold text-slate-900 leading-tight">{user.name}</div>
            <div className="text-[10px] text-teal-700 font-bold flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-teal-600" />
              <span>مدير عام النظام</span>
            </div>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={onLogout}
          title="تسجيل الخروج"
          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
