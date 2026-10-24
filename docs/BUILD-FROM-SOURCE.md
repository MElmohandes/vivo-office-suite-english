# Build from source — advanced option

For the ready-made download with no build tools, use [Easy installation](INSTALLATION.md).

## Requirements

- Windows with the official vivo Office Suite **7.0.6** installed and working.
- The original unmodified archive whose SHA-256 matches the README. Download the original Windows software from [pc.vivo.com](https://pc.vivo.com/) and confirm the supported version/hash. The current download may be newer than the tested 7.0.6 build. No vendor installer is redistributed here.
- Node.js **20+**, a writable working folder, approximately 2 GB free disk space, and administrator access to replace a file under Program Files.
- Your existing compatible phone/account and network connection for online features. The patch does not add support for unsupported devices or regions.

The tested installation was `C:\Program Files (x86)\pcsuite`. If you installed elsewhere, substitute your actual folder. Do not assume the installation path is identical on every computer.

## 1. Preserve the original

Before the first installation, fully exit the app and its tray icon. In a normal PowerShell window, prepare a working copy:

```powershell
New-Item -ItemType Directory -Path 'C:\vivo-patch' -ErrorAction Stop
Copy-Item -LiteralPath 'C:\Program Files (x86)\pcsuite\resources\app.asar' -Destination 'C:\vivo-patch\original-7.0.6.asar' -ErrorAction Stop
Get-FileHash -LiteralPath 'C:\vivo-patch\original-7.0.6.asar' -Algorithm SHA256
```

If the working folder already exists, use it or choose a new one; the first command deliberately reports an error rather than hiding that fact. Preserve this original archive outside the installation folder as well as the installation backup.

Expected original hash:

```text
35ffb46ab7979ddc5250c66393dd6fb35210739dab4fd125a94462f72a7f96e0
```

If it differs, stop. An already-patched archive, a different release or a vendor rebuild is not supported. The builder does not try a partial or best-effort patch. Do not rename a patched archive and call it an original. Use your genuine preserved original or an official clean installation matching this build; never delete your profile to address a hash mismatch.

## 2. Build and verify

From the extracted/cloned project directory:

```powershell
node .\src\patch.cjs 'C:\vivo-patch\original-7.0.6.asar' 'C:\vivo-patch\english-7.0.6.asar'
if ($LASTEXITCODE -ne 0) { throw 'Build failed; do not install.' }
node .\tools\verify-archive.cjs 'C:\vivo-patch\english-7.0.6.asar'
if ($LASTEXITCODE -ne 0) { throw 'Verification failed; do not install.' }
```

The output must be 394,510,622 bytes with SHA-256:

```text
c68629d20a5ef81eccdb5f46c37422f7d38d9b1a2518c73158ef5ae190a3e9cc
```

Output files are created exclusively: choose a new name if the file already exists. The builder never writes to the source archive or the installation automatically. It checks the complete source hash, each changed file, the complete output hash, and all packed-file/block integrity values. Unpacked entries remain references to the application's existing `app.asar.unpacked` directory.

## 3. Apply the archive

Exit the app again, including its tray process. Open **PowerShell as Administrator** for these commands. They create a timestamped installation backup and then replace only the archive:

```powershell
$resourceDir = 'C:\Program Files (x86)\pcsuite\resources'
$installedArchive = Join-Path $resourceDir 'app.asar'
$backupArchive = Join-Path $resourceDir ('app.asar.backup-' + (Get-Date -Format 'yyyyMMdd-HHmmss-fff'))
$builtArchive = 'C:\vivo-patch\english-7.0.6.asar'
$expectedHash = 'c68629d20a5ef81eccdb5f46c37422f7d38d9b1a2518c73158ef5ae190a3e9cc'
if ((Get-FileHash -LiteralPath $builtArchive -Algorithm SHA256).Hash.ToLowerInvariant() -ne $expectedHash) { throw 'Incorrect patch archive.' }
if (Test-Path -LiteralPath $backupArchive) { throw 'Backup already exists; choose a new backup name.' }
Copy-Item -LiteralPath $installedArchive -Destination $backupArchive -ErrorAction Stop
if ((Get-FileHash -LiteralPath $installedArchive).Hash -ne (Get-FileHash -LiteralPath $backupArchive).Hash) { throw 'Backup verification failed.' }
Copy-Item -LiteralPath $builtArchive -Destination $installedArchive -Force -ErrorAction Stop
if ((Get-FileHash -LiteralPath $installedArchive).Hash.ToLowerInvariant() -ne $expectedHash) { throw 'Installation verification failed; restore the backup.' }
Write-Output "Backup retained at: $backupArchive"
```

Keep the backup path. Leave all executables, DLLs, native addons, `app.asar.unpacked` and personal application data in place. Replacing the full application folder with this repository will not work.

## 4. Check the result

Start vivo Office Suite normally. Confirm English navigation and settings, reconnect your phone, then open Contacts, Browser, Spam blocking, Cloud Drive and Find Device. Reload a cloud screen if an old page was kept open. Verify your own normal workflow before relying on the modified installation.

## Rollback

Exit the app and tray process. In an administrator PowerShell window, restore the **actual backup path printed above**, substituting it in this example:

```powershell
Copy-Item -LiteralPath 'C:\Program Files (x86)\pcsuite\resources\app.asar.backup-YOUR-TIMESTAMP' -Destination 'C:\Program Files (x86)\pcsuite\resources\app.asar' -Force -ErrorAction Stop
```

Restart the app. This restores the archive backed up at that installation step, which may itself be a previous patch. For stock Chinese behavior, restore the verified original 7.0.6 archive. No account/profile deletion is needed.

## Troubleshooting

| Symptom | Action |
| --- | --- |
| Unsupported input archive | Compare the source hash; use the preserved original matching this release. A version label alone does not establish compatibility. |
| Output already exists | Choose a new output filename. |
| Access denied replacing the archive | Exit the app/tray and use administrator PowerShell; verify the installation path. |
| App does not start | Restore the backup, then check the output hash and that the matching unpacked resources remain present. |
| Some cloud UI is Chinese | Confirm the installed hash and reopen the service. Hosted page changes or unreviewed states may require a patch update; submit a sanitized issue. |
| Contacts stays on Loading… | This was observed before and after translation; investigate the service/account/network separately. |
| App update removes English | The updater may replace the archive. Do not patch the new version with this 7.0.6 recipe. |
| Another 7.0.6 package has a different hash | Treat it as unsupported and report the hash/version without uploading the proprietary archive. |
