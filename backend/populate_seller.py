import json
from app.database import _pool, get_cursor

def populate_toko_babat():
    conn = _pool.get_connection()
    cur = get_cursor(conn)
    # Pastikan TB Jaya Makmur Babat memiliki komoditas standar
    items = [
        ("Semen Gresik PPC 50kg", 60000.0, "zak", 150),
        ("Besi Beton Polos 10mm SNI (12m)", 80000.0, "batang", 220),
        ("Pasir Pasang Lumajang (M3)", 275000.0, "m3", 45),
        ("Bata Merah Press Tikung", 850.0, "biji", 8500),
        ("Genteng Karangpilang Good Year", 4200.0, "buah", 1200),
        ("Cat Tembok Weathershield 5kg", 120000.0, "pail", 35),
        ("Pipa PVC 4\" AW SNI", 92000.0, "batang", 80),
        ("Baja Ringan Canal C75 (0.75mm)", 84000.0, "batang", 140),
        ("Keramik Lantai 40x40 Polos", 62000.0, "dus", 95),
        ("Kayu Kaso 5x7 Meranti", 33000.0, "batang", 110),
    ]

    for nama, harga, sat, stok in items:
        cur.execute("SELECT id_katalog FROM katalog_harga WHERE id_toko = 3 AND nama_material = %s", (nama,))
        row = cur.fetchone()
        if row:
            cur.execute("UPDATE katalog_harga SET harga_jual = %s, satuan = %s, stok_tersedia = %s WHERE id_katalog = %s",
                        (harga, sat, stok, row['id_katalog']))
        else:
            cur.execute("INSERT INTO katalog_harga (id_toko, nama_material, harga_jual, satuan, stok_tersedia, terakhir_diperbarui) VALUES (%s, %s, %s, %s, %s, NOW())",
                        (3, nama, harga, sat, stok))
    
    conn.commit()
    print("Populated toko 3 items successfully!")
    cur.close()
    conn.close()

if __name__ == "__main__":
    populate_toko_babat()
