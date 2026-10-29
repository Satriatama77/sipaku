import mysql.connector
from app.config import DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT

def clean():
    conn = mysql.connector.connect(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME
    )
    cursor = conn.cursor(dictionary=True)

    # 1. Hapus laporan dengan nama_toko 'TB Test'
    cursor.execute("DELETE FROM laporan_harga WHERE nama_toko LIKE '%TB Test%'")
    print(f"Laporan dummy dihapus: {cursor.rowcount} baris")

    # 2. Hapus user 'wargatest1' (Warga Uji Coba)
    cursor.execute("DELETE FROM users WHERE username = 'wargatest1'")
    print(f"User dummy dihapus: {cursor.rowcount} baris")

    conn.commit()
    cursor.close()
    conn.close()
    print("Pembersihan database berhasil.")

if __name__ == "__main__":
    clean()
