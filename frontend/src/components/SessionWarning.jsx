/**
 * تنبيه انتهاء الجلسة
 */
import { useNavigate } from 'react-router-dom';
import { extendSession } from '../utils/session.js';

export default function SessionWarning({ status, remaining, onExtend }) {
  const navigate = useNavigate();

  if (status !== 'warning' && status !== 'expiring') return null;

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;

  const isCritical = status === 'expiring';

  const handleExtend = () => {
    extendSession();
    if (onExtend) onExtend();
  };

  const handleLogout = () => {
    navigate('/login');
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-fade-in">
      <div className={`bg-white rounded-2xl max-w-md w-full p-6 shadow-large ${isCritical ? 'ring-4 ring-red-200' : 'ring-4 ring-amber-200'}`}>
        <div className="text-center mb-6">
          <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center text-4xl mb-4 ${isCritical ? 'bg-red-50' : 'bg-amber-50'}`}>
            {isCritical ? '🚨' : '⏰'}
          </div>

          <h3 className="text-xl font-bold text-slate-900 mb-2">
            {isCritical ? 'الجلسة على وشك الانتهاء!' : 'تنبيه: الجلسة قاربت'}
          </h3>

          <p className="text-sm text-slate-600 mb-4">
            {isCritical
              ? 'سيتم تسجيل خروجك تلقائياً بعد:'
              : 'سيتم تسجيل خروجك تلقائياً بعد:'}
          </p>

          <div className={`text-5xl font-bold mb-6 ${isCritical ? 'text-red-600' : 'text-amber-600'}`} dir="ltr">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </div>

          <p className="text-xs text-slate-500">
            اضغط "تمديد الجلسة" للاستمرار في العمل
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleLogout}
            className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-all"
          >
            تسجيل الخروج
          </button>
          <button
            onClick={handleExtend}
            className={`flex-1 px-4 py-3 text-white rounded-lg font-semibold transition-all ${
              isCritical
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-amber-600 hover:bg-amber-700'
            }`}
          >
            ⏱️ تمديد الجلسة
          </button>
        </div>
      </div>
    </div>
  );
}