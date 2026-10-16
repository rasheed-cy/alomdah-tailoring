import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import LoadingOverlay from '../components/LoadingOverlay.jsx'
import CameraCapture from '../components/CameraCapture.jsx'
import { createCustomer, updateCustomer, getCustomer, uploadCustomerImage, getPrimaryImageUrl } from '../api/client.js'
export default function CustomerForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()

  const [form, setForm] = useState({
    measurement_page_no: '',
    full_name: '',
    phone_number: '',
    storage_number: '',
    delivery_date: '',
  })
  const [imageBlob, setImageBlob] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [showCamera, setShowCamera] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState('')
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (isEdit) {
      getCustomer(id).then(c => {
        setForm({
          measurement_page_no: c.measurement_page_no,
          full_name: c.full_name,
          phone_number: c.phone_number,
          storage_number: c.storage_number,
          delivery_date: c.delivery_date || '',
        })
        setImagePreview(getPrimaryImageUrl(id))
      }).catch(() => toast.error('فشل تحميل بيانات الزبون'))
    }
  }, [id, isEdit])

  const handleChange = (field, value) => {
    setForm({ ...form, [field]: value })
    if (errors[field]) setErrors({ ...errors, [field]: null })
  }

  const handleCapture = (blob, url) => {
    setImageBlob(blob)
    setImagePreview(url)
    setShowCamera(false)
    toast.success('تم التقاط الصورة')
  }

  const validate = () => {
    const e = {}
    if (!form.measurement_page_no.trim()) e.measurement_page_no = 'مطلوب'
    if (!form.full_name.trim()) e.full_name = 'مطلوب'
    if (!form.phone_number.trim()) e.phone_number = 'مطلوب'
    if (!form.storage_number.trim()) e.storage_number = 'مطلوب'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) {
      toast.error('أكمل جميع الحقول')
      return
    }

    setLoading(true)
    setLoadingMsg(isEdit ? 'جاري تحديث البيانات...' : 'جاري حفظ البيانات...')

    // نظف البيانات
    const payload = {
      ...form,
      delivery_date: form.delivery_date || null,
    }

    try {
      let customerId
      if (isEdit) {
        await updateCustomer(id, payload)
        customerId = parseInt(id)
      } else {
        const created = await createCustomer(payload)
        customerId = created.customer_id
      }

      if (imageBlob) {
        setLoadingMsg('جاري حفظ الصورة...')
        const file = new File([imageBlob], 'capture_' + Date.now() + '.jpg', { type: 'image/jpeg' })
        try {
          await uploadCustomerImage(customerId, file)
        } catch (imgErr) {
          toast.error('تم حفظ البيانات، لكن فشل رفع الصورة')
        }
      }

      toast.success(isEdit ? 'تم التحديث بنجاح' : 'تم الحفظ بنجاح')
      setTimeout(() => navigate('/customers'), 500)
    } catch (err) {
      console.error(err)
      toast.error('فشل الحفظ')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto" dir="rtl">
      <LoadingOverlay show={loading} message={loadingMsg} />

      {showCamera && (
        <CameraCapture
          onCapture={handleCapture}
          onCancel={() => setShowCamera(false)}
        />
      )}

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">
          {isEdit ? 'تعديل بيانات الزبون' : 'إضافة زبون جديد'}
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          {isEdit ? 'قم بتحديث بيانات الزبون' : 'أدخل بيانات الزبون الجديد'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-soft p-6">
          <h3 className="font-bold text-slate-900 mb-5 flex items-center gap-2">
            <span>👤</span> بيانات الزبون
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field
              label="رقم صفحة المقاسات"
              required
              value={form.measurement_page_no}
              onChange={(v) => handleChange('measurement_page_no', v)}
              error={errors.measurement_page_no}
              placeholder="0100"
            />
            <Field
              label="رقم المخزن"
              required
              value={form.storage_number}
              onChange={(v) => handleChange('storage_number', v)}
              error={errors.storage_number}
              placeholder="00042"
            />
            <Field
              label="اسم الزبون الرباعي"
              required
              value={form.full_name}
              onChange={(v) => handleChange('full_name', v)}
              error={errors.full_name}
              placeholder="محمد أحمد علي صالح"
              className="md:col-span-2"
            />
            <Field
              label="رقم الهاتف"
              required
              value={form.phone_number}
              onChange={(v) => handleChange('phone_number', v)}
              error={errors.phone_number}
              placeholder="0774361601"
              dir="ltr"
            />
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                📅 تاريخ التسليم
              </label>
              <input
                type="date"
                value={form.delivery_date}
                onChange={(e) => handleChange('delivery_date', e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
              />
              <p className="text-xs text-slate-400 mt-1">اختياري — موعد تسليم الطلبية</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-soft p-6">
          <h3 className="font-bold text-slate-900 mb-5 flex items-center gap-2">
            <span>📷</span> صورة المقاسات
          </h3>

          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <div className="border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 min-h-[280px] flex items-center justify-center p-4">
                {imagePreview ? (
                  <img src={imagePreview} alt="معاينة" className="max-h-64 rounded-lg shadow-medium" />
                ) : (
                  <div className="text-center text-slate-400">
                    <div className="text-6xl mb-3">📷</div>
                    <p className="text-sm">لا توجد صورة</p>
                    <p className="text-xs mt-1">اضغط "فتح الكاميرا"</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3 md:w-48">
              <button
                type="button"
                onClick={() => setShowCamera(true)}
                className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all shadow-soft flex items-center justify-center gap-2"
              >
                <span>📷</span>
                <span>فتح الكاميرا</span>
              </button>
              {imagePreview && (
                <button
                  type="button"
                  onClick={() => { setImageBlob(null); setImagePreview(null) }}
                  className="px-4 py-3 border border-slate-300 text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                >
                  🗑 مسح الصورة
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/customers')}
            className="px-6 py-3 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg transition-all font-medium"
          >
            إلغاء
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-semibold rounded-lg transition-all shadow-medium"
          >
            {loading ? 'جاري الحفظ...' : (isEdit ? 'تحديث' : 'حفظ')}
          </button>
        </div>
      </form>
    </div>
  )
}

function Field({ label, value, onChange, error, required, placeholder, dir, className = '' }) {
  return (
    <div className={className}>
      <label className="block text-sm font-semibold text-slate-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        dir={dir}
        className={'w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all ' + (error ? 'border-red-400 focus:ring-red-500/30 focus:border-red-500' : 'border-slate-200 focus:ring-blue-500/30 focus:border-blue-500')}
      />
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      <div className="mt-12 pt-6 border-t border-slate-200">
        
      </div>
    </div>
  )
}