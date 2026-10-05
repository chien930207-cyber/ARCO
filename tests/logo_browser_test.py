"""Injected-document logo regression. This is not a native install test."""
from pathlib import Path
from urllib.parse import urlsplit,unquote
from playwright.sync_api import sync_playwright
import json,mimetypes
ROOT=Path(__file__).resolve().parents[1]
HTML=(ROOT/'index.html').read_text()
FIXTURE="""const storage=new Map();Object.defineProperty(window,'localStorage',{value:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,String(v)),removeItem:k=>storage.delete(k),clear:()=>storage.clear(),key:i=>[...storage.keys()][i]??null,get length(){return storage.size;}}});"""
report={'mode':'Chromium injected document + test-only storage + local icon request fulfillment','views':[],'errors':[],'icon_requests':[],'limitations':['Native browser navigation blocked by environment policy','No live GitHub Pages deployment','No actual iOS/Android installation','Existing shortcut icon-cache refresh untested']}
shots=ROOT/'docs/logo';shots.mkdir(exist_ok=True)
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 for prefix in ['', 'arco/']:
  for width,lang in [(1440,'zh-TW'),(390,'en'),(320,'de')]:
   context=browser.new_context(viewport={'width':width,'height':1000},device_scale_factor=1)
   page=context.new_page();errs=[]
   page.on('pageerror',lambda e:errs.append(str(e)))
   def route(req):
    u=urlsplit(req.request.url);rel=unquote(u.path).lstrip('/')
    if prefix and rel.startswith(prefix):rel=rel[len(prefix):]
    f=(ROOT/rel).resolve()
    if not f.is_relative_to(ROOT) or not f.is_file():req.fulfill(status=404,body='Not found');return
    mime='application/manifest+json' if f.suffix=='.webmanifest' else mimetypes.guess_type(str(f))[0] or 'application/octet-stream'
    req.fulfill(status=200,body=f.read_bytes(),content_type=mime,headers={'Access-Control-Allow-Origin':'*'})
    if f.parent.name=='icons':report['icon_requests'].append(u.path)
   page.route('https://arco-preview.test/**',route)
   base='https://arco-preview.test/'+prefix
   test=HTML.replace('<head>','<head><base href="'+base+'"><script>'+FIXTURE+'</script>',1)
   page.set_content(test,wait_until='load')
   page.wait_for_function('!!window.ARCO && !!window.ArcoI18n')
   page.evaluate('(l)=>ArcoI18n.select(l)',lang)
   page.wait_for_timeout(200)
   # Fetch/decode every icon declared by the app rather than relying on a screenshot of the browser chrome.
   paths=page.evaluate('''async()=>{const rows=[...document.querySelectorAll('head link[rel~="icon"],head link[rel="apple-touch-icon"]')].map(e=>e.href);const mu=document.querySelector('link[rel="manifest"]').href;const m=await(await fetch(mu)).json();m.icons.forEach(i=>rows.push(new URL(i.src,mu).href));const out=[];for(const u of rows){const r=await fetch(u);if(!r.ok)throw Error('Missing icon '+u);const im=new Image();im.src=u;await im.decode();out.push({url:u,width:im.naturalWidth,height:im.naturalHeight});}return out;}''')
   assert len(paths)==8,len(paths)
   assert all('-r3' in row['url'] for row in paths)
   assert all(row['width']>0 and row['height']>0 for row in paths)
   logo=page.locator('.header .brand-mark image');assert logo.count()==1
   assert logo.get_attribute('href')=='./icons/arco-gold-512-r3.png'
   page.evaluate('document.querySelectorAll("dialog[open]").forEach(d=>d.close());ARCO.startFromFirst();')
   page.wait_for_timeout(100)
   page.evaluate('ARCO.go("home")');page.wait_for_timeout(200)
   page.locator('.header').screenshot(path=str(shots/f'header-{lang}-{width}-{bool(prefix)}.png'))
   if prefix=='' and lang=='zh-TW':
    page.screenshot(path=str(shots/'home-desktop.png'),full_page=False)
    page.locator('.header').screenshot(path='/mnt/data/ARCO-Logo-Ready-Header.png')
   for level in [1,40,100]:
    page.evaluate('(n)=>{const s=ARCO.getState();s.placement={start:100,at:1};s.learningPath="placement";ARCO.go("lesson/"+n);}',level)
    page.wait_for_timeout(80)
    assert page.locator('.lesson-cover-caption .brand-mark image').count()==1
   # Switching language must not mutate learned data or remove the installed icon links.
   before=page.evaluate('JSON.stringify(ARCO.getState())')
   for l in ['zh-TW','en','de',lang]:page.evaluate('(l)=>ArcoI18n.select(l)',l)
   assert before==page.evaluate('JSON.stringify(ARCO.getState())')
   assert page.locator('head link[rel="manifest"]').count()==1
   assert page.locator('head link[rel="apple-touch-icon"]').count()==1
   page.evaluate('ARCO.go("home")');page.wait_for_timeout(80)
   overflow=page.evaluate('document.documentElement.scrollWidth>innerWidth+1')
   assert not overflow,(prefix,width,lang)
   box=page.locator('.header .brand-mark').bounding_box()
   assert box and box['width']>20 and box['height']>20
   report['views'].append({'path':'/'+prefix,'language':lang,'viewport':width,'decoded_icons':paths,'horizontal_overflow':overflow,'header_logo_box':box,'errors':errs})
   report['errors'].extend(errs)
   context.close()
 browser.close()
report['icon_requests']=sorted(set(report['icon_requests']))
assert not report['errors'],report['errors']
(ROOT/'docs/logo-browser-report.json').write_text(json.dumps(report,indent=2)+'\n')
print('PASS',len(report['views']),'root/project, desktop/mobile, three-language render cases;',len(report['icon_requests']),'different icon URLs decoded; no script errors.')
