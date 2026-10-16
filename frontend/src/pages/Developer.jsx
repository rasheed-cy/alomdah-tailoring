import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

export default function Developer() {
  const navigate = useNavigate()
  const [imageError, setImageError] = useState(false)

  const developer = {
    name: 'رشيد عبدالله ثابت صالح',
    role: 'مطوّر التطبيق',
    phone: '771296378',
    whatsapp: '967771296378',
    github: 'https://github.com/rasheed-cy',
    githubDisplay: 'github.com/rasheed-cy',
    linkedin: 'https://linkedin.com/in/rasheed-abdullah-thabit-salah',
    linkedinDisplay: 'linkedin.com/in/rasheed-abdullah-thabit-salah',
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    toast.success('تم النسخ')
  }

  return (
    <div className="p-8 max-w-4xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900">👨‍💻 المطوّر</h2>
        <p className="text-sm text-slate-500 mt-1">معلومات الاتصال والتواصل</p>
      </div>

      {/* Developer Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-soft overflow-hidden mb-6">
        {/* Hero */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-8 text-center relative">
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="absolute top-4 right-4 w-10 h-10 rounded-lg bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white flex items-center justify-center transition-all"
            title="رجوع"
          >
            →
          </button>

          {/* Avatar */}
          <div className="w-32 h-32 rounded-full mx-auto mb-4 border-4 border-white shadow-large overflow-hidden bg-white">
            {!imageError ? (
              <img
                src="/developer.png"
                alt={developer.name}
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600 text-white text-6xl font-bold">
                ر
              </div>
            )}
          </div>

          {/* Name */}
          <h3 className="text-2xl font-bold text-white mb-1">
            {developer.name}
          </h3>

          {/* Role */}
          <p className="text-blue-100 text-sm">
            {developer.role}
          </p>
        </div>

        {/* Contact Info */}
        <div className="p-6 space-y-3">
          {/* WhatsApp */}
          <ContactRow
            icon="📱"
            label="رقم الهاتف"
            value={developer.phone}
            valueDir="ltr"
            actions={[
              {
                label: 'واتساب',
                icon: '💬',
                onClick: () => window.open(`https://wa.me/${developer.whatsapp}`, '_blank'),
                color: 'emerald',
              },
              {
                label: 'نسخ',
                icon: '📋',
                onClick: () => copyToClipboard(developer.phone),
                color: 'slate',
              },
            ]}
          />

          {/* GitHub */}
          <ContactRow
            icon="🔗"
            label="GitHub"
            value={developer.githubDisplay}
            valueDir="ltr"
            actions={[
              {
                label: 'فتح',
                icon: '↗',
                onClick: () => window.open(developer.github, '_blank'),
                color: 'blue',
              },
              {
                label: 'نسخ',
                icon: '📋',
                onClick: () => copyToClipboard(developer.github),
                color: 'slate',
              },
            ]}
          />

          {/* LinkedIn */}
          <ContactRow
            icon="💼"
            label="LinkedIn"
            value={developer.linkedinDisplay}
            valueDir="ltr"
            actions={[
              {
                label: 'فتح',
                icon: '↗',
                onClick: () => window.open(developer.linkedin, '_blank'),
                color: 'blue',
              },
              {
                label: 'نسخ',
                icon: '📋',
                onClick: () => copyToClipboard(developer.linkedin),
                color: 'slate',
              },
            ]}
          />
        </div>
      </div>

      {/* About App */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-soft p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden">
            <img src="/logo_dark.png" alt="العمده" className="max-w-full max-h-full object-contain p-1" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">العمده للخياطة الرجالية</h3>
            <p className="text-xs text-slate-500 mt-0.5">للخياطة والملابس الجاهزة</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <InfoBox label="الإصدار" value="0.1.0" />
          <InfoBox label="السنة" value={new Date().getFullYear().toString()} />
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          © جميع الحقوق محفوظة — {developer.name}
        </p>
      </div>
    </div>
  )
}

function ContactRow({ icon, label, value, valueDir, actions = [] }) {
  const colors = {
    emerald: 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white',
    blue: 'bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white',
    slate: 'bg-slate-50 text-slate-600 hover:bg-slate-600 hover:text-white',
  }

  return (
    <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
      <div className="w-11 h-11 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-xl flex-shrink-0">
        {icon}
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-xs text-slate-500 mb-0.5">{label}</div>
        <div className="text-sm font-semibold text-slate-900 truncate" dir={valueDir || 'rtl'}>
          {value}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {actions.map((action, i) => (
          <button
            key={i}
            onClick={action.onClick}
            className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all inline-flex items-center gap-1 ${colors[action.color] || colors.slate}`}
          >
            <span>{action.icon}</span>
            <span>{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function InfoBox({ label, value }) {
  return (
    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-center">
      <div className="text-xs text-slate-500 mb-1">{label}</div>
      <div className="text-lg font-bold text-slate-800" dir="ltr">{value}</div>
    </div>
  )
}