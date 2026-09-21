from fastapi import APIRouter, Depends, HTTPException
from app.schemas.katalog_schema import KatalogUpdate
from app.services import katalog_service
from app.database import get_db

router = APIRouter(prefix="/api/katalog", tags=["Katalog Toko"])

@router.get("/{id_toko}")
def get_katalog(id_toko: int, conn=Depends(get_db)):
    """Ambil seluruh katalog harga material dari toko tertentu."""
    data = katalog_service.ambil_katalog_toko(conn, id_toko)
    if not data:
        raise HTTPException(status_code=404, detail="Katalog toko tidak ditemukan")
    return {"status": "sukses", "total": len(data), "data": data}

@router.put("/{id_toko}")
def update_katalog(id_toko: int, katalog: KatalogUpdate, conn=Depends(get_db)):
    """Update atau tambah item harga di katalog toko (dari Voice Input atau manual)."""
    hasil = katalog_service.perbarui_harga(conn, id_toko, katalog)
    return {"status": "sukses", "data": hasil}
