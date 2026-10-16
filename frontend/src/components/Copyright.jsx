const WHATSAPP_URL = 'https://wa.me/967771296378?text=' + encodeURIComponent('مرحباً، أريد الاستفسار عن تطبيق العمده للخياطة');

export default function Copyright({ variant = 'default', className = '' }) {
  const openWhatsApp = () => window.open(WHATSAPP_URL, '_blank');

  if (variant === 'compact') {
    return (
      <div className={`text-center text-xs text-slate-400 ${className}`} dir="rtl">
        <p>© العمده للخياطة</p>
        <button
          onClick={openWhatsApp}
          className="text-blue-500 hover:text-blue-600 hover:underline transition-colors mt-1 inline-flex items-center gap-1"
        >
          <span>💬</span>
          <span>تواصل مع المطوّر</span>
        </button>
      </div>
    );
  }

  return (
    <div className={`text-center ${className}`} dir="rtl">
      <div className="text-xs text-slate-500 mb-2">© العمده للخياطة الرجالية</div>
      <div className="text-xs text-slate-400 mb-3">تطوير: رشيد عبدالله ثابت صالح</div>
      <button
        onClick={openWhatsApp}
        className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white rounded-lg transition-all text-xs font-semibold"
      >
        <span>💬</span>
        <span>تواصل مع المطوّر</span>
      </button>
    </div>
  );
}