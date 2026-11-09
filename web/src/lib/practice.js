// Jalankan "checks" latihan (regex dari API) terhadap isi editor.
// Pola dari server dianggap konten tepercaya (dibuat admin), tapi tetap dijaga:
// flag dibatasi ke yang valid dan pola rusak dihitung gagal, bukan bikin halaman crash.
export function runChecks(code, checks = []) {
  return checks.map((c) => {
    let pass = false;
    try {
      pass = new RegExp(c.pattern, (c.flags || '').replace(/[^gimsuy]/g, '')).test(code);
    } catch {
      pass = false;
    }
    return { label: c.label, pass };
  });
}
