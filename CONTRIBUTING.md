# Contributing

Open an issue before changing selectors, archive behavior or startup integration. Include the application version and original archive hash so the affected build is clear.

For translation reports, provide the screen, steps to reach the label, source text and suggested English. Sanitize screenshots. Preserve placeholders, numeric values, markup and programmatic identifiers. Never translate user-created names or content just because they equal a dictionary key.

Run `npm test`. Cloud changes need route-boundary, redirect-readiness, user-content-preservation and idle-observer checks. Runtime source or dictionary changes also require a newly integrated, tested archive and regenerated recipes; editing JSON alone does not update the release patch. See `docs/ARCHITECTURE.md`.

Do not commit proprietary installers/full application bundles, archives, DLLs, native addons, personal profiles, tokens, cookies or raw device/location dumps. Use synthetic fixtures. Keep changes focused, document observed behavior and distinguish real app tests from fixtures.
