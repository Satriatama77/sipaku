# Import aplikasi utama dari app.main agar perintah `uvicorn main:app` dan `uvicorn app.main:app` bekerja sama baiknya
from app.main import app

# Fungsi untuk membuka koneksi ke database MySQL (XAMPP)
def get_db_connection():
    return mysql.connector.connect(
        host="localhost",
        user="root",        # Username default XAMPP
        password="",        # Password default XAMPP (kosong)
        database="sipaku_db"
    )

# Endpoint 1: Cek Status API
@app.get("/")
def cek_status():
    return {"pesan": "Selamat, API Backend SIPAKU berhasil menyala!"}

# Endpoint 2: Mengambil Data Toko Bangunan (Contoh REST API Dasar)
@app.get("/api/toko")
def get_semua_toko():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True) # dictionary=True agar formatnya JSON rapi
    
    # Menjalankan perintah SQL
    cursor.execute("SELECT * FROM toko_bangunan")
    data_toko = cursor.fetchall()
    
    # Tutup koneksi
    cursor.close()
    conn.close()
    
    return {"status": "sukses", "data": data_toko}

# Endpoint 3: Mencari Toko Bangunan berdasarkan Nama (Fitur Search)
@app.get("/api/toko/cari/{keyword}")
def cari_toko(keyword: str):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    # Gunakan LIKE untuk pencarian kata (misal: mencari "bangun" akan memunculkan "TB. Bangun Djaya")
    query = "SELECT * FROM toko_bangunan WHERE nama_toko LIKE %s"
    search_pattern = (f"%{keyword}%",)
    
    cursor.execute(query, search_pattern)
    hasil_pencarian = cursor.fetchall()
    
    cursor.close()
    conn.close()
    
    # Beri respons berbeda jika data tidak ditemukan
    if not hasil_pencarian:
         return {"status": "gagal", "pesan": f"Toko dengan kata kunci '{keyword}' tidak ditemukan", "data": []}
         
    return {"status": "sukses", "data": hasil_pencarian}

# Endpoint 4: Log Masuk RBAC (Semakan Username & Password)
@app.get("/api/login/{username}/{password}")
def login_petugas(username: str, password: str):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    # Mencari user yang padan dalam jadual users
    query = "SELECT id_user, nama_lengkap, role FROM users WHERE username = %s AND password = %s"
    # Awas: Dalam projek sebenar, password tidak boleh dibaca seperti ini dan harus di-hash (misalnya menggunakan bcrypt).
    # Namun untuk fasa purprototip ini, kita guna semakan asas dahulu.
    credentials = (username, password)
    
    cursor.execute(query, credentials)
    user_info = cursor.fetchone()
    
    cursor.close()
    conn.close()
    
    if user_info:
         return {"status": "berjaya", "pesan": f"Selamat datang, {user_info['nama_lengkap']}!", "data_user": user_info}
    else:
         return {"status": "gagal", "pesan": "Log masuk gagal. Sila semak nama pengguna dan kata laluan anda."}