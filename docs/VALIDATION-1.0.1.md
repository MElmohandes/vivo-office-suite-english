# Validation — 1.0.1 update

Application compatibility remains the same original Windows vivo Office Suite **7.0.6** build. This is a bug-fix/localization update, not support for a new vivo version.

## Changes and evidence

The 1.0.0 home-screen handler looked up translated English APPLY_NAME keys while the packaged enum retained Chinese keys. The original handler therefore returned `not found app`. The updated method restores six internal lookups and exactly matches the vendor baseline. Tests reproduce the old silent failure and exercise all six connected/disconnected dispatch paths with native operations stubbed.

Calendar changes affect selected reminder display, built-in category labels, time-zone option labels and date separators. Twelve targeted checks evaluated the actual compiled form expressions/getters and verified unchanged source values, GUIDs, offsets and custom names. The staged runtime suite passed 45 checks. Portable snapshots of those reviewed expressions plus archive tests produce **50 passing public tests**. Snapshots are regression fixtures, not execution of a complete proprietary app in CI.

The corrected base translation pass contains 3,252 literal edits and 249 expression edits across 55 bundles, followed by 14 reviewed calendar display changes and the existing cloud preload pass. The property-key guard blocks internal literal-key translations. The calendar post-pass was checked for idempotence.

Compared with 1.0.0, five packed members change: 8.js, 128.js, 130.js, app-modules.js and ui-display.cjs. The startup/native and cloud-service code remains byte-identical to the previous release.

## Archive identity

- Original source SHA-256: `35ffb46ab7979ddc5250c66393dd6fb35210739dab4fd125a94462f72a7f96e0`
- Fixed app.asar SHA-256: `485091ea92b4c3ce3afa1eb7b5eda4678272f14793f6b204c83de96d7c24fb2b`
- Fixed size: **394,512,990 bytes**
- Verified packed files: **23,374**, with integrity blocks checked
- Unpacked entries retained: **5,485**
- Rebuilding from the original archive reproduced the fixed archive byte for byte.
- Upgrading from the preserved public 1.0.0 archive also reproduced that exact output.

## Remaining manual checks

The user reported a connected phone when the old buttons failed. The automated checks establish repaired dispatch and translated form bindings. No new confirmation of actual mirroring, phone file browsing, or the final form layout has been recorded. The existing Contacts Loading issue and the broader untested-operation limits in [the original validation record](VALIDATION.md) still apply.
