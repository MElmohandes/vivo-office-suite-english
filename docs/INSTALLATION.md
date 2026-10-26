# Easy installation — ready-made app.asar

**Tested on vivo Office Suite 7.0.6 for Windows.** No installer, Node.js, Git or commands are required. This patch translates the Chinese interface into English. First download and install the original **Windows application from [pc.vivo.com](https://pc.vivo.com/)**. The official app must be installed and working; the patch is a replacement resource file, not a standalone app. If the site offers a version newer than 7.0.6, this patch has not been validated for that version.

## 1. Check the version

Open vivo Office Suite and check its About/version screen. This release was tested on **7.0.6**, with a vivo X300 Pro over Wi-Fi. Other versions and vendor builds have not been validated. If your version differs, do not replace its files with this archive.

## 2. Download

**[Download app.asar.zip](https://github.com/MElmohandes/vivo-office-suite-english/releases/download/v1.0.1/app.asar.zip)** from [release v1.0.0](https://github.com/MElmohandes/vivo-office-suite-english/releases/tag/v1.0.1).

Under **Assets**, choose **app.asar.zip** (about 122 MB). Right-click the downloaded ZIP, choose **Extract All**, then open the extracted folder to find `app.asar`. The automatically generated **Source code (zip)** and **Source code (tar.gz)** files are developer downloads, not the ready-made app file.

Extract the ZIP using File Explorer; do not try to open the `app.asar` inside. Copy the extracted `app.asar`, rather than the ZIP, into the application folder. If a filename was changed, make sure the replacement is exactly `app.asar`.

## 3. Fully close the app

Close every vivo Office Suite window. If its icon remains beside the Windows clock, right-click it and choose Exit/Quit. Closing the window alone may leave the app running.

## 4. Open the resources folder

Press **Windows + E** to open File Explorer. Paste this into its address bar and press Enter:

```text
C:\Program Files (x86)\pcsuite\resources
```

If you installed elsewhere, use that installation's `resources` folder. You should see `app.asar` and an `app.asar.unpacked` folder. If they are missing, check the folder before continuing.

Turn on **View → Show → File name extensions** in Windows 11, or **View → File name extensions** in Windows 10, so you see full filenames.

## 5. Back up the existing file

Rename the existing **app.asar** to **app.asar.backup**. Approve Windows administrator access if asked.

**If that backup already exists, keep it.** Use another name, such as `app.asar.backup-2`, for the current file. Never overwrite an older backup. You can also copy your original archive to a safe folder outside the installation.

## 6. Copy the English file

Copy the extracted **app.asar** from the extracted download folder into the `resources` folder. Approve administrator access if Windows asks. It should now contain:

```text
resources\
  app.asar             ← downloaded English file
  app.asar.backup      ← previous file (or your chosen backup name)
  app.asar.unpacked\   ← existing folder, kept in place
```

**Change only app.asar.** Keep the unpacked folder and all other application files in place.

## 7. Start the app

Open vivo Office Suite normally. Check English navigation/settings and your phone connection. Open the cloud services you use; reopen a service if it kept an old page open.

Contacts may retain the existing **Loading…** state. Translation does not fix that hosted data-loading issue. See [validation and known limits](VALIDATION.md).

## Restore your previous version

1. Fully close the app and its tray process.
2. Rename the English `app.asar` to a spare name, such as `app.asar.english-disabled`. Choose another name if it already exists.
3. Rename your actual backup, such as `app.asar.backup`, back to **app.asar**.
4. Start the app again.

This restores the file you backed up. No account/profile deletion is needed. Keep `app.asar.unpacked` in place.

## Optional download verification

The extracted **app.asar** is **394,512,990 bytes**. Its SHA-256 (not the ZIP hash) is:

```text
485091ea92b4c3ce3afa1eb7b5eda4678272f14793f6b204c83de96d7c24fb2b
```

The release's `SHA256SUMS.txt` contains the same value for the extracted file. The checksum file also lists the ZIP hash. Compare the extracted archive against the app.asar line, and the ZIP against the app.asar.zip line. You can compare it with a checksum utility. Advanced users can optionally run this PowerShell command, substituting the actual download path:

```powershell
Get-FileHash -LiteralPath "$env:USERPROFILE\Downloads\app.asar" -Algorithm SHA256
```

The original tested archive was 365,088,330 bytes with SHA-256 `35ffb46ab7979ddc5250c66393dd6fb35210739dab4fd125a94462f72a7f96e0`. A version label alone cannot detect vendor repackaging. The optional [source builder](BUILD-FROM-SOURCE.md) enforces the original hash; manual replacement cannot do that automatic compatibility check.

## Common problems

| Problem | Action |
| --- | --- |
| Access denied/file in use | Exit the app/tray; approve administrator access when copying. |
| App does not start | Restore the backup; check version, download hash and resources folder. |
| Filename is app (1).asar or app.asar.asar | Show filename extensions and rename to exactly app.asar. |
| Some Chinese remains | Reopen the service, verify the installed file hash and report a sanitized screenshot. Hidden states or hosted changes may need another patch. |
| An app update removes English | Updates can replace app.asar. Do not reuse this file on a different app version. |
| Prefer to build/verify it yourself | Use [Build from source](BUILD-FROM-SOURCE.md) to reproduce the exact archive. |
