# ── Entry point SIPAKU Backend ─────────────────────────────
# File ini hanya mengimpor aplikasi FastAPI dari app.main.
# Semua endpoint, middleware, dan konfigurasi didefinisikan di app/main.py
# dan router masing-masing (auth_router, admin_router, dll.)
#
# Jalankan dengan: uvicorn app.main:app --reload
# ───────────────────────────────────────────────────────────

from app.main import app  # noqa: F401