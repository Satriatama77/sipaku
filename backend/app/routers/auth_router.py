from fastapi import APIRouter, Depends, HTTPException
from app.schemas.auth_schema import LoginRequest, LoginResponse, RegisterRequest
from app.services.auth_service import authenticate_user, create_access_token, register_user
from app.database import get_db

router = APIRouter(prefix="/api/auth", tags=["Auth"])

@router.post("/register")
def register(request: RegisterRequest, conn=Depends(get_db)):
    """Pendaftaran akun baru untuk warga/pembeli."""
    if len(request.username.strip()) < 3:
        raise HTTPException(status_code=400, detail="Username minimal 3 karakter")
    if len(request.password) < 6:
        raise HTTPException(status_code=400, detail="Password minimal 6 karakter")

    new_user, err = register_user(conn, request.nama_lengkap.strip(), request.username.strip(), request.password)
    if err:
        raise HTTPException(status_code=400, detail=err)

    token = create_access_token({
        "sub": str(new_user["id_user"]),
        "role": new_user["role"],
        "nama": new_user["nama_lengkap"],
        "id_toko": None,
    })

    return {
        "status": "berhasil",
        "pesan": f"Akun {new_user['nama_lengkap']} berhasil didaftarkan!",
        "access_token": token,
        "token_type": "bearer",
        "role": new_user["role"],
        "nama_lengkap": new_user["nama_lengkap"],
        "id_toko": None
    }

@router.post("/login", response_model=LoginResponse)
def login(request: LoginRequest, conn=Depends(get_db)):
    user = authenticate_user(conn, request.username, request.password)
    if not user:
        raise HTTPException(status_code=401, detail="Username atau password salah")

    token = create_access_token({
        "sub": str(user["id_user"]),
        "role": user["role"],
        "nama": user["nama_lengkap"],
        "id_toko": user.get("id_toko"),
    })
    return LoginResponse(
        status="berhasil",
        pesan=f"Selamat datang, {user['nama_lengkap']}!",
        access_token=token,
        role=user["role"],
        nama_lengkap=user["nama_lengkap"],
        id_toko=user.get("id_toko"),
    )


@router.post("/logout")
def logout():
    # JWT stateless: client cukup hapus token di localStorage
    return {"status": "berhasil", "pesan": "Anda telah logout"}
