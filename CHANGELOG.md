# Changelog

جميع التغييرات المهمة في هذا المشروع موثّقة في هذا الملف.

التنسيق يعتمد على [Keep a Changelog](https://keepachangelog.com/),
والمشروع يتبع [Semantic Versioning](https://semver.org/).

---

## [Unreleased]

### Planned
- تقارير المبيعات والإحصائيات
- تصدير PDF للفواتير
- دعم عدة فروع
- تطبيق جوال مصاحب

---

## [0.1.0] - 2026-10-16

### Added
- إدارة الزبائن: إضافة، تعديل، حذف، أرشفة، استعادة
- البحث الفوري في الزبائن
- التقاط صور المقاسات من الكاميرا
- تخزين الصور في قاعدة البيانات
- نظام المستخدمين مع الأدوار (ADMIN/EMPLOYEE)
- نظام جلسات آمن (20 دقيقة انتهاء تلقائي)
- تسجيل دخول مع كلمات مرور مشفرة (Argon2)
- إعدادات النظام (اسم المحل، العملة، اللغة)
- إعدادات الكاميرا (اختيار الكاميرا الافتراضية)
- النسخ الاحتياطي اليدوي والتلقائي
- جدولة النسخ عبر Windows Task Scheduler
- استعادة النسخ الاحتياطية
- واجهة عربية كاملة RTL
- صفحة المطوّر
- شعار التطبيق وحقوق النشر
- تطبيق سطح مكتب Portable (.exe)
- مُثبِّت Inno Setup احترافي

### Technical
- Backend: FastAPI + SQLAlchemy + Oracle 21c XE
- Frontend: React 18 + Vite + TailwindCSS
- Desktop: PySide6 + QtWebEngine
- Packaging: PyInstaller + Inno Setup

[Unreleased]: https://github.com/rasheed-cy/alomdah-tailoring/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/rasheed-cy/alomdah-tailoring/releases/tag/v0.1.0