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
