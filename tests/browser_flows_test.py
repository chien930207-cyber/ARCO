from pathlib import Path
from playwright.sync_api import sync_playwright
import json
P=Path(__file__).parent
HTML=(Path(__file__).resolve().parents[1]/'index.html').read_text()
FIXTURE="""const storage=new Map();Object.defineProperty(window,'localStorage',{value:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,String(v)),removeItem:k=>storage.delete(k),clear:()=>storage.clear(),key:i=>[...storage.keys()][i]??null,get length(){return storage.size;}}});"""
SCAN=r"""() => {const hits=[];const cjk=/[\u3400-\u9fff]/;const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;while(n=w.nextNode()){if(!n.parentElement||n.parentElement.closest('script,style,textarea,[data-no-translate],.player strong,.score-name,.player-name'))continue;const s=n.nodeValue.trim();if(cjk.test(s))hits.push(s);}document.querySelectorAll('[aria-label],[title],[placeholder],[alt]').forEach(el=>{if(el.closest('[data-no-translate]'))return;for(const a of ['aria-label','title','placeholder','alt']){const s=el.getAttribute(a);if(s&&cjk.test(s))hits.push(s);}});return hits;}"""
found={};errors=[]
with sync_playwright() as w:
 b=w.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 p=b.new_page(viewport={'width':1440,'height':1000});p.on('pageerror',lambda e:errors.append(str(e)));p.evaluate(FIXTURE);p.set_content(HTML,wait_until='domcontentloaded')
 def scan(path):
  p.evaluate('ArcoI18n.apply()')
  for s in p.evaluate(SCAN):found.setdefault(s,[]).append(path)
 for lang in ['en','de']:
  p.evaluate('(l)=>ArcoI18n.select(l)',lang)
  p.evaluate('document.querySelectorAll("dialog[open]").forEach(d=>d.close());ArcoPlacement.leaveRoute(true);Object.assign(ARCO.getState(),{placement:null,placementRecord:null,learningPath:null,best:{},wrong:{},attempts:[]});ArcoPlacement.start();')
  for i in range(15):
   scan(lang+':placement'+str(i))
   p.evaluate('(i)=>{const q=ArcoPlacement.current();ArcoPlacement.answer(i<6?q.correct:i===6?(q.correct+1)%4:-1);}',i)
   if i==4:
    before=p.evaluate('JSON.stringify(ArcoPlacement.getRun())');p.evaluate('ArcoI18n.select("zh-TW");ArcoI18n.select("de");ArcoI18n.select("en")');assert p.evaluate('JSON.stringify(ArcoPlacement.getRun())')==before
    p.evaluate('(l)=>ArcoI18n.select(l)',lang)
   p.evaluate('ArcoPlacement.next()')
  scan(lang+':placement-result');p.evaluate('ArcoPlacement.accept()');scan(lang+':placement-accepted')
  for n in [1,4,15,40,100]:
   p.evaluate('(n)=>{ArcoPlacement.leaveRoute(true);Object.assign(ARCO.getState(),{placement:{start:100,at:1},learningPath:"placement"});ARCO.go("lesson/"+n);}',n);p.wait_for_timeout(20)
   p.locator('[data-action="start-quiz"]').first.evaluate('(el)=>el.click()')
   for j in range(10):
    scan(lang+':quiz'+str(n))
    # Pick an option by canonical data attribute, not translated text.
    opts=p.locator('[data-action="answer"]')
    choice=p.evaluate('(n)=>ARCO.lesson(n).questions.map(q=>q.correct)',n)[j]
    (p.locator(f'[data-action="answer"][data-choice="{choice}"]') if n in [1,100] else opts.nth(j%4)).evaluate('(el)=>el.click()');scan(lang+':quiz-feedback'+str(n))
    p.locator('[data-action="next-question"]').evaluate('(el)=>el.click()')
   scan(lang+':quiz-result'+str(n))
  p.evaluate('ARCO.go("review")');p.wait_for_timeout(20);scan(lang+':wrong-notebook')
  p.evaluate('ARCO.go("duel")');p.wait_for_timeout(20);p.locator('#duel-name').fill('Player');p.locator('[data-action="duel-scope-current"]').evaluate('(el)=>el.click()');scan(lang+':duel-scope-current');p.locator('[data-action="duel-scope-clear"]').evaluate('(el)=>el.click()');scan(lang+':scope-empty');p.locator('[data-action="duel-scope-all"]').evaluate('(el)=>el.click()');p.locator('[data-action="duel-ai"][data-profile="hard"]').evaluate('(el)=>el.click()');
  p.wait_for_function('ArcoDuel.getRoom()?.round');scan(lang+':battle-preview');p.wait_for_function('ArcoDuel.getRoom()?.status==="playing"',timeout=10000);scan(lang+':battle-playing')
  # Simulate a finished log to test every review string; no scoring/network change is shipped.
  p.evaluate('''()=>{const r=ArcoDuel.getRoom();const qs=[...ArcoDuelEngine.Q.values()];r.status='result';r.matches=2;r.scores={host:500,guest:500};r.log=qs.filter(q=>[1,4,17,40,69,94,100].includes(q.level)).slice(0,80).map((q,i)=>({qid:q.id,boss:i===9,answers:{host:{choice:i%4===0?null:(q.correct+1)%4,correct:false},guest:{choice:q.correct,correct:true}}}));ArcoDuel.render();}''');scan(lang+':battle-results')
  p.locator('[data-action="duel-leave"]').first.evaluate('(el)=>el.click()')
  print(lang,'done, missing',len(found),flush=True)
 b.close()
(P/'browser-flow-missing.json').write_text(json.dumps(found,ensure_ascii=False,indent=2));print('ERRORS',errors);print('\n'.join(found))

assert not found, 'Untranslated workflow UI remains'
assert not errors, errors
