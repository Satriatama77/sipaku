from pydantic import BaseModel
from typing import Optional

class KatalogUpdate(BaseModel):
    nama_material: str
    harga_jual: float
    satuan: str         # "zak", "batang", "m3", "kg"
    stok_tersedia: Optional[bool] = True

class KatalogResponse(BaseModel):
    id_katalog: int
    id_toko: int
    nama_toko: str
    nama_material: str
    harga_jual: float
    satuan: str
    stok_tersedia: bool
    terakhir_diperbarui: str   # ISO datetime string
