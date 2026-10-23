# Architecture and maintenance

## Reproducible archive patching

`patches/7.0.6.json` defines 70 changed or added packed archive members. Each recipe stores an input file hash, an output hash and a sequence of operations: `[offset, length]` copies bytes from the original member; a Base64 string inserts new bytes. This format avoids shipping complete vendor bundles or a full application archive. Insertions include localized display code and necessary patch context; third-party ownership still applies to vendor-derived fragments.

`src/patch.cjs` uses Node built-ins only. It verifies the entire original archive hash before processing recipes, checks each reconstructed member, appends changed bytes to the original data section, updates ASAR offsets and SHA-256 integrity blocks, and preserves unpacked entries and other members. It then checks the exact release hash and every packed integrity block. It creates a new output with exclusive write semantics. It does not automatically install anything.

`tools/generate-recipes.cjs` derives recipes from locally owned original and tested archives. It indexes 32-byte source blocks and emits copy/insert operations, checking a round trip for every changed member. Example for a maintainer with both archives:

```powershell
node tools/generate-recipes.cjs ORIGINAL.asar TESTED.asar patches/7.0.6.json
```

Changing translation JSON or a helper source file **does not automatically change the frozen release recipe**. A new release requires integrating the change into a working app, testing it, regenerating the recipe from the original and newly tested archive, recording the new target hash, and rebuilding to prove reproducibility. The recipes are authoritative for release 1.0.0; helper/dictionary files are readable maintenance sources.

## Local interface

Earlier localization passes selected the English locale and changed reviewed display literals and expressions in compiled Electron bundles. The local UI pass changed 55 bundles using a ledger of 3,258 literal and 249 expression edits. AST comparison checked that code outside approved display nodes was preserved. These counts describe that pass, not the full 70-member release recipe.

`src/runtime/ui-display.cjs` formats reviewed dynamic labels, calendar/weekday/lunar text and built-in album folders. Custom album names and unknown user strings are preserved. Translation maps under `translations/local/` document the reviewed text; they are not a replacement for testing the actual rendering context.

## Hosted cloud interface

Cloud pages are separate hosted applications. Selecting the local English locale was insufficient: the inspected bridge consumed theme state without changing these service labels.

The reviewed cloud engine translates exact text nodes and selected UI attributes (`placeholder`, `title`, `aria-label`, `alt`). It supports fixed counts and selected UI date contexts. It excludes user-content containers, editable values, contact/group names, bookmark titles, filenames, device names, addresses and map labels. It does not perform substring replacement on arbitrary content.

The eligibility check restricts execution to HTTPS on exact vivo service hosts and reviewed route roots. Login/passport pages and lookalike hosts are excluded. A readiness hook handles provisional redirect URLs. The guest preload installs the engine for hosted pages; a trusted host-side guest-ready fallback also installs it after Find Device redirects. Internal Chinese Vue component identifiers are retained because they are programmatic identifiers.

A mutation observer processes changed subtrees. It does not use polling or repeatedly scan the complete document while idle. Future hosted markup can change these assumptions, so route, selector and user-content boundary tests are required for maintenance.

## Startup responsiveness

Three synchronous calls to the native `electron-dragfile.getOSInfo()` blocked startup in the investigated environment. OS-version decisions now use `process.getSystemVersion()`. The helper `src/runtime/startup-os-info.cjs` collects the complete native hardware result asynchronously in a hidden child process, shares concurrent requests, retries after failure and cleans up the child if the parent exits.

The cloud localization pass retained the previous startup/main-process helper behavior. Domestic backend configuration and device/region logic were preserved.

## Public repository boundary

The repository contains no complete vendor application, native dependencies, signed-in profiles, cookies, access tokens, precise-location captures or raw runtime dumps. Those are not needed to reproduce the archive from a user's own matching original installation. Public CI uses synthetic archive fixtures; full compatibility verification is local and requires the proprietary original.

GitHub Releases separately provides the tested modified app.asar and its checksum for manual installation. The asset contains vendor code/assets and requires the matching official installation and external unpacked resources. Personal profiles are not included.
