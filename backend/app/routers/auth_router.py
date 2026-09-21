from fastapi import APIRouter, Depends, HTTPException
from app.schemas.auth_schema import LoginRequest, LoginResponse
from app.services.auth_service import authenticate_user, create_access_token
from app.database import get_db

router = APIRouter(prefix="/api/auth", tags=["Auth"])

@router.post("/login", response_model=LoginResponse)
def login(request: LoginRequest, conn=Depends(get_db)):
    user = authenticate_user(conn, request.username, request.password)
    if not user:
        raise HTTPException(status_code=401, detail="Username atau password salah")

    token = create_access_token({
        "sub": str(user["id_user"]),
        "role": user["role"],
        "nama": user["nama_lengkap"],
    })
    return LoginResponse(
        status="berhasil",
        pesan=f"Selamat datang, {user['nama_lengkap']}!",
        access_token=token,
        role=user["role"],
        nama_lengkap=user["nama_lengkap"],
    )

@router.post("/logout")
def logout():
    # JWT stateless: client cukup hapus token di localStorage
    return {"status": "berhasil", "pesan": "Anda telah logout"}
