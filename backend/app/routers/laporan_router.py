import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, File, Form
from typing import Optional
from app.schemas.laporan_schema import LaporanStatusUpdate
from app.services import laporan_service
from app.database import get_db

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads")

router = APIRouter(prefix="/api/laporan", tags=["Laporan Harga"])

@router.get("", include_in_schema=False)
@router.get("/")
def get_semua_laporan(status: str = None, conn=Depends(get_db)):
    """Ambil semua laporan. Query param ?status=Pending|Tindak Lanjut|Selesai"""
    data = laporan_service.ambil_semua_laporan(conn, status)
    return {"status": "sukses", "total": len(data), "data": data}

from app.dependencies import require_warga, AuthenticatedUser

@router.post("", include_in_schema=False)
@router.post("/")
async def buat_laporan(
    request: Request,
    id_kecamatan: int = Form(...),
    nama_toko: str = Form(...),
    nama_material: str = Form(...),
    harga_temuan: float = Form(...),
    satuan: str = Form("satuan"),
    nama_pelapor: str = Form("Warga Anonim"),
    foto_bukti: Optional[UploadFile] = File(None),
    current_user: AuthenticatedUser = Depends(require_warga),
    conn=Depends(get_db),
):
    """Submit laporan harga baru dari warga/pembeli, dengan foto bukti opsional."""
    id_pelapor = current_user.id_user

    foto_url = None
    if foto_bukti and foto_bukti.filename:
        # Validasi tipe file
        allowed_types = ["image/jpeg", "image/png", "image/webp", "image/jpg"]
        if foto_bukti.content_type not in allowed_types:
            raise HTTPException(
                status_code=400,
                detail="Format file tidak didukung. Gunakan JPG, PNG, atau WebP."
            )

        # Validasi ukuran file (max 5MB)
        contents = await foto_bukti.read()
        if len(contents) > 5 * 1024 * 1024:
            raise HTTPException(
                status_code=400,
                detail="Ukuran file terlalu besar. Maksimal 5MB."
            )

        # Simpan file
        ext = os.path.splitext(foto_bukti.filename)[1] or ".jpg"
        filename = f"bukti_{uuid.uuid4().hex[:12]}{ext}"
        filepath = os.path.join(UPLOAD_DIR, filename)
        os.makedirs(UPLOAD_DIR, exist_ok=True)

        with open(filepath, "wb") as f:
            f.write(contents)

        foto_url = f"/uploads/{filename}"

    # Buat object laporan untuk service
    from app.schemas.laporan_schema import LaporanCreate
    laporan = LaporanCreate(
        id_kecamatan=id_kecamatan,
        nama_toko=nama_toko,
        nama_material=nama_material,
        harga_temuan=harga_temuan,
        satuan=satuan,
        nama_pelapor=nama_pelapor,
        foto_url=foto_url,
    )

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
