"""
Authentication & Role-Based Access Control (RBAC) Dependencies.
Menyediakan validasi token JWT ketat dan otorisasi berbasis role untuk FastAPI.
"""
from typing import Optional, List, Union
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from datetime import datetime
from pydantic import BaseModel
from app.config import SECRET_KEY, ALGORITHM

# HTTP Bearer scheme untuk Swagger UI & automatic extraction
security = HTTPBearer(auto_error=False)

# ── Standarisasi Role Pengguna ────────────────────────────────
ROLE_MAPPING = {
    "admin": "admin",
    "admin pu": "admin",
    "admin_pu": "admin",
    "penjual": "penjual",
    "seller": "penjual",
    "toko": "penjual",
    "pembeli": "pembeli",
    "warga": "pembeli",
    "buyer": "pembeli",
}

def normalize_role(role: Optional[str]) -> str:
    """Normalisasi format role agar konsisten (mendukung 'Admin PU', 'Penjual', 'Warga')."""
    if not role:
        return "guest"
    return ROLE_MAPPING.get(role.strip().lower(), role.strip().lower())

class AuthenticatedUser(BaseModel):
    id_user: int
    role: str           # normalized role: 'admin' | 'penjual' | 'pembeli'
    raw_role: str       # role asli dari token
    nama: Optional[str] = None
    id_toko: Optional[int] = None


async def get_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> AuthenticatedUser:
    """
    Dependency untuk mengekstrak dan memvalidasi JWT token secara ketat.
    Memeriksa keaslian signature, keberadaan claim penting (sub, role), dan waktu kedaluwarsa (exp).
    Mengembalikan HTTPException 401 Unauthorized jika token tidak valid.
    """
    token = None

    # 1. Ambil dari HTTPBearer credentials jika ada
    if credentials and credentials.scheme.lower() == "bearer":
        token = credentials.credentials

    # 2. Cadangan: ambil langsung dari header Authorization jika HTTPBearer terlewat
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ", 1)[1].strip()

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token autentikasi diperlukan. Silakan login terlebih dahulu.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        
        # Validasi claim 'sub' (User ID)
        sub = payload.get("sub")
        if sub is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token tidak valid: klaim identitas pengguna (sub) tidak ditemukan.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Validasi waktu kedaluwarsa (exp)
        exp = payload.get("exp")
        if exp and datetime.utcfromtimestamp(exp) < datetime.utcnow():
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Sesi token JWT Anda telah kedaluwarsa. Silakan lakukan login ulang.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        raw_role = payload.get("role", "pembeli")
        norm_role = normalize_role(raw_role)
        id_user = int(sub)
        nama = payload.get("nama")
        id_toko = payload.get("id_toko")

        user = AuthenticatedUser(
            id_user=id_user,
            role=norm_role,
            raw_role=raw_role,
            nama=nama,
            id_toko=id_toko
        )

        # Simpan ke request.state agar dapat diakses downstream jika dibutuhkan
        request.state.user = user
        request.state.user_id = user.id_user
        request.state.role = user.role
        request.state.id_toko = user.id_toko

        return user

    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token tidak valid atau telah dimanipulasi: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


def require_roles(*allowed_roles: str):
    """
    Factory dependency untuk Role-Based Access Control (RBAC).
    Menerima satu atau lebih role yang diizinkan (misal: 'Admin PU', 'Penjual', 'Warga').
    Mengembalikan HTTPException 403 Forbidden jika role pengguna tidak memenuhi syarat.
    """
    normalized_allowed = {normalize_role(r) for r in allowed_roles}

    async def role_checker(current_user: AuthenticatedUser = Depends(get_current_user)) -> AuthenticatedUser:
        if current_user.role not in normalized_allowed:
            readable_roles = ", ".join(f"'{r}'" for r in allowed_roles)
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    f"Akses Ditolak (403 Forbidden): Akun Anda memiliki role '{current_user.raw_role}', "
                    f"sedangkan endpoint ini mensyaratkan otorisasi role {readable_roles}."
                )
            )
        return current_user

    return role_checker


# ── Shortcut RBAC Dependencies Siap Pakai ─────────────────────
# 1. Khusus Admin PU (Pengawas Dinas)
require_admin = require_roles("admin", "Admin PU")

# 2. Khusus Penjual Toko Bangunan
require_penjual = require_roles("penjual", "Penjual")

# 3. Khusus Warga / Pembeli
require_warga = require_roles("pembeli", "warga", "Warga")

# 4. Penjual dan Admin
require_penjual_or_admin = require_roles("penjual", "Penjual", "admin", "Admin PU")
