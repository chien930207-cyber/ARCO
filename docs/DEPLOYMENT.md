# Publishing the update

For an existing deployment, export a learning backup from Settings, then upload this entire package to the existing website publishing location. Replace `index.html` and upload `icons/`, `site.webmanifest`, `favicon.ico` and `apple-touch-icon.png` together. The interface, question banks, translations and scene images remain embedded in the HTML; the new logo files are external and must remain beside it.

To keep the repository maintainable, also upload `src/`, `locales/`, `build.py`, the README files and documentation. Keep your own `CNAME`, repository settings and deployment workflow. Upload extracted files, not just the ZIP.

For a new GitHub Pages repository, place `index.html` at the published root and configure Pages to publish that directory. No npm installation or build job is required to use the delivered HTML. `python build.py` is needed only after changing source or translation files.

Updating the website does not intentionally clear progress. Do not clear browser site data to force an update. A browser refresh or hard reload is different from deleting site storage.

Before announcing the update, check saved progress, the three language choices, keyboard sound, placement/review screens and a real cross-device duel on the actual published site. Local two-tab tests do not cover every network or firewall.

For this gold-logo release, follow [LOGO-DEPLOYMENT.md](LOGO-DEPLOYMENT.md) and the top-level [UPLOAD.md](../UPLOAD.md). The optional [logo check](../logo-check.html) verifies the deployed references without touching study data.
