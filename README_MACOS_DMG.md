# EmlékSúgó macOS DMG build

Másold a `.github/workflows/build-macos-dmg.yml` fájlt a projekt gyökerébe, commitold és pushold GitHubra.

Utána GitHubon: Actions → Build macOS DMG → Run workflow.

A kész `.dmg` fájlok az adott workflow run alján az Artifacts résznél lesznek:

- EmlékSúgó-2.0-FIX-macOS-arm64-DMG
- EmlékSúgó-2.0-FIX-macOS-intel-DMG

Fontos: ez unsigned DMG. Tesztre jó. Macen első indításnál Gatekeeper figyelmeztethet.
