# Peta Koperasi Desa Merah Putih

Peta lokal (React + Leaflet + supercluster), tanpa tile/API eksternal.

    npm install
    npm run dev          # atau: npm run build && npm run preview

Data sudah ada di `src/data`. Bangun ulang (butuh `pip install requests pycryptodome shapely`):

    python scripts/scrape_koperasi.py                      # -> koperasi.csv (dari simkopdes.go.id)
    python scripts/join_desa.py <path geomaps_indo>        # -> koperasi_desa.csv
    python scripts/build_data.py <path geomaps_indo> koperasi_desa.csv

`<path geomaps_indo>` = clone https://github.com/QueenOfMagician/geomaps_indo
