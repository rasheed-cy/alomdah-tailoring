# -*- mode: python ; coding: utf-8 -*-

from pathlib import Path

ROOT = Path(r"E:\Projects\Alomdah_Tailoring")
BACKEND = ROOT / "backend"
FRONTEND_DIST = ROOT / "frontend" / "dist"
ICON = ROOT / "desktop" / "app.ico"

block_cipher = None

datas = [
    (str(BACKEND / "app"), "app"),
    (str(FRONTEND_DIST), "frontend_dist"),
]

env_file = BACKEND / ".env"
if env_file.exists():
    datas.append((str(env_file), "."))

hiddenimports = [
    # app modules
    "app",
    "app.main",
    "app.core",
    "app.core.config",
    "app.db",
    "app.db.database",
    "app.api",
    "app.api.auth",
    "app.api.customers",
    "app.api.images",
    "app.api.backup",
    "app.api.settings",
    "app.api.users",
    "app.api.roles",
    "app.api.app_settings",
    "app.models",
    "app.models.customer",
    "app.models.user",
    "app.models.image",
    "app.models.backup",
    "app.models.role",
    "app.models.app_setting",
    "app.services",
    "app.services.app_settings_service",
    "app.services.backup_service",
    # uvicorn
    "uvicorn",
    "uvicorn.logging",
    "uvicorn.loops",
    "uvicorn.loops.auto",
    "uvicorn.protocols",
    "uvicorn.protocols.http",
    "uvicorn.protocols.http.auto",
    "uvicorn.protocols.websockets",
    "uvicorn.protocols.websockets.auto",
    "uvicorn.lifespan",
    "uvicorn.lifespan.on",
    # web stack
    "fastapi",
    "starlette",
    "pydantic",
    "sqlalchemy",
    # Oracle
    "oracledb",
    # ⭐ cryptography — كامل مع كل الوحدات الفرعية
    "cryptography",
    "cryptography.hazmat",
    "cryptography.hazmat.backends",
    "cryptography.hazmat.backends.openssl",
    "cryptography.hazmat.primitives",
    "cryptography.hazmat.primitives.hashes",
    "cryptography.hazmat.primitives.hmac",
    "cryptography.hazmat.primitives.constant_time",
    "cryptography.hazmat.primitives.padding",
    "cryptography.hazmat.primitives.ciphers",
    "cryptography.hazmat.primitives.ciphers.algorithms",
    "cryptography.hazmat.primitives.ciphers.modes",
    "cryptography.hazmat.primitives.ciphers.aead",
    "cryptography.hazmat.primitives.asymmetric",
    "cryptography.hazmat.primitives.asymmetric.padding",
    "cryptography.hazmat.primitives.asymmetric.rsa",
    "cryptography.hazmat.primitives.asymmetric.ec",
    "cryptography.hazmat.primitives.asymmetric.utils",
    "cryptography.hazmat.primitives.kdf",
    "cryptography.hazmat.primitives.kdf.pbkdf2",      # ⭐ المهم
    "cryptography.hazmat.primitives.kdf.hkdf",
    "cryptography.hazmat.primitives.kdf.scrypt",
    "cryptography.hazmat.primitives.serialization",
    "cryptography.hazmat.primitives.serialization.pkcs12",
    "cryptography.x509",
    "cryptography.x509.extensions",
    "cryptography.x509.name",
    "cryptography.x509.oid",
    "_cffi_backend",
    "cffi",
    # auth
    "jwt",
    "argon2",
    "argon2_cffi_bindings",
    "passlib",
    "passlib.handlers",
    "passlib.handlers.argon2",
    "bcrypt",
    # misc
    "multipart",
    "dotenv",
    # Qt
    "PySide6.QtCore",
    "PySide6.QtGui",
    "PySide6.QtWidgets",
    "PySide6.QtWebEngineWidgets",
    "PySide6.QtWebEngineCore",
]

a = Analysis(
    [str(ROOT / "desktop" / "app_launcher.py")],
    pathex=[str(BACKEND)],
    binaries=[],
    datas=datas,
    hiddenimports=hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=["tkinter", "matplotlib", "numpy", "pandas"],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name="Alomdah",
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=False,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=str(ICON) if ICON.exists() else None,
)

coll = COLLECT(
    exe,
    a.binaries,
    a.zipfiles,
    a.datas,
    strip=False,
    upx=False,
    upx_exclude=[],
    name="Alomdah",
)