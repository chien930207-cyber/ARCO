from pathlib import Path
from playwright.sync_api import sync_playwright
import json
P=Path(__file__).parent
HTML=(Path(__file__).resolve().parents[1]/'index.html').read_text()
FIXTURE="""const storage=new Map();Object.defineProperty(window,'localStorage',{value:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,String(v)),removeItem:k=>storage.delete(k),clear:()=>storage.clear(),key:i=>[...storage.keys()][i]??null,get length(){return storage.size;}}});"""
SCAN=r"""() => {const hits=[];const cjk=/[\u3400-\u9fff]/;const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;while(n=w.nextNode()){if(!n.parentElement||n.parentElement.closest('script,style,textarea,[data-no-translate],.player strong,.score-name'))continue;const s=n.nodeValue.trim();if(cjk.test(s))hits.push({s,kind:'text',selector:n.parentElement.tagName+'.'+n.parentElement.className});}document.querySelectorAll('[aria-label],[title],[placeholder],[alt]').forEach(el=>{if(el.closest('[data-no-translate]'))return;for(const a of ['aria-label','title','placeholder','alt']){const s=el.getAttribute(a);if(s&&cjk.test(s))hits.push({s,kind:a,selector:el.tagName+'.'+el.className});}});return hits;}"""
with sync_playwright() as w:
 b=w.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 page=b.new_page(viewport={'width':1440,'height':1000});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.evaluate(FIXTURE);page.set_content(HTML,wait_until='domcontentloaded');page.wait_for_timeout(100)
 found={}
 def scan(path):
  page.evaluate('ArcoI18n.apply()')
  for hit in page.evaluate(SCAN):
   s=hit['s'];found.setdefault(s,{'source':s,'where':[],'kind':hit['kind']})['where'].append(path)
 page.evaluate("ArcoI18n.select('en')");scan('welcome')
 page.evaluate("document.querySelectorAll('dialog[open]').forEach(d=>d.close());Object.assign(ARCO.getState(),{learningPath:'placement',placement:{start:100,at:1},onboardingSeen:true});ARCO.save();")
 for lang in ['en','de']:
  page.evaluate('(l)=>ArcoI18n.select(l)',lang)
  for route in ['home','courses','review','duel']+[f'lesson/{i}' for i in range(1,101)]:
   if route.startswith('lesson/') and int(route.split('/')[1])%10==0:
    print(lang,route,flush=True)
    (P/'browser-lesson-missing.json').write_text(json.dumps(list(found.values()),ensure_ascii=False,indent=2))
   page.evaluate('(r)=>ARCO.go(r)',route);page.wait_for_timeout(30);scan(lang+':'+route)
   if route.startswith('lesson/'):
    page.evaluate("document.querySelectorAll('details').forEach(d=>d.open=true);ArcoPractice.check();")
    scan(lang+':'+route+':check-empty')
    kind=page.evaluate('ArcoPractice.current()?.w.kind')
    if kind=='keys':
     page.evaluate("ArcoPractice.current().notes=[61];ArcoPractice.check();")
    elif kind=='rhythm':
     page.evaluate("ArcoPractice.current().selected=[];ArcoPractice.check();")
    else:
     page.evaluate("ArcoPractice.current().choice=1;ArcoPractice.check();")
    scan(lang+':'+route+':check-wrong')
    page.evaluate("{const s=ArcoPractice.current();if(s.w.kind==='keys')s.notes=s.w.target.slice();else if(s.w.kind==='rhythm')s.selected=s.w.target.slice();else s.choice=s.w.choices.indexOf(s.w.answer);ArcoPractice.check();}")
    scan(lang+':'+route+':check-correct')
  print(lang,'lessons done',len(found),flush=True)
  (P/'browser-lesson-missing.json').write_text(json.dumps(list(found.values()),ensure_ascii=False,indent=2))
  page.evaluate("ARCO.go('home')");page.wait_for_timeout(50)
  page.locator('[data-action="settings"]').evaluate('(el)=>el.click()');scan(lang+':settings');page.evaluate("document.querySelectorAll('dialog[open]').forEach(d=>d.close())")
  page.locator('[data-action="about"]').evaluate('(el)=>el.click()');scan(lang+':about');page.evaluate("document.querySelectorAll('dialog[open]').forEach(d=>d.close())")
 (P/'browser-lesson-missing.json').write_text(json.dumps(list(found.values()),ensure_ascii=False,indent=2))
 (P/'browser-lesson-missing.tsv').write_text('\n'.join(f'U{i:04d}\t{x["source"].replace(chr(10)," ")}\t{x["kind"]}\t{x["where"][0]}' for i,x in enumerate(found.values())))
 print('Leftover UI',len(found),'errors',errors[:20]);print('\n'.join(found.keys())[:3000])
 b.close()

assert not found, 'Untranslated lesson UI remains'
assert not errors, errors
