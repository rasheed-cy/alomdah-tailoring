import { useRef, useState, useEffect } from 'react'
import toast from 'react-hot-toast'

export default function CameraCapture({ onCapture, onCancel }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const [devices, setDevices] = useState([])
  const [selectedDevice, setSelectedDevice] = useState('')
  const [captured, setCaptured] = useState(null)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  // اكتشاف الكاميرات
  useEffect(() => {
    const init = async () => {
      try {
        // طلب الإذن أولاً — ضروري لرؤية أسماء الكاميرات
        const initial = await navigator.mediaDevices.getUserMedia({ video: true })
        initial.getTracks().forEach(t => t.stop())

        // انتظر قليلاً حتى تُحدَّث الأسماء
        await new Promise(r => setTimeout(r, 300))

        const all = await navigator.mediaDevices.enumerateDevices()
        const cams = all.filter(d => d.kind === 'videoinput')
        setDevices(cams)

        if (cams.length > 0) {
          setSelectedDevice(cams[0].deviceId)
        } else {
          setError('لا توجد كاميرا متصلة')
        }
      } catch (e) {
        console.error(e)
        setError('تعذر الوصول إلى الكاميرا. تأكد من منح الإذن.')
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  // بدء الكاميرا
  useEffect(() => {
    if (!selectedDevice) return

    const start = async () => {
      try {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(t => t.stop())
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            deviceId: { exact: selectedDevice },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        })
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play()
            setReady(true)
          }
        }
      } catch (e) {
        console.error(e)
        setError('تعذر تشغيل الكاميرا')
      }
    }
    start()

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
      }
    }
  }, [selectedDevice])

  const handleCapture = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob)
      setCaptured({ blob, url })
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
        streamRef.current = null
      }
      setReady(false)
    }, 'image/jpeg', 0.92)
  }

  const handleRetake = () => {
    if (captured) {
      URL.revokeObjectURL(captured.url)
    }
    setCaptured(null)
    setReady(false)
    const restart = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: { exact: selectedDevice } },
        })
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play()
          setReady(true)
        }
      } catch (e) {
        toast.error('تعذر إعادة تشغيل الكاميرا')
      }
    }
    restart()
  }

  const handleConfirm = () => {
    if (!captured) return
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
    }
    onCapture(captured.blob, captured.url)
  }

  const handleClose = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
    }
    if (captured) URL.revokeObjectURL(captured.url)
    onCancel()
  }

  // تنسيق اسم الكاميرا
  const getCameraLabel = (d, i) => {
    let label = d.label || 'كاميرا ' + (i + 1)
    // تنظيف الأسماء الطويلة
    label = label
      .replace(/\([0-9a-f]{4}:[0-9a-f]{4}\)/gi, '')
      .replace(/\([^)]*\)/g, '')
      .trim()
    if (!label) label = 'كاميرا ' + (i + 1)
    return label
  }

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <h3 className="text-lg font-bold text-slate-900">📷 التقاط صورة المقاسات</h3>
          <button
            onClick={handleClose}
            className="w-9 h-9 rounded-lg bg-slate-200 hover:bg-red-100 hover:text-red-600 text-slate-600 flex items-center justify-center transition-all"
          >
            ✕
          </button>
        </div>

        {/* Camera selector — يظهر دائماً إن كان هناك كاميرا واحدة على الأقل */}
        {!loading && devices.length > 0 && (
          <div className="px-6 py-3 border-b border-slate-200 bg-white flex items-center gap-3">
            <label className="text-sm font-semibold text-slate-700 whitespace-nowrap">
              📹 اختر الكاميرا:
            </label>
            <select
              value={selectedDevice}
              onChange={(e) => setSelectedDevice(e.target.value)}
              disabled={Boolean(captured)}
              className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-white text-slate-900"
            >
              {devices.map((d, i) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {getCameraLabel(d, i)}
                </option>
              ))}
            </select>
            {devices.length > 1 && (
              <span className="text-xs text-slate-400 whitespace-nowrap">
                ({devices.length} كاميرات متاحة)
              </span>
            )}
          </div>
        )}

        {/* Video / Preview */}
        <div className="bg-black aspect-video flex items-center justify-center relative">
          {loading ? (
            <div className="text-center text-slate-400">
              <div className="spinner mx-auto mb-3"></div>
              <div>جاري اكتشاف الكاميرات...</div>
            </div>
          ) : error ? (
            <div className="text-center text-red-400 p-8">
              <div className="text-6xl mb-3">📷</div>
              <div className="text-lg font-semibold">{error}</div>
            </div>
          ) : captured ? (
            <img src={captured.url} alt="ملتقطة" className="max-w-full max-h-full object-contain" />
          ) : (
            <>
              <video ref={videoRef} autoPlay playsInline muted className="max-w-full max-h-full" />
              {!ready && (
                <div className="absolute inset-0 flex items-center justify-center text-slate-400 bg-slate-900/50">
                  <div className="text-center">
                    <div className="spinner mx-auto mb-3"></div>
                    <div>جاري تحضير الكاميرا...</div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <canvas ref={canvasRef} className="hidden" />

        {/* Actions */}
        <div className="px-6 py-5 border-t border-slate-200 flex items-center justify-center gap-3 bg-slate-50">
          {error ? (
            <button
              onClick={handleClose}
              className="px-8 py-3 bg-slate-600 hover:bg-slate-700 text-white font-semibold rounded-lg transition-all"
            >
              إغلاق
            </button>
          ) : captured ? (
            <>
              <button
                onClick={handleRetake}
                className="px-6 py-3 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg transition-all font-medium"
              >
                🔄 إعادة التصوير
              </button>
              <button
                onClick={handleConfirm}
                className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-all shadow-medium"
              >
                ✓ تأكيد الصورة
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleClose}
                className="px-6 py-3 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg transition-all font-medium"
              >
                إلغاء
              </button>
              <button
                onClick={handleCapture}
                disabled={!ready}
                className="px-10 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-semibold rounded-lg transition-all shadow-medium flex items-center gap-2"
              >
                <span>📷</span>
                <span>التقاط</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}