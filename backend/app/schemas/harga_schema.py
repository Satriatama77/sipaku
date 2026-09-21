from pydantic import BaseModel
from typing import Optional

class HargaSSH(BaseModel):
    """Representasi satu item dari data Standar Satuan Harga (SSH) Lamongan."""
    nama_material: str
    satuan: str
    harga_ssh: float          # Harga acuan pemerintah (Rp)
    tahun: int = 2025

class DisparitasResult(BaseModel):
    """Hasil kalkulasi disparitas antara harga laporan dan harga SSH."""
    nama_material: str
    nama_kecamatan: str
    harga_laporan: float
    harga_ssh: float
    selisih: float
    persentase: float         # (selisih / harga_ssh) * 100
    status_zona: str          # "Normal", "Waspada", "Merah"
