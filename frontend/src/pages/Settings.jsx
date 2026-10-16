import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import LoadingOverlay from '../components/LoadingOverlay.jsx'
import Copyright from '../components/Copyright.jsx'
import {
  getSystemInfo,
  getBackupSchedule, setBackupSchedule, runBackupNow,
  getCameraSettings, saveCameraSettings, clearCameraSettings,
} from '../api/client.js'
import { getCurrentUser } from '../utils/session.js'

export default function Settings() {
  const [info, setInfo] = useState(null)
  const [backup, setBackup] = useState(null)
  const [camera, setCamera] = useState(null)
  const [cameras, setCameras] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState('جاري التحميل...')

  const user = getCurrentUser() || {}
  const isAdmin = user.role === 'ADMIN'

  const loadAll = async () => {
    try {
      const [i, b, c] = await Promise.all([
        getSystemInfo(),
        getBackupSchedule(),
        getCameraSettings(),
      ])
      setInfo(i)
      setBackup(b)
      setCamera(c)
    } catch (e) {
      toast.error('فشل تحميل الإعدادات')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadAll() }, [])

  // اكتشاف الكاميرات
  const discoverCameras = async () => {
    try {
      const initial = await navigator.mediaDevices.getUserMedia({ video: true })
      initial.getTracks().forEach(t => t.stop())

      const all = await navigator.mediaDevices.enumerateDevices()
      const cams = all.filter(d => d.kind === 'videoinput')
      setCameras(cams)

      if (cams.length === 0) {
        toast.error('لا توجد كاميرات متصلة')
      } else {
        toast.success(`تم اكتشاف ${cams.length} كاميرا`)
      }
    } catch (e) {
      toast.error('تعذر الوصول إلى الكاميرات')
    }
  }

  const handleSaveCamera = async (deviceId, label) => {
    setSaving(true)
    setLoadingMsg('جاري حفظ الكاميرا...')
    try {
      await saveCameraSettings(deviceId, label)
      toast.success('تم حفظ الكاميرا الافتراضية')
      const c = await getCameraSettings()
      setCamera(c)
    } catch (e) {
      toast.error('فشل الحفظ')
    } finally {
      setSaving(false)
    }
  }

  const handleClearCamera = async () => {
    setSaving(true)
    setLoadingMsg('جاري المسح...')
    try {
      await clearCameraSettings()
      toast.success('تم مسح الكاميرا الافتراضية')
      const c = await getCameraSettings()
      setCamera(c)
    } catch (e) {
      toast.error('فشل المسح')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleBackup = async (enabled) => {
    setSaving(true)
    setLoadingMsg(enabled ? 'جاري تفعيل النسخ التلقائي...' : 'جاري التعطيل...')
    try {
      const res = await setBackupSchedule({
        enabled,
        time: backup?.time || '02:00',
        keep_count: backup?.keep_count || 30,
      })
      if (res.success) {
        toast.success(res.message || 'تم')
        const b = await getBackupSchedule()
        setBackup(b)
      } else {
        toast.error(res.message || 'فشل')
      }
    } catch (e) {
      toast.error('فشل')
    } finally {
      setSaving(false)
    }
  }

  const handleBackupTimeChange = async (newTime) => {
    if (!backup?.enabled) {
      setBackup({ ...backup, time: newTime })
      return
    }
    setSaving(true)
    setLoadingMsg('جاري تحديث الوقت...')
    try {
      await setBackupSchedule({
        enabled: true,
        time: newTime,
        keep_count: backup.keep_count,
      })
      toast.success('تم التحديث')
      const b = await getBackupSchedule()
      setBackup(b)
    } catch (e) {
      toast.error('فشل التحديث')
    } finally {
      setSaving(false)
    }
  }

  const handleRunBackupNow = async () => {
    setSaving(true)
    setLoadingMsg('جاري إنشاء نسخة احتياطية...')
    try {
      const res = await runBackupNow()
      if (res.success) {
        toast.success(res.message || 'تم إنشاء النسخة')
        const b = await getBackupSchedule()
        setBackup(b)
      } else {
        toast.error('فشل')
      }
    } catch (e) {
      toast.error('فشل إنشاء النسخة')
    } finally {
      setSaving(false)
    }
  }

  const formatDate = (d) => {
    if (!d) return '—'
    try {
      const date = new Date(d)
      const months = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر']
      return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()} — ${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`
    } catch { return d }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="space-y-4">
          {[1,2,3,4].map(i => <div key={i} className="skeleton h-32"></div>)}
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-5xl mx-auto" dir="rtl">
      <LoadingOverlay show={saving} message={loadingMsg} />

      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900">⚙️ الإعدادات</h2>
        <p className="text-sm text-slate-500 mt-2">معلومات النظام والتحكم</p>
      </div>

      {/* 1) حالة النظام */}
      <Section icon="🟢" title="حالة النظام" subtitle="ملخص تشغيلي مباشر" color="emerald">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatusCard label="التطبيق" value="يعمل" icon="✅" color="emerald" pulse />
          <StatusCard
            label="قاعدة البيانات"
            value={info?.database_connected ? 'متصل' : 'غير متصل'}
            icon={info?.database_connected ? '✅' : '❌'}
            color={info?.database_connected ? 'emerald' : 'red'}
            pulse={info?.database_connected}
          />
          <StatusCard label="الزبائن" value={info?.customers_count || 0} icon="👥" color="blue" />
          <StatusCard label="الصور" value={info?.images_count || 0} icon="🖼" color="purple" />
        </div>
      </Section>

      {/* 2) النسخ الاحتياطي التلقائي — للمدير فقط */}
      {isAdmin && backup && (
        <Section icon="💾" title="النسخ الاحتياطي التلقائي" subtitle="حماية بياناتك يومياً" color="violet">
          <div className="space-y-4">
            {/* Toggle */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${backup.enabled ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-200 text-slate-500'}`}>
                  {backup.enabled ? '✅' : '⏸'}
                </div>
                <div>
                  <div className="font-semibold text-slate-800">
                    {backup.enabled ? 'النسخ التلقائي مُفعّل' : 'النسخ التلقائي مُعطّل'}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {backup.enabled
                      ? `يعمل يومياً الساعة ${backup.time}`
                      : 'لن تُنشأ نسخ تلقائية'}
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleToggleBackup(!backup.enabled)}
                className={`relative w-16 h-8 rounded-full transition-all ${backup.enabled ? 'bg-emerald-500' : 'bg-slate-300'}`}
              >
                <span
                  className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-all ${backup.enabled ? 'right-9' : 'right-1'}`}
                />
              </button>
            </div>

            {/* Settings Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  ⏰ وقت النسخ اليومي
                </label>
                <input
                  type="time"
                  value={backup.time}
                  onChange={(e) => handleBackupTimeChange(e.target.value)}
                  disabled={!backup.enabled}
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 disabled:bg-slate-100 disabled:text-slate-400"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  📦 عدد النسخ المحتفظ بها
                </label>
                <input
                  type="number"
                  value={backup.keep_count}
                  onChange={(e) => setBackup({ ...backup, keep_count: parseInt(e.target.value) || 30 })}
                  disabled={!backup.enabled}
                  min="5"
                  max="365"
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 disabled:bg-slate-100 disabled:text-slate-400"
                  dir="ltr"
                />
              </div>
            </div>

            {/* Task Status */}
            <div className={`p-3 rounded-lg border text-xs ${backup.task_exists ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
              {backup.task_exists
                ? '✅ مهمة Windows Task Scheduler مسجّلة — ستعمل حتى لو كان التطبيق مغلقاً'
                : '⚠️ مهمة Task Scheduler غير مسجّلة — تفعيل النسخ التلقائي سيُسجّلها'}
            </div>

            {/* Last Run */}
            {backup.last_run && (
              <div className="text-xs text-slate-500 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                🕐 آخر نسخة: {formatDate(backup.last_run)} — <span className="font-semibold">{backup.last_status || '—'}</span>
              </div>
            )}

            {/* Run Now Button */}
            <button
              onClick={handleRunBackupNow}
              disabled={saving}
              className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-semibold rounded-lg transition-all shadow-medium"
            >
              💾 إنشاء نسخة احتياطية الآن
            </button>
          </div>
        </Section>
      )}

      {/* 3) اختيار الكاميرا — للجميع */}
      <Section icon="📷" title="إعدادات الكاميرا" subtitle="اختر الكاميرا الافتراضية للتصوير" color="pink">
        <div className="space-y-4">
          {/* Current Camera */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${camera?.device_id ? 'bg-blue-50 text-blue-600' : 'bg-slate-200 text-slate-500'}`}>
                📹
              </div>
              <div>
                <div className="font-semibold text-slate-800">
                  {camera?.device_id ? 'كاميرا محفوظة' : 'لم يتم اختيار كاميرا'}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {camera?.device_label || 'سيُطلب منك اختيار كاميرا عند كل تصوير'}
                </div>
              </div>
            </div>
            {camera?.device_id && (
              <button
                onClick={handleClearCamera}
                className="px-3 py-2 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-lg text-xs font-semibold transition-all"
              >
                🗑 مسح
              </button>
            )}
          </div>

          {/* Discover Button */}
          <button
            onClick={discoverCameras}
            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all shadow-medium"
          >
            🔍 اكتشاف الكاميرات المتاحة
          </button>

          {/* List of Cameras */}
          {cameras.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-semibold text-slate-700">
                اختر الكاميرا الافتراضية:
              </div>
              {cameras.map((cam, i) => (
                <button
                  key={cam.deviceId}
                  onClick={() => handleSaveCamera(cam.deviceId, cam.label || `كاميرا ${i + 1}`)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                    camera?.device_id === cam.deviceId
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 hover:border-blue-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📷</span>
                    <div className="text-right">
                      <div className="font-semibold text-slate-800 text-sm">
                        {cam.label || `كاميرا ${i + 1}`}
                      </div>
                      <div className="text-xs text-slate-500 font-mono truncate max-w-xs" dir="ltr">
                        {cam.deviceId.substring(0, 30)}...
                      </div>
                    </div>
                  </div>
                  {camera?.device_id === cam.deviceId && (
                    <span className="text-blue-600 font-bold">✓</span>
                  )}
                </button>
              ))}
            </div>
          )}

          {cameras.length === 0 && (
            <div className="text-center text-xs text-slate-400 p-3 bg-slate-50 rounded-lg">
              اضغط "اكتشاف الكاميرات المتاحة" لرؤية قائمة الأجهزة
            </div>
          )}
        </div>
      </Section>

      {/* 4) حول التطبيق */}
      <Section icon="ℹ️" title="حول التطبيق" subtitle="معلومات عامة" color="slate">
        <div className="text-center py-6">
          <div className="w-24 h-24 mx-auto mb-4 bg-white rounded-2xl border border-slate-200 flex items-center justify-center overflow-hidden">
            <img src="/logo_dark.png" alt="العمده" className="max-w-full max-h-full object-contain p-2" />
          </div>
          <div className="text-xl font-bold text-slate-900">العمده للخياطة الرجالية</div>
          <div className="text-sm text-slate-500 mt-1">للخياطة والملابس الجاهزة</div>
          <div className="text-xs text-slate-400 mt-4">
            الإصدار {info?.app_version || '0.1.0'} — {new Date().getFullYear()}
          </div>
        </div>
      </Section>

      {/* حقوق النشر */}
      <div className="mt-12 pt-6 border-t border-slate-200">
        <Copyright variant="compact" />
      </div>
    </div>
  )
}

function Section({ icon, title, subtitle, color, children }) {
  const colors = {
    emerald: 'from-emerald-500 to-emerald-600',
    blue: 'from-blue-500 to-blue-600',
    violet: 'from-violet-500 to-purple-600',
    pink: 'from-pink-500 to-rose-600',
    slate: 'from-slate-500 to-slate-600',
  }
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-soft mb-6 overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-4">
        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${colors[color]} text-white flex items-center justify-center text-xl shadow-medium`}>
          {icon}
        </div>
        <div>
          <h3 className="font-bold text-slate-900 text-base">{title}</h3>
          <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}

function StatusCard({ label, value, icon, color = 'slate', pulse = false }) {
  const colors = {
    emerald: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    red: 'text-red-700 bg-red-50 border-red-200',
    blue: 'text-blue-700 bg-blue-50 border-blue-200',
    purple: 'text-purple-700 bg-purple-50 border-purple-200',
    slate: 'text-slate-700 bg-slate-50 border-slate-200',
  }
  return (
    <div className={`rounded-xl border p-4 ${colors[color]}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{icon}</span>
        {pulse && <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>}
      </div>
      <div className="text-xl font-bold">{value}</div>
      <div className="text-xs mt-1 opacity-75">{label}</div>
    </div>
  )
}