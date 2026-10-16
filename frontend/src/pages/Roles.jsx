import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import LoadingOverlay from '../components/LoadingOverlay.jsx'
import { listRoles, createRole, updateRole, deleteRole } from '../api/client.js'
const PERMISSION_LABELS = {
  customers_view: 'عرض الزبائن',
  customers_add: 'إضافة زبون',
  customers_edit: 'تعديل زبون',
  customers_delete: 'حذف زبون',
  images_manage: 'إدارة الصور',
  backup_view: 'عرض النسخ الاحتياطية',
  backup_create: 'إنشاء نسخة احتياطية',
  backup_restore: 'استعادة نسخة',
  settings_view: 'عرض الإعدادات',
  settings_edit: 'تعديل الإعدادات',
  users_manage: 'إدارة المستخدمين',
  roles_manage: 'إدارة الأدوار',
}

export default function Roles() {
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMsg, setLoadingMsg] = useState('جاري التحميل...')
  const [editing, setEditing] = useState(null)
  const [creating, setCreating] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const loadData = async () => {
    try {
      const data = await listRoles()
      setRoles(data)
    } catch (e) {
      toast.error('فشل تحميل الأدوار')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const handleSave = async (data, id) => {
    setLoadingMsg(id ? 'جاري التحديث...' : 'جاري الإنشاء...')
    setLoading(true)
    try {
      if (id) {
        await updateRole(id, data)
        toast.success('تم التحديث')
      } else {
        await createRole(data)
        toast.success('تم الإنشاء')
      }
      setEditing(null)
      setCreating(false)
      await loadData()
    } catch (e) {
      toast.error(e.response?.data?.detail || 'فشل الحفظ')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setLoadingMsg('جاري الحذف...')
    setLoading(true)
    try {
      await deleteRole(deleteTarget.role_id)
      toast.success('تم الحذف')
      setDeleteTarget(null)
      await loadData()
    } catch (e) {
      toast.error(e.response?.data?.detail || 'فشل الحذف')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-5xl mx-auto" dir="rtl">
      <LoadingOverlay show={loading && roles.length > 0} message={loadingMsg} />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">🔐 الأدوار والصلاحيات</h2>
          <p className="text-sm text-slate-500 mt-1">إدارة أدوار المستخدمين وصلاحياتهم</p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all shadow-medium"
        >
          ➕ دور جديد
        </button>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {roles.map((role) => (
          <div
            key={role.role_id}
            className="bg-white rounded-2xl border border-slate-200 shadow-soft p-5 hover:shadow-medium transition-all"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center text-xl font-bold">
                  {role.role_name_ar.charAt(0)}
                </div>
                <div>
                  <div className="font-bold text-slate-900">{role.role_name_ar}</div>
                  <div className="text-xs font-mono text-slate-500">{role.role_code}</div>
                </div>
              </div>
              {role.is_system === 1 ? (
                <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-semibold">
                  🛡️ نظامي
                </span>
              ) : (
                <span className="text-xs bg-slate-50 text-slate-600 border border-slate-200 px-2 py-0.5 rounded-full font-semibold">
                  مخصص
                </span>
              )}
            </div>

            {/* Description */}
            {role.description && (
              <p className="text-xs text-slate-500 mb-3 line-clamp-2">{role.description}</p>
            )}

            {/* Users Count */}
            <div className="flex items-center gap-2 mb-4 text-sm">
              <span className="text-slate-500">👥</span>
              <span className="font-semibold text-slate-700">{role.users_count}</span>
              <span className="text-slate-500">مستخدم</span>
            </div>

            {/* Permissions Summary */}
            <div className="mb-4">
              <div className="text-xs text-slate-400 mb-2">الصلاحيات:</div>
              <div className="flex flex-wrap gap-1">
                {Object.entries(role.permissions || {})
                  .filter(([k, v]) => v)
                  .slice(0, 4)
                  .map(([k]) => (
                    <span
                      key={k}
                      className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-medium"
                    >
                      ✓ {PERMISSION_LABELS[k] || k}
                    </span>
                  ))}
                {Object.values(role.permissions || {}).filter(v => v).length > 4 && (
                  <span className="text-xs text-slate-500 px-2 py-0.5">
                    +{Object.values(role.permissions).filter(v => v).length - 4} أخرى
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setEditing(role)}
                className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg text-xs font-semibold transition-all"
              >
                ✏️ تعديل
              </button>
              {role.is_system !== 1 && (
                <button
                  onClick={() => setDeleteTarget(role)}
                  className="px-3 py-2 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-lg text-xs font-semibold transition-all"
                >
                  🗑
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Edit/Create Modal */}
      {(editing || creating) && (
        <RoleModal
          role={editing}
          onSave={handleSave}
          onCancel={() => { setEditing(null); setCreating(false) }}
        />
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-large">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-50 rounded-full mx-auto flex items-center justify-center text-3xl mb-4">⚠️</div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">تأكيد الحذف</h3>
              <p className="text-sm text-slate-600">
                حذف دور "<span className="font-semibold">{deleteTarget.role_name_ar}</span>"؟
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
                حذف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function RoleModal({ role, onSave, onCancel }) {
  const isEdit = Boolean(role)
  const [code, setCode] = useState(role?.role_code || '')
  const [nameAr, setNameAr] = useState(role?.role_name_ar || '')
  const [desc, setDesc] = useState(role?.description || '')
  const [permissions, setPermissions] = useState(role?.permissions || {})
  const [isActive, setIsActive] = useState(role?.is_active ?? 1)

  const togglePermission = (key) => {
    setPermissions({ ...permissions, [key]: !permissions[key] })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!nameAr.trim()) {
      toast.error('اسم الدور مطلوب')
      return
    }
    if (!isEdit && !code.trim()) {
      toast.error('رمز الدور مطلوب')
      return
    }

    const data = {
      role_name_ar: nameAr.trim(),
      description: desc.trim() || null,
      permissions,
      is_active: isActive,
    }
    if (!isEdit) {
      data.role_code = code.trim().toUpperCase().replace(/\s+/g, '_')
    }

    onSave(data, role?.role_id)
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" dir="rtl">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-large flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">
            {isEdit ? 'تعديل الدور' : 'دور جديد'}
          </h3>
          <button
            onClick={onCancel}
            className="w-9 h-9 rounded-lg bg-slate-100 hover:bg-red-100 hover:text-red-600 text-slate-500 flex items-center justify-center transition-all"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-5">
            {/* Role Code */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                رمز الدور (بالإنجليزية) {!isEdit && <span className="text-red-500">*</span>}
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                disabled={isEdit && role?.is_system === 1}
                placeholder="مثال: SUPERVISOR"
                className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 font-mono disabled:bg-slate-100 disabled:text-slate-500"
                dir="ltr"
              />
              {isEdit && role?.is_system === 1 && (
                <p className="text-xs text-amber-600 mt-1">⚠️ رمز الدور النظامي غير قابل للتغيير</p>
              )}
            </div>

            {/* Role Name */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                الاسم بالعربية <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={nameAr}
                onChange={(e) => setNameAr(e.target.value)}
                placeholder="مثال: مشرف"
                className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                الوصف (اختياري)
              </label>
              <textarea
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                rows="2"
                placeholder="وصف مختصر للدور..."
                className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 resize-none"
              />
            </div>

            {/* Permissions */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                الصلاحيات
              </label>
              <div className="bg-slate-50 rounded-xl p-4 space-y-2 max-h-64 overflow-y-auto">
                {Object.entries(PERMISSION_LABELS).map(([key, label]) => (
                  <label
                    key={key}
                    className="flex items-center gap-3 p-2 hover:bg-white rounded-lg cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={permissions[key] || false}
                      onChange={() => togglePermission(key)}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-700">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Active Toggle */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <span className="text-sm font-semibold text-slate-700">الدور مُفعّل</span>
              <button
                type="button"
                onClick={() => setIsActive(isActive ? 0 : 1)}
                disabled={isEdit && role?.is_system === 1}
                className={'w-14 h-7 rounded-full transition-all relative disabled:opacity-50 ' + (isActive ? 'bg-blue-600' : 'bg-slate-300')}
              >
                <span
                  className={'absolute top-1 w-5 h-5 bg-white rounded-full transition-all ' + (isActive ? 'right-1' : 'right-8')}
                ></span>
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3 bg-slate-50">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 font-medium"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-medium"
            >
              {isEdit ? 'تحديث' : 'إنشاء'}
            </button>
          </div>
        </form>
      </div>
      <div className="mt-12 pt-6 border-t border-slate-200">
        
      </div>
    </div>
  )
}