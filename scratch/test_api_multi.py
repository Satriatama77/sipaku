import urllib.request
import urllib.parse
import json

BASE_URL = "http://localhost:8000"

def test_multi_nlp_api():
    # 1. Login sebagai admin
    login_payload = json.dumps({
        "username": "admin",
        "password": "admin123",
        "expected_role": "admin"
    }).encode("utf-8")

    req_login = urllib.request.Request(
        f"{BASE_URL}/api/auth/login",
        data=login_payload,
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req_login) as resp:
        res = json.loads(resp.read().decode())
        token = res["access_token"]
        print("Login sukses, token didapatkan.")

    # 2. Test /api/nlp/text-parse
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    kalimat = "harga semen gresik 40 kilo 70.000 bersar dan harga batu bata merah 900 per buah"
    req_nlp = urllib.request.Request(
        f"{BASE_URL}/api/nlp/text-parse",
        data=json.dumps({"teks": kalimat}).encode("utf-8"),
        headers=headers
    )
    with urllib.request.urlopen(req_nlp) as resp:
        res_nlp = json.loads(resp.read().decode())
        print("\n--- Response /api/nlp/text-parse ---")
        print(f"Total terdeteksi: {res_nlp.get('total_terdeteksi')}")
        for idx, item in enumerate(res_nlp.get("items", []), 1):
            print(f"  Item {idx}: {item['nama_material']} - Rp {item['harga_jual']:,.0f} ({item['satuan']}) - Conf: {item['confidence']}")

    # 3. Test Batch Update ke katalog toko 1
    items_to_save = [
        {
            "nama_material": it["nama_material"],
            "harga_jual": it["harga_jual"],
            "satuan": it["satuan"],
            "stok_tersedia": True
        }
        for it in res_nlp.get("items", [])
    ]

    req_batch = urllib.request.Request(
        f"{BASE_URL}/api/katalog/1/batch",
        data=json.dumps(items_to_save).encode("utf-8"),
        headers=headers,
        method="PUT"
    )
    with urllib.request.urlopen(req_batch) as resp:
        res_batch = json.loads(resp.read().decode())
        print("\n--- Response /api/katalog/1/batch ---")
        print("Status batch save:", res_batch)

    # 4. Ambil katalog toko 1 untuk memastikan tersimpan
    req_katalog = urllib.request.Request(f"{BASE_URL}/api/katalog/1")
    with urllib.request.urlopen(req_katalog) as resp:
        res_kat = json.loads(resp.read().decode())
        print("\n--- Katalog Toko 1 Terkini ---")
        for k in res_kat.get("data", [])[:5]:
            print(f"  - {k['nama_material']}: Rp {k['harga_jual']:,.0f}/{k['satuan']}")

if __name__ == "__main__":
    test_multi_nlp_api()
