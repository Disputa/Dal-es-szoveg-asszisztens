# Dal- es szoveg asszisztens - projektosszefoglalo

Munkanev: **Dal- es szoveg asszisztens**

Kiindulasi alap: **EmlekSugo 2.5.4 hotfix**

Forrasprojekt helye ezen a gepen:

`D:\Sajat meghajto\Deme_Gabor_Archivum\Programozas\CODEING\CODEING\EmlekSugo_clean`

Megjegyzes: a mappa neve a fajlrendszerben ekezetesen jelenik meg: `EmlékSúgó_clean`. Korabbi munkamenetekben ugyanez a Google Drive mas meghajtojel alatt is latszott, peldaul `I:\...`; a jelenlegi gepen/kornyezetben a Drive a `D:\` meghajton erheto el.

## 1. Projektcel

A Dal- es szoveg asszisztens celja egy professzionalis, koncerteken, szinhazi es eloeloadas-kornyezetben hasznalhato szoveg-, dal-, felirat- es musor-koveto rendszer letrehozasa.

Ket fo felhasznalasi irany:

- **Eloadoknak, enekeseknek, zenekaroknak, szineszeknek**: szinpadon vagy monitoron kovetheto dalszoveg, probaszoveg, musorrend, blokkos vagy folyamatos lejatszas.
- **Nezoknek, kozonsegnek**: feliratozo rendszer siketek es nagyothallok reszere, idegen nyelvu eloadas magyar feliratozasahoz, illetve magyar eloadas idegen nyelvu feliratozasahoz.

A vegcel nem egy egyszeru teleprompter, hanem egy eloadasvezerlesre alkalmas, rugalmas szovegasszisztens, amely kulonbozo kijelzokre, kulonbozo nezeti modokban, pontosan idozitheto es kezzel is kovetheto tartalmat tud kuldeni.

## 2. Kiindulasi allapot: EmlekSugo 2.5.4

A mostani EmlekSugo mar tartalmazza az uj projekt szamara fontos alapokat:

- Tauri alapu desktop alkalmazas.
- Windows build: NSIS telepito es MSI.
- macOS build workflow: Intel es Apple Silicon DMG GitHub Actions segitsegevel.
- Foablak es kulon Display2 ablak.
- Display2 hatterkepes megjelenes.
- Musorlista bal oldali megjelenitese.
- Jobb oldali blokk-sav, kattinthato blokkokkal.
- Blokkonkenti es scroll jellegu lejatszasi mod.
- Play/pause, elozo/kovetkezo blokk, felirat eleje/vege, kovetkezo dal eleje.
- Black funkcio.
- Szovegmeret es pozicio allitas.
- Megszolalo/enekes nev meret es pozicio allitas.
- Foablak preview, amely a Display2 monitor kepet kicsinyitve kontrollmonitor-szeruen mutatja.
- Projektmentes `.esp` fajlba.
- Beepitett sugo.
- GitHub repo es build pipeline.

Jelenlegi Git branch:

`codex/emleksugo-2-5-0`

GitHub repo:

`https://github.com/Disputa/EmlekSugo.git`

Fontos build-verzio:

`2.5.4`

## 3. Uj projekt strategiai iranyai

### 3.1 Koncert-sugo rendszer

Felhasznalok:

- enekesek,
- zenekarok,
- korusok,
- karmesterek,
- szinpadi asszisztensek,
- musorvezetok,
- technikusok.

Tipikus igenyek:

- dalok sorrendje,
- dalszovegek blokkokra bontva,
- megszolalo/enekes szerinti megjelenites,
- tempohoz igazodo scroll,
- kezi blokkugras,
- kovetkezo dal elokeszitese,
- szinpadi monitoros vagy kulon kijelzos hasznalat,
- gyors musorrendmodositas.

### 3.2 Szinhazi feliratozo rendszer

Felhasznalok:

- szinhazak,
- befogadohelyek,
- fesztivalok,
- feliratozast vezerlo operatorok,
- akadalymentesitesi szakemberek.

Celkozonseg:

- siket es nagyothallo nezok,
- idegen nyelvu nezok,
- magyar nezok idegen nyelvu eloadasnal,
- oktatasi, archivalasi vagy stream-kornyezetek.

Tipikus igenyek:

