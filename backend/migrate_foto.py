"""
Script migrasi: menambahkan kolom foto_url ke tabel laporan_harga
jika kolom belum ada.
"""
import mysql.connector
from app.config import DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT

def migrate():
    conn = mysql.connector.connect(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME,
    )
    cursor = conn.cursor()
    
    # Cek apakah kolom foto_url sudah ada
    cursor.execute("""
        SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = %s AND TABLE_NAME = 'laporan_harga' AND COLUMN_NAME = 'foto_url'
    """, (DB_NAME,))
    
    if not cursor.fetchone():
        print("Menambahkan kolom foto_url ke tabel laporan_harga...")
        cursor.execute("ALTER TABLE laporan_harga ADD COLUMN foto_url VARCHAR(500) DEFAULT NULL")
        conn.commit()
        print("✓ Kolom foto_url berhasil ditambahkan!")
    else:
        print("✓ Kolom foto_url sudah ada, tidak perlu migrasi.")
    
    # Cek apakah kolom nama_pelapor sudah ada
    cursor.execute("""
        SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = %s AND TABLE_NAME = 'laporan_harga' AND COLUMN_NAME = 'nama_pelapor'
    """, (DB_NAME,))
    
    if not cursor.fetchone():
        print("Menambahkan kolom nama_pelapor ke tabel laporan_harga...")
        cursor.execute("ALTER TABLE laporan_harga ADD COLUMN nama_pelapor VARCHAR(255) DEFAULT 'Warga Anonim'")
        conn.commit()
        print("✓ Kolom nama_pelapor berhasil ditambahkan!")
    else:
        print("✓ Kolom nama_pelapor sudah ada, tidak perlu migrasi.")
    
    cursor.close()
    conn.close()
    print("\n✓ Migrasi selesai!")

if __name__ == "__main__":
    migrate()
