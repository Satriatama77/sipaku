from fastapi import APIRouter, Depends, HTTPException
from app.schemas.laporan_schema import LaporanStatusUpdate
from app.services import laporan_service, katalog_service
from app.database import get_db

router = APIRouter(prefix="/api/admin", tags=["Admin - Dinas PU"])

@router.get("/laporan")
def get_laporan_admin(status: str = None, conn=Depends(get_db)):
    """Admin: ambil semua laporan untuk diverifikasi."""
    data = laporan_service.ambil_semua_laporan(conn, status)
    return {"status": "sukses", "total": len(data), "data": data}

@router.patch("/laporan/{id_laporan}/status")
def update_status(id_laporan: int, body: LaporanStatusUpdate, conn=Depends(get_db)):
    """Admin: ubah status laporan (Pending → Tindak Lanjut → Selesai)."""
    berhasil = laporan_service.update_status_laporan(conn, id_laporan, body.status, body.catatan_admin)
    if not berhasil:
        raise HTTPException(status_code=404, detail="Laporan tidak ditemukan")
    return {"status": "sukses", "pesan": f"Status laporan #{id_laporan} diubah ke '{body.status}'"}

@router.get("/statistik")
def get_statistik(conn=Depends(get_db)):
    """Admin: ringkasan statistik untuk dasbor (total laporan per status, per kecamatan)."""
    semua = laporan_service.ambil_semua_laporan(conn)
    total = len(semua)
    per_status = {}
    for l in semua:
        s = l.get("status", "Pending")
        per_status[s] = per_status.get(s, 0) + 1
    zona_merah = [l for l in semua if l.get("persentase_disparitas", 0) and abs(l["persentase_disparitas"]) >= 20]
    return {
        "status": "sukses",
        "data": {
            "total_laporan": total,
            "per_status": per_status,
            "total_zona_merah": len(zona_merah),
        }
    }

@router.get("/toko")
def get_toko_admin(conn=Depends(get_db)):
    """Admin: ambil daftar semua toko bangunan untuk survei lapangan."""
    data = katalog_service.ambil_semua_toko(conn)
    return {"status": "sukses", "total": len(data), "data": data}

