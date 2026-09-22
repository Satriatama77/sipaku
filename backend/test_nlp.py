import sys
sys.path.insert(0, '.')
from app.services.nlp_service import parse_voice_input

kasus = [
    'Harga semen 70.000 persak.',
    'harga semen 70.000 per zak',
    'semen 1.500.000 per zak',
    'harga pasir seratus sembilan puluh ribu per kubik',
    'besi beton empat puluh lima ribu per batang',
    'batu bata seribu per biji',
    'harga semen lima puluh delapan ribu per zak',
    'harga cat 85000 per kg',
    'keramik 120.000 per lembar',
]

for k in kasus:
    h = parse_voice_input(k)
    mat  = h['nama_material']
    harg = h['harga_jual']
    sat  = h['satuan']
    conf = h['confidence']
    print(f'INPUT : {k}')
    print(f'HASIL : {mat} | Rp {harg:,.0f} | {sat} | {conf}')
    print()
