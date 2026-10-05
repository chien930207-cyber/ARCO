"""Validate icon references/decoding and unchanged non-branding source modules."""
from pathlib import Path
from urllib.parse import urljoin,urlsplit
from PIL import Image
from bs4 import BeautifulSoup
import hashlib,json,math
ROOT=Path(__file__).resolve().parents[1]
html=(ROOT/'index.html').read_text()
soup=BeautifulSoup(html,'html.parser')
report={'icon_release':'gold-r3','checks':[],'icons':[],'unchanged_modules':[]}
assert soup.select_one('meta[name="arco-icon-release"]')['content']=='gold-r3'
links=soup.select('head link[rel~="icon"],head link[rel="apple-touch-icon"],head link[rel="manifest"]')
assert len(links)==6,len(links)
for el in links:
    href=el['href'];assert not href.startswith(('data:','/','http:','https:')),href
    path=ROOT/urlsplit(href).path.removeprefix('./');assert path.is_file(),path
    if el['rel']==['manifest']:continue
    assert '-r3' in href,href
    with Image.open(path) as im:
        im.load();assert im.width==im.height
        if path.suffix=='.png':assert el.get('sizes')==f'{im.width}x{im.height}'
        report['icons'].append({'file':str(path.relative_to(ROOT)),'size':im.size,'mode':im.mode})
m=json.loads((ROOT/'site.webmanifest').read_text())
assert m['name']==m['short_name']=='ARCO'
assert m['id']==m['scope']==m['start_url']=='./'
assert any(i.get('purpose')=='maskable' for i in m['icons'])
for row in m['icons']:
    assert '-r3' in row['src']
    f=ROOT/urlsplit(row['src']).path.removeprefix('./')
    with Image.open(f) as im:
        im.load();assert row['sizes']==f'{im.width}x{im.height}'
        assert im.mode=='RGB','Icons must have an opaque background'
        if row.get('purpose')=='maskable':
            points=[(x,y) for y in range(im.height) for x in range(im.width) if (lambda c:c[0]>90 and c[0]>c[2]*1.3)(im.getpixel((x,y)))]
            radius=max(math.hypot(x-(im.width-1)/2,y-(im.height-1)/2) for x,y in points)
            assert radius <= .4*im.width,(radius,.4*im.width)
            report['maskable_gold_radius_px']=round(radius,2)
            report['maskable_safe_radius_px']=.4*im.width
for base in ['https://example.test/','https://example.test/arco/','https://example.test/arco/index.html']:
    for el in links:
        u=urljoin(base,el['href']);parent=urljoin(base,'./');assert u.startswith(parent),(u,parent)
    mu=urljoin(base,'./site.webmanifest?v=gold-r3')
    assert urljoin(mu,m['scope'])==urljoin(base,'./')
    assert urljoin(mu,m['start_url'])==urljoin(base,'./')
    for row in m['icons']:assert urljoin(mu,row['src']).startswith(urljoin(base,'./'))
preserved=json.loads((ROOT/'docs/logo-preservation.json').read_text())
for name,wanted in preserved['unchanged_sha256'].items():
    actual=hashlib.sha256((ROOT/name).read_bytes()).hexdigest();assert actual==wanted,name
    report['unchanged_modules'].append(name)
# All rendered logos use the new raster, while standard line icons remain unchanged.
assert 'M34 137 109 11' not in html
assert 'href="data:image/svg+xml' not in html
assert 'href="data:image/png' not in html
assert 'arco-gold-512-r3.png' in (ROOT/'src/icons.js').read_text()
report['checks']=['no old inline icon links','all PNG and ICO assets decode','manifest paths and dimensions match','opaque maskable icon respects safe zone','root and project-directory path resolution','11 learning/data/translation modules hash-identical','no old in-page brand mark paths']
(ROOT/'docs/logo-assets-report.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
