# العمده للخياطة الرجالية

تطبيق سطح مكتب احترافي لإدارة محل الخياطة — يعمل بدون إنترنت مع قاعدة بيانات Oracle محلية.

## الميزات

- إدارة الزبائن: إضافة، تعديل، بحث، أرشفة، استعادة
- التقاط صور المقاسات مباشرة من الكاميرا
- نسخ احتياطي تلقائي يومي
- نظام مستخدمين وأدوار (ADMIN / EMPLOYEE)
- جلسات آمنة تنتهي بعد 20 دقيقة من عدم النشاط
- إعدادات الكاميرا الافتراضية
- واجهة عربية كاملة RTL

## التقنيات

| الطبقة | التقنية |
|--------|---------|
| الواجهة | React 18 + Vite + TailwindCSS |
| الخادم | FastAPI (Python 3.12) |
| قاعدة البيانات | Oracle Database 21c XE |
| سطح المكتب | PySide6 + QtWebEngine |
| التغليف | PyInstaller + Inno Setup |

## المتطلبات

للتطوير:
- Python 3.12+
- Node.js 18+
- Oracle Database 21c XE

للتشغيل:
- Windows 10/11 (64-bit)
- Oracle Database 21c XE
- 4 GB RAM

## التثبيت السريع

1. حمّل Alomdah_Setup_0.1.0.exe
2. شغّله واتبع الخطوات
3. سجّل الدخول: admin / Admin@Alomdah2026

## التطوير

### الخادم
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
python -m uvicorn app.main:app --reload

### الواجهة
cd frontend
npm install
npm run dev

### سطح المكتب
cd desktop
python app_launcher.py

## هيكل المشروع

alomdah-tailoring/
- backend/    — FastAPI
- frontend/   — React
- desktop/    — PySide6 launcher
- scripts/    — سكربتات مساعدة
- README.md

## المطوّر

رشيد عبدالله ثابت صلاح
- WhatsApp: 967771296378
- GitHub: github.com/rasheed-cy
- LinkedIn: linkedin.com/in/rasheed-abdullah-thabit-salah

## الترخيص

جميع الحقوق محفوظة © 2026 — رشيد عبدالله ثابت صالح
