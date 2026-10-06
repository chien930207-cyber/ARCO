# ARCO / VOCAB App identity collision repair

Date: 2026-10-06

## Finding

The supplied VocabClash-App-Ready.zip and ARCO-v2.5.0-Logo-Ready.zip both declared `"id": "./"`.
Per the Web Application Manifest id algorithm, that resolves against the origin of start_url.
If both apps are served under the same account.github.io origin, their resolved identities are identical.
This is a confirmed defect in the inspected packages and explains the reported symptom under same-origin deployment.
The user's actual published URLs and installed Microsoft Edge records have NOT been inspected.

The previous VOCAB checker used `new URL(m.id, manifestURL)`. That was incorrect and could falsely pass both apps.
The corrected checker resolves the id using `start.origin + '/'` and checks the assigned per-app value.

## Corrected values

| App | App id | Launch | Scope |
|---|---|---|---|
| ARCO | /arco | ./ | ./ |
| VOCAB CLASH | /vocab-clash | ./ | ./ |

These ids are permanent identity labels, not required physical directories. Do not add version strings to them.
The launch URLs and scope remain relative to each app's own manifest directory.
No service worker, database migration, cache purge, site-data deletion or game changes are introduced.

## Checks actually run

- 15 Node URL/identity regression checks passed, including reproduction of the old collision,
  corrected distinct ids on one origin, stable ids across manifest cache queries, same-origin validation,
  fallback behavior and retained launch/scope paths.
- 12 HTTP resource requests to one local server passed for two distinct project directories.
  Both manifests, homepages, check pages and declared manifest icons were served with matching bytes.
- 2 check-page JavaScript syntax checks passed (node --check).
- Only id changed within each manifest; every other manifest property was preserved.
- All 15 existing VOCAB index.html script bodies are byte-identical. Its only HTML change is
  the manifest link cache query, from vc-app-r2 to vc-app-identity-r3.
- ARCO index.html is not included in the small patch and was not edited.
- VOCAB's 12 and ARCO's 23 image/icon asset files were byte-identical to their respective baselines.

## Browser attempt and limitations

A normal Chromium navigation to the local VOCAB check page was attempted. It was blocked with
ERR_BLOCKED_BY_ADMINISTRATOR. No restriction was bypassed. No successful end-to-end check-page
browser run, PWA OS installation, or Microsoft Edge co-installation is claimed.
The 15 identity tests exercise a spec-based URL resolver; they are not a substitute for verifying
both real installed apps in the user's Edge profile. Gameplay and storage durability were not retested.

After publication, run each site's logo-check.html, remove the confused installed app entries only
AFTER backing up both sites (leave delete-site-data unchecked), then install the separate HTTPS homepages.

## References

- https://www.w3.org/TR/appmanifest/#id-member
- https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/id
- https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/start_url
- https://support.microsoft.com/en-us/edge/install-manage-or-uninstall-apps-in-microsoft-edge
