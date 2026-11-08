import React, { useState, useRef } from 'react';
import { api } from '../../services/api';
import { toast } from '../../context/ToastContext';
import {
  Bot,
  Search,
  Volume2,
  Camera,
  Sparkles,
  ExternalLink,
  CheckCircle,
  Play,
  RotateCcw,
  AlertCircle,
} from 'lucide-react';

export const AiToolsPanel: React.FC = () => {
  // 1. Search Grounding state
  const [searchQuery, setSearchQuery] = useState('سعر كرتونة زيت كريستال وسعر كيلو السكر والأرز في مصر اليوم');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchAnswer, setSearchAnswer] = useState<string | null>(null);
  const [searchSources, setSearchSources] = useState<any[]>([]);

  // 2. TTS state
  const [ttsText, setTtsText] = useState('مرحباً بكم في نظام المتاجر المتكامل. إجمالي مبيعات اليوم حققت زيادة ملحوظة، وجميع الورديات منتظمة.');
  const [ttsVoice, setTtsVoice] = useState<'Puck' | 'Kore' | 'Charon' | 'Fenrir' | 'Zephyr'>('Puck');
  const [ttsLoading, setTtsLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  // 3. Image Analysis state
  const [imageTask, setImageTask] = useState<'receipt' | 'product'>('receipt');
  const [imageLoading, setImageLoading] = useState(false);
  const [imageResult, setImageResult] = useState<any | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle Search Grounding
  const handleMarketSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      setSearchLoading(true);
      setSearchAnswer(null);
      setSearchSources([]);
      const res = await api.searchMarketPrice(searchQuery);
      setSearchAnswer(res.answer);
      setSearchSources(res.sources || []);
    } catch (err: any) {
      toast(err.message || 'فشل البحث في أسعار السوق', 'error');
    } finally {
      setSearchLoading(false);
    }
  };

  // Handle TTS
  const handleGenerateTTS = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ttsText.trim()) return;

    try {
      setTtsLoading(true);
      const res = await api.textToSpeech(ttsText, ttsVoice);
      if (res.audioBase64) {
        const url = `data:${res.mimeType || 'audio/wav'};base64,${res.audioBase64}`;
        setAudioUrl(url);
        const audio = new Audio(url);
        await audio.play().catch(() => {});
      } else if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(ttsText);
        utterance.lang = 'ar-SA';
        window.speechSynthesis.speak(utterance);
      }
    } catch (err: any) {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(ttsText);
        utterance.lang = 'ar-SA';
        window.speechSynthesis.speak(utterance);
      }
    } finally {
      setTtsLoading(false);
    }
  };

  // Handle Image Upload
  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        setImageLoading(true);
        setImageResult(null);
        const base64 = reader.result as string;
        const res = await api.analyzeImage(base64, imageTask, file.type);
        setImageResult(res.data);
      } catch (err: any) {
        toast(err.message || 'فشل تحليل الصورة بالذكاء الاصطناعي', 'error');
      } finally {
        setImageLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Bot className="w-5 h-5 text-teal-600" />
            <span>مركز أدوات الذكاء الاصطناعي المدمجة (Gemini AI)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            البحث المباشر في أسعار السوق المصري (Google Search Grounding)، التعرف على الفواتير والصور، وتوليد الصوت البشري (Gemini TTS).
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Google Search Grounding for Market Intelligence */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                <Search className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-black text-slate-900">
                  استعلام أسعار السوق المصري المباشرة (Google Search Grounding)
                </h2>
                <p className="text-[11px] text-slate-400">نموذج gemini-3.8-flash مدعوم بالبحث الحي</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 my-3 leading-relaxed">
              استعلم عن أحدث أسعار الجملة والتجزئة لسلع البقالة أو المنظفات أو الشوكولاتة المستوردة في السوق المصري للتحقق من أسعارك وهامش ربحك.
            </p>

            <form onSubmit={handleMarketSearch} className="space-y-3">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="اكتب اسم السلعة أو السؤال..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div className="flex flex-wrap gap-1.5">
                {[
                  'سعر كيلو السكر المعبأ اليوم في مصر',
                  'سعر مسحوق أريال 4 كيلو وسعر فيري',
                  'سعر برطمان نوتيلا 750 جرام وسعر لوتس',
                ].map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSearchQuery(sample)}
                    className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-lg transition-colors font-medium"
                  >
                    💡 {sample}
                  </button>
                ))}
              </div>

              <button
                type="submit"
                disabled={searchLoading}
                className="w-full py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {searchLoading ? (
                  <span>جاري البحث في مصادر السوق المصري الحية...</span>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>البحث والتحقق من السعر</span>
                  </>
                )}
              </button>
            </form>

            {/* Answer Display */}
            {searchAnswer && (
              <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 space-y-3">
                <div className="font-bold text-teal-800 text-xs flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                  <span>نتائج البحث الميداني الموثقة:</span>
                </div>
                <div className="whitespace-pre-wrap leading-relaxed text-slate-700">{searchAnswer}</div>

                {searchSources.length > 0 && (
                  <div className="pt-2 border-t border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold block mb-1">المصادر المرجعية للأسعار:</span>
                    <div className="flex flex-wrap gap-2">
                      {searchSources.map((src, i) => (
                        <a
                          key={i}
                          href={src?.web?.uri || '#'}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] bg-white border border-slate-200 hover:border-teal-500 text-teal-700 px-2 py-1 rounded flex items-center gap-1 truncate max-w-xs"
                        >
                          <ExternalLink className="w-3 h-3 shrink-0" />
                          <span className="truncate">{src?.web?.title || 'مصدر سوقي'}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 2. Text to Speech using gemini-3.8-flash-tts */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Volume2 className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-black text-slate-900">
                  تحويل النص لصوت واقعي (Gemini TTS)
                </h2>
                <p className="text-[11px] text-slate-400">نموذج gemini-3.8-flash-tts بالنطق العربي الفصيح</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 my-3 leading-relaxed">
              استمع للتنبيهات الصوتية، نطق إجمالي الفواتير للعملاء، أو الملخصات الإدارية بصوت واضح ونقي.
            </p>

            <form onSubmit={handleGenerateTTS} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">النص المطلوب نطقه:</label>
                <textarea
                  rows={3}
                  value={ttsText}
                  onChange={e => setTtsText(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اختيار الصوت المفضل:</label>
                <div className="flex gap-2">
                  {(['Puck', 'Kore', 'Charon', 'Fenrir'] as const).map(v => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setTtsVoice(v)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                        ttsVoice === v
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={ttsLoading}
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {ttsLoading ? (
                  <span>جاري توليد الملف الصوتي بواسطة الذكاء الاصطناعي...</span>
                ) : (
                  <>
                    <Volume2 className="w-4 h-4" />
                    <span>توليد وتشغيل الصوت</span>
                  </>
                )}
              </button>
            </form>

            {audioUrl && (
              <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-xl flex items-center justify-between">
                <span className="text-xs font-bold text-purple-900">الملف الصوتي جاهز</span>
                <audio controls src={audioUrl} className="h-8 max-w-[200px]" />
              </div>
            )}
          </div>
        </div>

        {/* 3. Image Analysis (Receipts & Products OCR) */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900">
                التعرف البصري على الفواتير والمنتجات (Gemini Vision OCR)
              </h2>
              <p className="text-[11px] text-slate-400">استخراج الأصناف والباركود والأسعار تلقائياً من الكاميرا أو الصور</p>
            </div>
          </div>

          <p className="text-xs text-slate-600 my-2 leading-relaxed">
            ارفع صورة فاتورة شراء ورقية من المورد أو صورة عبوة منتج لقراءة بياناته وإدخاله للمخزن بضغطة زر.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3 my-4">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setImageTask('receipt')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                  imageTask === 'receipt' ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                فاتورة شراء / إيصال مورد
              </button>
              <button
                type="button"
                onClick={() => setImageTask('product')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                  imageTask === 'product' ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                عبوة منتج / باركود
              </button>
            </div>

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={imageLoading}
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-colors"
            >
              <Camera className="w-4 h-4" />
              <span>{imageLoading ? 'جاري الفحص البصري...' : 'اختر صورة من الجهاز أو التقط بالكاميرا'}</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageFile}
            />
          </div>

          {/* Results display */}
          {imageResult && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-2">
              <div className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>البيانات المستخرجة بنجاح من الصورة:</span>
              </div>
              <pre className="bg-white p-3 rounded-xl border border-slate-200 font-mono text-xs overflow-x-auto text-slate-800 leading-relaxed">
                {JSON.stringify(imageResult, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
