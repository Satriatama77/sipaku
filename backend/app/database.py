import mysql.connector
from mysql.connector import pooling
from app.config import DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT

# ── Connection Pool ───────────────────────────────────────
# Pool lebih efisien daripada buka-tutup koneksi setiap request
_pool = pooling.MySQLConnectionPool(
    pool_name="sipaku_pool",
    pool_size=5,
    host=DB_HOST,
    port=DB_PORT,
    user=DB_USER,
    password=DB_PASSWORD,
    database=DB_NAME,
)

def get_db():
    """Mengembalikan koneksi dari pool. Selalu tutup setelah digunakan."""
    conn = _pool.get_connection()
    try:
        yield conn
    finally:
        conn.close()

def get_cursor(conn, dictionary: bool = True):
    """Shortcut untuk membuka cursor dengan format dictionary."""
    return conn.cursor(dictionary=dictionary)
