import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { getCurrentUser, clearSession } from '../utils/session.js'
export default function Layout() {
  const navigate = useNavigate()
  const user = getCurrentUser() || { full_name: 'زائر', role: 'EMPLOYEE' }
  const isAdmin = user.role === 'ADMIN'

  const handleLogout = () => {
    clearSession()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen flex bg-slate-50">
      <aside className="w-64 bg-slate-900 flex flex-col fixed right-0 top-0 h-full z-10">
        {/* Logo */}
        <div className="p-3 border-b border-slate-800">
          <div
            className="rounded-xl flex items-center justify-center h-24 overflow-hidden"
            style={{
              backgroundImage: 'url(/logo_dark.png)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }}
          />
        </div>

        {/* User */}
        <div className="px-4 py-5 border-b border-slate-800 text-center">
          <div className="w-12 h-12 rounded-full bg-blue-600 mx-auto flex items-center justify-center text-white font-bold text-lg mb-2">
            {user.full_name?.charAt(0) || '؟'}
          </div>
          <div className="text-white text-sm font-semibold truncate">{user.full_name}</div>
          <div className="text-slate-400 text-xs mt-0.5">
            {isAdmin ? 'مدير' : 'موظف'}
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <NavItem to="/dashboard" icon="🏠">الرئيسية</NavItem>
          <NavItem to="/customers" icon="👥">الزبائن</NavItem>

          {isAdmin && (
            <>
              <div className="pt-3 pb-1 px-3">
                <div className="text-xs text-slate-500 font-semibold uppercase">الإدارة</div>
              </div>
              <NavItem to="/backup" icon="💾">النسخ الاحتياطي</NavItem>
              <NavItem to="/roles" icon="🔐">الأدوار</NavItem>
              <NavItem to="/users" icon="👤">المستخدمون</NavItem>
              <NavItem to="/settings" icon="⚙️">الإعدادات</NavItem>
            </>
          )}

          {/* قسم عن التطبيق — للجميع */}
          <div className="pt-3 pb-1 px-3">
            <div className="text-xs text-slate-500 font-semibold uppercase">عن التطبيق</div>
          </div>
          <NavItem to="/developer" icon="👨‍💻">المطوّر</NavItem>
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-300 hover:bg-red-600 hover:text-white transition-all text-sm"
          >
            <span>🚪</span>
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 mr-64 min-h-screen">
        <Outlet />
      </main>
      <div className="mt-12 pt-6 border-t border-slate-200">
        
      </div>
    </div>
  )
}

function NavItem({ to, icon, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        'flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm ' +
        (isActive
          ? 'bg-blue-600 text-white font-semibold shadow-medium'
          : 'text-slate-300 hover:bg-slate-800')
      }
    >
      <span className="text-lg">{icon}</span>
      <span>{children}</span>
    </NavLink>
  )
}