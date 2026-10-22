const fmt = (n) => n.toLocaleString("id-ID");
const pct = (a, b) => (b ? (a / b) * 100 : 0);
const fmtPct = (v) => v.toLocaleString("id-ID", { maximumFractionDigits: 1 }) + "%";

function Card({ label, value, sub }) {
  return (
    <div className="card">
      <div className="card-v">{value}</div>
      <div className="card-l">{label}</div>
      {sub && <div className="card-s">{sub}</div>}
    </div>
  );
}

function Row({ nama, koperasi, desa, onClick }) {
  const p = pct(koperasi, desa);
  return (
    <li className={onClick ? "row click" : "row"} onClick={onClick}>
      <div className="row-top">
        <span className="row-n">{nama}</span>
        <span className="row-p">{fmtPct(p)}</span>
      </div>
      <div className="bar"><i style={{ width: Math.min(p, 100) + "%" }} /></div>
      <div className="row-s">{fmt(koperasi)} koperasi / {fmt(desa)} desa</div>
    </li>
  );
}

export default function Panel({ wil, stats, prov, kab, onProv, onKab }) {
  const sortDesc = (a) => [...a].sort((x, y) => pct(y.koperasi, y.desa) - pct(x.koperasi, x.desa));
  let title = "Capaian Nasional", d = stats.total, listTitle = "Provinsi", rows = null;

  if (prov === null) {
    rows = sortDesc(stats.provs).map((p) => <Row key={p.pi} {...p} onClick={() => onProv(p.pi)} />);
  } else if (kab === null) {
    const p = stats.provs[prov];
    title = p.nama; d = p; listTitle = "Kabupaten / Kota";
    rows = sortDesc(stats.kabs[prov]).map((k) => <Row key={k.ki} {...k} onClick={() => onKab(k.ki)} />);
  } else {
    const k = stats.kabs[prov][kab];
    title = k.nama; d = { ...k, kab: 1, kabAktif: 1 }; listTitle = "Kecamatan";
    rows = sortDesc(stats.kecs[prov][kab]).map((c) => <Row key={c.nama} {...c} />);
  }

  return (
    <aside className="panel">
      <div className="crumb">
        <button onClick={() => onProv(null)} disabled={prov === null}>Nasional</button>
        {prov !== null && <> / <button onClick={() => onKab(null)} disabled={kab === null}>{wil[prov].nama}</button></>}
        {kab !== null && <> / <span>{wil[prov].kab[kab].nama}</span></>}
      </div>
      <h2>{title}</h2>
      <div className="cap">
        <div className="cap-v">{fmtPct(pct(d.koperasi, d.desa))}</div>
        <div className="cap-l">capaian desa</div>
        <div className="bar big"><i style={{ width: Math.min(pct(d.koperasi, d.desa), 100) + "%" }} /></div>
        <div className="cap-s">{fmt(d.koperasi)} koperasi dari {fmt(d.desa)} desa/kelurahan</div>
      </div>
      <div className="cards">
        {prov === null && <Card label="Provinsi" value={fmt(d.prov)} />}
        {kab === null && <Card label="Kabupaten/Kota" value={fmt(d.kab)} sub={`${fmt(d.kabAktif)} sudah ada koperasi`} />}
        <Card label="Kecamatan" value={fmt(d.kec)} sub={`${fmt(d.kecAktif)} sudah ada koperasi`} />
        <Card label="Desa/Kelurahan" value={fmt(d.desa)} />
        <Card label="Koperasi" value={fmt(d.koperasi)} />
      </div>
      <h3>{listTitle} <small>(urut capaian)</small></h3>
      <ul className="list">{rows}</ul>
      <p className="note">Capaian = jumlah koperasi ÷ jumlah desa/kelurahan resmi (kode wilayah Kemendagri 2026).</p>
    </aside>
  );
}
