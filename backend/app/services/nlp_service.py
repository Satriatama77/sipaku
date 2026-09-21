import re
from typing import Optional

# ── Pattern NLP sederhana berbasis regex ─────────────────
# Contoh kalimat: "harga semen gresik empat puluh ribu per zak"
# Contoh kalimat: "update pasir seribu lima ratus per meter kubik"

_MATERIAL_KEYWORDS = [
    "semen", "besi", "pasir", "batu bata", "bata", "keramik",
    "cat", "kayu", "genteng", "paku", "triplek", "baja ringan",
    "pipa", "kabel", "mortar",
]

_SATUAN_KEYWORDS = {
    "zak": "zak", "sak": "zak",
    "batang": "batang",
    "meter kubik": "m3", "m3": "m3", "kubik": "m3",
    "lembar": "lembar",
    "kg": "kg", "kilogram": "kg",
    "meter": "m", "m2": "m2",
    "buah": "buah", "biji": "buah",
}

_ANGKA_KATA = {
    "nol": 0, "satu": 1, "dua": 2, "tiga": 3, "empat": 4,
    "lima": 5, "enam": 6, "tujuh": 7, "delapan": 8, "sembilan": 9,
    "sepuluh": 10, "sebelas": 11, "dua belas": 12, "tiga belas": 13,
    "dua puluh": 20, "tiga puluh": 30, "empat puluh": 40,
    "lima puluh": 50, "enam puluh": 60, "tujuh puluh": 70,
    "delapan puluh": 80, "sembilan puluh": 90,
    "ratus": 100, "ribu": 1_000, "juta": 1_000_000,
}

def _kata_ke_angka(teks: str) -> Optional[float]:
    """Konversi teks angka bahasa Indonesia ke float."""
    teks = teks.lower().strip()

    # Coba parsing angka numerik dulu
    numerik = re.search(r"[\d.,]+", teks)
    if numerik:
        return float(numerik.group().replace(",", ""))

    # Parsing kata-kata angka (simplified)
    hasil = 0
    satuan_besar = 1
    for kata, nilai in sorted(_ANGKA_KATA.items(), key=lambda x: -x[1]):
        if kata in teks:
            if nilai >= 100:
                satuan_besar = nilai
            else:
                hasil += nilai
    return float(hasil * satuan_besar) if (hasil or satuan_besar > 1) else None

def parse_voice_input(transkrip: str) -> dict:
    """
    Parsing transkrip suara menjadi data terstruktur harga.

    Args:
        transkrip: Hasil Speech-to-Text (string bahasa Indonesia)

    Returns:
        dict: {nama_material, harga_jual, satuan, raw_text}

    Contoh input: "harga semen gresik empat puluh ribu per zak"
    Contoh output: {"nama_material": "semen", "harga_jual": 40000.0, "satuan": "zak"}
    """
    teks = transkrip.lower()

    # 1. Deteksi material
    material_terdeteksi = None
    for mat in _MATERIAL_KEYWORDS:
        if mat in teks:
            material_terdeteksi = mat
            break

    # 2. Deteksi satuan
    satuan_terdeteksi = "unit"
    for kata_satuan, nilai_satuan in _SATUAN_KEYWORDS.items():
        if kata_satuan in teks:
            satuan_terdeteksi = nilai_satuan
            break

    # 3. Ekstrak angka harga (ambil bagian setelah kata harga/update)
    harga = None
    match = re.search(r"(\d[\d.,]*)", teks)
    if match:
        harga = float(match.group().replace(",", ""))
    else:
        # Coba konversi kata
        harga = _kata_ke_angka(teks)

    return {
        "nama_material": material_terdeteksi or "tidak terdeteksi",
        "harga_jual": harga or 0.0,
        "satuan": satuan_terdeteksi,
        "raw_text": transkrip,
        "confidence": "high" if material_terdeteksi and harga else "low",
    }

async def transkripsi_audio(audio_bytes: bytes, filename: str = "audio.webm") -> str:
    """
    Konversi audio blob ke teks menggunakan Whisper (OpenAI).
    
    Untuk production: ganti dengan whisper.load_model("base").transcribe(file_path)
    Untuk prototype: return simulasi teks.
    """
    # TODO: Implementasi Whisper setelah dependensi diinstall
    # import whisper
    # model = whisper.load_model("base")
    # result = model.transcribe(temp_file_path, language="id")
    # return result["text"]
    
    # Simulasi response untuk prototype
    return "harga semen gresik empat puluh ribu per zak"
