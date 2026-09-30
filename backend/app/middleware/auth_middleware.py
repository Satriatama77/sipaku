from fastapi import Request
from starlette.responses import JSONResponse
from jose import jwt, JWTError
from app.config import SECRET_KEY, ALGORITHM

# Role yang diizinkan per prefix endpoint (Ketat berdasarkan role pengguna)
ROLE_PERMISSIONS = {
    "/api/admin": ["admin"],
    "/api/nlp":   ["admin"],
}

async def rbac_middleware(request: Request, call_next):
    """
    Middleware RBAC ketat: verifikasi JWT dan cek izin role per endpoint.
    Endpoint publik (/api/auth, /api/harga, /, GET /api/katalog, GET /api/laporan) tidak butuh token.
    Fitur spesifik dibatasi ketat per role:
    - Admin: /api/admin, /api/nlp
    - Penjual: PUT /api/katalog (hanya untuk update katalog tokonya)
    - Pembeli: POST /api/laporan (hanya untuk warga yang melapor)
    """
    # Request OPTIONS (CORS preflight) selalu lolos tanpa cek token
    if request.method == "OPTIONS":
        return await call_next(request)

    path = request.url.path

    # Endpoint publik tidak memerlukan token JWT:
    # - / dan dokumentasi API
    # - /api/auth (login, register & logout)
    # - /api/harga (standar satuan harga SSH)
    # - GET /api/katalog (semua katalog & harga pasar toko dapat dilihat publik/pembeli)
    # - GET /api/laporan (warga bebas melihat laporan tanpa login; POST laporan butuh login)
    # - GET /api/toko
    is_public = (
        path == "/"
        or any(path.startswith(p) for p in ["/api/auth", "/api/harga", "/docs", "/openapi.json", "/redoc"])
        or (request.method == "GET" and path.startswith("/api/katalog"))
        or (request.method == "GET" and path.startswith("/api/toko"))
        or (request.method == "GET" and path.startswith("/api/laporan"))
    )

    if is_public:
        return await call_next(request)

    # Ambil token dari header Authorization
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return JSONResponse(status_code=401, content={"detail": "Token autentikasi diperlukan. Silakan login terlebih dahulu."})

    token = auth_header.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        role = payload.get("role")
        request.state.user_id = payload.get("sub")
        request.state.role = role
        request.state.id_toko = payload.get("id_toko")
    except JWTError:
        return JSONResponse(status_code=401, content={"detail": "Token tidak valid atau sudah kadaluarsa"})

    # Cek izin role ketat
    # 1. Endpoint Admin & NLP hanya untuk Admin
    for prefix, allowed_roles in ROLE_PERMISSIONS.items():
        if path.startswith(prefix) and role not in allowed_roles:
            return JSONResponse(
                status_code=403,
                content={"detail": f"Akses ditolak: role '{role}' tidak diizinkan mengakses fitur Admin"}
            )

    # 2. Update katalog toko hanya boleh dilakukan oleh Penjual
    if path.startswith("/api/katalog") and request.method in ["PUT", "POST"]:
        if role != "penjual":
            return JSONResponse(
                status_code=403,
                content={"detail": f"Akses ditolak: hanya Penjual yang dapat memperbarui katalog toko"}
            )

    # 3. Lapor harga hanya boleh dilakukan oleh Pembeli (Warga)
    if path.startswith("/api/laporan") and request.method == "POST":
        if role != "pembeli":
            return JSONResponse(
                status_code=403,
                content={"detail": f"Akses ditolak: hanya akun Warga/Pembeli yang dapat mengirimkan laporan harga"}
            )

    return await call_next(request)

