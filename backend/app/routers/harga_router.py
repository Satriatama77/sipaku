from fastapi import APIRouter, Depends
from app.services.disparitas_service import get_semua_ssh, hitung_disparitas
from app.database import get_db

router = APIRouter(prefix="/api/harga", tags=["Harga & Disparitas"])

@router.get("/ssh")
def get_data_ssh():
    """Mengembalikan seluruh data Standar Satuan Harga (SSH) Kabupaten Lamongan."""
    data = get_semua_ssh()
    return {"status": "sukses", "total": len(data), "data": data}

@router.get("/komparasi")
def komparasi_harga(
    nama_material: str,
    nama_kecamatan: str,
    harga_laporan: float,
):
    """
    Hitung disparitas antara harga laporan warga dengan harga SSH.
    Digunakan oleh frontend untuk preview sebelum submit laporan.
    """
    hasil = hitung_disparitas(nama_material, nama_kecamatan, harga_laporan)
    return {"status": "sukses", "data": hasil.model_dump()}
