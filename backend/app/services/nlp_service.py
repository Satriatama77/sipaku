import re
from typing import Optional

# ── Pattern NLP Multi-Komoditas Berbasis Regex Cerdas ────────
# Contoh input:
# - "harga semen gresik 40 kilo 70.000 bersar dan harga batu bata merah 900 per buah"
# - "harga semen gresik lima puluh delapan ribu per zak dan pasir pasang seratus sembilan puluh ribu per kubik"
# - "besi beton polos 8 mili 45.000 per batang, batu bata 900 per buah, semen tiga roda 57000 persak"

_MATERIAL_KEYWORDS = [
    # Semen
    "semen gresik", "semen tiga roda", "semen holcim", "semen padang", "semen dynamix", "semen putih", "semen",
    # Besi
    "besi beton polos", "besi beton ulir", "besi beton", "besi begel", "besi hollow", "besi",
    # Pasir & Batu
    "pasir urug", "pasir pasang", "pasir beton", "pasir",
    "batu bata merah", "batu bata", "bata merah", "bata ringan", "bata hebel", "batako pres", "batako", "bata",
    "kerikil / batu pecah", "kerikil", "batu pecah", "split", "koral",
    # Keramik & Penutup Lantai/Atap
    "keramik lantai", "keramik dinding", "keramik",
    "genteng beton", "genteng keramik", "genteng metal", "genteng tanah", "genteng",
    # Cat & Kayu
    "cat tembok", "cat kayu", "cat besi", "cat dasar", "cat",
    "kayu kaso", "kayu papan", "kayu balok", "kayu reng", "kayu",
    # Paku & Lembaran
    "paku usuk", "paku reng", "paku beton", "paku payung", "paku triplek", "paku",
    "triplek", "plywood", "kalsiboard", "gypsum", "gipsum",
    # Baja & Atap
    "baja ringan", "spandek", "bondek", "hollow galvalum", "galvalum",
    # Pipa & Kabel
    "pipa pvc", "pipa paralon", "pipa",
    "kabel listrik", "kabel", "mortar",
]

# Normalisasi nama material ke standar SSH Lamongan
_SSH_MATERIAL_MAPPING = {
    "semen gresik": "Semen Gresik 40kg",
    "semen tiga roda": "Semen Tiga Roda 40kg",
    "semen holcim": "Semen Holcim 40kg",
    "semen": "Semen Gresik 40kg",
    "besi beton polos": "Besi Beton Polos Ø8mm",
    "besi beton": "Besi Beton Polos Ø8mm",
    "besi": "Besi Beton Polos Ø8mm",
    "pasir pasang": "Pasir Pasang",
    "pasir urug": "Pasir Urug",
    "pasir beton": "Pasir Beton",
    "pasir": "Pasir Pasang",
    "batu bata merah": "Batu Bata Merah",
    "batu bata": "Batu Bata Merah",
    "bata merah": "Batu Bata Merah",
    "bata": "Batu Bata Merah",
    "batako pres": "Batako Pres",
    "batako": "Batako Pres",
    "kerikil": "Kerikil / Batu Pecah",
    "batu pecah": "Kerikil / Batu Pecah",
    "keramik": "Keramik 40x40 (polos)",
    "triplek": "Triplek 9mm 122x244",
    "baja ringan": "Baja Ringan (kanal C)",
    "genteng beton": "Genteng Beton",
    "genteng": "Genteng Beton",
    "cat tembok": "Cat Tembok (5kg)",
    "cat": "Cat Tembok (5kg)",
    "pipa pvc": "Pipa PVC 4\" AW",
    "pipa": "Pipa PVC 4\" AW",
    "kayu kaso": "Kayu Kaso 5x7",
    "kayu papan": "Kayu Papan 3x20",
    "kayu": "Kayu Kaso 5x7",
}

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
    "per kaleng": "kaleng", "kaleng": "kaleng",
    "per roll": "roll", "roll": "roll", "dus": "dus", "per dus": "dus"
}