- nagy kontrasztu, jol olvashato felirat,
- tobbnyelvu tartalom,
- feliratablak kulon kijelzon/projektoron/LED-falon,
- operator altali sor- vagy blokk-kovetes,
- jelenetvaltasok, megszolalok kovetese,
- nem hallhato hangok jelolese, peldaul `[zene]`, `[taps]`, `[ajton kopognak]`,
- akadalymentes feliratozasi szabalyok tamogatasa.

## 4. Fo modulok

### 4.1 Projekt- es musorrendkezeles

Feladat:

- eloadas/projekt letrehozasa,
- musorrend osszeallitasa,
- dalok, jelenetek, blokkok kezelese,
- import/export,
- projektverziok kezelese.

Javasolt formatumok:

- `.esp` vagy uj projektformatum, peldaul `.dsa`,
- JSON alapu belso adatmodell,
- import `.txt`, `.docx`, kesobb `.xlsx`, `.csv`, `.srt`, `.vtt`.

### 4.2 Szoveg- es blokkeditor

Feladat:

- dalszoveg vagy feliratszoveg blokkokra bontasa,
- megszolalo/karakter/enekes hozzarendelese,
- blokkok atrendezese,
- gyors szerkesztes proban vagy eloadas elott,
- duett/tobbszereplos blokkok kezelese.

Javasolt bovitmenyek:

- automatikus blokkfelismeres ures sorok, megszolalo nevek vagy idokod alapjan,
- karakterlista,
- szereposztas,
- kulon jeloles zenei vagy hanghatas instrukcioknak,
- "operator megjegyzes" mezok, amelyek nem mennek ki a kozonseg kijelzore.

### 4.3 Display motor

Feladat:

- kulon ablak/kijelzo kezelese,
- tobb kijelzo tamogatasa,
- feliratpozicio, meret, szin, hatter,
- scroll es blokkonkenti mod,
- fullscreen, ablakos mod, talcara rejtese, bezaras.

Javasolt fejlesztes:

- tobb kulonbozo kimenet egyszerre:
  - szinpadi monitor,
  - kozonsegfelirat,
  - operator preview,
  - kulon nyelvi kijelzo.
- profilok:
  - koncert,
  - szinhazi felirat,
  - akadalymentesitett felirat,
  - probamod.

### 4.4 Operator / kontrollfelulet

Feladat:

- egy helyrol vezerelni a teljes eloadast,
- latni az aktualis blokkot,
- latni a kovetkezo blokkokat,
- preview monitoron pontos kepet kapni a kimenetrol,
- gyorsan ugrani dalra, jelenetre, blokkra.

Kulcsfontossagu elv:

Az operator preview nem "hasonlo" kep legyen, hanem a valodi kimenet aranyos kontrollkepe. Ez mar a 2.5.3/2.5.4 iranyban elkezdodott, es a tovabbi projektben alapelvkent kell kezelni.

### 4.5 Idozites es kovetes

Feladat:

- kezi blokkugras,
- automatikus scroll,
- sebessegallitas,
- idokodos feliratfajlok kezelese,
- kesobb MIDI/OSC/QLab/timecode integracio.

Lehetseges bovitmenyek:

- SRT/VTT import,
- idokod alapjan automatikus feliratvaltás,
- QLab cue-k kapcsolasa,
- MIDI pedal / Stream Deck vezerles,
- billentyuparancs szerkesztes.

### 4.6 Akadalymentes feliratozas

Feladat:

- siketek es nagyothallok szamara jol ertheto feliratozas,
- nem beszedszeru hangok jelolese,
- beszelo azonositas,
- kontraszt es olvashatosag garantalasa.

Javasolt funkciok:

- speaker label megjelenitesi modok,
- hanghatas-jeloles kulon stilussal,
- olvashatosagi ellenorzes,
- minimum betumeret,
- sorhossz figyelmeztetes,
- nagy kontrasztu sablonok.

### 4.7 Forditas es tobbnyelvuseg

Feladat:

- eredeti nyelv es celnyelv kezelese,
- ketnyelvu szerkesztes,
- feliratnyelv valtas,
- kulon kimenet kulon nyelvnek.

Javasolt adatmodell:

- blokk azonosito,
- eredeti szoveg,
- forditott szoveg(ek),
- megszolalo,
- megjegyzes,
- idokod,
- stilus.

Kesobbi fejlesztes:

