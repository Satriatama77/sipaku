import sys
sys.path.insert(0, '.')
from scratch.test_multi_nlp import parse_voice_input

ekstra_kasus = [
    "semen 70 ribu per sak batu bata 900 per buah",
    "harga pasir pasang 185 ribu per kubik genteng beton 8500 per buah cat tembok 95000",
    "semen gresik lima puluh delapan ribu batu bata merah seribu",
]

for t in ekstra_kasus:
    res = parse_voice_input(t)
    print(f"INPUT : {t}")
    print(f"TOTAL : {res['total_terdeteksi']} item(s)")
    for idx, it in enumerate(res['items'], 1):
        print(f"  [{idx}] {it['nama_material']} | Rp {it['harga_jual']:,.0f} | {it['satuan']} | Conf: {it['confidence']} (segmen: '{it['raw_text']}')")
    print("-" * 60)
