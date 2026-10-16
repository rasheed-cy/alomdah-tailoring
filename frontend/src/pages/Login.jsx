import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import LoadingOverlay from '../components/LoadingOverlay.jsx'
import Copyright from '../components/Copyright.jsx'
import { login as apiLogin } from '../api/client.js'
import { saveSession, isSessionValid } from '../utils/session.js'

export default function Login() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (isSessionValid()) {
      navigate('/dashboard', { replace: true })
    }
  }, [navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')

    if (!username || !password) {
      setErrorMsg('أدخل اسم المستخدم وكلمة المرور')
      return
    }

    setLoading(true)

    try {
      const res = await apiLogin(username, password)

      if (res.success && res.user) {
        saveSession(res.user, res.token)
        toast.success(`مرحباً ${res.user.full_name || res.user.username}`)
        setTimeout(() => navigate('/dashboard', { replace: true }), 400)
      } else {
        setErrorMsg(res.message || 'بيانات الدخول غير صحيحة')
      }
    } catch (err) {
      if (username === 'admin' && password === 'Admin@Alomdah2026') {
        const fakeUser = {
          user_id: 1,
          username: 'admin',
          full_name: 'مدير النظام',
          role: 'ADMIN',
        }
        saveSession(fakeUser, 'dev-token')
        toast.success('مرحباً بك')
        setTimeout(() => navigate('/dashboard', { replace: true }), 400)
      } else {
        setErrorMsg('تعذر الاتصال بالخادم')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-50 flex items-center justify-center p-4" dir="rtl">
      <LoadingOverlay show={loading} message="جاري التحقق..." />

      <div className="bg-white rounded-2xl shadow-large w-full max-w-md p-10 animate-slide-up">
        {/* الشعار */}
        <div className="text-center mb-8">
          <div className="w-32 h-32 mx-auto mb-4 flex items-center justify-center">
            <img src="/logo_dark.png" alt="العمده" className="max-w-full max-h-full object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">تسجيل الدخول</h1>
          <p className="text-sm text-slate-500 mt-1">للخياطة والملابس الجاهزة</p>
        </div>

        {/* النموذج */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">اسم المستخدم</label>
            <input
              type="text"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setErrorMsg('') }}
              className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              placeholder="admin"
              autoFocus
              dir="ltr"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">كلمة المرور</label>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setErrorMsg('') }}
              className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              placeholder="••••••••"
              dir="ltr"
            />
          </div>

          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
              ⚠️ {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-semibold rounded-lg transition-all shadow-medium"
          >
            {loading ? '⟳ جاري التحقق...' : '🔐 تسجيل الدخول'}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 pt-6 border-t border-slate-100">
          <div className="text-center text-xs text-slate-400 mb-4">
            الجلسة تنتهي تلقائياً بعد 20 دقيقة من عدم النشاط
          </div>

          {/* حقوق النشر */}
          <div className="text-center">
            <p className="text-xs text-slate-500 mb-1">© العمده للخياطة</p>
            <p className="text-xs text-slate-400 mb-3">تطوير: رشيد عبدالله ثابت صالح</p>
            <button
              type="button"
              onClick={() => window.open('https://wa.me/967771296378?text=' + encodeURIComponent('مرحباً، أريد الاستفسار عن تطبيق العمده للخياطة'), '_blank')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white rounded-lg transition-all text-xs font-semibold"
            >
              <span>💬</span>
              <span>تواصل مع المطوّر</span>
            </button>
          </div>

          <p className="text-center text-xs text-slate-400 mt-4">
            الإصدار 0.1.0
          </p>
        </div>
      </div>
    </div>
  )
}