- fordítási memoria,
- AI-alapu nyersforditas ellenorzessel,
- dramaturgiai/nyelvi lektor workflow,
- kulon operatori es publikusan megjeleno szoveg.

## 5. Javasolt adatmodell

Egy projekt tartalmazhat:

- projekt metaadatok:
  - cim,
  - produkcio,
  - helyszin,
  - datum,
  - nyelvek,
  - verzio,
  - keszitok.
- musorrend:
  - dalok,
  - jelenetek,
  - konferansz blokkok,
  - szunetek,
  - technikai cue-k.
- szovegblokkok:
  - id,
  - tipus,
  - megszolalo,
  - eredeti szoveg,
  - forditasok,
  - megjelenitesi stilus,
  - idokod,
  - operatori megjegyzes.
- kijelzoprofilok:
  - szinpadi monitor,
  - kozonsegfelirat,
  - preview,
  - nyelvi kimenetek.
- vezerlesi beallitasok:
  - sebesseg,
  - billentyuparancsok,
  - automatikus/kezi kovetes,
  - QLab/MIDI/OSC integracio.

## 6. Felhasznaloi szerepkorok

### Operator

- eloadas kozben vezerel,
- blokkot valt,
- scrollt indit/allit,
- blacket kapcsol,
- szoveget gyorsan korrigalhat.

### Szerkeszto / dramaturg / fordito

- szoveget importal,
- blokkokra bont,
- fordit,
- ellenoriz,
- stilust es megjelenesi modot valaszt.

### Technikus

- kijelzoket allit be,
- projektort/LED-falat/monitort kezel,
- felbontast es fullscreen modot ellenoriz,
- kulso rendszerekkel integral.

### Eloadok

- szinpadi monitoron kovetik a szoveget,
- proban hasznaljak,
- szemelyre szabott nezeti modot igenyelhetnek.

### Nezok

- kozonsegfeliratot latnak,
- akadalymentesitett vagy forditott tartalmat kapnak.

## 7. UI/UX iranyelvek

### Operator felulet

- gyors, suru, nem marketing jellegu felulet,
- nagy, biztosan kattinthato vezergombok,
- billentyuparancsok,
- egyertelmu statusz: PLAY, PAUSE, BLACK, aktualis blokk,
- preview mindig pontos legyen,
- musorrend es blokkok gyors elerese.

### Display / kozonseg felirat

- minimalis zavaras,
- nagy kontraszt,
- olvashato sorhossz,
- pozicio es meret profilok,
- nincs felesleges UI, ha kozonsegnek megy.

### Szinpadi monitor

- eros, nagy szoveg,
- megszolalo vagy dalcim jol lathato,
- kovetkezo blokk jelzese opcionálisan,
- sotet szinpadi kornyezethez optimalizalt megjelenes.

## 8. Technikai alapok

Jelenlegi stack:

- Tauri 2,
- JavaScript,
- Vite,
- HTML/CSS,
- Rust oldali Tauri parancsok,
- GitHub Actions build pipeline.

Javasolt tovabbi technikai irany:

- a Display motor es a preview kozos render-modelljenek formalizalasa,
- kulon adatmodell fajl a projektstrukturanak,
- import/export modulok szetvalasztasa,
- kijelzoprofilok bevezetese,
- automatikus tesztek a blokkugrasra es a Display szinkronra,
- macOS/Windows build pipeline stabilizalasa,
- release csomagolas es verziozas szabalyainak rogzitese.

## 9. Integracios lehetosegek

Kesobbi professzionalis hasznalatnal fontos lehet:

- QLab integracio,
- OSC uzenetek,
- MIDI vezerles,
- Stream Deck gombok,
- timecode kovetes,
- NDI vagy mas video-kimenet,
- webes remote control tabletrol,
- local network preview/kimenet,
- kulso feliratformatumok:
  - SRT,
  - WebVTT,
  - ASS/SSA,
  - CSV/XLSX.

## 10. Release es telepites

A mostani projektbol atveheto:

- Windows NSIS setup,
- Windows MSI,
- macOS Intel DMG,
- macOS Apple Silicon DMG,
- GitHub Actions workflow.

Javaslat az uj projekthez:

- kulon repo vagy uj fo branch,
- egyertelmu verziozas,
- minden hotfix uj verzioszamot kapjon,
- release mappak:
  - `release-x.y.z/`
  - `MacOS x.y.z/`
  - `Windows x.y.z/`
