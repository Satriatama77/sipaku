import sys
sys.path.insert(0, r'c:\sipaku\backend')
import mysql.connector
from app.config import DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT
from datetime import datetime

def migrate():
    conn = mysql.connector.connect(
        host=DB_HOST, port=DB_PORT, user=DB_USER,
        password=DB_PASSWORD, database=DB_NAME
    )
    cursor = conn.cursor(dictionary=True)

    # 1. Cek apakah kolom kode_tiket sudah ada
    cursor.execute("SHOW COLUMNS FROM laporan_harga LIKE 'kode_tiket'")
    column = cursor.fetchone()
    if not column:
        print("Menambahkan kolom kode_tiket ke tabel laporan_harga...")
        cursor.execute("ALTER TABLE laporan_harga ADD COLUMN kode_tiket VARCHAR(30) UNIQUE NULL AFTER id_laporan")
        conn.commit()
        print("Kolom kode_tiket berhasil ditambahkan!")
    else:
        print("Kolom kode_tiket sudah ada di tabel laporan_harga.")

    # 2. Update baris yang kode_tiket-nya masih NULL
    cursor.execute("SELECT id_laporan, tanggal_laporan FROM laporan_harga WHERE kode_tiket IS NULL ORDER BY id_laporan ASC")
    rows = cursor.fetchall()
    print(f"Ditemukan {len(rows)} baris yang perlu diisi kode_tiket.")

    for r in rows:
        id_laporan = r["id_laporan"]
        tgl = r.get("tanggal_laporan")
        year = tgl.year if isinstance(tgl, datetime) else 2026
        kode = f"SPK-{year}-{id_laporan:04d}"
        cursor.execute("UPDATE laporan_harga SET kode_tiket = %s WHERE id_laporan = %s", (kode, id_laporan))
        print(f"  - Laporan #{id_laporan} -> {kode}")

    conn.commit()

    # 3. Verifikasi hasil
    cursor.execute("SELECT id_laporan, kode_tiket, nama_material, nama_toko, status FROM laporan_harga LIMIT 10")
    print("\nContoh data laporan_harga setelah migrasi:")
    for row in cursor.fetchall():
        print(f"  ID: {row['id_laporan']} | Tiket: {row['kode_tiket']} | {row['nama_material']} @ {row['nama_toko']} ({row['status']})")

    cursor.close()
    conn.close()
    print("\nMigrasi kode_tiket selesai dengan sukses!")

if __name__ == "__main__":
    migrate()
