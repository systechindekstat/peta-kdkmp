import { useMemo, useState, useDeferredValue } from "react";
import MapView from "./MapView.jsx";
import Panel from "./Panel.jsx";
import Filter from "./Filter.jsx";
import wil from "./data/wilayah.json";
import coops from "./data/koperasi.json";
import { buildStats } from "./stats.js";

const stats = buildStats(wil, coops);

export default function App() {
  const [f, setF] = useState({ prov: null, kab: null, kec: null, desa: "" }); // indeks bertingkat; desa = nama
  const { prov, kab, kec, desa } = f;
  const set = (patch) => setF((o) => ({ ...o, ...patch }));
  const [q, setQ] = useState(() => new URLSearchParams(location.search).get("q") || "");
  const dq = useDeferredValue(q.trim().toLowerCase());

  // indeks baris koperasi yang lolos filter
  const ids = useMemo(() => {
    const out = [];
    for (let i = 0; i < coops.length; i++) {
      const c = coops[i];
      if (prov !== null && c[3] !== prov) continue;
      if (kab !== null && c[4] !== kab) continue;
      if (kec !== null && c[5] !== kec) continue;
      if (desa && c[6] !== desa) continue;
      if (dq && !(c[2].toLowerCase().includes(dq) || c[6].toLowerCase().includes(dq))) continue;
      out.push(i);
    }
    return out;
  }, [prov, kab, kec, desa, dq]);

  const pickProv = (p) => set({ prov: p, kab: null, kec: null, desa: "" });

  return (
    <>
      <MapView coops={coops} ids={ids} wil={wil} prov={prov} kab={kab} fitKey={`${prov}|${kab}|${kec}|${desa}|${dq}`} onPickProv={pickProv} />
      <div className="left">
        <div className="search">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari nama koperasi / desa..." />
          <span>{ids.length.toLocaleString("id-ID")} titik</span>
        </div>
        <Filter wil={wil} coops={coops} f={f} set={set} />
      </div>
      <Panel wil={wil} stats={stats} prov={prov} kab={kab} onProv={pickProv} onKab={(k) => set({ kab: k, kec: null, desa: "" })} />
    </>
  );
}
