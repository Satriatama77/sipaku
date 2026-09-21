# SIPAKU — Sistem Informasi Harga Konstruksi

Aplikasi web full-stack untuk mengelola **informasi harga konstruksi** dan **toko bangunan**, dilengkapi fitur pencarian dan autentikasi berbasis peran (RBAC).

---

## 📐 Arsitektur Sistem

```
sipaku/
├── backend/          ← Python FastAPI (REST API)
│   ├── main.py       ← Semua endpoint API
│   └── env/          ← Python Virtual Environment (venv)
├── frontend/         ← React + Vite (UI)
│   ├── src/
│   │   ├── main.jsx  ← Entry point React
│   │   ├── App.jsx   ← Komponen utama
│   │   ├── App.css   ← Styling komponen
│   │   └── index.css ← Global styling (dark/light mode)
│   ├── index.html    ← HTML shell
│   └── vite.config.js
└── README.md
```

### Alur Sistem

```
┌─────────────────┐        HTTP Request        ┌──────────────────────┐
│                 │  ────────────────────────►  │                      │
│  Frontend       │                             │  Backend             │
│  React + Vite   │  ◄────────────────────────  │  FastAPI (Python)    │
│  Port: 5173     │        JSON Response        │  Port: 8000          │
└─────────────────┘                             └──────────┬───────────┘
                                                           │ SQL Query
                                                           ▼
                                                ┌──────────────────────┐
                                                │  MySQL Database      │
                                                │  (XAMPP)             │
                                                │  DB: sipaku_db       │
                                                └──────────────────────┘
```

---

## 🔌 Backend — FastAPI

**Teknologi:** Python 3.14, FastAPI, MySQL Connector
**Database:** MySQL via XAMPP (`sipaku_db`)

| Endpoint | Method | Fungsi |
|---|---|---|
| `/` | GET | Cek status API |
| `/api/toko` | GET | Ambil semua data toko bangunan |
| `/api/toko/cari/{keyword}` | GET | Cari toko berdasarkan nama |
| `/api/login/{username}/{password}` | GET | Login user dengan RBAC |

**Tabel Database yang dibutuhkan:**

```sql
CREATE TABLE toko_bangunan (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nama_toko VARCHAR(255),
    alamat TEXT,
    telepon VARCHAR(20)
);

CREATE TABLE users (
    id_user INT AUTO_INCREMENT PRIMARY KEY,
    nama_lengkap VARCHAR(255),
    username VARCHAR(100),
    password VARCHAR(255),
    role VARCHAR(50)
);
```

---

## 🎨 Frontend — React + Vite

**Teknologi:** React 19, Vite 8, Axios, Leaflet (peta), React Router DOM

| Library | Kegunaan |
|---|---|
| `axios` | HTTP request ke backend |
| `leaflet` + `react-leaflet` | Fitur peta lokasi toko |
| `react-router-dom` | Navigasi antar halaman |

---

## 🚀 Cara Menjalankan

### Prasyarat

- XAMPP (MySQL aktif)
- Python 3.14
- Node.js + npm

### 1. Siapkan Database MySQL

1. Buka **XAMPP Control Panel** → Start **Apache** dan **MySQL**
2. Buka `http://localhost/phpmyadmin`
3. Buat database baru: **`sipaku_db`**
4. Jalankan query SQL pembuatan tabel di atas

### 2. Jalankan Backend

```powershell
# Masuk ke folder backend
cd sipaku/backend

# Aktifkan virtual environment
.\env\Scripts\activate

# Jalankan server FastAPI
uvicorn main:app --reload
```

- API berjalan di: `http://localhost:8000`
- Dokumentasi API (Swagger): `http://localhost:8000/docs`

### 3. Jalankan Frontend

Buka terminal **baru**:

```powershell
# Masuk ke folder frontend
cd sipaku/frontend

# Install dependency (pertama kali)
npm install

# Jalankan dev server
npm run dev
```

- Frontend berjalan di: `http://localhost:5173`

---

## 🌿 Git Branch

| Branch | Isi |
|---|---|
| `main` | Branch utama / merge point |
| `backend` | Kode Python FastAPI |
| `frontend` | Kode React + Vite |

---

## ⚠️ Catatan Penting

- **Password belum di-hash** — Untuk production, gunakan `bcrypt` atau library hashing lainnya.
- **Login via GET request** — Mengirim password lewat URL tidak aman. Ganti ke `POST` di tahap produksi.
- **Frontend belum terhubung ke backend** — `App.jsx` masih dalam tahap pengembangan awal.