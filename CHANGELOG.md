# Changelog

## 1.0.1 — 2026-10-26

- Restore six internal action enum lookups so mirroring/file-manager buttons reach the original vendor dispatch paths.
- Protect computed property and object keys from literal translation.
- Translate calendar form selected reminders, built-in event/to-do categories and time-zone labels at the display boundary.
- Fix the date pickers displaying concatenated year/month/day words.
- Add 30 regression tests and regenerate the hash-locked patch and upgrade recipes.
- Preserve custom names, serialized reminder values, category GUIDs and time-zone IDs/offsets.

The actual dispatch method matches the original vendor method. New native feature execution and visual layout checks remain pending; automated fixtures do not establish live phone operation.

## 1.0.0 — 2026-10-23

Initial public patch release, tested on vivo Office Suite **7.0.6** for Windows.

- English local navigation, settings, module display text and dynamic date/folder labels.
- Fixed synchronous native OS-information calls that delayed startup in the test environment.
- English Contacts, Browser, Spam blocking, Cloud Drive and Find Device interfaces using 511 reviewed cloud labels.
- Scoped hosted-page translation with user-content exclusions and Find Device redirect handling.
- Portable dependency-free, hash-locked archive reconstruction with complete packed integrity verification.
- Installation, backup, rollback, architecture, compatibility and validation documentation.
- Portable helper/archive regression tests and CI configuration.

The public release packages the final internal cloud pass (pass 3), with the earlier local UI and startup changes included. It does not fix hosted Contacts data loading or establish support for a different app build.