_SATUAN_DEFAULT_PER_MATERIAL = {
    "semen": "zak",
    "besi": "batang",
    "pasir": "m3",
    "bata": "buah",
    "batako": "buah",
    "kerikil": "m3",
    "keramik": "m2",
    "triplek": "lembar",
    "baja": "batang",
    "genteng": "buah",
    "cat": "kaleng",
    "pipa": "batang",
    "kayu": "batang",
    "paku": "kg",
    "kabel": "meter",
    "mortar": "zak",
}

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
    Menangani titik/koma ribuan dan desimal:
    - "70.000"    → 70000
    - "1.500.000" → 1500000
    - "1,5"       → 1.5
    """
    s = teks_angka.strip()
    jumlah_titik = s.count('.')
    jumlah_koma  = s.count(',')

    if jumlah_titik == 0 and jumlah_koma == 0:
        try:
            return float(s)
        except ValueError:
            return None

    if jumlah_koma == 1 and jumlah_titik == 0:
        bagian = s.split(',')
        if len(bagian[1]) <= 2:
            return float(s.replace(',', '.'))
        else:
            return float(s.replace(',', ''))

    if jumlah_titik >= 1 and jumlah_koma == 0:
        bagian = s.split('.')
        if all(len(b) == 3 for b in bagian[1:]):
            return float(s.replace('.', ''))
        if len(bagian) == 2 and len(bagian[1]) <= 2:
            return float(s)
        return float(s.replace('.', ''))

    if jumlah_titik >= 1 and jumlah_koma == 1:
        s_clean = s.replace('.', '').replace(',', '.')
        try:
            return float(s_clean)
        except ValueError:
            return None

    return None


def _kata_ke_angka(teks: str) -> Optional[float]:
    """
    Konversi teks kata angka bahasa Indonesia ke float.
    - 'tujuh puluh ribu'            → 70.000
    - 'seratus sembilan puluh ribu' → 190.000
    """
    teks = teks.lower().strip()

    match_numerik = re.search(r'\d[\d.,]*', teks)
    if match_numerik:
        angka_str = match_numerik.group()
        hasil = _parse_angka_indonesia(angka_str)
        if hasil is not None:
            return hasil

    teks_kerja = teks
    for kata, nilai in sorted(_ANGKA_KATA.items(), key=lambda x: -len(x[0])):
        pattern = r'\b' + re.escape(kata) + r'\b'
        if re.search(pattern, teks_kerja):
            teks_kerja = re.sub(pattern, f' __VAL_{nilai}__ ', teks_kerja, count=1)

    tokens = re.findall(r'__VAL_(\d+)__', teks_kerja)
    if not tokens:
        return None

    token_angka = [int(t) for t in tokens]
    total = 0
    akum  = 0

    for val in token_angka:
        if val == 1_000_000:
            total += (akum or 1) * 1_000_000
            akum   = 0
        elif val == 1_000:
            total += (akum or 1) * 1_000
            akum   = 0
        elif val == 100:
            if akum % 100 == 0 and akum > 0:
                akum = (akum // 100 if akum >= 100 else akum) * 100
            else:
                akum = (akum or 1) * 100
        else:
            akum += val

    total += akum
    return float(total) if total > 0 else None


def segmentasi_klausa(teks: str) -> list[str]:
    """
    Memecah kalimat transkrip menjadi segmen-segmen per komoditas.
    Mendukung split kata sambung (dan, lalu, kemudian, terus, serta), tanda baca (koma, titik),
    atau jika tanpa pemisah tapi ada multiple kemunculan material keywords.
    """
    teks_clean = teks.strip()

    # Pisahkan berdasarkan pemisah eksplisit: koma, titik, titik koma yang BUKAN di tengah angka ribuan,
    # serta kata hubung 'dan', 'lalu', 'kemudian', 'terus', 'serta'
    pola_pemisah = r'(?:(?<!\d)[\.,;]+(?![\d])|[\n\r]+|\b(?:dan\s+juga|dan|lalu|kemudian|terus|serta)\b)'
    calon_segmen = re.split(pola_pemisah, teks_clean, flags=re.IGNORECASE)

    segmen_list = [s.strip() for s in calon_segmen if s.strip()]

    # Periksa apakah dalam satu segmen masih terdapat LEBIH DARI SATU kata kunci material
    # Jika iya (misal: "harga semen 70 ribu harga pasir 180 ribu" tanpa kata 'dan'),
    # potong otomatis berdasarkan posisi keyword material berikutnya
    hasil_segmen = []
    for seg in segmen_list:
        seg_lower = seg.lower()
        matches = []
        for mat in sorted(_MATERIAL_KEYWORDS, key=len, reverse=True):
            for m in re.finditer(r'\b' + re.escape(mat) + r'\b', seg_lower):
                overlap = False
                for existing_start, existing_end, _ in matches:
                    if not (m.end() <= existing_start or m.start() >= existing_end):
                        overlap = True
                        break
                if not overlap:
                    matches.append((m.start(), m.end(), mat))

        matches.sort(key=lambda x: x[0])

        if len(matches) <= 1:
            hasil_segmen.append(seg)
        else:
            for idx in range(len(matches)):
                start_pos = matches[idx][0]
                potongan_sebelum = seg[:start_pos]
                m_pemicu = re.search(r'\b(?:harga|seharga|senilai|untuk)\b\s*$', potongan_sebelum, re.IGNORECASE)
                if m_pemicu:
                    start_pos = m_pemicu.start()

                if idx + 1 < len(matches):
                    next_start = matches[idx + 1][0]
                    potongan_antara = seg[start_pos:next_start]
                    m_pemicu_next = re.search(r'\b(?:harga|seharga|senilai|untuk)\b\s*$', potongan_antara, re.IGNORECASE)
                    if m_pemicu_next:
                        end_pos = start_pos + m_pemicu_next.start()
                    else:
                        end_pos = next_start
                else:
                    end_pos = len(seg)

                sub_seg = seg[start_pos:end_pos].strip()
                if sub_seg:
                    hasil_segmen.append(sub_seg)

    return hasil_segmen if hasil_segmen else [teks_clean]


def parse_segmen_tunggal(segmen: str) -> dict:
    """
    Parsing segmen tunggal ucapan komoditas menjadi data harga dan material.
    """
    teks_asli = segmen.strip()
    teks = teks_asli.lower()

    # 1. Deteksi spesifikasi ukuran/berat (misal: "40 kilo", "40 kg", "8 mili", "10 mm")
    pola_spek = re.search(r'\b(\d+(?:[.,]\d+)?\s*(?:kg|kilo|kilogram|zak|sak|mili|mm|cm|meter|m|dim|inch|in))\b', teks)

    # 2. Deteksi material (prioritaskan nama terpanjang)
    material_terdeteksi = None
    for mat in sorted(_MATERIAL_KEYWORDS, key=len, reverse=True):
        if re.search(r'\b' + re.escape(mat) + r'\b', teks):
            material_terdeteksi = mat
            break

    # Normalisasi nama material ke standar SSH Lamongan jika ada
    nama_standar = None
    if material_terdeteksi:
        for key, val in _SSH_MATERIAL_MAPPING.items():
            if key == material_terdeteksi or key in material_terdeteksi:
                nama_standar = val
                break
        if not nama_standar:
            nama_standar = material_terdeteksi.title()
    else:
        nama_standar = "Material Tidak Terdeteksi"

    # 3. Deteksi Satuan
    satuan_terdeteksi = None
    for kata_satuan, nilai_satuan in sorted(_SATUAN_KEYWORDS.items(), key=lambda x: -len(x[0])):
        if kata_satuan in teks:
            satuan_terdeteksi = nilai_satuan
            break

    # Satuan default cerdas per jenis material jika tidak diucapkan
    if not satuan_terdeteksi and material_terdeteksi:
        for k_mat, default_sat in _SATUAN_DEFAULT_PER_MATERIAL.items():
            if k_mat in material_terdeteksi:
                satuan_terdeteksi = default_sat
                break
    if not satuan_terdeteksi:
        satuan_terdeteksi = "satuan"

    # 4. Ekstrak Harga
    # Hapus spesifikasi angka (misal "40 kilo") dari teks agar "40" tidak disangka harga!
    teks_untuk_harga = teks
    if pola_spek:
        teks_untuk_harga = teks[:pola_spek.start()] + ' ' + teks[pola_spek.end():]

    # Bersihkan noise pemicu STT atau typo seperti "bersar" (sebesar)
    teks_untuk_harga = re.sub(r'\b(?:sebesar|bersar|senilai|seharga|berkisar|harganya|harga)\b', ' ', teks_untuk_harga)

    harga = None

    # Prioritas A1: Kombinasi angka numerik + kata pengali ("70 ribu", "185 ribu", "1,5 juta", "70rb", "1.5jt")
    pola_hybrid = re.search(r'\b(\d+(?:[.,]\d+)?)\s*(ribu|rb|juta|jt|ratus)\b', teks_untuk_harga)
    if pola_hybrid:
        num_str = pola_hybrid.group(1)
        unit = pola_hybrid.group(2)
        val = _parse_angka_indonesia(num_str)
        if val is not None:
            if unit in ["ribu", "rb"]:
                harga = val * 1_000
            elif unit in ["juta", "jt"]:
                harga = val * 1_000_000
            elif unit == "ratus":
                harga = val * 100

    # Prioritas A2: Format angka numerik murni Indonesia (contoh: 70.000, 1.500.000, 900, 85000)
    if harga is None:
        matches_numerik = re.findall(r'\b(\d{1,3}(?:[.,]\d{3})+(?:[.,]\d{1,2})?|\d+)\b', teks_untuk_harga)
        for m in matches_numerik:
            val = _parse_angka_indonesia(m)
            if val is not None:
                if harga is None or val > harga:
                    harga = val

    # Prioritas B: Kata angka murni Indonesia ("tujuh puluh ribu", "sembilan ratus")
    if harga is None or (harga < 100 and any(k in teks_untuk_harga for k in ["puluh", "ratus", "ribu", "juta"])):
        kata_val = _kata_ke_angka(teks_untuk_harga)
        if kata_val and kata_val >= 100:
            harga = kata_val

    # Fallback terakhir
    if harga is None:
        m_fall = re.search(r'\d+', teks_untuk_harga)
        if m_fall:
            harga = float(m_fall.group())

    harga = harga or 0.0

    # Confidence check
    confidence = "high" if (material_terdeteksi and harga >= 100) else "low"

    return {
        "nama_material": nama_standar,
        "material_kunci": material_terdeteksi or "",
        "harga_jual": float(harga),
        "satuan": satuan_terdeteksi,
        "raw_text": teks_asli,
        "confidence": confidence,
    }


def parse_voice_input(transkrip: str) -> dict:
    """
    Parsing transkrip suara menjadi data terstruktur harga multi-komoditas.

    Args:
        transkrip: Hasil Speech-to-Text (string bahasa Indonesia)

    Returns:
        dict:
            - items: list of dict parsed material
            - total_terdeteksi: int
            - nama_material, harga_jual, satuan, confidence (backward compatible untuk single-item caller)
    """
    if not transkrip or not transkrip.strip():
        return {
            "nama_material": "tidak terdeteksi",
            "harga_jual": 0.0,
            "satuan": "satuan",
            "raw_text": "",
            "confidence": "low",
            "items": [],
            "total_terdeteksi": 0,
        }

    segmen_list = segmentasi_klausa(transkrip)
    items = []
    for seg in segmen_list:
        parsed = parse_segmen_tunggal(seg)
        # Masukkan item jika ada nama material yang valid atau harga ditemukan
        if parsed["material_kunci"] or parsed["harga_jual"] > 0:
            items.append(parsed)

    if not items:
        item_fallback = parse_segmen_tunggal(transkrip)
        items = [item_fallback]

    first = items[0]
    return {
        "nama_material": first["nama_material"],
        "harga_jual": first["harga_jual"],
        "satuan": first["satuan"],
        "raw_text": transkrip.strip(),
        "confidence": first["confidence"],
        "items": items,
        "total_terdeteksi": len(items),
    }


async def transkripsi_audio(audio_bytes: bytes, filename: str = "audio.webm") -> str:
    """
    Konversi audio blob ke teks menggunakan Whisper (OpenAI).
    Untuk prototype: return simulasi teks multi-komoditas.
    """
    return "harga semen gresik 40 kilo 70.000 bersar dan harga batu bata merah 900 per buah"
