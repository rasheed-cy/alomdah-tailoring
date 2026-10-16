"""مشغّل التطبيق — يدعم الكاميرا داخل QtWebEngine."""
import os
import sys
import io
import time
import socket
import logging
import threading
from pathlib import Path

# إصلاح stdout / stderr
if sys.stdout is None or not hasattr(sys.stdout, "isatty"):
    try:
        _ld = Path(os.environ.get("TEMP", ".")) / "alomdah_logs"
        _ld.mkdir(parents=True, exist_ok=True)
        sys.stdout = open(_ld / "stdout.log", "a", encoding="utf-8", buffering=1)
    except Exception:
        sys.stdout = io.TextIOWrapper(io.BytesIO(), encoding="utf-8")
if sys.stderr is None or not hasattr(sys.stderr, "isatty"):
    try:
        _ld = Path(os.environ.get("TEMP", ".")) / "alomdah_logs"
        _ld.mkdir(parents=True, exist_ok=True)
        sys.stderr = open(_ld / "stderr.log", "a", encoding="utf-8", buffering=1)
    except Exception:
        sys.stderr = io.TextIOWrapper(io.BytesIO(), encoding="utf-8")


# ⭐⭐ إعدادات WebEngine المهمة للكاميرا
os.environ["QTWEBENGINE_CHROMIUM_FLAGS"] = (
    "--enable-media-stream "
    "--use-fake-ui-for-media-stream "
    "--enable-features=WebRTC,MediaStream "
    "--disable-web-security "
    "--allow-running-insecure-content "
    "--unsafely-treat-insecure-origin-as-secure=http://127.0.0.1:8000 "
    "--unsafely-treat-insecure-origin-as-secure=http://localhost:8000"
)
os.environ["QTWEBENGINE_DISABLE_SANDBOX"] = "1"


# المسارات
IS_FROZEN = getattr(sys, "frozen", False) and hasattr(sys, "_MEIPASS")
if IS_FROZEN:
    MEIPASS = Path(sys._MEIPASS)
    ROOT = Path(sys.executable).parent
    APP_DIR = MEIPASS / "app"
    FRONTEND_DIST = MEIPASS / "frontend_dist"
    ICON_PATH = ROOT / "app.ico"
else:
    ROOT = Path(__file__).resolve().parent.parent
    APP_DIR = ROOT / "backend" / "app"
    FRONTEND_DIST = ROOT / "frontend" / "dist"
    ICON_PATH = ROOT / "desktop" / "app.ico"

BACKEND_ROOT = APP_DIR.parent
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))
os.environ["PYTHONPATH"] = str(BACKEND_ROOT)

for env_file in [
    (MEIPASS / ".env") if IS_FROZEN else (ROOT / "backend" / ".env"),
    ROOT / ".env",
]:
    if env_file.exists():
        os.environ["ALOMDAH_ENV_FILE"] = str(env_file)
        break


from PySide6.QtCore import QUrl, Qt
from PySide6.QtGui import QIcon
from PySide6.QtWidgets import QApplication, QMainWindow, QMessageBox
from PySide6.QtWebEngineWidgets import QWebEngineView
from PySide6.QtWebEngineCore import (
    QWebEngineSettings, QWebEngineProfile, QWebEnginePage,
)


# ⭐ Page مخصص — يمنح صلاحيات الكاميرا
class AlomdahPage(QWebEnginePage):
    def permissionRequested(self, securityOrigin, feature):
        try:
            self.setFeaturePermission(
                securityOrigin, feature,
                QWebEnginePage.PermissionGrantedByUser,
            )
        except Exception:
            pass

    def javaScriptConsoleMessage(self, level, message, line, source):
        try:
            log_dir = Path(os.environ.get("TEMP", ".")) / "alomdah_logs"
            log_dir.mkdir(parents=True, exist_ok=True)
            with open(log_dir / "js_console.log", "a", encoding="utf-8") as f:
                f.write(f"[{level}] {source}:{line} | {message}\n")
        except Exception:
            pass


def find_free_port(preferred=8000):
    for port in range(preferred, preferred + 20):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            try:
                s.bind(("127.0.0.1", port))
                return port
            except OSError:
                continue
    return preferred


