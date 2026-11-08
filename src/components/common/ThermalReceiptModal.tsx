import React from 'react';
import { Sale, Store } from '../../types';
import { Printer, X, CheckCircle, Volume2 } from 'lucide-react';
import { api } from '../../services/api';

interface ThermalReceiptModalProps {
  sale: Sale;
  store: Store;
  onClose: () => void;
}

export const ThermalReceiptModal: React.FC<ThermalReceiptModalProps> = ({ sale, store, onClose }) => {
  const [isPlayingAudio, setIsPlayingAudio] = React.useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handlePlayVoice = async () => {
    try {
      setIsPlayingAudio(true);
      const message = `شكراً لزيارتكم ${store.name}. إجمالي الفاتورة ${sale.total} جنيه مصري.`;
      const res = await api.textToSpeech(message);
      if (res.audioBase64) {
        const audio = new Audio(`data:${res.mimeType || 'audio/wav'};base64,${res.audioBase64}`);
        await audio.play().catch(() => {});
      } else if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(message);
        utterance.lang = 'ar-SA';
        window.speechSynthesis.speak(utterance);
      }
    } catch (err) {
      console.warn('TTS notice:', err);
    } finally {
      setIsPlayingAudio(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
        {/* Action Header */}
        <div className="no-print bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-teal-400" />
            <span className="font-bold text-sm">تم إتمام الفاتورة بنجاح</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePlayVoice}
              disabled={isPlayingAudio}
              title="نطق الإجمالي عبر الذكاء الاصطناعي"
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-teal-300 rounded-lg text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>{isPlayingAudio ? 'جاري النطق...' : 'صوت الذكاء الاصطناعي'}</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>طباعة (Ctrl+P)</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Thermal Receipt (80mm standard) */}
        <div className="p-6 bg-white text-slate-800 receipt-printable font-mono text-sm leading-relaxed">
          <div className="text-center pb-3 border-b border-dashed border-slate-300">
            <h2 className="text-lg font-black tracking-tight text-slate-900">{store.name}</h2>
            <p className="text-xs text-slate-600 mt-0.5">{store.address}</p>
            <p className="text-xs text-slate-600">هاتف: {store.phone}</p>
            {store.taxNumber && <p className="text-xs text-slate-500">س.ت / ضريبي: {store.taxNumber}</p>}
          </div>

          <div className="py-2.5 border-b border-dashed border-slate-300 text-xs text-slate-600 space-y-1">
            <div className="flex justify-between">
              <span>رقم الفاتورة:</span>
              <span className="font-bold text-slate-900">{sale.invoiceNumber}</span>
            </div>
            <div className="flex justify-between">
              <span>التاريخ والوقت:</span>
              <span>{new Date(sale.createdAt).toLocaleString('ar-EG')}</span>
            </div>
            <div className="flex justify-between">
              <span>الكاشير:</span>
              <span>{sale.cashierName}</span>
            </div>
            <div className="flex justify-between">
              <span>العميل:</span>
              <span>{sale.customerName || 'عميل نقدي'}</span>
            </div>
          </div>

          {/* Items Table */}
          <table className="w-full text-xs my-3">
            <thead>
              <tr className="border-b border-slate-300 text-slate-600">
                <th className="text-right py-1.5">الصنف</th>
                <th className="text-center py-1.5">الكمية</th>
                <th className="text-center py-1.5">السعر</th>
                <th className="text-left py-1.5">الإجمالي</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sale.items.map((item, idx) => (
                <tr key={idx} className="py-1">
                  <td className="py-1.5 text-right font-medium text-slate-900">
                    <div>{item.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{item.barcode}</div>
                  </td>
                  <td className="text-center py-1.5 text-slate-700">{item.quantity}</td>
                  <td className="text-center py-1.5 text-slate-700">{item.unitPrice.toFixed(2)}</td>
                  <td className="text-left py-1.5 font-bold text-slate-900">{item.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals Section */}
          <div className="pt-2 border-t border-dashed border-slate-300 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>المجموع الفرعي:</span>
              <span>{sale.subtotal.toFixed(2)} ج.م</span>
            </div>
            {sale.discount > 0 && (
              <div className="flex justify-between text-red-600 font-medium">
                <span>الخصم الممنوح:</span>
                <span>-{sale.discount.toFixed(2)} ج.م</span>
              </div>
            )}
            <div className="flex justify-between text-base font-black text-slate-950 pt-1 border-t border-slate-200">
              <span>الإجمالي الصافي:</span>
              <span>{sale.total.toFixed(2)} ج.م</span>
            </div>

            <div className="pt-2 border-t border-slate-200 space-y-1 text-slate-600">
              <div className="flex justify-between">
                <span>طريقة الدفع:</span>
                <span className="font-semibold text-slate-800">
                  {sale.paymentMethod === 'cash' ? 'نقدي (كاش)' : sale.paymentMethod === 'card' ? 'فيزا / بطاقة' : 'دفع مختلط'}
                </span>
              </div>
              {sale.paymentMethod !== 'card' && (
                <>
                  <div className="flex justify-between">
                    <span>المبلغ المدفوع:</span>
                    <span>{sale.cashPaid.toFixed(2)} ج.م</span>
                  </div>
                  <div className="flex justify-between font-bold text-teal-700">
                    <span>المتبقي للعميل (الباقي):</span>
                    <span>{sale.changeAmount.toFixed(2)} ج.م</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Barcode graphic & footer note */}
          <div className="text-center pt-4 mt-3 border-t border-dashed border-slate-300">
            <div className="inline-block bg-slate-950 text-white font-mono text-[10px] tracking-widest px-3 py-1 rounded-sm mb-1.5">
              *{sale.invoiceNumber}*
            </div>
            <p className="text-[11px] text-slate-500 leading-tight">{store.receiptFooter}</p>
            <p className="text-[10px] text-slate-400 mt-1">نظام إدارة المتاجر المتكامل - إصدار السحاب 2026</p>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="no-print p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-sm font-semibold transition-colors"
          >
            إغلاق ومتابعة البيع
          </button>
          <button
            onClick={handlePrint}
            className="px-6 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-sm font-bold flex items-center gap-2 transition-colors shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة الإيصال</span>
          </button>
        </div>
      </div>
    </div>
  );
};
