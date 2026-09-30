import bcrypt
from jose import jwt
from datetime import datetime, timedelta
from app.config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES
from app.database import get_cursor

def verify_password(plain_password: str, stored_password: str) -> bool:
    try:
        if not stored_password:
            return False
        # Cocokkan teks biasa
        if plain_password == stored_password:
            return True
        # Cadangan untuk kompatibilitas hash bcrypt jika ada
        if stored_password.startswith("$2"):
            return bcrypt.checkpw(plain_password.encode('utf-8')[:72], stored_password.encode('utf-8'))
        return False
    except Exception:
        return False

def hash_password(password: str) -> str:
    # Simpan sebagai teks biasa agar mudah dicek langsung di database (phpMyAdmin)
    return password



def create_access_token(data: dict) -> str:
    payload = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload.update({"exp": expire})
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def authenticate_user(conn, username: str, password: str) -> dict | None:
    """Cek credential user dari database. Return data user jika valid."""
    cursor = get_cursor(conn)
    query = "SELECT id_user, nama_lengkap, username, password, role, id_toko FROM users WHERE username = %s"
    cursor.execute(query, (username,))
    user = cursor.fetchone()
    cursor.close()

    if not user:
        return None
    # Untuk prototype: dukung plain text dan bcrypt
    is_valid = (password == user["password"]) or verify_password(password, user["password"])
    return user if is_valid else None

def register_user(conn, nama_lengkap: str, username: str, password: str) -> tuple[dict | None, str | None]:
    """Daftarkan user baru dengan role 'pembeli'."""
    cursor = get_cursor(conn)
    cursor.execute("SELECT id_user FROM users WHERE username = %s", (username,))
    existing = cursor.fetchone()
    if existing:
        cursor.close()
        return None, "Username sudah digunakan oleh akun lain"

    hashed = hash_password(password)
    try:
        cursor.execute(
            "INSERT INTO users (nama_lengkap, username, password, role) VALUES (%s, %s, %s, 'pembeli')",
            (nama_lengkap, username, hashed)
        )
        conn.commit()
        new_id = cursor.lastrowid
        cursor.close()
        return {
            "id_user": new_id,
            "nama_lengkap": nama_lengkap,
            "username": username,
            "role": "pembeli",
            "id_toko": None
        }, None
    except Exception as e:
        conn.rollback()
        cursor.close()
        return None, f"Gagal mendaftarkan user: {str(e)}"

