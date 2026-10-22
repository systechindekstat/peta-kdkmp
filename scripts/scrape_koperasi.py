"""Scrape semua lokasi koperasi dari simkopdes.go.id -> koperasi.csv
Endpoint publik POST /api/getAllCooperativesNested (tanpa auth), respons AES-CBC;
kunci/IV hardcoded di JS klien (_app chunk, modul 85372 fungsi LV).
Pakai: pip install requests pycryptodome && python scrape_koperasi.py
"""
import base64, csv, hashlib, json
import requests
from Crypto.Cipher import AES

K, IV = "Bf7QmWxYzKpLnRsTuVcHdJgEiAoNpLqR", "Hx49RtWmNpQkSvYb"

def dec(b):
    p = AES.new(hashlib.sha256(K.encode()).digest(), AES.MODE_CBC, IV.encode()).decrypt(base64.b64decode(b))
    return json.loads(p[:-p[-1]])

r = requests.post("https://simkopdes.go.id/api/getAllCooperativesNested", timeout=300)
r.raise_for_status()
data = dec(r.json()["data"])["grouped"]

with open("koperasi.csv", "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f)
    w.writerow(["cooperative_id", "name", "province", "district", "subdistrict", "latitude", "longitude"])
    n = 0
    for p in data:
        for d in p["districts"]:
            for s in d["subdistricts"]:
                for c in s["cooperatives"]:
                    w.writerow([c["cooperative_id"], c["name"], p["province"], d["district"], s["subdistrict"], c["latitude"], c["longitude"]])
                    n += 1
print(n, "koperasi ->", "koperasi.csv")