- checksum fajlok keszitese,
- changelog vezetes.

## 11. A jelenlegi EmlekSugo projekt hasznos reszei

Az uj projekt indulaskor ezekbol erdemes dolgozni:

- `src/main.js`
  - operator felulet logikaja,
  - projekt import/export,
  - Display2 szinkron,
  - preview rendereles,
  - billentyuparancsok.
- `src/display.js`
  - kulon kijelzos megjelenito,
  - blokk- es scrollmod,
  - Display2 sajat vezerlogombok,
  - blokk-sav kattintas.
- `src/style.css`
  - operator felulet,
  - preview,
  - szerkeszto panelek.
- `src/display.css`
  - Display2 vizualis megjelenes,
  - hatter,
  - musorlista,
  - blokk-sav,
  - feliratpozicio.
- `index.html`
  - operator UI szerkezete.
- `display.html`
  - Display2 ablak szerkezete.
- `help.html`
  - beepitett sugo alapja.
- `src-tauri/`
  - desktop app konfiguracio,
  - Rust oldali Tauri parancsok,
  - build metaadatok.
- `.github/workflows/build-macos-dmg.yml`
  - macOS DMG build pipeline.

## 12. Javasolt uj projektmappa-struktura

Egy tisztabb uj projektben erdemes lehet ilyen strukturat kialakitani:

```text
Dal-es-szoveg-asszisztens/
  docs/
    projektosszefoglalo.md
    adatmodell.md
    felhasznaloi_munkafolyamatok.md
    release_folyamat.md
  src/
    app/
      operator/
      display/
      preview/
      editor/
    core/
      project-model/
      playback/
      importers/
      exporters/
      display-profiles/
    assets/
  src-tauri/
  public/
    help/
  .github/
    workflows/
  release/
```

## 13. Fejlesztesi roadmap

### 1. fazis: stabil alap uj projektben

- EmlekSugo 2.5.4 atemelese uj projektbe.
- Nev, ikon, metadata atnevezese.
- Alap projektmodell tisztazasa.
- Display/preview kozos renderlogika formalizalasa.
- Windows/macOS build mukodesenek ellenorzese.

### 2. fazis: koncertmod

- dal- es musorrendkezeles bovites,
- szinpadi monitor profilok,
- gyors blokkszerkesztes,
- kovetkezo blokk/dal elonezet,
- Stream Deck/MIDI alapok.

### 3. fazis: szinhazi feliratmod

- jelenetek es karakterek kezelese,
- kozonsegfelirat profil,
- akadalymentes feliratozasi jelolesek,
- SRT/VTT import/export,
- idokod alapok.

### 4. fazis: tobbnyelvu rendszer

- eredeti es forditott szoveg parhuzamos kezelese,
- nyelvi kimenetek,
- forditasi workflow,
- kulon kozonsegkijelzok.

### 5. fazis: professzionalis integraciok

- QLab/OSC/MIDI,
- remote control,
- halozati kijelzok,
- backup/failover mod,
- show-safe release folyamat.

## 14. Fontos tervezesi elvek

- A preview mindig a valodi kimenet kontrollkepe legyen.
- A kijelzo es a preview ne kulon logikat emulaljon, hanem ugyanazt az allapotot renderelje.
- Minden kezi blokkugrasnak a valodi lejatszasi poziciot is mozgatnia kell.
- A feliratnak akadalymentes helyzetben elsosorban olvashatonak kell lennie, nem dekorativnak.
- Eloadas kozben a rendszernek gyorsnak, kiszamithatonak es hibaturesnek kell lennie.
- Minden hotfix kapjon uj verzioszamot.
- A projektfajlok legyenek visszafele kompatibilisek, ameddig lehet.

## 15. Kovetkezo konkret lepesek

1. Uj repo vagy uj projektmappa letrehozasa `Dal-es-szoveg-asszisztens` neven.
2. EmlekSugo 2.5.4 kodbazis masolasa kiindulasi alapnak.
3. Termeknev, app identifier, ikonok es build artifact nevek atnevezese.
4. Dokumentacio atemelese `docs/` ala.
5. Projektmodell es kijelzoprofilok megtervezese.
6. Koncertmod es szinhazi feliratmod kulon feluleti/profil logikajanak megtervezese.
7. Import/export kovetelmenyek listazasa.
8. Elso `0.1.0` fejlesztoi build kiadasa az uj nev alatt.

