import json
import os
from typing import Optional
from app.schemas.harga_schema import DisparitasResult

# Ambang batas disparitas (persentase selisih dari harga SSH)
BATAS_WASPADA = 10.0   # > 10% → Waspada
BATAS_MERAH   = 20.0   # > 20% → Zona Merah

def _load_ssh() -> list[dict]:
    """Load data SSH dari file JSON lokal (Mock API)."""
    data_path = os.path.join(os.path.dirname(__file__), "../data/ssh_lamongan.json")
    with open(data_path, encoding="utf-8") as f:
        return json.load(f)

def get_harga_ssh(nama_material: str) -> Optional[float]:
    """Cari harga SSH untuk material tertentu (case-insensitive)."""
    ssh_data = _load_ssh()
    for item in ssh_data:
        if item["nama_material"].lower() == nama_material.lower():
            return item["harga_ssh"]
    return None

def hitung_disparitas(
    nama_material: str,
    nama_kecamatan: str,
    harga_laporan: float,
) -> DisparitasResult:
    """Hitung persentase disparitas dan tentukan zona status."""
    harga_ssh = get_harga_ssh(nama_material) or 0.0
    selisih     = harga_laporan - harga_ssh
    persentase  = (selisih / harga_ssh * 100) if harga_ssh > 0 else 0.0

    if abs(persentase) >= BATAS_MERAH:
        status_zona = "Merah"
    elif abs(persentase) >= BATAS_WASPADA:
        status_zona = "Waspada"
    else:
        status_zona = "Normal"

    return DisparitasResult(
        nama_material=nama_material,
        nama_kecamatan=nama_kecamatan,
        harga_laporan=harga_laporan,
        harga_ssh=harga_ssh,
        selisih=selisih,
        persentase=round(persentase, 2),
        status_zona=status_zona,
    )

def get_semua_ssh() -> list[dict]:
    """Return seluruh data SSH sebagai list dict."""
    return _load_ssh()
