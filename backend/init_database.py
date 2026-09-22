"""
Database initialization script - creates all tables and seeds demo data
Run this script once to set up the database for SIPAKU
"""
import mysql.connector
from app.config import DB_HOST, DB_USER, DB_PASSWORD, DB_PORT
from app.services.auth_service import hash_password

def create_database():
    """Create database if not exists"""
    conn = mysql.connector.connect(
        host=DB_HOST,
        user=DB_USER,
        password=DB_PASSWORD,
        port=DB_PORT
    )
    cursor = conn.cursor()
    try:
        cursor.execute("CREATE DATABASE IF NOT EXISTS sipaku_db")
        print("✓ Database sipaku_db created/exists")
    finally:
        cursor.close()
        conn.close()

def create_tables():
    """Create all required tables"""
    conn = mysql.connector.connect(
        host=DB_HOST,
        user=DB_USER,
        password=DB_PASSWORD,
        database="sipaku_db",
        port=DB_PORT
    )
    cursor = conn.cursor()
    
    tables = [
        """
        CREATE TABLE IF NOT EXISTS kecamatan (
            id_kecamatan INT PRIMARY KEY,
            nama_kecamatan VARCHAR(100) NOT NULL,
            kode_wilayah VARCHAR(20)
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS users (
            id_user INT AUTO_INCREMENT PRIMARY KEY,
            nama_lengkap VARCHAR(255) NOT NULL,
            username VARCHAR(100) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            role ENUM('pembeli', 'penjual', 'admin') NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS toko_bangunan (
            id INT AUTO_INCREMENT PRIMARY KEY,
            nama_toko VARCHAR(255) NOT NULL,
            id_kecamatan INT,
            alamat TEXT,
            telepon VARCHAR(20),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (id_kecamatan) REFERENCES kecamatan(id_kecamatan)
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS katalog_harga (
            id_katalog INT AUTO_INCREMENT PRIMARY KEY,
            id_toko INT NOT NULL,
            nama_material VARCHAR(255) NOT NULL,
            harga_jual DECIMAL(15,2) NOT NULL,
            satuan VARCHAR(50),
            stok_tersedia BOOLEAN DEFAULT TRUE,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (id_toko) REFERENCES toko_bangunan(id)
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS laporan_harga (
            id_laporan INT AUTO_INCREMENT PRIMARY KEY,
            id_user INT NOT NULL,
            nama_material VARCHAR(255) NOT NULL,
            harga_lapor DECIMAL(15,2) NOT NULL,
            harga_ssh DECIMAL(15,2),
            disparitas_persen FLOAT,
            status_zona VARCHAR(20),
            status_laporan ENUM('pending', 'verified', 'rejected') DEFAULT 'pending',
            id_kecamatan INT,
            catatan TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (id_user) REFERENCES users(id_user),
            FOREIGN KEY (id_kecamatan) REFERENCES kecamatan(id_kecamatan)
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS ssh_harga (
            id_ssh INT AUTO_INCREMENT PRIMARY KEY,
            nama_material VARCHAR(255) NOT NULL,
            harga_ssh DECIMAL(15,2) NOT NULL,
            satuan VARCHAR(50),
            tahun INT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """
    ]
    
    for i, table_sql in enumerate(tables, 1):
        try:
            cursor.execute(table_sql)
            print(f"✓ Table {i}/6 created")
        except mysql.connector.Error as e:
            print(f"✗ Error creating table {i}: {e}")
    
    conn.commit()
    cursor.close()
    conn.close()

def seed_demo_users():
    """Seed demo user accounts"""
    conn = mysql.connector.connect(
        host=DB_HOST,
        user=DB_USER,
        password=DB_PASSWORD,
        database="sipaku_db",
        port=DB_PORT
    )
    cursor = conn.cursor()
    
    demo_users = [
        ("admin", "Admin Dinas PU", "admin123", "admin"),
        ("pembeli1", "Budi Santoso", "pembeli123", "pembeli"),
        ("penjual1", "Toko Material Jaya", "penjual123", "penjual"),
    ]
    
    for username, nama_lengkap, password, role in demo_users:
        # Check if user exists
        cursor.execute("SELECT id_user FROM users WHERE username = %s", (username,))
        if cursor.fetchone():
            print(f"⚠ User {username} already exists, skipping")
            continue
        
        hashed_pwd = hash_password(password)
        try:
            cursor.execute(
                "INSERT INTO users (username, nama_lengkap, password, role) VALUES (%s, %s, %s, %s)",
                (username, nama_lengkap, hashed_pwd, role)
            )
            print(f"✓ User {username} ({role}) created")
        except mysql.connector.Error as e:
            print(f"✗ Error creating user {username}: {e}")
    
    conn.commit()
    cursor.close()
    conn.close()

