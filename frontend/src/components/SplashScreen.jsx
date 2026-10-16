import { useEffect, useState } from 'react'

export default function SplashScreen({ onComplete }) {
  const [progress, setProgress] = useState(0)
  const [message, setMessage] = useState('جاري فتح النظام...')

  useEffect(() => {
    // شريط يتقدم بسلاسة
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) return 100
        const increment = prev < 30 ? 2 : prev < 70 ? 1.5 : 1
        return Math.min(prev + increment, 100)
      })
    }, 60)

    // النصوص
    const stages = [
      { at: 300, m: 'جاري الاتصال بقاعدة البيانات...' },
      { at: 900, m: 'جاري تحضير الواجهة...' },
      { at: 1500, m: 'جاري تحميل البيانات...' },
      { at: 2000, m: 'على وشك الانتهاء...' },
    ]

    const timers = stages.map(s => setTimeout(() => setMessage(s.m), s.at))

    // إنهاء سريع بعد 2500ms
    const finishTimer = setTimeout(() => {
      setProgress(100)
      setMessage('مرحباً بك')

      // انتقال بعد 300ms
      setTimeout(() => {
        if (onComplete) onComplete()
      }, 300)
    }, 2500)

    return () => {
      clearInterval(progressInterval)
      timers.forEach(t => clearTimeout(t))
      clearTimeout(finishTimer)
    }
  }, [onComplete])

  return (
    <div className="fixed inset-0 bg-slate-900 flex items-center justify-center z-50" dir="rtl">
      <div className="text-center px-8 animate-fade-in">
        <div className="bg-white rounded-3xl p-6 mx-auto mb-6 shadow-large w-48 h-48 flex items-center justify-center">
          <img
            src="/logo_dark.png"
            alt="العمده"
            className="max-w-full max-h-full object-contain animate-pulse-soft"
          />
        </div>

        <h1 className="text-3xl font-bold text-white mb-2">العمده للخياطة</h1>
        <p className="text-slate-400 text-sm mb-10">للخياطة والملابس الجاهزة</p>

        <div className="w-72 mx-auto">
          <div className="h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-l from-blue-400 to-blue-600 rounded-full transition-all duration-300"
              style={{ width: progress + '%' }}
            />
          </div>
          <div className="flex items-center justify-between mt-3">
            <p className="text-slate-400 text-xs">{message}</p>
            <p className="text-blue-400 text-xs font-mono">{Math.round(progress)}%</p>
          </div>
        </div>
      </div>
    </div>
  )
}