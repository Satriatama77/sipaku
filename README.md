# SIPAKU — Sistem Informasi Pengaduan dan Komparasi Harga Material Konstruksi

Platform web berbasis **e-governance** untuk transparansi dan pengawasan harga material konstruksi di **Kabupaten Lamongan**, dilengkapi fitur pelaporan warga, input harga via suara (NLP), dan dasbor analitik untuk Dinas PU.

---

## 🏗️ Arsitektur Sistem

```
┌─────────────────────┐       HTTP / REST API       ┌──────────────────────────┐
│                     │  ─────────────────────────►  │                          │
│  Frontend           │                              │  Backend                 │
│  React 19 + Vite 8  │  ◄─────────────────────────  │  Python FastAPI          │
│  Port: 5173         │       JSON Response          │  Port: 8000              │
└─────────────────────┘                              └───────────┬──────────────┘
                                                                 │ SQL Query
                                                                 ▼
                                                     ┌──────────────────────────┐
                                                     │  MySQL Database (XAMPP)  │
                                                     │  DB: sipaku_db           │
                                                     └──────────────────────────┘
```

### Tiga Role Pengguna (RBAC)

| Role | Deskripsi | Akses |
|---|---|---|
| **Pembeli** | Warga / Pemborong | Lihat harga SSH, lapor harga, riwayat laporan |
| **Penjual** | Pemilik Toko Bangunan | Kelola katalog harga, input harga via suara NLP |
| **Admin** | Dinas PU / Instansi | Verifikasi laporan, dasbor statistik, peta disparitas |

---

## 📁 Struktur File Lengkap

### Frontend (`sipaku/frontend/`)

```
frontend/
├── .env                           # VITE_API_BASE_URL=http://localhost:8000
├── index.html
├── package.json
├── vite.config.js
└── src/
    ├── App.jsx                    # Root → render AppRouter
    ├── main.jsx                   # Entry point React
    ├── index.css                  # Global CSS & design tokens
    │
    ├── router/
    │   └── AppRouter.jsx          # Semua route + ProtectedRoute per role
    │
    ├── context/
    │   └── AuthContext.jsx        # Provider: user, role, login, logout
    │
    ├── hooks/
    │   ├── useVoiceRecorder.js    # MediaRecorder API (mic capture → Blob)
    │   └── useDisparitas.js       # Kalkulasi % selisih harga vs SSH (memoized)
    │
    ├── services/                  # Layer HTTP Axios ke backend
    │   ├── api.js                 # Axios instance + JWT interceptors
    │   ├── authService.js         # login, logout, getCurrentUser
    │   ├── hargaService.js        # getDataSSH, komparasiHarga
    │   ├── laporanService.js      # getLaporan, submitLaporan
    │   ├── adminService.js        # getStatistik, updateStatusLaporan
    │   └── voiceService.js        # kirimAudio (multipart/form-data ke NLP)
    │
    ├── components/                # Komponen UI reusable (shared)
    │   ├── Navbar.jsx             # Nav dinamis per role + tombol logout
    │   ├── StatusBadge.jsx        # Badge: Normal / Waspada / Merah / Pending
    │   └── ProtectedRoute.jsx     # Guard route berdasarkan role
    │
    ├── data/                      # Data lokal (Mock / Master)
    │   ├── ssh_lamongan.js        # 23 item harga SSH Kab. Lamongan 2025
    │   └── kecamatan_lamongan.json # 27 kecamatan (kode wilayah Kemendagri)
    │
    └── features/                  # Fitur dikelompokkan per role
        ├── auth/
        │   └── LoginPage.jsx      # Form login → redirect ke dashboard role
        │
        ├── pembeli/               # Role: Warga / Pemborong
        │   ├── PembeliDashboard.jsx   # Tabel harga acuan SSH
        │   ├── LaporHargaPage.jsx     # Form laporan + preview disparitas live
        │   └── RiwayatLaporan.jsx     # Tabel riwayat laporan + status
        │
        ├── penjual/               # Role: Pemilik Toko Bangunan
        │   ├── PenjualDashboard.jsx   # Hub navigasi penjual
        │   ├── KatalogHargaPage.jsx   # Katalog harga material toko
        │   └── VoiceInputPage.jsx     # Mic recorder + parsing NLP + preview
        │
        └── admin/                 # Role: Dinas PU / Admin
            ├── AdminDashboard.jsx     # Statistik: total laporan, zona merah
            ├── VerifikasiPage.jsx     # Tabel laporan + ubah status inline
            └── PetaDisparitasPage.jsx # Peta Leaflet: titik anomali per kecamatan
```

---

