EmlékSúgó 2.0_FIX – ikon bitmélység javítás

Hiba:
  failed to decode icon ... icon.ico: Unsupported PNG bit depth: Sixteen

Ok:
  A korábbi ikonfájlok 16-bit/color PNG-k voltak, az icon.ico belsejében is.
  A Tauri build ezt nem fogadja el.

Javítás:
  Ez a patch 8-bit/color RGBA PNG ikonokat és 8-bit/color ICO-t másol be.

Használat a projekt gyökerében:
  node .\apply_emleksugo_icon_depth_fix.cjs
  npm run tauri build

Ha ugyanazt írná még egyszer:
  cd src-tauri
  cargo clean
  cd ..
  npm run tauri build
