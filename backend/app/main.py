import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.middleware.base import BaseHTTPMiddleware

from app.config import APP_TITLE, APP_VERSION, CORS_ORIGINS
from app.middleware.auth_middleware import rbac_middleware
from app.routers import auth_router, laporan_router, katalog_router, harga_router, admin_router, nlp_router

# ── Inisialisasi Aplikasi ─────────────────────────────────
app = FastAPI(
    title=APP_TITLE,
    version=APP_VERSION,
    description="REST API untuk SIPAKU: Sistem Informasi Harga Konstruksi Kabupaten Lamongan",
)

# ── RBAC Middleware ───────────────────────────────────────
app.add_middleware(BaseHTTPMiddleware, dispatch=rbac_middleware)

# ── CORS (izinkan frontend React mengakses API) ───────────
# Ditambahkan terakhir agar menjadi middleware terluar yang menangani request OPTIONS
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Static Files: Serve uploaded photos ───────────────────
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# ── Register Semua Router ─────────────────────────────────
app.include_router(auth_router.router)
app.include_router(laporan_router.router)
app.include_router(katalog_router.router)
app.include_router(harga_router.router)
app.include_router(admin_router.router)
app.include_router(nlp_router.router)

# ── Root Endpoint ─────────────────────────────────────────
@app.get("/", tags=["Status"])
def cek_status():
    return {
        "aplikasi": APP_TITLE,
        "versi": APP_VERSION,
        "status": "aktif",
        "docs": "/docs",
    }

