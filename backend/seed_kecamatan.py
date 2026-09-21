import mysql.connector
import json
from app.config import DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT

def main():
    conn = mysql.connector.connect(
        host=DB_HOST,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME,
        port=DB_PORT
    )
    cursor = conn.cursor()

    # Pastikan kolom kode_wilayah ada
    cursor.execute("SHOW COLUMNS FROM kecamatan LIKE 'kode_wilayah'")
    if not cursor.fetchone():
        cursor.execute("ALTER TABLE kecamatan ADD COLUMN kode_wilayah VARCHAR(20) AFTER nama_kecamatan")

    with open('../frontend/src/data/kecamatan_lamongan.json', 'r', encoding='utf-8') as f:
        kecamatans = json.load(f)

    for k in kecamatans:
        cursor.execute(
            """
            INSERT INTO kecamatan (id_kecamatan, nama_kecamatan, kode_wilayah)
            VALUES (%s, %s, %s)
            ON DUPLICATE KEY UPDATE nama_kecamatan = VALUES(nama_kecamatan), kode_wilayah = VALUES(kode_wilayah)
            """,
            (k['id_kecamatan'], k['nama_kecamatan'], k['kode_wilayah'])
        )
    conn.commit()

    cursor.execute('SELECT id_kecamatan, nama_kecamatan, kode_wilayah FROM kecamatan ORDER BY id_kecamatan')
    rows = cursor.fetchall()
    print(f"Berhasil seed {len(rows)} kecamatan ke database sipaku_db!")
    for r in rows[:3]:
        print(" ", r)
    print("  ...")
    for r in rows[-3:]:
        print(" ", r)

    cursor.close()
    conn.close()

if __name__ == "__main__":
    main()
