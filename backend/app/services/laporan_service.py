from app.database import get_cursor
from app.schemas.laporan_schema import LaporanCreate
from app.services.disparitas_service import hitung_disparitas
from datetime import datetime

def buat_laporan(conn, laporan: LaporanCreate, id_pelapor: int) -> dict:
    """Simpan laporan harga baru ke database dan hitung disparitasnya."""
    cursor = get_cursor(conn)

    # Hitung disparitas sebelum simpan
    # Ambil nama kecamatan dulu
    cursor.execute("SELECT nama_kecamatan FROM kecamatan WHERE id_kecamatan = %s", (laporan.id_kecamatan,))
    row = cursor.fetchone()
    nama_kecamatan = row["nama_kecamatan"] if row else "Unknown"

    hasil = hitung_disparitas(laporan.nama_material, nama_kecamatan, laporan.harga_temuan)

    query = """
        INSERT INTO laporan_harga
            (id_pelapor, id_kecamatan, nama_toko, nama_material,
             harga_temuan, harga_ssh, persentase_disparitas, status, foto_url, nama_pelapor, tanggal_laporan)
        VALUES (%s, %s, %s, %s, %s, %s, %s, 'Pending', %s, %s, %s)
    """
    cursor.execute(query, (
        id_pelapor, laporan.id_kecamatan, laporan.nama_toko,
        laporan.nama_material, laporan.harga_temuan,
        hasil.harga_ssh, hasil.persentase,
        laporan.foto_url, laporan.nama_pelapor or "Warga Anonim", datetime.now(),
    ))
    conn.commit()
    id_baru = cursor.lastrowid
    cursor.close()
    return {"id_laporan": id_baru, "disparitas": hasil.model_dump()}

def ambil_semua_laporan(conn, status: str = None) -> list[dict]:
    """Ambil semua laporan. Filter by status jika diberikan."""
    cursor = get_cursor(conn)
    if status:
        cursor.execute(
            "SELECT l.*, k.nama_kecamatan FROM laporan_harga l JOIN kecamatan k ON l.id_kecamatan = k.id_kecamatan WHERE l.status = %s ORDER BY l.tanggal_laporan DESC",
            (status,)
        )
    else:
        cursor.execute(
            "SELECT l.*, k.nama_kecamatan FROM laporan_harga l JOIN kecamatan k ON l.id_kecamatan = k.id_kecamatan ORDER BY l.tanggal_laporan DESC"
        )
    data = cursor.fetchall()
    cursor.close()
    return data

def update_status_laporan(conn, id_laporan: int, status: str, catatan: str = None) -> bool:
    """Admin mengubah status laporan."""
    cursor = get_cursor(conn)
    cursor.execute(
        "UPDATE laporan_harga SET status = %s, catatan_admin = %s WHERE id_laporan = %s",
        (status, catatan, id_laporan)
    )
    conn.commit()
    affected = cursor.rowcount
    cursor.close()
    return affected > 0
