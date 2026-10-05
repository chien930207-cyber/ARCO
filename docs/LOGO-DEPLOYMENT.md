# ARCO GitHub Pages deployment | gold-r3

## Upload this package as a unit

This is the complete ARCO v2.5.0 three-language website with the approved gold A logo. The learning, audio, localization and duel modules are unchanged. Only logo markup, icon metadata and deployment assets were updated. The application protocol/version is unchanged.

1. Export your current learning progress from ARCO Settings and keep the JSON backup on your device, not in the public repository.
2. Unzip this archive. Upload **all files and folders inside it**, at your existing GitHub Pages publishing location. Replace `index.html`, `src/page.html` and `src/icons.js` as well as uploading the image files. Do not upload only the ZIP or only the `icons` folder.
3. Keep your existing `CNAME`, custom-domain settings and `.github` workflow configuration. This package does not supply or delete those files. A branch-based site with these files at the repository root uses Pages: `Deploy from a branch`, your publishing branch, `/ (root)`. Do not switch a working custom deployment unnecessarily.
4. Wait for the Pages deployment to succeed in GitHub Actions. Open the published website, not the GitHub file-preview page. Reload the page.
5. Open `logo-check.html` next to the deployed `index.html`. Click the check button. It fetches the deployed homepage, verifies that gold-r3 is present, and checks every favicon, Apple icon and manifest icon. It does not inspect or modify learning progress.

## What is fixed

- All old inline SVG/PNG favicon and Apple-icon links have been removed from the main page.
- New icon URLs include `gold` and `r3` in the **actual filenames**, rather than relying only on replacing a file at a cached URL.
- The manifest points to newly named 192, 512 and maskable 512 PNGs. Its relative start URL, scope and identity remain within the deployed repository folder.
- The conventional `favicon.ico`, `apple-touch-icon.png` and old icon filenames also contain the new artwork for fallback/legacy references. Do not mistake these compatibility copies for additional logo designs.
- The navbar, homepage signature and other calls to the logo renderer use the same new gold A. Their box dimensions and surrounding layout are unchanged. Ordinary navigation icons, lesson diagrams, photos and animations are not redesigned.
- The build template and logo renderer are updated too, so `python build.py` does not put the old logo back.

## Existing shortcuts and caches

New filenames help normal browser requests avoid older cached icon resources. They do not force an already installed browser/OS shortcut to refresh immediately. If an existing shortcut still shows an older icon, back up progress from that instance before removing and adding it again. Do not clear all website data and do not initialize ARCO merely to refresh a logo. Different browser/device/origin storage is not automatically synchronized.

This package does not install a service worker, clear caches, reset learning records, rename a storage key or change any course/duel rules. A GitHub-hosted offline installation and universal installation prompts are not claimed.

The small browser favicon and the installed home-screen icon have different purposes. Social-network link previews and search-engine thumbnails are separate systems and are outside this icon-only update.

## Files

- `index.html`: complete built website. Keep `icons/` beside it.
- `site.webmanifest`: application name, launch path and home-screen icons.
- `icons/*-r3.*`: current explicitly referenced gold assets.
- `favicon.ico`, `apple-touch-icon.png`, older-named files in `icons/`: new-logo compatibility copies.
- `logo-check.html`: optional deployment diagnostic, not part of the site's main navigation.
- `src/`, `locales/`, `build.py`: current matching sources.
- `README*.md`: public product readmes.
- `tests/`, `docs/logo-*`: verification code and reports.

## Rebuild

```sh
python build.py
node tests/placement.test.cjs
node tests/battle_engine.test.cjs
node tests/audio_recovery.test.cjs
node tests/translation.test.cjs
python tests/logo_assets_test.py
```

## Verification limits

Read `logo-verification.json` for the exact checks performed in this release. In this execution environment Chromium navigation to a local HTTP origin was blocked by policy, so browser-rendering checks use the real built HTML injected into Chromium with a separate test-only storage fixture and locally fulfilled icon requests. HTTP status/path checks are separate requests to a local test server. Neither establishes live GitHub Pages deployment, actual mobile installation, or the refresh behavior of already installed shortcuts. The test fixture is not in the distributed application.

## Technical references

- [GitHub Pages publishing source](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
- [MDN: defining app icons](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/How_to/Define_app_icons)
- [MDN: manifest icon URLs](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/icons)
- [MDN: HTTP caching](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching)
- [Apple: web clip icon and title](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html)
