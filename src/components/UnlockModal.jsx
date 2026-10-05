import React, { useState } from 'react';
import { 
  X, Lock, Unlock, ShieldAlert, KeyRound, Download, 
  CheckCircle, FileText, AlertCircle, ShieldCheck
} from 'lucide-react';
import { formatFileSize, formatDateArabic } from '../utils/helpers';
import confetti from 'canvas-confetti';

export default function UnlockModal({ isOpen, onClose, file, clientId, currentUserId, onFileUnlocked }) {
  const [pin, setPin] = useState('');
  const [account, setAccount] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isBlocked, setIsBlocked] = useState(file?.isPermanentlyBlocked || false);
  const [unlockedResult, setUnlockedResult] = useState(null);

  if (!isOpen || !file) return null;

  const handleUnlockSubmit = async (e) => {
    e.preventDefault();
    if (!pin.trim()) {
      setError('يرجى إدخال الرقم السري');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/files/unlock/${file.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pin: pin.trim(),
          account: account.trim(),
          name: name.trim(),
          clientId,
          currentUserId
        })
      });

      const data = await res.json();
      setIsLoading(false);

      if (!res.ok) {
        if (data.isBlocked) {
          setIsBlocked(true);
          setError('تم حظر هذا الجهاز نهائياً من فتح هذا الملف لأسباب أمنية.');
        } else {
          setError('بيانات الأمان غير مطابقة، يرجى التأكد وإعادة المحاولة.');
        }
        return;
      }

      // Success
      setUnlockedResult(data);
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 }
      });
      if (onFileUnlocked) onFileUnlocked(file.id);
    } catch (err) {
      setIsLoading(false);
      setError('تعذر التحقق من الخادم، يرجى إعادة المحاولة.');
    }
  };

  const handlePinInput = (e) => {
    const val = e.target.value.replace(/\D/g, '');
    setPin(val);
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 z-10 w-8 h-8 rounded-lg bg-slate-100/80 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header with Professional Palette */}
        <div className={`p-6 text-center ${
          isBlocked 
            ? 'bg-red-700 text-white' 
            : unlockedResult 
              ? 'bg-emerald-700 text-white' 
              : 'bg-slate-900 text-white'
        }`}>
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-white/15">
            {isBlocked ? (
              <ShieldAlert className="w-6 h-6 text-white" />
            ) : unlockedResult ? (
              <Unlock className="w-6 h-6 text-white" />
            ) : (
              <Lock className="w-6 h-6 text-white" />
            )}
          </div>

          <h3 className="text-lg font-bold">
            {isBlocked 
              ? 'تم حظر الوصول نهائياً' 
              : unlockedResult 
                ? 'تم فك القفل بنجاح' 
                : 'التحقق من أدوات الأمان'
            }
          </h3>

          <p className="text-xs text-white/80 mt-1 truncate max-w-xs mx-auto">
            {file.originalName} ({formatFileSize(file.size)})
          </p>
        </div>

        <div className="p-6">
          {/* CASE 1: PERMANENTLY BLOCKED */}
          {isBlocked ? (
            <div className="text-center space-y-4 py-2">
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 space-y-1.5">
                <p className="font-bold text-xs sm:text-sm">
                  تم حظر هذا الجهاز نهائياً من الوصول إلى هذا الملف
                </p>
                <p className="text-xs text-red-600 leading-relaxed">
                  لحماية أمان وخصوصية الملف، تم إيقاف إمكانية إدخال الرموز من هذا الجهاز نهائياً.
                </p>
              </div>

              <button
                onClick={onClose}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs sm:text-sm font-bold transition-colors"
              >
                إغلاق
              </button>
            </div>
          ) : unlockedResult ? (
            /* CASE 2: UNLOCKED */
            <div className="space-y-4 py-1">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 text-center space-y-1">
                <p className="font-bold text-xs sm:text-sm text-emerald-800 flex items-center justify-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  تمت المصادقة بنجاح وأصبح الملف متاحاً
                </p>
                <p className="text-xs text-emerald-700">
                  {unlockedResult.file.originalName}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                <a
                  href={unlockedResult.downloadUrl}
                  download={unlockedResult.file.originalName}
                  className="w-full flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors text-center shadow-xs"
                >
                  <Download className="w-4 h-4" />
                  <span>تحميل الملف الآن</span>
                </a>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs sm:text-sm transition-colors"
                >
                  إغلاق
                </button>
              </div>
            </div>
          ) : (
            /* CASE 3: INPUT SECURITY TOOLS (NO ATTEMPT COUNTER DISPLAYED) */
            <form onSubmit={handleUnlockSubmit} className="space-y-3.5">
              
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-bold text-center shake flex items-center justify-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{error}</span>
                </div>
              )}

              {/* Tool 1: PIN (Mandatory - numbers only) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  الرقم السري (PIN) <span className="text-red-500">* إجباري (أرقام فقط)</span>
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                  <input
                    type="password"
                    inputMode="numeric"
                    placeholder="أدخل الرقم السري"
                    value={pin}
                    onChange={handlePinInput}
                    dir="ltr"
                    className="w-full pr-9 pl-3 py-2.5 text-center font-mono font-bold tracking-widest text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-800"
                    autoFocus
                  />
                </div>
              </div>

              {/* Tool 2: Account (Only if required) */}
              {file.requiredTools?.account && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    الحساب المطلوب لهذا الملف <span className="text-slate-900">* مطلوب</span>
                  </label>
                  <input
                    type="text"
                    placeholder="أدخل الحساب المحدد من قِبل الرافع"
                    value={account}
                    onChange={(e) => setAccount(e.target.value)}
                    dir="ltr"
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-800 text-left"
                  />
                </div>
              )}

              {/* Tool 3: Name (Only if required) */}
              {file.requiredTools?.name && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    الاسم المطلوب لهذا الملف <span className="text-slate-900">* مطلوب</span>
                  </label>
                  <input
                    type="text"
                    placeholder="أدخل الاسم المحدد للملف"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-800"
                  />
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-xs sm:text-sm transition-all shadow-xs flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <span>جاري التحقق...</span>
                  ) : (
                    <>
                      <Unlock className="w-4 h-4" />
                      <span>فتح الملف</span>
                    </>
                  )}
                </button>
              </div>

              <div className="pt-1 flex items-center justify-center gap-1 text-[11px] text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>محمي بنظام التحقق المشفر</span>
              </div>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}
