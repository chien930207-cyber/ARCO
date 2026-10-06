# ARCO - small App identity patch

For the previously supplied ARCO-v2.5.0-Logo-Ready.zip using gold-r3 icons.
Only site.webmanifest and logo-check.html are included. This is NOT a complete ARCO website.
There is no replacement index.html, course data, logo, or learning database.

1. Export your ARCO and VOCAB learning backups before changing installed apps.
2. Upload site.webmanifest and logo-check.html to the ARCO repository's existing publishing directory.
   Do NOT upload these files to VOCAB. Keep all other ARCO files.
3. For a NEWER or DIFFERENT ARCO version, do not blindly replace the manifest:
   open your current site.webmanifest in GitHub and change only `"id": "./"` to `"id": "/arco"`.
   Preserve its icons, start_url, scope, and other fields. Keep /arco stable in future releases.
4. On the published ARCO homepage, refresh and use Edge DevTools > Application > Manifest to check id.
   With the supplied baseline, logo-check.html also verifies the id, start and scope with fresh fetches.
5. After also fixing VOCAB (/vocab-clash), remove the confused installed app entries in edge://apps.
   Leave 'delete app history/data' UNCHECKED, then install each site's distinct published HTTPS homepage.

The /arco identity need not be the directory name or a downloadable file. Start/scope remain ./.
This patch does not repair a site accidentally deployed over the other site's files.
No actual Edge installation or the user's public website has been tested here.

References:
https://www.w3.org/TR/appmanifest/#id-member
https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/id
https://support.microsoft.com/en-us/edge/install-manage-or-uninstall-apps-in-microsoft-edge
