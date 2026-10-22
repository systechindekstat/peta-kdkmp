"""Tambah kolom desa ke koperasi.csv via point-in-polygon ke gadm41_IDN_4 (geomaps_indo)
(nama desa dari NAME_4 GADM; kode GADM versi lama, tidak sama dgn kode-wilayah 2026). Output koperasi_desa.csv.
Pakai: python join_desa.py <path geomaps_indo>   (butuh shapely)"""
import csv, json, os, sys
from shapely.geometry import shape, Point
from shapely.strtree import STRtree

repo = sys.argv[1]
feats = json.load(open(f"{repo}/indeksmaps/public/gadm41_IDN_4.json"))["features"]
polys = [shape(f["geometry"]) for f in feats]
codes = [f["properties"]["CC_4"] for f in feats]
tree = STRtree(polys)

import re
names = [re.sub(r"(?<=[a-z])(?=[A-Z])", " ", f["properties"]["NAME_4"]) for f in feats]  # GADM tanpa spasi: "AlueBagok"

rows = list(csv.DictReader(open("koperasi.csv", encoding="utf-8")))
pts = [Point(float(r["longitude"]), float(r["latitude"])) for r in rows]
hit = 0
with open("koperasi_desa.csv", "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f)
    w.writerow(list(rows[0]) + ["kode_desa", "desa"])
    for r, pt in zip(rows, pts):
        k = n = ""
        for i in tree.query(pt):
            if polys[i].covers(pt):
                k, n = codes[i], names[i]; hit += 1; break
        w.writerow(list(r.values()) + [k, n])
print(hit, "/", len(rows), "koperasi dapat desa")
