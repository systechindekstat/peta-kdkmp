import { useEffect, useRef } from "react";
import L from "leaflet";
import Supercluster from "supercluster";
import provGeo from "./data/prov.geo.json";
import kabGeo from "./data/kab.geo.json";

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
// pin merah + ikon toko/koperasi putih; hanya titik tunggal yang terlihat (hasil cluster) yang dibuat, jadi ringan
const PIN = L.divIcon({
  className: "pin",
  iconSize: [30, 40],
  iconAnchor: [15, 39],
  popupAnchor: [0, -34],
  html: `<svg viewBox="0 0 30 40" width="30" height="40"><path d="M15 1C7.3 1 1 7.2 1 14.8 1 25 15 39 15 39s14-14 14-24.200C29 7.200 22.700 1 15 1z" fill="#c0392b" stroke="#fff" stroke-width="2"/><path d="M8.500 13.500 10 9h10l1.500 4.500v1H8.500zM9.500 16h11v6h-11zM13 18h4v4h-4z" fill="#fff"/></svg>`,
});
const STYLE = { color: "#c0392b", weight: 1, fillColor: "#f4f1e8", fillOpacity: 1 };
const STYLE_SEL = { color: "#c0392b", weight: 2.5, fillColor: "#fde9d4", fillOpacity: 1 };

export default function MapView({ coops, ids, wil, prov, kab, fitKey, onPickProv }) {
  const el = useRef(null);
  const s = useRef({}); // state imperatif leaflet
  const cb = useRef(onPickProv);
  cb.current = onPickProv;

  // init peta sekali
  useEffect(() => {
    const map = L.map(el.current, { maxZoom: 18, preferCanvas: true, zoomControl: true, attributionControl: false }).setView([-2.5, 123], 5);
    L.control.attribution({ prefix: false }).addAttribution("batas: GADM/Kemendagri via geomaps_indo · data: simkopdes.go.id").addTo(map);
    L.geoJSON(kabGeo, { style: { color: "#9aa5ad", weight: 0.5, fillColor: "#f4f1e8", fillOpacity: 1 }, interactive: false }).addTo(map);
    const provLayer = L.geoJSON(provGeo, {
      style: STYLE,
      onEachFeature: (f, l) => l.on("click", (e) => {
        // batas GADM belum punya provinsi Papua baru: provinsi diambil dari koperasi terdekat dari titik klik
        let best = -1, bd = Infinity;
        for (const c of s.current.coops) {
          const d = (c[0] - e.latlng.lat) ** 2 + (c[1] - e.latlng.lng) ** 2;
          if (d < bd) { bd = d; best = c[3]; }
        }
        if (best >= 0) cb.current(best);
      }),
    }).addTo(map);
    const layer = L.layerGroup().addTo(map);
    Object.assign(s.current, { map, provLayer, layer, coops });

    const draw = () => {
      const { index, ids } = s.current;
      layer.clearLayers();
      if (!index) return;
      const b = map.getBounds();
      const items = index.getClusters([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()], Math.round(map.getZoom()));
      for (const it of items) {
        const [lon, lat] = it.geometry.coordinates;
        if (it.properties.cluster) {
          const n = it.properties.point_count, size = n < 100 ? 32 : n < 1000 ? 38 : 46;
          L.marker([lat, lon], {
            icon: L.divIcon({ className: "cl", html: `<div style="width:${size}px;height:${size}px;line-height:${size}px">${n >= 1000 ? Math.round(n / 100) / 10 + "k" : n}</div>`, iconSize: [size, size] }),
          }).on("click", () => map.setView([lat, lon], Math.min(index.getClusterExpansionZoom(it.properties.cluster_id), 18))).addTo(layer);
        } else {
          const c = coops[it.properties.i];
          const k = wil[c[3]], kb = k.kab[c[4]];
          L.marker([lat, lon], { icon: PIN })
            .bindPopup(() =>
              `<b>Kop. Desa Merah Putih ${esc(c[2])}</b><br>${c[6] ? `Desa ${esc(c[6])}${c[7] ? "" : " <i title='nama tidak cocok dgn nama koperasi'>(?)</i>"}<br>` : ""}` +
              `${kb ? esc(kb.kec[c[5]]?.nama ? "Kec. " + kb.kec[c[5]].nama + ", " : "") + esc(kb.nama) + ", " : ""}${esc(k.nama)}<br><small>${c[0]}, ${c[1]}</small>`)
            .addTo(layer);
        }
      }
    };
    s.current.draw = draw;
    map.on("moveend", draw);
    return () => map.remove();
  }, []);

  // titik berubah -> bangun ulang indeks cluster
  useEffect(() => {
    const index = new Supercluster({ radius: 60, maxZoom: 16 });
    index.load(ids.map((i) => ({ type: "Feature", properties: { i }, geometry: { type: "Point", coordinates: [coops[i][1], coops[i][0]] } })));
    s.current.index = index;
    s.current.draw();
  }, [ids, coops]);

  // pilihan/filter berubah -> zoom ke titik & sorot provinsi
  useEffect(() => {
    const { map, provLayer } = s.current;
    const code = prov !== null ? wil[prov].kode : null;
    provLayer.eachLayer((l) => l.setStyle(l.feature.properties.code === code ? STYLE_SEL : STYLE));
    if (!ids.length || ids.length === coops.length) {
      if (prov === null) map.setView([-2.5, 123], 5);
      return;
    }
    let a = 90, b = 180, c = -90, d = -180;
    for (const i of ids) {
      const [la, lo] = coops[i];
      if (la < a) a = la; if (la > c) c = la; if (lo < b) b = lo; if (lo > d) d = lo;
    }
    map.fitBounds([[a, b], [c, d]], { padding: [40, 40], maxZoom: 13 });
  }, [fitKey]); // eslint-disable-line

  return <div ref={el} className="map" />;
}
