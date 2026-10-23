# Validation record — patch 1.0.0

**Tested application:** vivo Office Suite 7.0.6, Windows desktop installation.  
**Phone:** vivo X300 Pro, Wi-Fi connection.  
**Release preparation:** 23 October 2026.

## Archive evidence

| Check | Result |
| --- | --- |
| Original archive SHA-256 | `35ffb46ab7979ddc5250c66393dd6fb35210739dab4fd125a94462f72a7f96e0` |
| English archive SHA-256 | `c68629d20a5ef81eccdb5f46c37422f7d38d9b1a2518c73158ef5ae190a3e9cc` |
| English archive size | 394,510,622 bytes |
| Changed/added packed members | 70 |
| Packed files verified | 23,374, including SHA-256 integrity blocks |
| External unpacked entries | 5,485 retained; their external bytes are not embedded in the archive |
| Portable recipe reconstruction | Byte-for-byte identical to the tested archive |

The final target hash is the release identity. The runtime helper sources and translation data in this repository reflect that release. Original-profile logs and raw captures are excluded from the public repository because they can contain account or device information.

## Live application checks

- Opened Contacts, Browser, Spam blocking, Cloud Drive and Find Device and inspected their primary screens visually.
- Opened Contacts create/import/export menus and Cloud Drive sorting controls without submitting operations.
- Checked final Blocklist/Allowlist count labels and Browser Trash wording for layout fit.
- Verified actual page reload persistence for Contacts, Browser and Find Device by observing a changed page time origin. Find Device's redirect path required a host-side guest-ready fallback.
- Confirmed the main app could connect to the tested phone over Wi-Fi.

These checks establish visible localization and navigation for those states. They do not establish successful data mutation, transfer execution or every dialog state.

## Automated localization checks

The original 15 Node regression tests are included:

- Four startup tests: request sharing, complete native results, retry on malformed output, child failure/cleanup and exit handling.
- Six local display tests: reviewed labels, Gregorian/lunar dates, reminders, rich-text preservation, weekday contexts and custom-folder protection.
- Five cloud tests: allowed routes, readiness after redirects, exact fixed labels/counts, preservation of unknown text and placeholder consistency.

Additional archive tests validate copy/insert recipes, reject corrupt input/output, preserve unpacked references and verify synthetic integrity blocks. Run the public suite with `npm test`.

Prior interactive browser checks covered five temporary populated service fixtures, including user names equal to dictionary keys. They checked preserved names, fixed-label updates, existing event listeners and no extra node processing during an idle window. These were local DOM fixtures, not proof of real populated cloud accounts or data mutation. Raw fixture dumps and private runtime profiles are not distributed.

## Startup observations

An investigated startup path previously spent roughly 58 seconds internally around synchronous native OS information collection. After moving that collection off the main process, isolated launches were around four seconds. A later cloud-pass run observed DOM readiness around 2.16 seconds and renderer navigation around 4.48 seconds. Those measurements use different observation points and are not a controlled before/after benchmark or a guarantee for other computers.

## Known limits

| Area | Limit |
| --- | --- |
| Contacts | Persistent Loading… state existed before and after translation; data retrieval was not repaired. |
| Populated cloud accounts | Real test lists were empty; populated boundaries used fixtures. |
| Destructive/security actions | No real deletes, contact saves, group creation, sharing, verification submissions, ring, lock or erase. |
| File transfers | Upload/download execution was not validated. An isolated runtime previously reported a missing `FREE_TRANSFER_GET_TASKS` handler. |
| Calendar | The requested Year route redirected to Month at the tested window size; Year view remains unverified. |
| Separate native components | Remote PC and separate AI components were not fully audited/localized. |
| Coverage | Hidden/unvisited errors and future hosted markup may expose Chinese text. |
| Platforms/versions | Only the recorded Windows 7.0.6 archive and phone were checked. |

## Suggested manual regression before a new release

1. Rebuild from the preserved original and compare the entire output hash.
2. Start the app, inspect startup responsiveness, connect the phone and visit local modules/settings.
3. Inspect all five hosted cloud services, their safe menus and a real reload/redirect cycle.
4. With an explicitly authorized test account, inspect populated lists and confirm Chinese user content remains unchanged.
5. Check narrow/wide layouts, tooltips, placeholders and error states that can be reached without changing real data.
6. Record any functional actions separately from visual checks. Do not claim a feature works solely because its UI translated.
