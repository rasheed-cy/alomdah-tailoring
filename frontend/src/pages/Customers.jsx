import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  listCustomers, listArchived, searchCustomers,
  countCustomers, countArchived,
  getImageUrl, listCustomerImages,
  archiveCustomer, restoreCustomer, deleteCustomerPermanent
} from '../api/client.js'
import LoadingOverlay from '../components/LoadingOverlay.jsx'
export default function Customers() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('active')  // 'active' | 'archived'
  const [customers, setCustomers] = useState([])
  const [count, setCount] = useState(0)
  const [archivedCount, setArchivedCount] = useState(0)
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadingMsg, setLoadingMsg] = useState('جاري التحميل...')
  const [imageModal, setImageModal] = useState(null)
  const [actionTarget, setActionTarget] = useState(null)
  const [actionType, setActionType] = useState(null)  // 'archive' | 'restore' | 'delete'

  const loadData = async (showLoader = false) => {
    if (showLoader) { setLoading(true); setLoadingMsg('جاري البحث...') }
    try {
      const [list, cnt, archCnt] = await Promise.all([
        tab === 'archived'
          ? listArchived()
          : (query.trim() ? searchCustomers(query) : listCustomers()),
        countCustomers(),
        countArchived(),
      ])
      setCustomers(list)
      setCount(cnt.count)
      setArchivedCount(archCnt.count)
    } catch (e) {
      toast.error('فشل تحميل البيانات')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData(false) }, [tab])

  useEffect(() => {
    if (tab !== 'active') return
    const t = setTimeout(() => { loadData(true) }, 300)
    return () => clearTimeout(t)
  }, [query])

  const openImageModal = async (customer) => {
    setLoadingMsg('جاري تحميل الصورة...')
    setLoading(true)
    try {
      const images = await listCustomerImages(customer.customer_id)
      setImageModal({
        customer,
        url: images.length > 0 ? getImageUrl(images[0].image_id) : null,
      })
    } catch (e) {
      setImageModal({ customer, url: null })
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async () => {
    if (!actionTarget || !actionType) return
    setLoading(true)

    try {
      if (actionType === 'archive') {
        setLoadingMsg('جاري الأرشفة...')
        await archiveCustomer(actionTarget.customer_id, 'أرشفة يدوية')
        toast.success('تم الأرشفة')
      } else if (actionType === 'restore') {
        setLoadingMsg('جاري الاستعادة...')
        await restoreCustomer(actionTarget.customer_id)
        toast.success('تم الاستعادة')
      } else if (actionType === 'delete') {
        setLoadingMsg('جاري الحذف النهائي...')
        await deleteCustomerPermanent(actionTarget.customer_id)
        toast.success('تم الحذف النهائي')
      }
      setActionTarget(null)
      setActionType(null)
      await loadData(false)
    } catch (e) {
      toast.error(e.response?.data?.detail || 'فشلت العملية')
    } finally {
      setLoading(false)
    }
  }

  // حساب فرق الأيام
  const getDaysUntil = (dateStr) => {
    if (!dateStr) return null
    try {
      const target = new Date(dateStr)
      target.setHours(0, 0, 0, 0)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return Math.round((target - today) / (1000 * 60 * 60 * 24))
    } catch {
      return null
    }
  }

  // تصنيف تاريخ التسليم
  const getDeliveryStyle = (dateStr) => {
    const days = getDaysUntil(dateStr)
    if (days === null) {
      return {
        bg: 'bg-slate-50',
        border: 'border-slate-200',
        text: 'text-slate-500',
        label: 'بدون تاريخ',
        icon: '—',
        dot: 'bg-slate-300',
      }
    }
    if (days < 0) {
      return {
        bg: 'bg-red-50',
        border: 'border-red-300',
        text: 'text-red-700',
        label: `متأخر بـ ${Math.abs(days)} يوم`,
        icon: '⚠️',
        dot: 'bg-red-500',
      }
    }
    if (days === 0) {
      return {
        bg: 'bg-red-50',
        border: 'border-red-300',
        text: 'text-red-700',
        label: 'اليوم',
        icon: '🔔',
        dot: 'bg-red-500',
      }
    }
    if (days <= 3) {
      return {
        bg: 'bg-amber-50',
        border: 'border-amber-300',
        text: 'text-amber-700',
        label: `خلال ${days} يوم`,
        icon: '⏰',
        dot: 'bg-amber-500',
      }
    }
    return {
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      text: 'text-emerald-700',
      label: `خلال ${days} يوم`,
      icon: '📅',
      dot: 'bg-emerald-500',
    }
  }

  const formatDate = (d) => {
    if (!d) return '—'
    try {
      const date = new Date(d)
      const months = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر']
      return `${date.getDate()} ${months[date.getMonth()]}`
    } catch { return d }
  }

  return (
    <div className="p-8" dir="rtl">
      <LoadingOverlay show={loading && customers.length > 0} message={loadingMsg} />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">الزبائن</h2>
          <p className="text-sm text-slate-500 mt-1">
            {tab === 'active' ? `إجمالي: ${count}` : `في الأرشيف: ${archivedCount}`}
          </p>
        </div>
        {tab === 'active' && (
          <button
            onClick={() => navigate('/customers/new')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-medium flex items-center gap-2"
          >
            <span>➕</span>
            <span>إضافة زبون</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-slate-200">
        <TabButton
          active={tab === 'active'}
          onClick={() => setTab('active')}
          icon="👥"
          label="النشطون"
          count={count}
        />
        <TabButton
          active={tab === 'archived'}
          onClick={() => setTab('archived')}
          icon="📦"
          label="الأرشيف"
          count={archivedCount}
        />
      </div>

      {/* Search (active only) */}
      {tab === 'active' && (
        <div className="mb-6">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="🔍 ابحث بالاسم، الهاتف، رقم الصفحة، أو المخزن..."
            className="w-full max-w-2xl px-5 py-3.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 bg-white shadow-soft"
          />
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-soft overflow-hidden">
        {loading && customers.length === 0 ? (
          <div className="p-6 space-y-3">
            {[1,2,3,4,5].map(i => <div key={i} className="skeleton h-16"></div>)}
          </div>
        ) : customers.length === 0 ? (
          <div className="p-16 text-center text-slate-400">
            <div className="text-6xl mb-4">{tab === 'archived' ? '📦' : '📋'}</div>
            <div className="text-lg font-medium">
              {tab === 'archived' ? 'الأرشيف فارغ' : 'لا توجد سجلات'}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-l from-slate-50 to-slate-100 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-4 text-right text-xs font-bold text-slate-600 uppercase tracking-wider">ID</th>
                  <th className="px-4 py-4 text-right text-xs font-bold text-slate-600 uppercase tracking-wider">صفحة المقاسات</th>
                  <th className="px-4 py-4 text-right text-xs font-bold text-slate-600 uppercase tracking-wider">الاسم الرباعي</th>
                  <th className="px-4 py-4 text-right text-xs font-bold text-slate-600 uppercase tracking-wider">رقم الهاتف</th>
                  <th className="px-4 py-4 text-right text-xs font-bold text-slate-600 uppercase tracking-wider">رقم المخزن</th>
                  <th className="px-4 py-4 text-right text-xs font-bold text-slate-600 uppercase tracking-wider">
                    {tab === 'archived' ? 'تاريخ الأرشفة' : 'تاريخ التسليم'}
                  </th>
                  <th className="px-4 py-4 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.map((c) => {
                  const deliveryStyle = getDeliveryStyle(c.delivery_date)
                  const isArchived = tab === 'archived'
                  return (
                    <tr key={c.customer_id} className="hover:bg-blue-50/40 transition-colors">
                      <td className="px-4 py-4 text-slate-700 font-mono text-sm font-semibold">
                        #{c.customer_id}
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-semibold">
                          {c.measurement_page_no}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                            {c.full_name?.charAt(0) || '؟'}
                          </div>
                          <span className="text-slate-900 font-medium">{c.full_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-slate-600 font-mono text-sm" dir="ltr">
                        {c.phone_number}
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 bg-amber-50 text-amber-700 rounded-lg text-sm font-semibold">
                          {c.storage_number}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        {isArchived ? (
                          <span className="text-sm text-slate-500">
                            {formatDate(c.archived_at)}
                          </span>
                        ) : (
                          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${deliveryStyle.bg} ${deliveryStyle.border}`}>
                            <span className={`w-2 h-2 rounded-full ${deliveryStyle.dot}`}></span>
                            <span className={`text-sm font-semibold ${deliveryStyle.text}`}>
                              {c.delivery_date ? formatDate(c.delivery_date) : '—'}
                            </span>
                            <span className={`text-xs ${deliveryStyle.text} opacity-75`}>
                              ({deliveryStyle.label})
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center gap-2">
                          {/* عرض الصورة */}
                          <button
                            onClick={() => openImageModal(c)}
                            className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center"
                            title="عرض صورة المقاسات"
                          >
                            🖼
                          </button>

                          {/* تعديل */}
                          {!isArchived && (
                            <button
                              onClick={() => navigate('/customers/' + c.customer_id + '/edit')}
                              className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white transition-all flex items-center justify-center"
                              title="تعديل"
                            >
                              ✏️
                            </button>
                          )}

                          {/* أرشفة / استعادة / حذف */}
                          {isArchived ? (
                            <>
                              <button
                                onClick={() => { setActionTarget(c); setActionType('restore') }}
                                className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all flex items-center justify-center"
                                title="استعادة"
                              >
                                ♻️
                              </button>
                              <button
                                onClick={() => { setActionTarget(c); setActionType('delete') }}
                                className="w-9 h-9 rounded-lg bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all flex items-center justify-center"
                                title="حذف نهائي"
                              >
                                🗑
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => { setActionTarget(c); setActionType('archive') }}
                              className="w-9 h-9 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-700 hover:text-white transition-all flex items-center justify-center"
                              title="أرشفة"
                            >
                              📦
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Image Modal */}
      {imageModal && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
          onClick={() => setImageModal(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-large animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-gradient-to-l from-slate-50 to-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center font-bold">
                  {imageModal.customer.full_name?.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{imageModal.customer.full_name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    صفحة: {imageModal.customer.measurement_page_no} • مخزن: {imageModal.customer.storage_number}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setImageModal(null)}
                className="w-9 h-9 rounded-lg bg-slate-100 hover:bg-red-100 hover:text-red-600 text-slate-500 flex items-center justify-center transition-all"
              >
                ✕
              </button>
            </div>
            <div className="p-6 bg-slate-50 flex items-center justify-center min-h-[400px]">
              {imageModal.url ? (
                <img
                  src={imageModal.url}
                  alt="صورة المقاسات"
                  className="max-h-[60vh] rounded-xl shadow-medium"
                />
              ) : (
                <div className="text-center text-slate-400">
                  <div className="text-6xl mb-4">📷</div>
                  <div className="text-lg font-medium">لا توجد صورة مقاسات</div>
                  <div className="text-sm mt-1">يمكنك إضافتها من صفحة التعديل</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Action Confirmation */}
      {actionTarget && actionType && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-large">
            <div className="text-center mb-6">
              <div className={'w-16 h-16 rounded-full mx-auto flex items-center justify-center text-3xl mb-4 ' + (
                actionType === 'archive' ? 'bg-slate-100' :
                actionType === 'restore' ? 'bg-emerald-50' : 'bg-red-50'
              )}>
                {actionType === 'archive' ? '📦' : actionType === 'restore' ? '♻️' : '⚠️'}
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                {actionType === 'archive' ? 'تأكيد الأرشفة' :
                 actionType === 'restore' ? 'تأكيد الاستعادة' : 'تأكيد الحذف النهائي'}
              </h3>
              <p className="text-sm text-slate-600">
                <span className="font-semibold">{actionTarget.full_name}</span>
              </p>
              {actionType === 'archive' && (
                <p className="text-xs text-slate-500 mt-3">
                  يمكنك استعادته من الأرشيف لاحقاً
                </p>
              )}
              {actionType === 'delete' && (
                <p className="text-xs text-red-500 mt-3 font-semibold">
                  ⚠️ لا يمكن التراجع عن هذه العملية
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setActionTarget(null); setActionType(null) }}
                className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium"
              >
                إلغاء
              </button>
              <button
                onClick={handleAction}
                className={'flex-1 px-4 py-3 text-white rounded-lg font-semibold ' + (
                  actionType === 'archive' ? 'bg-slate-700 hover:bg-slate-800' :
                  actionType === 'restore' ? 'bg-emerald-600 hover:bg-emerald-700' :
                  'bg-red-600 hover:bg-red-700'
                )}
              >
                {actionType === 'archive' ? 'أرشفة' :
                 actionType === 'restore' ? 'استعادة' : 'حذف نهائي'}
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

function TabButton({ active, onClick, icon, label, count }) {
  return (
    <button
      onClick={onClick}
      className={
        'px-5 py-3 font-semibold text-sm transition-all border-b-2 flex items-center gap-2 -mb-px ' +
        (active
          ? 'border-blue-600 text-blue-600'
          : 'border-transparent text-slate-500 hover:text-slate-700')
      }
    >
      <span className="text-lg">{icon}</span>
      <span>{label}</span>
      <span className={
        'px-2 py-0.5 rounded-full text-xs font-bold ' +
        (active ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600')
      }>
        {count}
      </span>
    </button>
  )
}