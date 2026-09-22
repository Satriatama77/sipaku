import re
from typing import Optional

# ── Pattern NLP sederhana berbasis regex ─────────────────
# Contoh kalimat: "harga semen gresik empat puluh ribu per zak"
# Contoh kalimat: "semen 70.000 per sak"
# Contoh kalimat: "pasir seratus sembilan puluh ribu per kubik"

_MATERIAL_KEYWORDS = [
    "semen", "besi", "pasir", "batu bata", "bata", "keramik",
    "cat", "kayu", "genteng", "paku", "triplek", "baja ringan",
    "pipa", "kabel", "mortar",
]

_SATUAN_KEYWORDS = {
    "per sak": "zak", "persak": "zak", "per zak": "zak", "perzak": "zak",
    "sak": "zak", "zak": "zak",
    "per batang": "batang", "batang": "batang",
    "per meter kubik": "m3", "meter kubik": "m3", "per kubik": "m3",
    "kubik": "m3", "m3": "m3",
    "per lembar": "lembar", "lembar": "lembar",
    "per kg": "kg", "per kilogram": "kg", "kilogram": "kg", "kg": "kg",
    "per meter": "m", "meter": "m", "m2": "m2",
    "per buah": "buah", "per biji": "buah", "buah": "buah", "biji": "buah",
}

# Kata pembuka angka yang umum diucapkan
_TRIGGER_WORDS = [
    "harga", "seharga", "senilai", "update", "ubah", "perbarui", "sebesar",
]

# Kata penghubung yang bisa muncul antara material dan angka
_SKIP_WORDS = ["per", "adalah", "yaitu", "itu", "nya"]

_ANGKA_KATA = {
    # Satuan
    "nol": 0, "satu": 1, "dua": 2, "tiga": 3, "empat": 4,
    "lima": 5, "enam": 6, "tujuh": 7, "delapan": 8, "sembilan": 9,
    # Belasan
    "sepuluh": 10, "sebelas": 11,
    "dua belas": 12, "tiga belas": 13, "empat belas": 14,
    "lima belas": 15, "enam belas": 16, "tujuh belas": 17,
    "delapan belas": 18, "sembilan belas": 19,
    # Puluhan
    "dua puluh": 20, "tiga puluh": 30, "empat puluh": 40,
    "lima puluh": 50, "enam puluh": 60, "tujuh puluh": 70,
    "delapan puluh": 80, "sembilan puluh": 90,
    # Ratusan
    "seratus": 100, "dua ratus": 200, "tiga ratus": 300,
    "empat ratus": 400, "lima ratus": 500, "enam ratus": 600,
    "tujuh ratus": 700, "delapan ratus": 800, "sembilan ratus": 900,
    # Multiplier
    "ratus": 100, "ribu": 1_000, "juta": 1_000_000,
    "seribu": 1_000, "sejuta": 1_000_000,
}


def _parse_angka_indonesia(teks_angka: str) -> Optional[float]:
    """
    Konversi string angka format Indonesia ke float.

    Menangani:
    - "70.000"    → 70000  (titik = pemisah ribuan)
    - "70,000"    → 70000  (koma = pemisah ribuan)
    - "1.500.000" → 1500000
    - "58.500"    → 58500
    - "1,5"       → 1.5    (koma sebagai desimal jika hanya satu koma dengan 1-2 digit)
    """
    s = teks_angka.strip()

    # Hitung jumlah titik dan koma
    jumlah_titik = s.count('.')
    jumlah_koma  = s.count(',')

    if jumlah_titik == 0 and jumlah_koma == 0:
        # Angka bersih tanpa pemisah
        try:
            return float(s)
        except ValueError:
            return None

    if jumlah_koma == 1 and jumlah_titik == 0:
        # Contoh: "1,5" → 1.5 (desimal) atau "70,000" → 70000 (ribuan)
        bagian = s.split(',')
        if len(bagian[1]) <= 2:
            # "1,5" atau "1,50" → desimal
            return float(s.replace(',', '.'))
        else:
            # "70,000" atau "1,500" → ribuan
            return float(s.replace(',', ''))

    if jumlah_titik >= 1 and jumlah_koma == 0:
        # Contoh: "70.000" atau "1.500.000" → ribuan Indonesia
        bagian = s.split('.')
        # Jika semua bagian setelah titik pertama punya 3 digit → ribuan
        if all(len(b) == 3 for b in bagian[1:]):
            return float(s.replace('.', ''))
        # Jika hanya satu titik dengan 1-2 digit desimal → desimal
        if len(bagian) == 2 and len(bagian[1]) <= 2:
            return float(s)
        # Fallback: hapus titik
        return float(s.replace('.', ''))

    if jumlah_titik >= 1 and jumlah_koma == 1:
        # Contoh: "1.500,50" → ribuan + desimal (format Eropa/Indonesia)
        s_clean = s.replace('.', '').replace(',', '.')
        try:
            return float(s_clean)
        except ValueError:
            return None

    return None


