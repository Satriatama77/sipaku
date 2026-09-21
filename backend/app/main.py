from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
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

# ── CORS (izinkan frontend React mengakses API) ───────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── RBAC Middleware ───────────────────────────────────────
app.add_middleware(BaseHTTPMiddleware, dispatch=rbac_middleware)

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