### Backend (`sipaku/backend/`)

```
backend/
├── requirements.txt               # Daftar dependency Python
├── main.py                        # Entry point lama (deprecated, gunakan app/)
└── app/
    ├── main.py                    # FastAPI: mount router + CORS + RBAC middleware
    ├── config.py                  # Konfigurasi: DB, JWT, CORS dari .env
    ├── database.py                # MySQL Connection Pool (pool_size=5)
    │
    ├── routers/                   # Endpoint API per domain
    │   ├── auth_router.py         # POST /api/auth/login, /logout
    │   ├── laporan_router.py      # GET/POST /api/laporan, GET /api/laporan/{id}
    │   ├── katalog_router.py      # GET/PUT /api/katalog/{id_toko}
    │   ├── harga_router.py        # GET /api/harga/ssh, /api/harga/komparasi
    │   ├── admin_router.py        # GET /api/admin/laporan, PATCH status, GET statistik
    │   └── nlp_router.py          # POST /api/nlp/voice-to-text, /text-parse
    │
    ├── services/                  # Logika bisnis utama
    │   ├── auth_service.py        # Verifikasi credential, bcrypt, JWT token
    │   ├── laporan_service.py     # CRUD laporan + auto-hitung disparitas
    │   ├── katalog_service.py     # CRUD katalog harga toko
    │   ├── disparitas_service.py  # Algoritma % selisih harga + zona status
    │   └── nlp_service.py         # Parser NLP regex (ID) + Whisper stub
    │
    ├── schemas/                   # Pydantic validation (request/response)
    │   ├── auth_schema.py         # LoginRequest, LoginResponse
    │   ├── laporan_schema.py      # LaporanCreate, LaporanResponse, StatusUpdate
    │   ├── katalog_schema.py      # KatalogUpdate, KatalogResponse
    │   └── harga_schema.py        # HargaSSH, DisparitasResult
    │
    ├── middleware/
    │   └── auth_middleware.py     # JWT verification + RBAC guard per prefix
    │
    └── data/
        └── ssh_lamongan.json      # Mock API: 23 item harga SSH Lamongan 2025
```

---

## 🔌 Daftar Endpoint API

| Method | Endpoint | Role | Fungsi |
|---|---|---|---|
| POST | `/api/auth/login` | Publik | Login → JWT token |
| POST | `/api/auth/logout` | Publik | Logout (hapus token) |
| GET | `/api/harga/ssh` | Publik | Ambil data SSH Lamongan |
| GET | `/api/harga/komparasi` | Semua | Kalkulasi disparitas real-time |
| GET | `/api/laporan` | Semua | Ambil laporan (filter by status) |
| POST | `/api/laporan` | Pembeli | Submit laporan harga baru |
| GET | `/api/laporan/{id}` | Semua | Detail satu laporan |
| GET | `/api/katalog/{id_toko}` | Penjual | Katalog harga toko |
| PUT | `/api/katalog/{id_toko}` | Penjual | Update harga di katalog |
| GET | `/api/admin/laporan` | Admin | Semua laporan untuk verifikasi |
| PATCH | `/api/admin/laporan/{id}/status` | Admin | Ubah status laporan |
| GET | `/api/admin/statistik` | Admin | Ringkasan dasbor admin |
| POST | `/api/nlp/voice-to-text` | Penjual | Upload audio → parsing harga NLP |
| POST | `/api/nlp/text-parse` | Penjual | Parsing teks manual (debug) |

---

## 🗄️ Skema Database

```sql
-- Tabel master wilayah
CREATE TABLE kecamatan (
    id_kecamatan INT PRIMARY KEY,
    nama_kecamatan VARCHAR(100) NOT NULL,
    kode_wilayah VARCHAR(20)
);

-- Tabel pengguna (RBAC)
CREATE TABLE users (
    id_user INT AUTO_INCREMENT PRIMARY KEY,
    nama_lengkap VARCHAR(255) NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,   -- bcrypt hash
    role ENUM('pembeli', 'penjual', 'admin') NOT NULL
);

-- Tabel toko bangunan
CREATE TABLE toko_bangunan (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nama_toko VARCHAR(255) NOT NULL,
    id_kecamatan INT,
    alamat TEXT,
    telepon VARCHAR(20),
    FOREIGN KEY (id_kecamatan) REFERENCES kecamatan(id_kecamatan)
);

-- Tabel katalog harga (dikelola penjual)
CREATE TABLE katalog_harga (
    id_katalog INT AUTO_INCREMENT PRIMARY KEY,
    id_toko INT NOT NULL,
    nama_material VARCHAR(255) NOT NULL,
    harga_jual DECIMAL(15,2) NOT NULL,
    satuan VARCHAR(50),
    stok_tersedia BOOLEAN DEFAULT TRUE,
    terakhir_diperbarui DATETIME,
    FOREIGN KEY (id_toko) REFERENCES toko_bangunan(id)
);

-- Tabel laporan harga (dari warga)
CREATE TABLE laporan_harga (
    id_laporan INT AUTO_INCREMENT PRIMARY KEY,
    id_pelapor INT NOT NULL,
    id_kecamatan INT NOT NULL,
    nama_toko VARCHAR(255),
    nama_material VARCHAR(255) NOT NULL,
    harga_temuan DECIMAL(15,2) NOT NULL,
    harga_ssh DECIMAL(15,2),
    persentase_disparitas DECIMAL(8,2),
    status ENUM('Pending','Tindak Lanjut','Selesai') DEFAULT 'Pending',
    catatan_admin TEXT,
    foto_url VARCHAR(500),
    tanggal_laporan DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_pelapor) REFERENCES users(id_user),
    FOREIGN KEY (id_kecamatan) REFERENCES kecamatan(id_kecamatan)
);
```