def seed_kecamatan():
    """Seed kecamatan data"""
    import json
    
    conn = mysql.connector.connect(
        host=DB_HOST,
        user=DB_USER,
        password=DB_PASSWORD,
        database="sipaku_db",
        port=DB_PORT
    )
    cursor = conn.cursor()
    
    try:
        # Try to load from frontend data
        with open('frontend/src/data/kecamatan_lamongan.json', 'r', encoding='utf-8') as f:
            kecamatans = json.load(f)
        
        for k in kecamatans:
            cursor.execute(
                "INSERT INTO kecamatan (id_kecamatan, nama_kecamatan, kode_wilayah) VALUES (%s, %s, %s) ON DUPLICATE KEY UPDATE nama_kecamatan = VALUES(nama_kecamatan)",
                (k['id_kecamatan'], k['nama_kecamatan'], k.get('kode_wilayah', ''))
            )
        
        conn.commit()
        print(f"✓ Seeded {len(kecamatans)} kecamatan data")
    except FileNotFoundError:
        print("⚠ kecamatan_lamongan.json not found, skipping kecamatan seed")
    except Exception as e:
        print(f"✗ Error seeding kecamatan: {e}")
    finally:
        cursor.close()
        conn.close()

def seed_ssh_harga():
    """Seed SSH harga reference data"""
    import json
    
    conn = mysql.connector.connect(
        host=DB_HOST,
        user=DB_USER,
        password=DB_PASSWORD,
        database="sipaku_db",
        port=DB_PORT
    )
    cursor = conn.cursor()
    
    try:
        with open('backend/app/data/ssh_lamongan.json', 'r', encoding='utf-8') as f:
            ssh_data = json.load(f)
        
        for item in ssh_data:
            cursor.execute(
                "INSERT INTO ssh_harga (nama_material, harga_ssh, satuan, tahun) VALUES (%s, %s, %s, %s) ON DUPLICATE KEY UPDATE harga_ssh = VALUES(harga_ssh)",
                (item['nama'], item['harga'], item.get('satuan', 'unit'), 2025)
            )
        
        conn.commit()
        print(f"✓ Seeded {len(ssh_data)} SSH harga data")
    except FileNotFoundError:
        print("⚠ ssh_lamongan.json not found, skipping SSH seed")
    except Exception as e:
        print(f"✗ Error seeding SSH data: {e}")
    finally:
        cursor.close()
        conn.close()

def seed_demo_toko():
    """Seed demo stores"""
    conn = mysql.connector.connect(
        host=DB_HOST,
        user=DB_USER,
        password=DB_PASSWORD,
        database="sipaku_db",
        port=DB_PORT
    )
    cursor = conn.cursor()
    
    demo_toko = [
        ("Toko Material Jaya", 1, "Jl. Urip Sumoharjo No. 45, Lamongan", "0812-3456-7890"),
        ("Toko Bangunan Berkah", 2, "Jl. Ahmad Yani No. 67, Lamongan", "0812-3456-7891"),
        ("Toko Bahan Bangunan Murni", 3, "Jl. Gatot Subroto No. 89, Lamongan", "0812-3456-7892"),
    ]
    
    for nama_toko, id_kecamatan, alamat, telepon in demo_toko:
        cursor.execute("SELECT id FROM toko_bangunan WHERE nama_toko = %s", (nama_toko,))
        if cursor.fetchone():
            print(f"⚠ Toko {nama_toko} already exists, skipping")
            continue
        
        try:
            cursor.execute(
                "INSERT INTO toko_bangunan (nama_toko, id_kecamatan, alamat, telepon) VALUES (%s, %s, %s, %s)",
                (nama_toko, id_kecamatan, alamat, telepon)
            )
            print(f"✓ Toko {nama_toko} created")
        except mysql.connector.Error as e:
            print(f"✗ Error creating toko {nama_toko}: {e}")
    
    conn.commit()
    cursor.close()
    conn.close()

if __name__ == "__main__":
    print("\n🚀 Starting SIPAKU Database Initialization...\n")
    
    try:
        print("Step 1: Creating database...")
        create_database()
        print()
        
        print("Step 2: Creating tables...")
        create_tables()
        print()
        
        print("Step 3: Seeding kecamatan data...")
        seed_kecamatan()
        print()
        
        print("Step 4: Seeding SSH harga data...")
        seed_ssh_harga()
        print()
        
        print("Step 5: Seeding demo users...")
        seed_demo_users()
        print()
        
        print("Step 6: Seeding demo stores...")
        seed_demo_toko()
        print()
        
        print("✅ Database initialization completed successfully!\n")
        print("Demo accounts:")
        print("  - Admin: admin / admin123")
        print("  - Pembeli: pembeli1 / pembeli123")
        print("  - Penjual: penjual1 / penjual123\n")
        
    except Exception as e:
        print(f"\n❌ Initialization failed: {e}\n")
        exit(1)
