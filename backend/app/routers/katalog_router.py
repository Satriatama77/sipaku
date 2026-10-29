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

from app.dependencies import require_penjual_or_admin, AuthenticatedUser

@router.put("/{id_toko}")
def update_katalog(
    id_toko: int,
    katalog: KatalogUpdate,
    current_user: AuthenticatedUser = Depends(require_penjual_or_admin),
    conn=Depends(get_db)
):
    """Update atau tambah item harga di katalog toko (dari Voice Input atau manual)."""
    # Jika Penjual, pastikan dia hanya mengedit tokonya sendiri
    if current_user.role == "penjual" and current_user.id_toko and current_user.id_toko != id_toko:
        raise HTTPException(
            status_code=403,
            detail=f"Akses Ditolak (403): Akun Anda terdaftar untuk Toko #{current_user.id_toko}, tidak diizinkan mengubah Toko #{id_toko}."
        )

    hasil = katalog_service.perbarui_harga(conn, id_toko, katalog)
    return {"status": "sukses", "data": hasil}

@router.put("/{id_toko}/batch")
def update_katalog_batch(
    id_toko: int,
    items: list[KatalogUpdate],
    current_user: AuthenticatedUser = Depends(require_penjual_or_admin),
    conn=Depends(get_db)
):
    """Update atau tambah banyak item harga sekaligus di katalog toko (Multi-Item NLP Input)."""
    if current_user.role == "penjual" and current_user.id_toko and current_user.id_toko != id_toko:
        raise HTTPException(
            status_code=403,
            detail=f"Akses Ditolak (403): Akun Anda terdaftar untuk Toko #{current_user.id_toko}, tidak diizinkan mengubah Toko #{id_toko}."
        )

    if not items:
        raise HTTPException(status_code=400, detail="Daftar item tidak boleh kosong")

    hasil = katalog_service.perbarui_harga_batch(conn, id_toko, items)
    return {"status": "sukses", "data": hasil}
