import { useMemo } from "react";

// Dropdown bertingkat provinsi > kabupaten > kecamatan > desa (desa = nama hasil join poligon GADM)
export default function Filter({ wil, coops, f, set }) {
  const { prov, kab, kec, desa } = f;
  const kabs = prov === null ? [] : wil[prov].kab;
  const kecs = kab === null ? [] : kabs[kab].kec;
  const desas = useMemo(() => {
    if (kec === null) return [];
    const s = new Set();
    for (const c of coops) if (c[3] === prov && c[4] === kab && c[5] === kec && c[6]) s.add(c[6]);
    return [...s].sort((a, b) => a.localeCompare(b, "id"));
  }, [coops, prov, kab, kec]);

  const num = (v) => (v === "" ? null : +v);
  return (
    <div className="filter">
      <label>Provinsi
        <select value={prov ?? ""} onChange={(e) => set({ prov: num(e.target.value), kab: null, kec: null, desa: "" })}>
          <option value="">Semua provinsi</option>
          {wil.map((p, i) => <option key={i} value={i}>{p.nama}</option>)}
        </select>
      </label>
      <label>Kabupaten/Kota
        <select value={kab ?? ""} disabled={prov === null} onChange={(e) => set({ kab: num(e.target.value), kec: null, desa: "" })}>
          <option value="">Semua kabupaten/kota</option>
          {kabs.map((k, i) => <option key={i} value={i}>{k.nama}</option>)}
        </select>
      </label>
      <label>Kecamatan
        <select value={kec ?? ""} disabled={kab === null} onChange={(e) => set({ kec: num(e.target.value), desa: "" })}>
          <option value="">Semua kecamatan</option>
          {kecs.map((c, i) => <option key={i} value={i}>{c.nama}</option>)}
        </select>
      </label>
      <label>Desa
        <select value={desa} disabled={kec === null} onChange={(e) => set({ desa: e.target.value })}>
          <option value="">Semua desa</option>
          {desas.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
      </label>
    </div>
  );
}
