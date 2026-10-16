import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import LoadingOverlay from '../components/LoadingOverlay.jsx'
import {
  createBackup, listBackups, downloadBackupUrl,
  verifyBackup, restoreBackup, deleteBackup
} from '../api/client.js'

export default function Backup() {
  const [backups, setBackups] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMsg, setLoadingMsg] = useState('جاري التحميل...')
  const [creating, setCreating] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [restoreTarget, setRestoreTarget] = useState(null)

  const loadBackups = async () => {
    try {
      const list = await listBackups()
      setBackups(list)
    } catch (e) {
      toast.error('فشل تحميل النسخ')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadBackups() }, [])

  const handleCreate = async () => {
    setCreating(true)
    setLoadingMsg('جاري إنشاء النسخة الاحتياطية...')
    try {
      const res = await createBackup()
      if (res.success) {
        toast.success('تم إنشاء النسخة بنجاح')
        await loadBackups()
      } else {
        toast.error(res.message || 'فشل')
      }
    } catch (e) {
      toast.error('فشل إنشاء النسخة')
    } finally {
      setCreating(false)
    }
  }

  const handleVerify = async (id) => {
    setLoadingMsg('جاري التحقق من السلامة...')
    setLoading(true)
    try {
      const res = await verifyBackup(id)
      if (res.success) toast.success('النسخة سليمة ✅')
      else toast.error('الملف تالف ❌')
      await loadBackups()
    } catch (e) {
      toast.error('فشل التحقق')
    } finally {
      setLoading(false)
    }
  }

  const handleRestore = async () => {
    if (!restoreTarget) return
    setLoadingMsg('جاري الاستعادة...')
    setLoading(true)
    try {
      const res = await restoreBackup(restoreTarget.backup_id)
      if (res.success) {
        toast.success(res.message || 'تمت الاستعادة بنجاح')
        setRestoreTarget(null)
      } else {
        toast.error(res.message || 'فشل')
      }
    } catch (e) {
      toast.error(e.response?.data?.detail || 'فشل الاستعادة')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setLoadingMsg('جاري الحذف...')
    setLoading(true)
    try {
      await deleteBackup(deleteTarget.backup_id)
      toast.success('تم الحذف')
      setDeleteTarget(null)
      await loadBackups()
    } catch (e) {
      toast.error(e.response?.data?.detail || 'فشل الحذف')
    } finally {
      setLoading(false)
    }
  }

  // تنسيق الحجم بشكل بشري
  const formatSize = (bytes) => {
    if (!bytes) return '—'
    const b = Number(bytes)
    if (b < 1024) return b + ' بايت'
    if (b < 1024 * 1024) return (b / 1024).toFixed(0) + ' كيلوبايت'
    if (b < 1024 * 1024 * 1024) return (b / 1024 / 1024).toFixed(1) + ' ميجابايت'
    return (b / 1024 / 1024 / 1024).toFixed(2) + ' جيجابايت'
  }

  // تنسيق التاريخ بالعربية
  const formatDate = (d) => {
    if (!d) return '—'
    try {
      const date = new Date(d)
      const months = [
        'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
        'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
      ]
      const day = date.getDate()
      const month = months[date.getMonth()]
      const year = date.getFullYear()
      const hours = date.getHours()
      const minutes = String(date.getMinutes()).padStart(2, '0')
      const period = hours >= 12 ? 'مساءً' : 'صباحاً'
      const h12 = hours % 12 || 12
      return `${day} ${month} ${year} — ${h12}:${minutes} ${period}`
    } catch {
      return d
    }
  }

  const typeLabel = (type) => {
    if (type === 'MANUAL') return 'يدوية'
    if (type === 'DAILY') return 'تلقائية يومية'
    if (type === 'AUTO') return 'تلقائية'
    return type
  }

  const statusInfo = (b) => {
    if (b.status === 'SUCCESS') {
      return { text: 'جاهزة للاستخدام', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: '✓' }
    }
    if (b.status === 'RUNNING') {
      return { text: 'جاري الإنشاء', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: '⟳' }
    }
    return { text: 'فشلت', color: 'bg-red-50 text-red-700 border-red-200', icon: '✕' }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto" dir="rtl">
      <LoadingOverlay show={loading && backups.length > 0} message={loadingMsg} />

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">النسخ الاحتياطي</h2>
        <p className="text-sm text-slate-500 mt-1">حماية بياناتك وصورك من الفقدان</p>
      </div>

      {/* Create Card */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-8 mb-6 text-white shadow-large">
        <h3 className="text-xl font-bold mb-2">💾 إنشاء نسخة احتياطية الآن</h3>
        <p className="text-blue-100 text-sm mb-6">
          نسخة كاملة من بياناتك وصورك يمكنك استعادتها في أي وقت
        </p>
        <button
          onClick={handleCreate}
          disabled={creating}
          className="px-6 py-3 bg-white text-blue-700 hover:bg-blue-50 disabled:opacity-50 font-bold rounded-lg transition-all shadow-medium"
        >
          {creating ? '⟳ جاري الإنشاء...' : '💾 إنشاء نسخة احتياطية'}
        </button>
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-soft overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-bold text-slate-900">النسخ السابقة</h3>
          <span className="text-xs text-slate-500">{backups.length} نسخة</span>
        </div>

        {loading && backups.length === 0 ? (
          <div className="p-6 space-y-3">
            {[1,2,3].map(i => <div key={i} className="skeleton h-24"></div>)}
          </div>
        ) : backups.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <div className="text-5xl mb-3">💾</div>
            <div className="font-medium">لا توجد نسخ احتياطية بعد</div>
            <div className="text-sm mt-1">اضغط الزر أعلاه لإنشاء أول نسخة</div>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {backups.map((b) => {
              const st = statusInfo(b)
              const isSuccess = b.status === 'SUCCESS'
              return (
                <div key={b.backup_id} className="p-5 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    {/* Icon + Info */}
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-2xl flex-shrink-0">
                        💾
                      </div>
                      <div className="flex-1 min-w-0">
                        {/* Title + Status */}
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <h4 className="font-bold text-slate-900 text-base">
                            نسخة احتياطية {typeLabel(b.backup_type)}
                          </h4>
                          <span className={'text-xs px-2.5 py-1 rounded-full border font-semibold ' + st.color}>
                            {st.icon} {st.text}
                          </span>
                        </div>

                        {/* Date */}
                        <div className="text-sm text-slate-600 mb-2">
                          📅 {formatDate(b.started_at)}
                        </div>

                        {/* Size */}
                        <div className="text-sm text-slate-600 mb-2">
                          📦 الحجم: <span className="font-semibold text-slate-800">{formatSize(b.file_size)}</span>
                        </div>

                        {/* Stats */}
                        {isSuccess && b.stats && (
                          <div className="flex flex-wrap gap-3 text-xs text-slate-500 mt-2">
                            <span className="inline-flex items-center gap-1">
                              👥 <span className="font-semibold text-slate-700">{b.stats.customers}</span> زبون
                            </span>
                            <span className="inline-flex items-center gap-1">
                              🖼 <span className="font-semibold text-slate-700">{b.stats.images}</span> صورة
                            </span>
                            <span className="inline-flex items-center gap-1">
                              🔐 <span className="font-semibold text-slate-700">{b.stats.users}</span> مستخدم
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  {isSuccess && (
                    <div className="flex flex-wrap gap-2 mt-4 mr-18" style={{ marginRight: '72px' }}>
                      <a
                        href={downloadBackupUrl(b.backup_id)}
                        download
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg text-sm font-semibold transition-all"
                      >
                        ⬇ تحميل
                      </a>
                      <button
                        onClick={() => handleVerify(b.backup_id)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-lg text-sm font-semibold transition-all"
                      >
                        ✓ فحص السلامة
                      </button>
                      <button
                        onClick={() => setRestoreTarget(b)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white rounded-lg text-sm font-semibold transition-all"
                      >
                        🔄 استعادة
                      </button>
                      <button
                        onClick={() => setDeleteTarget(b)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-lg text-sm font-semibold transition-all"
                      >
                        🗑 حذف
                      </button>
                    </div>
                  )}

                  {!isSuccess && b.status === 'FAILED' && (
                    <div className="mt-3 text-xs text-red-500 mr-18" style={{ marginRight: '72px' }}>
                      ⚠️ فشل الإنشاء — يمكنك حذف هذه النسخة
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Restore Confirmation */}
      {restoreTarget && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-large">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-amber-50 rounded-full mx-auto flex items-center justify-center text-3xl mb-4">🔄</div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">تأكيد الاستعادة</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                سيتم استعادة البيانات والصور من نسخة:
                <br />
                <span className="font-semibold text-slate-900 block mt-2">
                  {formatDate(restoreTarget.started_at)}
                </span>
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-4 text-xs text-amber-800">
                ⚠️ هذا سيستبدل الملفات الحالية. تأكد قبل المتابعة.
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setRestoreTarget(null)}
                className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium"
              >
                إلغاء
              </button>
              <button
                onClick={handleRestore}
                className="flex-1 px-4 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold"
              >
                نعم، استعد
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-large">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-50 rounded-full mx-auto flex items-center justify-center text-3xl mb-4">⚠️</div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">تأكيد الحذف</h3>
              <p className="text-sm text-slate-600">
                حذف النسخة نهائياً؟ <br />
                <span className="text-xs text-red-500">لا يمكن التراجع</span>
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium"
              >
                إلغاء
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold"
              >
                حذف نهائي
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="mt-12 pt-6 border-t border-slate-200">
        
      </div>
    </div>
  )
}