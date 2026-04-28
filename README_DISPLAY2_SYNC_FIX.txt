EmlékSúgó 2.0_FIX Display2 szövegátvitel javítás

Hiba:
A második kijelző betölt, a nyitókép látszik, de a szöveg nem jelenik meg.

Ok:
A Display2 Tauri window tényleges labelje: emlek-sugo-display.
A capability fájlban korábban csak main/display szerepelt, ezért a Display2 ablakon az event listener/emit jogok nem működhettek stabilan.
Plusz az első display:block event elveszhetett, ha a főablak túl korán küldte.

Használat:
1. Másold/csomagold ki ezt a fájlt a projekt gyökerébe:
   C:\Users\Deme\Desktop\CODEING\EmlékSúgó_clean

2. Futtasd:
   node .\apply_emleksugo_display_sync_fix.cjs

3. Build:
   npm run tauri build

Mit módosít:
- src-tauri/capabilities/*.json
  - hozzáadja: emlek-sugo-display window label
  - event listen/emit/emit-to jogokat ellenőrzi
  - régi dialog:/fs: permissionöket kitakarítja
- fő JS
  - Display2 nyitás után többször újraküldi az aktuális blokkot
  - figyeli a Display2 ready/request-state eseményét
- Display2 JS
  - betöltés után ready/request-state eseményt küld a főablaknak

Nem nyúl:
- blokkok logikájához
- lejátszás/megállás szabályhoz
- színekhez
- háttérképhez
- .esp mentési Rust-parancshoz
- ikonokhoz
