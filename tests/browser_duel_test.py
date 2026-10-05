"""v2.4.1 automatic battle flow, language popup, real timers and BroadcastChannel."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json,time
ROOT=Path(__file__).resolve().parents[1];HTML=(ROOT/'index.html').read_text();OUT=ROOT/'docs/i18n';OUT.mkdir(exist_ok=True)
R={'version':'2.5.0','checks':[],'errors':[],'method':'DOM injection, memory storage fixture, real timers, real BroadcastChannel; no WebRTC claim.'}
MISSING={}
SCAN="() => {const hits=[];const cjk=/[\\u3400-\\u9fff]/;const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;while(n=w.nextNode()){if(!n.parentElement||n.parentElement.closest('script,style,textarea,[data-no-translate],.player strong,.score-name,.player-name'))continue;const s=n.nodeValue.trim();if(cjk.test(s))hits.push(s);}document.querySelectorAll('[aria-label],[title],[placeholder],[alt]').forEach(el=>{if(el.closest('[data-no-translate]'))return;for(const a of ['aria-label','title','placeholder','alt']){const s=el.getAttribute(a);if(s&&cjk.test(s))hits.push(s);}});return hits;}"
def scan_page(p,where):
 p.evaluate('ArcoI18n.apply()')
 for text in p.evaluate(SCAN): MISSING.setdefault(text,[]).append(where)
 (ROOT/'tests/duel-translation-missing.json').write_text(json.dumps(MISSING,ensure_ascii=False,indent=2))
def record(s):
 print('PASS',s,flush=True);R['checks'].append(s);(ROOT/'tests/duel-report.json').write_text(json.dumps(R,indent=2))
def mount(p,html=HTML):
 p.set_default_timeout(6000);p.on('pageerror',lambda e:R['errors'].append(str(e)))
 p.evaluate('''()=>{const m={'arco.learning.visual.v1':JSON.stringify({name:'Player',learningPath:'from-first',placement:null,sfx:false,onboardingSeen:true,lastLevel:40})};Object.defineProperty(window,'localStorage',{value:{getItem:k=>m[k]||null,setItem:(k,v)=>m[k]=v},configurable:true});}''')
 p.set_content(html);p.wait_for_timeout(100)
 if p.locator('#welcome').evaluate('e=>e.open'):p.locator('#welcome').evaluate('e=>e.close()')
 p.evaluate("ARCO.go('duel')");p.wait_for_selector('#duel-mode');return p
def wait(p,state,i=None):
 exp='ArcoDuel.getRoom()?.status==='+json.dumps(state)
 if i is not None:exp+='&&ArcoDuel.getRoom().index==='+str(i)
 p.wait_for_function(exp,timeout=40500,polling=50)
def answer(p,correct=True):
 scan_page(p,'playing')
 c=p.evaluate('ArcoDuelEngine.Q.get(ArcoDuel.getRoom().round.qid).correct');c=c if correct else (c+1)%4
 p.locator(f'[data-action="duel-answer"][data-choice="{c}"]').click()
def scores(p):return p.evaluate('ArcoDuel.getRoom().scores')
def check_reveal(p):
 scan_page(p,'reveal')
 assert p.locator('[data-action="duel-next"]').count()==0
 assert p.locator('.battle-review').count()==0
 assert p.locator('#duel-auto-status').count()==1
 assert '+0' not in p.locator('.round-reveal').inner_text()
 expl=p.evaluate('ArcoDuelEngine.Q.get(ArcoDuel.getRoom().round.qid).explanation')
 assert expl not in p.locator('.quiz-card').inner_text(),('early explanation',expl)
with sync_playwright() as w:
 b=w.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 ctx=b.new_context(viewport={'width':1440,'height':1100},reduced_motion='reduce')
 p=mount(ctx.new_page());p.locator('.header-tools [data-language-toggle]').click();p.locator('.header-tools [data-locale="en"]').click();p.wait_for_timeout(100);before=p.evaluate('JSON.stringify(ARCO.getState())')
 p.locator('[data-action="duel-ai"][data-profile="hard"]').click()
 for i in range(10):
  wait(p,'preview',i);assert p.locator('[data-action="duel-answer"]').count()==0
  wait(p,'playing',i)
  assert p.locator('#duel-seconds').inner_text()=='30'
  if i==1:
   stamp=p.evaluate('JSON.stringify({qid:ArcoDuel.getRoom().round.qid,order:ArcoDuel.getRoom().round.order,roundId:ArcoDuel.getRoom().round.roundId,scores:ArcoDuel.getRoom().scores})')
   remaining=int(p.locator('#duel-seconds').inner_text())
   p.locator('.header-tools [data-language-toggle]').click();p.locator('.header-tools [data-locale="de"]').click();p.wait_for_timeout(100)
   assert p.evaluate('JSON.stringify({qid:ArcoDuel.getRoom().round.qid,order:ArcoDuel.getRoom().round.order,roundId:ArcoDuel.getRoom().round.roundId,scores:ArcoDuel.getRoom().scores})')==stamp
   assert int(p.locator('#duel-seconds').inner_text())<=remaining
   p.locator('.header-tools [data-language-toggle]').click();p.locator('.header-tools [data-locale="en"]').click()
   record('Language dropdown during live AI round preserves question, order, scores and countdown')
  if i>0:answer(p,i!=3)
  wait(p,'reveal',i);check_reveal(p);print('AI REVEAL',i+1,scores(p),flush=True)
  if i==0:assert p.evaluate('ArcoDuel.getRoom().answers.host.points')==0
  if i==9:
   assert p.evaluate('ArcoDuel.getRoom().answers.host.boss')==3
   p.screenshot(path=str(OUT/'battle-auto-reveal-desktop.png'))
  p.wait_for_timeout(700);assert p.evaluate('ArcoDuel.getRoom().status')=='reveal'
  # No click: the next loop must arrive automatically.
 wait(p,'result');scan_page(p,'ai-result');assert p.evaluate('ArcoDuel.getRoom().log.length')==10
 assert p.locator('.battle-review-row[open]').count()==2
 assert p.locator('.review-your-answer').count()==2
 assert p.locator('.battle-review .score-formula').count()==0
 assert all('/' not in el.inner_text() for el in p.locator('.battle-review-row summary>b').all())
 p.screenshot(path=str(OUT/'battle-result-desktop.png'),full_page=True)
 p.locator('.battle-review-row').first.screenshot(path=str(OUT/'battle-review.png'))
 p.locator('[data-action="duel-review-filter"][data-filter="all"]').click();assert p.locator('.battle-review-row').count()==10
 p.locator('[data-action="duel-review-filter"][data-filter="wrong"]').click();assert p.locator('.battle-review-row').count()==2
 # setName may default an empty nickname at launch; progress payload itself must be unchanged.
 assert p.evaluate('JSON.stringify([ARCO.getState().placement,ARCO.getState().best,ARCO.getState().wrong,ARCO.getState().attempts])')==json.dumps([None,{}, {}, []],separators=(',',':'))
 record('AI complete 10-round match: real 5s preview, 30s timeout, automatic 3s answer reveal, boss x3, deferred mistake review')
 p.locator('[data-action="duel-leave"]').first.click();p.wait_for_selector('#duel-mode')
 with p.expect_popup() as pop:p.evaluate("window.open('')")
 g=mount(pop.value);g.locator('.header-tools [data-language-toggle]').click();g.locator('.header-tools [data-locale="de"]').click();g.wait_for_timeout(100)
 for pg in [p,g]:pg.locator('#duel-mode').select_option('local')
 p.locator('[data-action="duel-create"]').click();wait(p,'waiting')
 code=p.evaluate('ArcoDuel.getRoom().code');g.locator('#duel-code').fill(code);g.locator('[data-action="duel-join"]').click();wait(g,'waiting')
 g.locator('[data-action="duel-ready"]').click();p.locator('[data-action="duel-start"]').click()
 for i in range(10):
  wait(p,'playing',i);wait(g,'playing',i)
  assert p.evaluate('ArcoDuel.getRoom().round.qid')==g.evaluate('ArcoDuel.getRoom().round.qid')
  assert p.evaluate('ArcoDuel.getRoom().round.order')==g.evaluate('ArcoDuel.getRoom().round.order')
  answer(p);answer(g,i not in [0,7]);wait(p,'reveal',i);wait(g,'reveal',i)
  check_reveal(p);check_reveal(g);assert scores(p)==scores(g)
  print('HUMAN REVEAL',i+1,scores(p),flush=True)
 wait(p,'result');wait(g,'result');scan_page(p,'host-result');scan_page(g,'guest-result');assert scores(p)==scores(g)
 assert p.locator('.battle-review-row').count()==0
 assert g.locator('.battle-review-row').count()==2
 record('BroadcastChannel complete 10-round human match: matching questions/order/scores, zero manual next clicks, automatic final result')
 # Next timer must not resurrect a room after leaving during reveal.
 p.locator('[data-action="duel-leave"]').first.click();p.wait_for_selector('#duel-mode')
 p.locator('[data-action="duel-ai"][data-profile="hard"]').click();wait(p,'playing',0);answer(p);wait(p,'reveal',0)
 p.locator('[data-action="duel-leave"]').click();p.locator('[data-action="exit-confirm"]').click();p.wait_for_timeout(3600)
 assert p.evaluate('ArcoDuel.getRoom()===null')
 assert p.locator('#duel-mode').count()==1
 record('Leaving during auto-reveal cancels transition timers and keeps the lobby stable')
 assert not R['errors'],R['errors'];b.close()
R['translationMissing']=len(MISSING)
R['status']='passed';(ROOT/'tests/duel-report.json').write_text(json.dumps(R,indent=2));print('BATTLE SUITE PASSED',flush=True)

assert not MISSING, 'Untranslated duel UI remains'
