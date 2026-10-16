/**
 * PageLoader — يظهر عند تحميل الصفحات
 * الحد الأدنى للمدة: 2 ثوان
 * إذا أخذ التحميل وقتاً أطول، يستمر حتى ينهي
 */

import { useEffect, useState } from 'react'

export default function PageLoader({ loading, message = 'جاري تحميل البيانات...', minDuration = 2000 }) {
  const [visible, setVisible] = useState(false)
  const [startTime, setStartTime] = useState(null)

  useEffect(() => {
    if (loading) {
      setStartTime(Date.now())
      setVisible(true)
    } else if (startTime) {
      const elapsed = Date.now() - startTime
      const remaining = Math.max(0, minDuration - elapsed)

      if (remaining > 0) {
        const timer = setTimeout(() => {
          setVisible(false)
          setStartTime(null)
        }, remaining)
        return () => clearTimeout(timer)
      } else {
        setVisible(false)
        setStartTime(null)
      }
    }
  }, [loading, startTime, minDuration])

  if (!visible) return null

  return (
    <div className="fixed inset-0 bg-white/95 backdrop-blur-sm z-[9998] flex items-center justify-center animate-fade-in" dir="rtl">
      <div className="text-center">
        {/* Spinner */}
        <div className="relative w-20 h-20 mx-auto mb-6">
          <div className="absolute inset-0 rounded-full border-4 border-slate-200"></div>
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600 animate-spin"></div>
        </div>

        {/* Message */}
        <p className="text-slate-700 font-semibold text-base mb-1">{message}</p>
        <p className="text-slate-400 text-xs">يرجى الانتظار قليلاً...</p>

        {/* Progress dots */}
        <div className="flex justify-center gap-1.5 mt-4">
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0ms' }}></span>
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '150ms' }}></span>
          <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '300ms' }}></span>
        </div>
      </div>
    </div>
  )
}