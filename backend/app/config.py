import os
from dotenv import load_dotenv

load_dotenv()

# ── Database ──────────────────────────────────────────────
DB_HOST     = os.getenv("DB_HOST", "localhost")
DB_USER     = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_NAME     = os.getenv("DB_NAME", "sipaku_db")
DB_PORT     = int(os.getenv("DB_PORT", 3306))

# ── Security ──────────────────────────────────────────────
SECRET_KEY        = os.getenv("SECRET_KEY", "sipaku-secret-key-ganti-di-production")
ALGORITHM         = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 8  # 8 jam

# ── App ───────────────────────────────────────────────────
APP_TITLE   = "API SIPAKU - Sistem Informasi Harga Konstruksi"
APP_VERSION = "1.0.0"
CORS_ORIGINS = [
    "http://localhost:5173",   # Vite dev server
    "http://localhost:3000",
]