---

## 🚀 Cara Menjalankan

### Prasyarat
- XAMPP (MySQL aktif)
- Python 3.14
- Node.js + npm

### 1. Siapkan Database

1. Buka **XAMPP Control Panel** → Start **Apache** dan **MySQL**
2. Buka `http://localhost/phpmyadmin`
3. Buat database baru: **`sipaku_db`**
4. Jalankan query SQL di atas untuk membuat semua tabel

### 2. Jalankan Backend

```powershell
cd sipaku/backend

# Aktifkan virtual environment
.\env\Scripts\activate

# Install semua dependency (pertama kali)
pip install -r requirements.txt

# Jalankan FastAPI dev server
uvicorn app.main:app --reload
```

- API aktif di: `http://localhost:8000`
- Dokumentasi Swagger: `http://localhost:8000/docs`

### 3. Jalankan Frontend

Buka terminal **baru**:

```powershell
cd sipaku/frontend

# Install dependency (pertama kali)
npm install

# Jalankan Vite dev server
npm run dev
```

- Frontend aktif di: `http://localhost:5173`

### 4. Akun Demo / Testing (Login)

Gunakan salah satu akun berikut untuk login sesuai role di `http://localhost:5173/login`:

| Role | Nama Pengguna | Username | Password | Dashboard Tujuan |
|---|---|---|---|---|
| **Admin** | Administrator | `admin` | `admin123` | `/admin` |
| **Admin (Petugas)** | Petugas Survei | `admin1` | `12345` | `/admin` |
| **Pembeli (Warga)** | Budi Santoso | `pembeli1` | `pembeli123` | `/pembeli` |
| **Penjual (Toko)** | TB Berkah Abadi | `penjual1` | `penjual123` | `/penjual` |

---

## 🧠 Fitur Utama

| Fitur | Deskripsi |
|---|---|
| **Dasbor Komparasi Harga** | Tabel harga SSH sebagai referensi warga |
| **Form Lapor Harga** | Warga lapor harga temuan + preview disparitas live sebelum submit |
| **Kalkulator Disparitas** | Algoritma otomatis hitung % selisih → Normal / Waspada / Zona Merah |
| **Voice Input NLP** | Penjual ucapkan harga → diproses AI → update katalog otomatis |
| **Peta Disparitas** | Peta Leaflet interaktif: titik anomali harga per kecamatan Lamongan |
| **Verifikasi Admin** | Dinas PU ubah status laporan: Pending → Tindak Lanjut → Selesai |

---

## 🌿 Git Branch

| Branch | Isi |
|---|---|
| `main` | Branch utama / merge point |
| `backend` | Kode Python FastAPI (`backend/app/`) |
| `frontend` | Kode React + Vite (`frontend/src/`) |

---

## ⚠️ Catatan Pengembangan

- **NLP Voice Input** — `nlp_service.py` saat ini menggunakan parser regex. Integrasi Whisper (OpenAI) sudah disiapkan sebagai stub di fungsi `transkripsi_audio()`.
- **Mock API SSH** — Data harga menggunakan simulasi JSON lokal (`app/data/ssh_lamongan.json`) karena Pemkab Lamongan belum memiliki Open Data API.
- **Keamanan Password** — Mendukung bcrypt hash. Untuk production, pastikan semua password di-hash sebelum disimpan.
- **Data 27 Kecamatan** — Bersumber dari repositori Open Source Kemendagri (cahyadsn) yang telah disaring untuk kode wilayah `35.24.*`.