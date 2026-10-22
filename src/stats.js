// Agregat koperasi per provinsi / kabupaten / kecamatan terhadap jumlah desa resmi (kode-wilayah).
// Baris koperasi: [lat, lon, nama, prov, kab, kec, desa, cocok]
export function buildStats(wil, coops) {
  const kc = wil.map((p) => p.kab.map(() => 0));
  const cc = wil.map((p) => p.kab.map((k) => k.kec.map(() => 0)));
  const pc = wil.map(() => 0);
  for (const [, , , p, k, c] of coops) {
    pc[p]++;
    if (k >= 0) kc[p][k]++;
    if (k >= 0 && c >= 0) cc[p][k][c]++;
  }
  const sum = (a) => a.reduce((s, x) => s + x, 0);
  const sumDesa = (kab) => kab.kec.reduce((s, c) => s + c.desa, 0);
  const provs = wil.map((p, pi) => ({
    pi,
    nama: p.nama,
    koperasi: pc[pi],
    desa: sum(p.kab.map(sumDesa)),
    kab: p.kab.length,
    kabAktif: kc[pi].filter(Boolean).length,
    kec: sum(p.kab.map((k) => k.kec.length)),
    kecAktif: sum(cc[pi].map((k) => k.filter(Boolean).length)),
  }));
  const kabs = wil.map((p, pi) =>
    p.kab.map((k, ki) => ({
      pi, ki,
      nama: k.nama,
      koperasi: kc[pi][ki],
      desa: sumDesa(k),
      kec: k.kec.length,
      kecAktif: cc[pi][ki].filter(Boolean).length,
    }))
  );
  const kecs = wil.map((p, pi) =>
    p.kab.map((k, ki) => k.kec.map((c, ci) => ({ nama: c.nama, koperasi: cc[pi][ki][ci], desa: c.desa })))
  );
  const total = provs.reduce(
    (t, p) => ({
      koperasi: t.koperasi + p.koperasi, desa: t.desa + p.desa, kab: t.kab + p.kab,
      kabAktif: t.kabAktif + p.kabAktif, kec: t.kec + p.kec, kecAktif: t.kecAktif + p.kecAktif,
    }),
    { koperasi: 0, desa: 0, kab: 0, kabAktif: 0, kec: 0, kecAktif: 0 }
  );
  return { provs, kabs, kecs, total: { ...total, prov: wil.length } };
}
