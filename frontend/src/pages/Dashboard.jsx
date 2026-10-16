import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { countCustomers, listCustomers, listBackups } from '../api/client.js'
export default function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    total: 0,
    today: 0,
    lastBackup: null,
    backupsCount: 0,
    dbConnected: false,
  })
  const [recent, setRecent] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [cnt, list, backups] = await Promise.all([
          countCustomers(),
          listCustomers(0, 10),
          listBackups(),
        ])

        const today = new Date().toISOString().split('T')[0]
        const todayCount = list.filter(c => c.created_at?.startsWith(today)).length

        const successBackups = backups.filter(b => b.status === 'SUCCESS')
        const lastBackup = successBackups.length > 0 ? successBackups[0] : null

        setStats({
          total: cnt.count,
          today: todayCount,
          lastBackup: lastBackup ? lastBackup.started_at : null,
          backupsCount: successBackups.length,
          dbConnected: true,
        })
        setRecent(list.slice(0, 10))
      } catch (e) {
        console.error(e)
        setStats(prev => ({ ...prev, dbConnected: false }))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const formatDate = (d) => {
    if (!d) return '—'
    try {
      const date = new Date(d)
      const months = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر']
      return `${date.getDate()} ${months[date.getMonth()]}`
    } catch { return d }
  }

  const timeAgo = (d) => {
    if (!d) return ''
    try {
      const diff = Date.now() - new Date(d).getTime()
      const minutes = Math.floor(diff / 60000)
      const hours = Math.floor(diff / 3600000)
      const days = Math.floor(diff / 86400000)

      if (minutes < 1) return 'الآن'
      if (minutes < 60) return `قبل ${minutes} دقيقة`
      if (hours < 24) return `قبل ${hours} ساعة`
      return `قبل ${days} يوم`
    } catch { return '' }
  }

  return (
    <div className="p-8" dir="rtl">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900">لوحة المعلومات</h2>
        <p className="text-sm text-slate-500 mt-1">نظرة عامة على أداء المحل</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatCard
          icon="👥"
          value={stats.total}
          label="إجمالي الزبائن"
          color="blue"
        />
        <StatCard
          icon="📅"
          value={stats.today}
          label="إضافات اليوم"
          color="green"
        />
        <StatCard
          icon="💾"
          value={stats.dbConnected ? "متصل" : "غير متصل"}
          label="حالة قاعدة البيانات"
          color={stats.dbConnected ? "emerald" : "red"}
        />
        <StatCard
          icon="🔒"
          value={stats.lastBackup ? formatDate(stats.lastBackup) : "—"}
          label={
            stats.lastBackup
              ? `آخر نسخة (${timeAgo(stats.lastBackup)})`
              : "آخر نسخة احتياطية"
          }
          color="amber"
          subValue={stats.backupsCount > 0 ? `${stats.backupsCount} نسخة` : null}
        />
      </div>

      {/* الجدول الجديد */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-soft overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-lg">آخر السجلات المضافة</h3>
          <button
            onClick={() => navigate('/customers')}
            className="text-sm text-blue-600 hover:text-blue-700 font-semibold"
          >
            عرض الكل ←
          </button>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {[1,2,3,4,5].map(i => <div key={i} className="skeleton h-12"></div>)}
          </div>
        ) : recent.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <div className="text-4xl mb-2">📋</div>
            <div>لا توجد سجلات بعد</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3 text-right text-xs font-bold text-slate-600 uppercase tracking-wider">ID</th>
                  <th className="px-5 py-3 text-right text-xs font-bold text-slate-600 uppercase tracking-wider">صفحة المقاسات</th>
                  <th className="px-5 py-3 text-right text-xs font-bold text-slate-600 uppercase tracking-wider">الاسم الرباعي</th>
                  <th className="px-5 py-3 text-right text-xs font-bold text-slate-600 uppercase tracking-wider">رقم الهاتف</th>
                  <th className="px-5 py-3 text-right text-xs font-bold text-slate-600 uppercase tracking-wider">رقم المخزن</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recent.map((c) => (
                  <tr
                    key={c.customer_id}
                    className="hover:bg-blue-50/40 transition-colors cursor-pointer"
                    onClick={() => navigate('/customers/' + c.customer_id + '/edit')}
                  >
                    <td className="px-5 py-4 text-slate-700 font-mono text-sm font-semibold">
                      #{c.customer_id}
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-semibold">
                        {c.measurement_page_no}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                          {c.full_name?.charAt(0) || '؟'}
                        </div>
                        <span className="text-slate-900 font-medium">{c.full_name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-600 font-mono text-sm" dir="ltr">
                      {c.phone_number}
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 bg-amber-50 text-amber-700 rounded-lg text-sm font-semibold">
                        {c.storage_number}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ icon, value, label, color = 'blue', subValue }) {
  const colors = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-emerald-500 to-emerald-600',
    emerald: 'from-teal-500 to-teal-600',
    red: 'from-red-500 to-red-600',
    amber: 'from-amber-500 to-orange-600',
  }
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-soft p-6 hover:shadow-medium transition-all">
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colors[color]} flex items-center justify-center text-2xl mb-4 shadow-medium`}>
        {icon}
      </div>
      <div className="text-3xl font-bold text-slate-900 mb-1">
        {value}
      </div>
      {subValue && (
        <div className="text-xs text-emerald-600 font-semibold mb-1">✓ {subValue}</div>
      )}
      <div className="text-sm text-slate-500">{label}</div>
      <div className="mt-12 pt-6 border-t border-slate-200">
        
      </div>
    </div>
  )
}