def _kata_ke_angka(teks: str) -> Optional[float]:
    """
    Konversi teks angka bahasa Indonesia ke float.
    Mendukung kombinasi seperti:
    - 'tujuh puluh ribu'            → 70.000
    - 'seratus sembilan puluh ribu' → 190.000
    - 'lima ratus ribu'             → 500.000
    - 'dua juta lima ratus ribu'    → 2.500.000
    """
    teks = teks.lower().strip()

    # Coba parsing angka numerik dengan format Indonesia dulu
    match_numerik = re.search(r'\d[\d.,]*', teks)
    if match_numerik:
        angka_str = match_numerik.group()
        hasil = _parse_angka_indonesia(angka_str)
        if hasil is not None:
            return hasil

    # ── Algoritma parsing kata angka Indonesia ──────────────
    # Urutan proses: ekstrak token angka dari teks, lalu akumulasikan
    # menggunakan logika segment: setiap "ribu"/"juta" berlaku sebagai multiplier
    # untuk semua nilai yang terakumulasi SEBELUMNYA dalam segmen tersebut.
    #
    # Contoh: "seratus sembilan puluh ribu"
    #   → ratus(100) + sembilan_puluh(90) = 190  → ×ribu = 190.000

    # Ganti semua kata yang dikenal dengan nilai numeriknya di teks
    # Urutkan dari kata terpanjang dulu untuk menghindari penggantian parsial
    nilai_tokens = []  # list of (nilai, is_multiplier_besar)
    teks_kerja = teks

    for kata, nilai in sorted(_ANGKA_KATA.items(), key=lambda x: -len(x[0])):
        pattern = r'\b' + re.escape(kata) + r'\b'
        if re.search(pattern, teks_kerja):
            teks_kerja = re.sub(pattern, f' __VAL_{nilai}__ ', teks_kerja, count=1)

    # Parse token yang sudah ditandai
    tokens = re.findall(r'__VAL_(\d+)__', teks_kerja)
    if not tokens:
        return None

    token_angka = [int(t) for t in tokens]

    # Akumulasikan dengan logika multiplier
    total = 0
    akum  = 0   # nilai yang sedang dikumpulkan sebelum multiplier besar

    for val in token_angka:
        if val == 1_000_000:
            total += (akum or 1) * 1_000_000
            akum   = 0
        elif val == 1_000:
            total += (akum or 1) * 1_000
            akum   = 0
        elif val == 100:
            # Ratus: kalikan dengan nilai sebelumnya dalam segmen, atau jadikan 100
            if akum % 100 == 0 and akum > 0:
                # Sudah ada kelipatan ratus, berarti "ratus" ini multiplier dari satuan
                # Contoh: "satu ratus" → akum=1 → akum=100
                akum = (akum // 100 if akum >= 100 else akum) * 100
            else:
                akum = (akum or 1) * 100
        else:
            akum += val

    total += akum
    return float(total) if total > 0 else None


def parse_voice_input(transkrip: str) -> dict:
    """
    Parsing transkrip suara menjadi data terstruktur harga.

    Args:
        transkrip: Hasil Speech-to-Text (string bahasa Indonesia)

    Returns:
        dict: {nama_material, harga_jual, satuan, raw_text, confidence}

    Contoh input : "Harga semen 70.000 per sak."
    Contoh output: {"nama_material": "semen", "harga_jual": 70000.0, "satuan": "zak"}

    Contoh input : "pasir seratus sembilan puluh ribu per kubik"
    Contoh output: {"nama_material": "pasir", "harga_jual": 190000.0, "satuan": "m3"}
    """
    teks_asli = transkrip.strip()
    teks = teks_asli.lower()

    # 1. Deteksi material (cari match terpanjang terlebih dahulu)
    material_terdeteksi = None
    for mat in sorted(_MATERIAL_KEYWORDS, key=len, reverse=True):
        if mat in teks:
            material_terdeteksi = mat
            break

    # 2. Deteksi satuan (cari phrase terpanjang terlebih dahulu)
    satuan_terdeteksi = "unit"
    for kata_satuan, nilai_satuan in sorted(_SATUAN_KEYWORDS.items(), key=lambda x: -len(x[0])):
        if kata_satuan in teks:
            satuan_terdeteksi = nilai_satuan
            break

    # 3. Ekstrak harga
    # Prioritas: cari angka numerik dengan pemisah ribuan Indonesia
    # Pattern: angka dengan titik/koma pemisah ribuan (misal 70.000 atau 1.500.000)
    harga = None

    # Coba cari angka numerik format Indonesia terlebih dahulu
    # Pattern: angka diikuti optional titik/koma dan 3 digit (ribuan)
    pola_numerik = re.search(
        r'\b(\d{1,3}(?:[.,]\d{3})+(?:[.,]\d{1,2})?|\d+(?:[.,]\d{1,2})?)\b',
        teks
    )
    if pola_numerik:
        harga = _parse_angka_indonesia(pola_numerik.group())

    # Jika tidak ada angka numerik, coba parse dari kata-kata angka
    if harga is None:
        harga = _kata_ke_angka(teks)

    # Fallback terakhir: ambil angka mentah pertama yang ada
    if harga is None:
        match_fallback = re.search(r'\d+', teks)
        if match_fallback:
            harga = float(match_fallback.group())

    return {
        "nama_material": material_terdeteksi or "tidak terdeteksi",
        "harga_jual": harga or 0.0,
        "satuan": satuan_terdeteksi,
        "raw_text": teks_asli,
        "confidence": "high" if material_terdeteksi and harga and harga >= 100 else "low",
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
