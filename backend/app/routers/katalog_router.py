from fastapi import APIRouter, Depends, HTTPException
from app.schemas.katalog_schema import KatalogUpdate
from app.services import katalog_service
from app.database import get_db

router = APIRouter(prefix="/api/katalog", tags=["Katalog Toko"])

@router.get("/semua")
def get_semua_katalog(conn=Depends(get_db)):
    """Ambil semua data harga material dari seluruh toko bangunan (hasil survei)."""
    data = katalog_service.ambil_semua_katalog_pasar(conn)
    return {"status": "sukses", "total": len(data), "data": data}

@router.get("/toko/semua")
def get_semua_toko(conn=Depends(get_db)):
    """Ambil daftar semua toko bangunan di Lamongan."""
    data = katalog_service.ambil_semua_toko(conn)
    return {"status": "sukses", "total": len(data), "data": data}

@router.get("/{id_toko}")
def get_katalog(id_toko: int, conn=Depends(get_db)):
    """Ambil seluruh katalog harga material dari toko tertentu."""
    data = katalog_service.ambil_katalog_toko(conn, id_toko)
    return {"status": "sukses", "total": len(data) if data else 0, "data": data or []}

@router.put("/{id_toko}")
def update_katalog(id_toko: int, katalog: KatalogUpdate, conn=Depends(get_db)):
    """Update atau tambah item harga di katalog toko (dari Voice Input atau manual)."""
    hasil = katalog_service.perbarui_harga(conn, id_toko, katalog)
    return {"status": "sukses", "data": hasil}
