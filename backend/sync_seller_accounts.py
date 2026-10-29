import mysql.connector
from app.config import DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT

def main():
    conn = mysql.connector.connect(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME
    )
    cursor = conn.cursor(dictionary=True)

    try:
        # 1. Ambil seluruh data toko
        cursor.execute("SELECT id_toko, nama_toko, nama_pemilik FROM toko_bangunan ORDER BY id_toko ASC")
        tokos = cursor.fetchall()
        print(f"Ditemukan {len(tokos)} toko bangunan:")

        # 2. Update username sementara untuk menghindari duplicate key error jika username penjual1 bentrok
        cursor.execute("UPDATE users SET username = CONCAT('_temp_', id_user, '_', username) WHERE role = 'penjual'")
        print("Username sementara berhasil diset.")

        # 3. Update nama_lengkap, username, dan password untuk setiap akun penjual berdasarkan id_toko
        for t in tokos:
            id_toko = t['id_toko']
            nama_toko = t['nama_toko']
            new_username = f"penjual{id_toko}"
            new_password = "penjual123"

            cursor.execute(
                """
                UPDATE users 
                SET nama_lengkap = %s, username = %s, password = %s 
                WHERE role = 'penjual' AND id_toko = %s
                """,
                (nama_toko, new_username, new_password, id_toko)
            )
            print(f"Toko ID {id_toko} ({nama_toko}) -> Username: {new_username}, Password: {new_password}, Nama Lengkap: {nama_toko}")

        conn.commit()
        print("\nBERHASIL: Transaksi database telah di-commit tanpa error!")

        # 4. Tampilkan hasil akhir tabel users
        cursor.execute("SELECT id_user, nama_lengkap, username, password, role, id_toko FROM users WHERE role = 'penjual' ORDER BY id_toko ASC")
        updated_users = cursor.fetchall()
        print("\n=== DATA AKUN PENJUAL SETELAH DISERAGAMKAN ===")
        for u in updated_users:
            print(f"ID User: {u['id_user']} | Toko ID: {u['id_toko']} | Nama Lengkap: {u['nama_lengkap']} | Username: {u['username']} | Password: {u['password']}")

    except Exception as e:
        conn.rollback()
        print(f"ERROR: Terjadi kesalahan saat update database: {e}")
        raise e
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    main()
