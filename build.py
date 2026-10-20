"""Validate the current ARCO static release without rebuilding from obsolete src/.

The repository's legacy src/page.html and modules predate the deployed app.
They must NOT overwrite the current homepage. GitHub Pages serves this release
as-is; no npm or Python build step is needed. Existing `python build.py` jobs
now run these non-destructive checks. Edit the deployed HTML/CSS/JS directly.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import re
import sys
from pathlib import Path
from html.parser import HTMLParser

ROOT = Path(__file__).resolve().parent
RELEASE = 'root-preview-r4-20261020'
HOME = 'https://chien930207-cyber.github.io/ARCO/'

class Metadata(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.meta: dict[str, list[str]] = {}
        self.files: set[str] = set()
    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        a = dict(attrs)
        if tag == 'meta':
            key = a.get('property') or a.get('name')
            if key:
                self.meta.setdefault(key, []).append(a.get('content') or '')
        candidate = a.get('src') if tag == 'script' else a.get('href') if tag == 'link' else None
        if candidate and candidate.startswith('./'):
            self.files.add(candidate[2:].split('?', 1)[0])

def main() -> int:
    args = argparse.ArgumentParser(description=__doc__)
    args.add_argument('--check', action='store_true', help='Validate only (also the default).')
    args.parse_args()
    try:
        raw = (ROOT / 'index.html').read_bytes()
        text = raw.decode('utf-8')
        data = Metadata()
        data.feed(text)
        for key in ['og:title', 'og:description', 'og:image', 'og:url', 'arco-share-release']:
            values = data.meta.get(key, [])
            if len(values) != 1 or not values[0]:
                raise ValueError('Missing/duplicate metadata: ' + key)
        if data.meta['arco-share-release'][0] != RELEASE:
            raise ValueError('Homepage belongs to another release; refusing a legacy rebuild.')
        if data.meta['og:url'][0] != HOME:
            raise ValueError('Open Graph must describe the normal homepage.')
        if raw.index(b'</head>') > 16384 or len(raw) > 65536:
            raise ValueError('The static homepage has grown beyond its preview budget.')
        data.files.update({'arco-styles-r4.css', 'arco-runtime-r4.js', 'sw.js'})
        for name in sorted(data.files):
            file = ROOT / name
            if not file.is_file() or file.stat().st_size == 0:
                raise ValueError('Missing or empty release file: ' + name)
        image = data.meta['og:image'][0]
        if not image.startswith(HOME):
            raise ValueError('Logo must use the public ARCO origin.')
        logo = ROOT / image[len(HOME):]
        if not logo.is_file() or logo.read_bytes()[:8] != b'\x89PNG\r\n\x1a\n':
            raise ValueError('The existing public PNG logo is unavailable.')
        manifest = json.loads((ROOT / 'site.webmanifest').read_text())
        for item in manifest['icons']:
            if not (ROOT / item['src']).is_file():
                raise ValueError('Manifest icon missing: ' + item['src'])
        runtime = (ROOT / 'arco-runtime-r4.js').read_text()
        for token in ['window.ARCO_DATA=', 'window.ARCO_DUEL_DATA=', 'window.ARCO_LOCALE_DATA=',
                      'arco.learning.visual.v1', 'arco.engagement.daily.v1',
                      'INSTALL_AT=5*60*1000,SHARE_AT=10*60*1000']:
            if token not in runtime:
                raise ValueError('Missing production module/setting: ' + token)
        print('ARCO release valid. No files rewritten.')
        print('Homepage bytes:', len(raw), '| SHA-256:', hashlib.sha256(raw).hexdigest())
        return 0
    except (OSError, UnicodeError, ValueError, KeyError) as error:
        print('ARCO validation failed: ' + str(error), file=sys.stderr)
        return 1

if __name__ == '__main__':
    raise SystemExit(main())