def setup_logging():
    rl = logging.getLogger()
    for h in list(rl.handlers):
        rl.removeHandler(h)
    ld = Path(os.environ.get("TEMP", ".")) / "alomdah_logs"
    ld.mkdir(parents=True, exist_ok=True)
    h = logging.FileHandler(str(ld / "backend.log"), encoding="utf-8")
    h.setFormatter(logging.Formatter("%(asctime)s | %(levelname)s | %(name)s | %(message)s"))
    rl.addHandler(h)
    rl.setLevel(logging.INFO)
    os.environ["NO_COLOR"] = "1"
    os.environ["TERM"] = "dumb"


def run_backend_in_thread(port):
    def target():
        try:
            setup_logging()
            import uvicorn
            from app.main import app as fastapi_app
            cfg = uvicorn.Config(
                fastapi_app, host="127.0.0.1", port=port,
                log_config=None, log_level="info",
                access_log=False, use_colors=False,
            )
            uvicorn.Server(cfg).run()
        except Exception:
            import traceback
            el = Path(os.environ.get("TEMP", ".")) / "alomdah_logs" / "error.log"
            el.parent.mkdir(parents=True, exist_ok=True)
            with open(el, "w", encoding="utf-8") as f:
                f.write(traceback.format_exc())
    t = threading.Thread(target=target, daemon=True)
    t.start()
    return t


def wait_for_backend(url, timeout=90):
    import urllib.request
    start = time.time()
    while time.time() - start < timeout:
        try:
            with urllib.request.urlopen(url, timeout=2) as r:
                if r.status == 200:
                    return True
        except Exception:
            time.sleep(0.5)
    return False


class AlomdahWindow(QMainWindow):
    def __init__(self, url):
        super().__init__()
        self.setWindowTitle("العمده للخياطة — البرنامج")
        self.setMinimumSize(1280, 800)
        self.resize(1440, 900)
        self.setLayoutDirection(Qt.RightToLeft)
        if ICON_PATH.exists():
            self.setWindowIcon(QIcon(str(ICON_PATH)))

        profile = QWebEngineProfile.defaultProfile()
        profile.setPersistentCookiesPolicy(QWebEngineProfile.NoPersistentCookies)

        s = profile.settings()
        s.setAttribute(QWebEngineSettings.JavascriptEnabled, True)
        s.setAttribute(QWebEngineSettings.LocalStorageEnabled, True)
        s.setAttribute(QWebEngineSettings.JavascriptCanAccessClipboard, True)
        s.setAttribute(QWebEngineSettings.LocalContentCanAccessRemoteUrls, True)
        s.setAttribute(QWebEngineSettings.LocalContentCanAccessFileUrls, True)
        s.setAttribute(QWebEngineSettings.PluginsEnabled, True)
        s.setAttribute(QWebEngineSettings.AutoLoadImages, True)
        s.setAttribute(QWebEngineSettings.PlaybackRequiresUserGesture, False)
        s.setAttribute(QWebEngineSettings.ScreenCaptureEnabled, True)

        self.web = QWebEngineView()
        self.web.setPage(AlomdahPage(profile, self.web))
        self.web.setUrl(QUrl(url))
        self.setCentralWidget(self.web)


def main():
    QApplication.setAttribute(Qt.AA_ShareOpenGLContexts, True)
    app = QApplication(sys.argv)
    app.setLayoutDirection(Qt.RightToLeft)
    app.setApplicationName("العمده للخياطة")
    if ICON_PATH.exists():
        app.setWindowIcon(QIcon(str(ICON_PATH)))

    port = find_free_port(8000)
    run_backend_in_thread(port)
    if not wait_for_backend(f"http://127.0.0.1:{port}/api/health", timeout=90):
        el = Path(os.environ.get("TEMP", ".")) / "alomdah_logs" / "error.log"
        detail = ""
        if el.exists():
            try:
                detail = el.read_text(encoding="utf-8")[:1500]
            except Exception:
                pass
        QMessageBox.critical(None, "فشل التشغيل", f"فشل الاتصال بـ Backend.\n\n{detail}")
        return 1

    w = AlomdahWindow(f"http://127.0.0.1:{port}/")
    w.showMaximized()
    return app.exec()


if __name__ == "__main__":
    sys.exit(main())