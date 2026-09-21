from fastapi import APIRouter, Depends, HTTPException
from app.schemas.laporan_schema import LaporanCreate, LaporanStatusUpdate
from app.services import laporan_service
from app.database import get_db

router = APIRouter(prefix="/api/laporan", tags=["Laporan Harga"])

@router.get("/")
def get_semua_laporan(status: str = None, conn=Depends(get_db)):
    """Ambil semua laporan. Query param ?status=Pending|Tindak Lanjut|Selesai"""
    data = laporan_service.ambil_semua_laporan(conn, status)
    return {"status": "sukses", "total": len(data), "data": data}

@router.post("/")
def buat_laporan(laporan: LaporanCreate, conn=Depends(get_db)):
    """Submit laporan harga baru dari warga/pembeli."""
    # TODO: ambil id_pelapor dari JWT token (sementara hardcode)
    id_pelapor = 1
    hasil = laporan_service.buat_laporan(conn, laporan, id_pelapor)
    return {"status": "sukses", "pesan": "Laporan berhasil dikirim", "data": hasil}

@router.get("/{id_laporan}")
def get_laporan_by_id(id_laporan: int, conn=Depends(get_db)):
    """Ambil detail satu laporan berdasarkan ID."""
    semua = laporan_service.ambil_semua_laporan(conn)
    laporan = next((l for l in semua if l["id_laporan"] == id_laporan), None)
    if not laporan:
        raise HTTPException(status_code=404, detail="Laporan tidak ditemukan")
    return {"status": "sukses", "data": laporan}
