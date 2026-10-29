from fastapi import APIRouter, Depends, HTTPException
from app.schemas.auth_schema import LoginRequest, LoginResponse, RegisterRequest, GantiPasswordRequest
from app.services.auth_service import authenticate_user, create_access_token, register_user
from app.database import get_db
from app.dependencies import get_current_user

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

    # Validasi kesesuaian role dengan portal/tab yang dipilih (RBAC Login Enforcement)
    if request.expected_role:
        from app.dependencies import normalize_role
        user_norm = normalize_role(user["role"])
        expected_norm = normalize_role(request.expected_role)

        if user_norm != expected_norm:
            ROLE_LABELS = {
                "admin": "Administrator PU",
                "penjual": "Pemilik Toko",
                "pembeli": "Publik/Warga",
            }
            user_lbl = ROLE_LABELS.get(user_norm, user["role"])
            expected_lbl = ROLE_LABELS.get(expected_norm, request.expected_role)
            raise HTTPException(
                status_code=403,
                detail=f"Akses Ditolak (403): Akun '{request.username}' terdaftar sebagai '{user_lbl}', bukan '{expected_lbl}'. Silakan masuk melalui tab yang sesuai."
            )

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


@router.get("/profil")
def ambil_profil(
    current_user=Depends(get_current_user),
    conn=Depends(get_db)
):
    """Mengambil rincian profil pengguna aktif untuk modal profil UI."""
    from app.database import get_cursor
    cursor = get_cursor(conn)
    
    query = """
        SELECT u.id_user, u.nama_lengkap, u.username, u.role, u.created_at, u.id_toko,
               t.nama_toko, t.nama_pemilik, t.id_kecamatan, k.nama_kecamatan,
               t.latitude, t.longitude
        FROM users u
        LEFT JOIN toko_bangunan t ON u.id_toko = t.id_toko
        LEFT JOIN kecamatan k ON t.id_kecamatan = k.id_kecamatan
        WHERE u.id_user = %s
    """
    cursor.execute(query, (current_user.id_user,))
    data = cursor.fetchone()
    cursor.close()

    if not data:
        raise HTTPException(status_code=404, detail="Data pengguna tidak ditemukan")

    return {
        "status": "sukses",
        "data": {
            "id_user": data["id_user"],
            "nama_lengkap": data["nama_lengkap"],
            "username": data["username"],
            "role": data["role"],
            "created_at": str(data["created_at"]) if data.get("created_at") else None,
            "id_toko": data.get("id_toko"),
            "nama_toko": data.get("nama_toko"),
            "nama_pemilik": data.get("nama_pemilik"),
            "nama_kecamatan": data.get("nama_kecamatan"),
            "latitude": float(data["latitude"]) if data.get("latitude") is not None else None,
            "longitude": float(data["longitude"]) if data.get("longitude") is not None else None,
        }
    }


@router.post("/ganti-password")
def ganti_password(
    body: GantiPasswordRequest,
    current_user=Depends(get_current_user),
    conn=Depends(get_db)
):
    """Mengubah kata sandi pengguna aktif."""
    if len(body.password_baru.strip()) < 6:
        raise HTTPException(status_code=400, detail="Password baru minimal 6 karakter")

    from app.database import get_cursor
    from app.services.auth_service import verify_password, hash_password
    cursor = get_cursor(conn)

    cursor.execute("SELECT password FROM users WHERE id_user = %s", (current_user.id_user,))
    user = cursor.fetchone()
    if not user:
        cursor.close()
        raise HTTPException(status_code=404, detail="Pengguna tidak ditemukan")

    if not verify_password(body.password_lama, user["password"]):
        cursor.close()
        raise HTTPException(status_code=400, detail="Kata sandi lama yang Anda masukkan salah")

    new_hash = hash_password(body.password_baru.strip())
    cursor.execute("UPDATE users SET password = %s WHERE id_user = %s", (new_hash, current_user.id_user))
    conn.commit()
    cursor.close()

    return {
        "status": "sukses",
        "pesan": "Kata sandi berhasil diperbarui!"
    }
