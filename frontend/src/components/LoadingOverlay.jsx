export default function LoadingOverlay({ show, message = 'جاري التحميل...' }) {
  if (!show) return null
  return (
    <div className="overlay-backdrop">
      <div className="bg-white rounded-2xl shadow-large px-10 py-8 text-center">
        <div className="spinner mx-auto mb-4"></div>
        <div className="text-slate-900 font-semibold text-base">{message}</div>
        <div className="text-slate-500 text-xs mt-2">يرجى الانتظار</div>
      </div>
    </div>
  )
}