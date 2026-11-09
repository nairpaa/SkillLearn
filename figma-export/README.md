# figma-export

Mengubah prototype desain di `../design_handoff/design/` menjadi layer Figma yang bisa diedit.

```bash
npm install
npm run capture   # DOM tiap layar → out/skilllearn-layers.json, kanvas referensi → out/reference/*.png
npm run preview   # gambar ulang JSON jadi PNG di out/preview/ untuk dicek tanpa Figma
npm run check     # cek tipe plugin/code.js terhadap @figma/plugin-typings
```

Plugin Figma ada di `plugin/` (Plugins > Development > Import plugin from manifest).
Butuh Chromium (`CHROMIUM_PATH`, default `/usr/bin/chromium`).
