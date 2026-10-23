# vivo Office Suite — English localization

Community English localization for **vivo Office Suite 7.0.6 on Windows**, including its hosted cloud service screens and a startup responsiveness fix.

**Patch release:** 1.0.0 · **Tested application:** 7.0.6 · **Test phone:** vivo X300 Pro over Wi-Fi

This is an independent community project, unaffiliated with vivo. Install the official application separately. This repository provides patch recipes, localization helpers, dictionaries and tests; it does not contain the original installer, native binaries, account profiles or a complete copy of the application.

## What changes

| Area | English coverage | Verification |
| --- | --- | --- |
| Desktop interface | Navigation, settings, connection prompts, Notes, Calendar, Tasks, Recorder, Albums, Documents and shared dialogs | Static validation, helper tests and selected runtime screens |
| Contacts | Sidebar, search, loading state, new/import/export menus | Real hosted screen and menu inspection; reload persistence |
| Browser | Bookmark navigation, fixed labels, empty state and Trash | Real hosted screen; reload persistence |
| Spam blocking | Blocklist, Allowlist, counts, deleted lists and empty states | Real hosted screen and layout inspection |
| Cloud Drive | Sidebar, search, toolbar, sort menu and empty states | Real hosted screen and sort menu inspection |
| Find Device | Device panel, fixed controls and map mode UI | Real hosted screen and redirect/reload persistence |
| Startup | Moves slow native hardware collection off the main process | Regression tests and measured isolated launches |

Cloud localization uses **511 fixed labels**, reviewed selectors and a mutation observer. It targets reviewed HTTPS service routes on `yun.vivo.com.cn` and `find.vivo.com.cn`. It preserves user content such as contact names, custom groups, bookmarks, filenames, folders, device names and map labels. It does not translate whole pages by sending their contents to a translation service.

The domestic backend setting remains `IS_EXPORT: false`. Region checks, authentication and device compatibility rules remain in place.

## Install

You need the official **Windows 7.0.6 installation**, its **original, unmodified `app.asar`**, Node.js 20 or later, and approximately 2 GB of free space for input, output and backup files. Node is required for building the patch; the installed app uses its bundled Electron runtime.

1. Download this repository using **Code → Download ZIP**, then extract it, or clone it:

   ```powershell
   git clone https://github.com/MElmohandes/vivo-office-suite-english.git
   cd vivo-office-suite-english
   ```

2. Copy your original `resources\app.asar` to a writable working folder. Build a new archive, choosing an output path that does not already exist:

   ```powershell
   node .\src\patch.cjs "C:\vivo-patch\original-7.0.6.asar" "C:\vivo-patch\english-7.0.6.asar"
   node .\tools\verify-archive.cjs "C:\vivo-patch\english-7.0.6.asar"
   ```

3. Fully exit vivo Office Suite, including its notification-area/tray process. Back up the installed `app.asar`, then copy the built archive into the installation's `resources` directory as **`app.asar`**. Approve Windows administrator access if prompted.
4. Restart the app and check the home page, settings, cloud services and phone connection.

**Replace only `resources\app.asar`. Keep `app.asar.unpacked` and the rest of the installed application together.** Do not copy this repository into the application folder.

The detailed [installation and rollback guide](docs/INSTALLATION.md) includes PowerShell commands, compatibility hashes, backup rules and troubleshooting. Building never changes your installed app and refuses to overwrite existing output files.

## Compatibility and checksums

Only the exact original archive below is accepted. A matching displayed version alone is insufficient: vendor repackaging or earlier localization can change the bytes.

| Archive | Size (bytes) | SHA-256 |
| --- | ---: | --- |
| Original 7.0.6 input | 365,088,330 | `35ffb46ab7979ddc5250c66393dd6fb35210739dab4fd125a94462f72a7f96e0` |
| Tested English output | 394,510,622 | `c68629d20a5ef81eccdb5f46c37422f7d38d9b1a2518c73158ef5ae190a3e9cc` |

Other vivo versions, macOS, Linux, other phone models and other original 7.0.6 builds have not been validated. An app update can replace the patched archive; do not apply this recipe to a different build.

## Test status and limitations

The tested output contains **23,374 verified packed files**, with **5,485 external unpacked entries retained**. The patch reconstructs the exact tested output and checks every packed file and integrity block before writing it.

The localization regression suite contains 15 tests covering startup, local display formatting, cloud URL boundaries, labels and placeholders. Additional prior browser checks exercised five service fixtures, preservation of dictionary-equal user names, existing event listeners and quiet observer behavior. Three real reload checks covered Contacts, Browser and Find Device. See [validation](docs/VALIDATION.md) for the distinction between live checks and fixtures.

- Contacts retained a pre-existing persistent **Loading…** state during the live check. This patch translates it; it does not fix the hosted data-loading problem.
- Real cloud lists were empty in the test account. Populated content protection was checked with temporary DOM fixtures, not real contact/file mutations.
- Upload/download execution, saving contacts, creating groups, deleting data, sharing, account changes, verification challenges and Find Device ring/lock/erase were not exercised.
- Unvisited error dialogs, future hosted-site changes and separate native/AI components may still contain Chinese. Calendar Year view was not validated at the tested window size.
- Startup improvement was observed in an isolated test environment, not a controlled cold-boot benchmark. It is not a performance guarantee.

## Development

```powershell
npm test
```

No npm dependencies or install step are required. See [architecture](docs/ARCHITECTURE.md), [contributing](CONTRIBUTING.md) and the [changelog](CHANGELOG.md). Public CI runs synthetic/archive safety tests and helper regressions; the proprietary application is not available in CI.

## Project contents

```text
src/patch.cjs          Portable archive patch builder
src/runtime/           Runtime helpers included in the tested patch
src/cloud/             Hosted-page translation engine and reviewed configuration
patches/7.0.6.json      Hash-locked byte-copy/insert recipes for the tested build
translations/          Reviewed local and cloud translation data
test/                  Portable regression tests
tools/                 Recipe generation and archive verification
docs/                  Installation, architecture and validation notes
```

## Reporting problems

Open an issue with the app version, patch version, affected screen, reproduction steps and sanitized screenshots. Remove account identifiers, phone numbers, personal file contents, precise locations, cookies and tokens. Never attach a signed-in Electron profile or raw Find Device capture.

See [security reporting](SECURITY.md) for sensitive findings and [third-party notices](THIRD_PARTY_NOTICES.md) for ownership and licensing boundaries.
