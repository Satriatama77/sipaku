from app.database import get_cursor
from app.schemas.katalog_schema import KatalogUpdate
from datetime import datetime

def ambil_katalog_toko(conn, id_toko: int) -> list[dict]:
    """Ambil semua item katalog harga milik toko tertentu."""
    cursor = get_cursor(conn)
    cursor.execute(
        "SELECT k.*, t.nama_toko FROM katalog_harga k JOIN toko_bangunan t ON k.id_toko = t.id_toko WHERE k.id_toko = %s ORDER BY k.nama_material ASC",
        (id_toko,)
    )
    data = cursor.fetchall()
    cursor.close()
    return data

def ambil_semua_katalog_pasar(conn) -> list[dict]:
    """Ambil semua item katalog dari seluruh toko beserta info toko dan kecamatan."""
    cursor = get_cursor(conn)
    cursor.execute(
        """SELECT k.id_katalog, k.id_toko, k.nama_material, k.harga_jual, k.satuan, 
                  k.stok_tersedia, k.terakhir_diperbarui,
                  t.nama_toko, t.nama_pemilik, t.id_kecamatan,
                  kec.nama_kecamatan
           FROM katalog_harga k
           JOIN toko_bangunan t ON k.id_toko = t.id_toko
           LEFT JOIN kecamatan kec ON t.id_kecamatan = kec.id_kecamatan
           ORDER BY k.terakhir_diperbarui DESC, k.nama_material ASC"""
    )
    data = cursor.fetchall()
    cursor.close()
    return data

def ambil_semua_toko(conn) -> list[dict]:
    """Ambil daftar semua toko bangunan beserta nama kecamatannya."""
    cursor = get_cursor(conn)
    cursor.execute(
        """SELECT t.id_toko, t.nama_toko, t.nama_pemilik, t.id_kecamatan, 
                  k.nama_kecamatan, t.latitude, t.longitude 
           FROM toko_bangunan t 
           LEFT JOIN kecamatan k ON t.id_kecamatan = k.id_kecamatan 
           ORDER BY t.nama_toko ASC"""
    )
    data = cursor.fetchall()
    cursor.close()
    return data

def perbarui_harga(conn, id_toko: int, katalog: KatalogUpdate) -> dict:
    """Tambah atau update harga material di katalog toko."""
    cursor = get_cursor(conn)
    now = datetime.now().isoformat()

    # Cek apakah material sudah ada
    cursor.execute(
        "SELECT id_katalog FROM katalog_harga WHERE id_toko = %s AND nama_material = %s",
        (id_toko, katalog.nama_material)
    )
    existing = cursor.fetchone()

    if existing:
        cursor.execute(
            "UPDATE katalog_harga SET harga_jual = %s, satuan = %s, stok_tersedia = %s, terakhir_diperbarui = %s WHERE id_katalog = %s",
            (katalog.harga_jual, katalog.satuan, katalog.stok_tersedia, now, existing["id_katalog"])
        )
    else:
        cursor.execute(
            "INSERT INTO katalog_harga (id_toko, nama_material, harga_jual, satuan, stok_tersedia, terakhir_diperbarui) VALUES (%s, %s, %s, %s, %s, %s)",
            (id_toko, katalog.nama_material, katalog.harga_jual, katalog.satuan, katalog.stok_tersedia, now)
        )
    conn.commit()
    cursor.close()
    return {"status": "berhasil", "material": katalog.nama_material, "harga_baru": katalog.harga_jual}

def ambil_daftar_kecamatan(conn) -> list[dict]:
    """Ambil daftar semua kecamatan di Lamongan."""
    cursor = get_cursor(conn)
    cursor.execute("SELECT id_kecamatan, nama_kecamatan, kode_wilayah FROM kecamatan ORDER BY nama_kecamatan ASC")
    data = cursor.fetchall()
    cursor.close()
    return data

def ambil_semua_toko_lengkap(conn) -> list[dict]:
    """Ambil semua toko beserta info kecamatan dan akun login penjual."""
    cursor = get_cursor(conn)
    cursor.execute(
        """SELECT t.id_toko, t.nama_toko, t.nama_pemilik, t.id_kecamatan,
                  k.nama_kecamatan, t.latitude, t.longitude,
                  u.id_user, u.username, u.nama_lengkap as nama_user
           FROM toko_bangunan t
           LEFT JOIN kecamatan k ON t.id_kecamatan = k.id_kecamatan
           LEFT JOIN users u ON u.id_toko = t.id_toko AND u.role = 'penjual'
           ORDER BY t.nama_toko ASC"""
    )
    data = cursor.fetchall()
    cursor.close()
    return data

def tambah_toko_dan_akun(conn, nama_toko: str, nama_pemilik: str, id_kecamatan: int, latitude: float = None, longitude: float = None) -> dict:
    """Tambah toko baru ke toko_bangunan dan otomatis buatkan akun penjual di tabel users."""
    import re
    from app.services.auth_service import hash_password

    cursor = get_cursor(conn)
    try:
        # 1. Insert ke toko_bangunan
        cursor.execute(
            """INSERT INTO toko_bangunan (id_kecamatan, nama_toko, nama_pemilik, latitude, longitude)
               VALUES (%s, %s, %s, %s, %s)""",
            (id_kecamatan, nama_toko, nama_pemilik, latitude, longitude)
        )
        conn.commit()
        id_toko = cursor.lastrowid

        # 2. Buat username otomatis: penjual_<nama_toko_clean>
        clean_nama = re.sub(r'[^a-zA-Z0-9]+', '_', nama_toko.lower()).strip('_')
        base_username = f"penjual_{clean_nama}"[:40]
        username = base_username

        # Cek keunikan username
        counter = 1
        while True:
            cursor.execute("SELECT id_user FROM users WHERE username = %s", (username,))
            if not cursor.fetchone():
                break
            username = f"{base_username}_{counter}"
            counter += 1

        default_password = "penjual123"
        hashed = hash_password(default_password)

        # 3. Insert ke users
        cursor.execute(
            """INSERT INTO users (nama_lengkap, username, password, role, id_toko)
               VALUES (%s, %s, %s, 'penjual', %s)""",
            (nama_pemilik or nama_toko, username, hashed, id_toko)
        )
        conn.commit()
        id_user = cursor.lastrowid
        cursor.close()

        return {
            "id_toko": id_toko,
            "nama_toko": nama_toko,
            "nama_pemilik": nama_pemilik,
            "id_kecamatan": id_kecamatan,
            "latitude": latitude,
            "longitude": longitude,
            "akun_penjual": {
                "id_user": id_user,
                "username": username,
                "password_default": default_password,
                "role": "penjual"
            }
        }
    except Exception as e:
        conn.rollback()
        cursor.close()
        raise e

