from fastapi import Request
from starlette.responses import JSONResponse
from jose import jwt, JWTError
from app.config import SECRET_KEY, ALGORITHM
from app.dependencies import normalize_role

# Role yang diizinkan per prefix endpoint (Ketat berdasarkan role pengguna)
ROLE_PERMISSIONS = {
    "/api/admin": ["admin"],
    "/api/nlp":   ["admin", "penjual"],
}

async def rbac_middleware(request: Request, call_next):
    """
    Middleware RBAC ketat (Defense-in-Depth):
    Memverifikasi token JWT dan memeriksa izin role pada setiap request HTTP.
    Endpoint publik dikecualikan secara eksplisit.
    Jika ada upaya manipulasi atau hak akses tidak mencukupi, kembalikan 401 atau 403.
    """
    # 1. Request OPTIONS (CORS preflight) selalu lolos tanpa cek token
    if request.method == "OPTIONS":
        return await call_next(request)

    path = request.url.path

    # 2. Endpoint publik yang tidak memerlukan autentikasi
    is_public = (
        path == "/"
        or any(path.startswith(p) for p in ["/api/auth", "/api/harga", "/docs", "/openapi.json", "/redoc", "/uploads"])
        or (request.method == "GET" and path.startswith("/api/katalog"))
        or (request.method == "GET" and path.startswith("/api/toko"))
        or (request.method == "GET" and path.startswith("/api/laporan"))
    )

    if is_public:
        return await call_next(request)

    # 3. Validasi Keberadaan Header Authorization
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return JSONResponse(
            status_code=401,
            content={"detail": "Token autentikasi diperlukan. Silakan login terlebih dahulu."}
        )

    token = auth_header.split(" ", 1)[1].strip()

    # 4. Validasi Keaslian & Kedaluwarsa Token JWT
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        raw_role = payload.get("role", "pembeli")
        role = normalize_role(raw_role)
        
        request.state.user_id = payload.get("sub")
        request.state.role = role
        request.state.raw_role = raw_role
        request.state.id_toko = payload.get("id_toko")
    except JWTError:
        return JSONResponse(
            status_code=401,
            content={"detail": "Token tidak valid atau sudah kadaluarsa. Silakan login ulang."}
        )

    # 5. Penegakan Role-Based Access Control (RBAC) Ketat
    # A. Endpoint Admin PU & NLP Suara
    for prefix, allowed_roles in ROLE_PERMISSIONS.items():
        if path.startswith(prefix) and role not in allowed_roles:
            return JSONResponse(
                status_code=403,
                content={
                    "detail": f"Akses Ditolak (403 Forbidden): Role akun Anda ('{raw_role}') tidak memiliki otoritas untuk mengakses fitur Admin PU."
                }
            )

    # B. Pembaruan Katalog Toko (Hanya Penjual & Admin)
    if path.startswith("/api/katalog") and request.method in ["PUT", "POST"]:
        if role not in ["penjual", "admin"]:
            return JSONResponse(
                status_code=403,
                content={
                    "detail": f"Akses Ditolak (403 Forbidden): Hanya role Penjual atau Admin yang dapat memperbarui katalog toko."
                }
            )

    # C. Lapor Harga Pengaduan (Hanya Warga / Pembeli)
    if path.startswith("/api/laporan") and request.method == "POST":
        if role != "pembeli":
            return JSONResponse(
                status_code=403,
                content={
                    "detail": f"Akses Ditolak (403 Forbidden): Hanya akun Warga/Pembeli yang berwenang mengirimkan laporan pengaduan harga."
                }
            )

    return await call_next(request)
