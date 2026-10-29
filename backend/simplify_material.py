import mysql.connector
from app.config import DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT

def simplify():
    conn = mysql.connector.connect(
        host=DB_HOST, port=DB_PORT, user=DB_USER,
        password=DB_PASSWORD, database=DB_NAME
    )
    cursor = conn.cursor(dictionary=True)

    # 1. Sederhanakan di tabel katalog_harga
    cursor.execute(
        "UPDATE katalog_harga SET nama_material = 'Semen Gresik 50kg' WHERE nama_material LIKE '%Portland Type 1%'"
    )
    print(f"katalog_harga diperbarui: {cursor.rowcount} baris")

    # 2. Sederhanakan di tabel laporan_harga
    cursor.execute(
        "UPDATE laporan_harga SET nama_material = 'Semen Gresik 50kg' WHERE nama_material LIKE '%Portland Type 1%'"
    )
    print(f"laporan_harga diperbarui: {cursor.rowcount} baris")

    # 3. Sederhanakan di tabel ssh_harga (jika ada)
    cursor.execute(
        "UPDATE ssh_harga SET nama_material = 'Semen Gresik 50kg' WHERE nama_material LIKE '%Portland Type 1%'"
    )
    print(f"ssh_harga diperbarui: {cursor.rowcount} baris")

    conn.commit()
    cursor.close()
    conn.close()
    print("Penyederhanaan nama material selesai.")

if __name__ == "__main__":
    simplify()
