import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import LoadingOverlay from '../components/LoadingOverlay.jsx'
import { listUsers, createUser, updateUser, deleteUser, changeUserPassword, listRoles } from '../api/client.js'
export default function Users() {
  const [users, setUsers] = useState([])
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMsg, setLoadingMsg] = useState('جاري التحميل...')
  const [editing, setEditing] = useState(null)
  const [creating, setCreating] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [passwordTarget, setPasswordTarget] = useState(null)

  const loadData = async () => {
    try {
      const [u, r] = await Promise.all([listUsers(), listRoles()])
      setUsers(u)
      setRoles(r.filter(role => role.is_active === 1))
    } catch (e) {
      toast.error('فشل تحميل البيانات')
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
        await updateUser(id, data)
        toast.success('تم التحديث')
      } else {
        await createUser(data)
        toast.success('تم إنشاء المستخدم')
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
      await deleteUser(deleteTarget.user_id)
      toast.success('تم الحذف')
      setDeleteTarget(null)
      await loadData()
    } catch (e) {
      toast.error(e.response?.data?.detail || 'فشل الحذف')
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async (newPassword) => {
    if (!passwordTarget) return
    setLoadingMsg('جاري التغيير...')
    setLoading(true)
    try {
      await changeUserPassword(passwordTarget.user_id, newPassword)
      toast.success('تم تغيير كلمة المرور')
      setPasswordTarget(null)
    } catch (e) {
      toast.error(e.response?.data?.detail || 'فشل التغيير')
    } finally {
      setLoading(false)
    }
  }

  const getRoleName = (code) => {
    const role = roles.find(r => r.role_code === code)
    return role ? role.role_name_ar : code
  }

  const getRoleColor = (code) => {
    if (code === 'ADMIN') return 'bg-amber-50 text-amber-700 border-amber-200'
    if (code === 'EMPLOYEE') return 'bg-blue-50 text-blue-700 border-blue-200'
    if (code === 'CASHIER') return 'bg-purple-50 text-purple-700 border-purple-200'
    return 'bg-slate-50 text-slate-700 border-slate-200'
  }

  const formatDate = (d) => {
    if (!d) return '—'
    try {
      return new Date(d).toLocaleString('ar-EG')
    } catch { return d }
  }

  return (
    <div className="p-8 max-w-6xl mx-auto" dir="rtl">
      <LoadingOverlay show={loading && users.length > 0} message={loadingMsg} />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">👥 المستخدمون</h2>
          <p className="text-sm text-slate-500 mt-1">إدارة حسابات المستخدمين والصلاحيات</p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all shadow-medium"
        >
          ➕ مستخدم جديد
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-soft overflow-hidden">
        {loading && users.length === 0 ? (
          <div className="p-6 space-y-3">
            {[1,2,3].map(i => <div key={i} className="skeleton h-16"></div>)}
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <div className="text-5xl mb-3">👥</div>
            <div>لا يوجد مستخدمون</div>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-5 py-4 text-right text-xs font-bold text-slate-600 uppercase">المستخدم</th>
                <th className="px-5 py-4 text-right text-xs font-bold text-slate-600 uppercase">الدور</th>
                <th className="px-5 py-4 text-right text-xs font-bold text-slate-600 uppercase">الحالة</th>
                <th className="px-5 py-4 text-right text-xs font-bold text-slate-600 uppercase">آخر دخول</th>
                <th className="px-5 py-4 text-center text-xs font-bold text-slate-600 uppercase">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.user_id} className="hover:bg-blue-50/30 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center font-bold">
                        {u.full_name?.charAt(0) || u.username.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">{u.full_name || u.username}</div>
                        <div className="text-xs font-mono text-slate-500" dir="ltr">@{u.username}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={'inline-flex text-xs px-2.5 py-1 rounded-full border font-semibold ' + getRoleColor(u.role)}>
                      {getRoleName(u.role)}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    {u.is_active === 1 ? (
                      <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        مُفعّل
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                        <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                        معطّل
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-xs text-slate-500">
                    {formatDate(u.last_login)}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => setEditing(u)}
                        className="px-3 py-2 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg text-xs font-semibold transition-all"
                        title="تعديل"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => setPasswordTarget(u)}
                        className="px-3 py-2 bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white rounded-lg text-xs font-semibold transition-all"
                        title="تغيير كلمة المرور"
                      >
                        🔑
                      </button>
                      <button
                        onClick={() => setDeleteTarget(u)}
                        className="px-3 py-2 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-lg text-xs font-semibold transition-all"
                        title="حذف"
                      >
                        🗑
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Edit/Create Modal */}
      {(editing || creating) && (
        <UserModal
          user={editing}
          roles={roles}
          onSave={handleSave}
          onCancel={() => { setEditing(null); setCreating(false) }}
        />
      )}

      {/* Password Modal */}
      {passwordTarget && (
        <PasswordModal
          user={passwordTarget}
          onSave={handleChangePassword}
          onCancel={() => setPasswordTarget(null)}
        />
      )}

      {/* Delete Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-large">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-50 rounded-full mx-auto flex items-center justify-center text-3xl mb-4">⚠️</div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">تأكيد الحذف</h3>
              <p className="text-sm text-slate-600">
                حذف المستخدم "<span className="font-semibold">{deleteTarget.full_name || deleteTarget.username}</span>"؟
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

function UserModal({ user, roles, onSave, onCancel }) {
  const isEdit = Boolean(user)
  const [username, setUsername] = useState(user?.username || '')
  const [fullName, setFullName] = useState(user?.full_name || '')
  const [role, setRole] = useState(user?.role || 'EMPLOYEE')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isActive, setIsActive] = useState(user?.is_active ?? 1)

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$'
    let pass = ''
    for (let i = 0; i < 12; i++) pass += chars[Math.floor(Math.random() * chars.length)]
    setPassword(pass)
    setShowPassword(true)
    navigator.clipboard.writeText(pass)
    toast.success('تم توليد كلمة المرور ونسخها')
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!isEdit && !username.trim()) {
      toast.error('اسم المستخدم مطلوب')
      return
    }
    if (!isEdit && password.length < 6) {
      toast.error('كلمة المرور قصيرة (6 أحرف على الأقل)')
      return
    }
    if (!role) {
      toast.error('الدور مطلوب')
      return
    }

    const data = {
      full_name: fullName.trim() || null,
      role,
      is_active: isActive,
    }
    if (!isEdit) {
      data.username = username.trim()
      data.password = password
    }

    onSave(data, user?.user_id)
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" dir="rtl">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-hidden shadow-large flex flex-col">
        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">
            {isEdit ? 'تعديل المستخدم' : 'مستخدم جديد'}
          </h3>
          <button
            onClick={onCancel}
            className="w-9 h-9 rounded-lg bg-slate-100 hover:bg-red-100 hover:text-red-600 text-slate-500 flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-4">
            {/* Username */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                اسم المستخدم {!isEdit && <span className="text-red-500">*</span>}
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isEdit}
                placeholder="مثال: ahmed"
                className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 font-mono disabled:bg-slate-100"
                dir="ltr"
              />
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                الاسم الكامل
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="أحمد محمد علي"
                className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              />
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                الدور <span className="text-red-500">*</span>
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 bg-white"
              >
                {roles.map((r) => (
                  <option key={r.role_id} value={r.role_code}>
                    {r.role_name_ar} ({r.role_code})
                  </option>
                ))}
              </select>
            </div>

            {/* Password (create only) */}
            {!isEdit && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  كلمة المرور <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 font-mono"
                      dir="ltr"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                    >
                      {showPassword ? '👁' : '👁‍🗨'}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={generatePassword}
                    className="px-4 py-3 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg text-sm font-semibold whitespace-nowrap"
                  >
                    🎲 توليد
                  </button>
                </div>
              </div>
            )}

            {/* Active */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <span className="text-sm font-semibold text-slate-700">الحساب مُفعّل</span>
              <button
                type="button"
                onClick={() => setIsActive(isActive ? 0 : 1)}
                className={'w-14 h-7 rounded-full transition-all relative ' + (isActive ? 'bg-blue-600' : 'bg-slate-300')}
              >
                <span className={'absolute top-1 w-5 h-5 bg-white rounded-full transition-all ' + (isActive ? 'right-1' : 'right-8')}></span>
              </button>
            </div>
          </div>

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
    </div>
  )
}

function PasswordModal({ user, onSave, onCancel }) {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$'
    let pass = ''
    for (let i = 0; i < 12; i++) pass += chars[Math.floor(Math.random() * chars.length)]
    setPassword(pass)
    setShowPassword(true)
    navigator.clipboard.writeText(pass)
    toast.success('تم توليد كلمة المرور ونسخها')
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (password.length < 6) {
      toast.error('كلمة المرور قصيرة')
      return
    }
    onSave(password)
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" dir="rtl">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-large">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-amber-50 rounded-full mx-auto flex items-center justify-center text-3xl mb-4">🔑</div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">تغيير كلمة المرور</h3>
          <p className="text-sm text-slate-500">
            للمستخدم: <span className="font-semibold text-slate-700">{user.full_name || user.username}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="flex gap-2 mb-4">
            <div className="flex-1 relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="كلمة المرور الجديدة"
                className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 font-mono"
                dir="ltr"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              >
                👁
              </button>
            </div>
            <button
              type="button"
              onClick={generatePassword}
              className="px-4 py-3 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg text-sm font-semibold whitespace-nowrap"
            >
              🎲
            </button>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
            >
              تغيير
            </button>
          </div>
        </form>
      </div>
      <div className="mt-12 pt-6 border-t border-slate-200">
        
      </div>
    </div>
  )
}