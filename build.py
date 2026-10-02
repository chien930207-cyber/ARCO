"""Rebuild ARCO from authored sources (Python 3.10+, standard library only)."""
from pathlib import Path
import base64, json, re, subprocess, sys
from urllib.parse import quote
ROOT=Path(__file__).resolve().parent
for script in ('build_curriculum.py','enrich_curriculum.py','build_docs.py'):
    subprocess.run([sys.executable,str(ROOT/'src'/script)],check=True)
html=(ROOT/'src/index.template.html').read_text(encoding='utf-8')
for token,name in [('CSS','styles.css'),('DATA','curriculum.js'),('AUDIO','audio.js'),('ICONS','icons.js'),('APP','app.js'),('PRACTICE','practice.js'),('PLACEMENT','placement.js'),('DUEL','duel.js')]:
    content=(ROOT/'src'/name).read_text(encoding='utf-8')
    if token!='CSS':content=content.replace('</script','<\\/script')
    html=html.replace('/*INLINE_'+token+'*/',content)
paths=json.loads((ROOT/'assets/icons.json').read_text(encoding='utf-8'))
icon_source=(ROOT/'src/icons.js').read_text(encoding='utf-8').split('const paths = {',1)[1].split('};',1)[0]
source_paths=dict(re.findall(r"(\w+): '([^']+)'",icon_source))
assert source_paths==paths, 'Update assets/icons.json to match src/icons.js before building'

def icon(match):
    name=match.group(1)
    return '<svg class="arco-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="'+paths[name]+'"/></svg>'
html=re.sub(r'<!--ICON_([a-z]+)-->',icon,html)
mark=(ROOT/'assets/arco-mark.svg').read_text(encoding='utf-8')
html=html.replace('<!--BRAND_MARK-->',mark)
svg=(ROOT/'assets/favicon.svg').read_text(encoding='utf-8')
html=html.replace('/*FAVICON_DATA*/','data:image/svg+xml,'+quote(svg,safe=''))
html=html.replace('/*APPLE_ICON_DATA*/','data:image/png;base64,'+base64.b64encode((ROOT/'assets/apple-touch-icon.png').read_bytes()).decode())
assert not re.search(r'/\*INLINE_|/\*FAVICON_DATA|/\*APPLE_ICON_DATA|<!--ICON_|<!--BRAND_MARK-->',html)
(ROOT/'index.html').write_text(html,encoding='utf-8')
print(f'Built index.html: {len(html.encode("utf-8")):,} bytes')
