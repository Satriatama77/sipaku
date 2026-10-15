from pydantic import BaseModel
from typing import Optional, Literal
from datetime import datetime

class LaporanCreate(BaseModel):
    id_kecamatan: int
    nama_toko: str
    nama_material: str
    harga_temuan: float          # Harga yang ditemukan warga (Rp)
    satuan: str                  # misal: "zak", "batang", "m3"
    nama_pelapor: Optional[str] = "Warga Anonim"
    foto_url: Optional[str] = None   # URL file yang diupload

class LaporanResponse(BaseModel):
    id_laporan: int
    id_kecamatan: int
    nama_kecamatan: str
    nama_toko: str
    nama_material: str
    harga_temuan: float
    harga_ssh: Optional[float] = None   # Data dari Mock SSH
    persentase_disparitas: Optional[float] = None
    status: Literal["Pending", "Tindak Lanjut", "Selesai"] = "Pending"
    tanggal_laporan: datetime

class LaporanStatusUpdate(BaseModel):
    status: Literal["Pending", "Tindak Lanjut", "Selesai"]
    catatan_admin: Optional[str] = None
