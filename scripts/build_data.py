"""Bangun src/data/*.json dari koperasi_desa.csv + repo geomaps_indo.
Pakai: python scripts/build_data.py <path geomaps_indo> <path koperasi_desa.csv>"""
import csv, json, os, re, sys
repo, csvp = sys.argv[1], sys.argv[2]
kw = f"{repo}/data-static-indonesia/kode-wilayah"
J = lambda p: json.load(open(p, encoding="utf-8"))

def norm(s):
    s = s.lower().replace("kabupaten", "kab").replace("kab.", "kab").replace("daerah istimewa", "di").replace("daerah khusus ibukota", "dki")
    s = s.replace("administrasi", "adm").replace("kep.", "kepulauan").replace("oku", "ogan komering ulu")
    s = re.sub(r"\b(dki|di|adm|dan)\b", "", s)  # DKI Jakarta == Jakarta, DI Yogyakarta == Yogyakarta
    return re.sub(r"[^a-z]", "", s)

# --- hierarki resmi: provinsi > kab > kec (+ jumlah desa)
wil, pidx, kidx, cidx = [], {}, {}, {}
for p in J(f"{kw}/provinces.json"):
    pc = p["code"]; pi = len(wil)
    pidx[norm(p["name"])] = pi
    prov = {"kode": pc, "nama": p["name"], "kab": []}
    for k in J(f"{kw}/provinces/{pc}.json"):
        kc = k["code"]; ki = len(prov["kab"])
        kidx[(pi, norm(k["name"]))] = ki
        kab = {"kode": kc, "nama": k["name"], "kec": []}
        fk = f"{kw}/regencies/{pc}/{kc}.json"
        for c in (J(fk) if os.path.exists(fk) else []):
            fd = f"{kw}/districts/{pc}/{kc}/{c['code']}.json"
            ndesa = len(J(fd)) if os.path.exists(fd) else 0
            cidx[(pi, ki, norm(c["name"]))] = len(kab["kec"])
            kab["kec"].append({"nama": c["name"], "desa": ndesa})
        prov["kab"].append(kab)
    wil.append(prov)

import difflib
def find(d, key, pool):  # exact lalu fuzzy (ejaan beda: Padang Sidempuan/Padangsidimpuan)
    if key in d: return d[key]
    m = difflib.get_close_matches(key, pool, n=1, cutoff=0.8)
    return d[m[0]] if m else -1
kpool = {}
for (pi, n), ki in kidx.items(): kpool.setdefault(pi, {})[n] = ki
cpool = {}
for (pi, ki, n), ci in cidx.items(): cpool.setdefault((pi, ki), {})[n] = ci

# --- koperasi
PRE = "KOPERASI DESA MERAH PUTIH "
rows, miss = [], {"prov": 0, "kab": 0, "kec": 0}
for r in csv.DictReader(open(csvp, encoding="utf-8")):
    lat, lon = float(r["latitude"]), float(r["longitude"])
    if (lat, lon) == (-6.2, 106.8) or not (-11.5 < lat < 6.5 and 94 < lon < 141.5):
        continue  # placeholder Jakarta / luar Indonesia
    pi = pidx.get(norm(r["province"]), -1)
    kd = kpool.get(pi, {})
    ki = find(kd, norm(r["district"]), list(kd))
    cd = cpool.get((pi, ki), {})
    ci = find(cd, norm(r["subdistrict"]), list(cd))
    miss["prov"] += pi < 0; miss["kab"] += ki < 0; miss["kec"] += ci < 0
    name = r["name"][len(PRE):] if r["name"].startswith(PRE) else r["name"]
    norm_ = lambda s: re.sub(r"[^a-z]", "", s.lower())
    cocok = int(bool(r["desa"]) and norm_(r["desa"]) in norm_(name))
    rows.append([round(lat, 5), round(lon, 5), name, pi, ki, ci, r["desa"], cocok])
print(len(rows), "koperasi; tidak cocok hierarki:", miss)
if os.environ.get("DBG"):
    import collections
    c = collections.Counter()
    for r in csv.DictReader(open(csvp, encoding="utf-8")):
        pi = pidx.get(norm(r["province"]), -1); kd = kpool.get(pi, {}); ki = find(kd, norm(r["district"]), list(kd))
        if pi < 0: c[("P", r["province"])] += 1
        elif ki < 0: c[("K", r["province"], r["district"])] += 1
    print(c.most_common(25))
json.dump(wil, open("src/data/wilayah.json", "w"), ensure_ascii=False, separators=(",", ":"))
json.dump(rows, open("src/data/koperasi.json", "w"), ensure_ascii=False, separators=(",", ":"))

# --- batas provinsi (gadm Kemendagri lvl1) & kabupaten (lvl2), disederhanakan
def simplify(path, nd, keep):
    out = []
    for f in J(path)["features"]:
        g = f["geometry"]
        polys = [g["coordinates"]] if g["type"] == "Polygon" else g["coordinates"]
        np_ = []
        for poly in polys:
            rings = []
            for ring in poly:
                o, last = [], None
                for x, y in ring:
                    p = [round(x, nd), round(y, nd)]
                    if p != last: o.append(p)
                    last = p
                if len(o) > 3: rings.append(o)
            if rings: np_.append(rings)
        out.append({"type": "Feature", "properties": {k: f["properties"].get(k) for k in keep}, "geometry": {"type": "MultiPolygon", "coordinates": np_}})
    return {"type": "FeatureCollection", "features": out}
gd = f"{repo}/data-static-indonesia/geojsonkemendagri-indonesia"
json.dump(simplify(f"{gd}/gadm41_IDN_1.json", 2, ["code"]), open("src/data/prov.geo.json", "w"), separators=(",", ":"))
json.dump(simplify(f"{gd}/gadm41_IDN_2.json", 3, ["code"]), open("src/data/kab.geo.json", "w"), separators=(",", ":"))
