import { useState, useEffect, useRef } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import SplashScreen from './components/SplashScreen.jsx'
import Layout from './components/Layout.jsx'
import { isSessionValid, getCurrentUser } from './utils/session.js'

import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Customers from './pages/Customers.jsx'
import CustomerForm from './pages/CustomerForm.jsx'
import Settings from './pages/Settings.jsx'
import Backup from './pages/Backup.jsx'
import Roles from './pages/Roles.jsx'
import Users from './pages/Users.jsx'
import Developer from './pages/Developer.jsx'

console.log('[App.jsx] Module loaded - v4.0')

export default function App() {
  const navigate = useNavigate()
  const location = useLocation()
  const splashShownRef = useRef(false)
  const [postLoginSplash, setPostLoginSplash] = useState(false)

  useEffect(() => {
    const sessionValid = isSessionValid()
    const isLoginPage = location.pathname === '/login'

    console.log('[App] Path:', location.pathname, '| sessionValid:', sessionValid)

    if (isLoginPage) {
      if (sessionValid) {
        navigate('/dashboard', { replace: true })
      }
      return
    }

    if (!sessionValid) {
      navigate('/login', { replace: true })
      return
    }

    if (!splashShownRef.current) {
      splashShownRef.current = true
      setPostLoginSplash(true)
      setTimeout(() => setPostLoginSplash(false), 2000)
    }
  }, [location.pathname, navigate])

  if (postLoginSplash) {
    return <SplashScreen onComplete={() => setPostLoginSplash(false)} />
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="customers" element={<Customers />} />
        <Route path="customers/new" element={<CustomerForm />} />
        <Route path="customers/:id/edit" element={<CustomerForm />} />
        <Route path="backup" element={<Backup />} />
        <Route path="settings" element={<Settings />} />
        <Route path="roles" element={<Roles />} />
        <Route path="users" element={<Users />} />
        <Route path="developer" element={<Developer />} />
      </Route>
    </Routes>
  )
}
