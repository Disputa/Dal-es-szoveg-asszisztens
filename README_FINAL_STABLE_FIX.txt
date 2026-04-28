EmlékSúgó végső stabilizáló patch

Futtatás a projekt gyökerében:

  node .\apply_emleksugo_final_stable_fix.cjs
  npm run tauri build

Javítja:
1) Projektmentés:
   - nem használja tovább a hibásan viselkedő Windows SaveFileDialogot;
   - először nevet kér promptban;
   - utána mappát választasz;
   - a fájlt Rust írja ki .esp kiterjesztéssel.

2) Display2 bezáró gomb:
   - jobb felső X gombot tesz vissza a második kijelzőre;
   - a Display2 eseményt küld a főablaknak;
   - a főablak Rust paranccsal bezárja a display ablakot.

Nem nyúl:
- dalszöveg-lejátszási logikához;
- Display2 szinkronhoz;
- blokk-diákhoz;
- háttérképhez;
- ikonokhoz;
- műsorrend/logikai struktúrához.
