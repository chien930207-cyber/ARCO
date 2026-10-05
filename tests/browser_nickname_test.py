from pathlib import Path
from playwright.sync_api import sync_playwright
import json
R=Path(__file__).resolve().parents[1];html=(R/'index.html').read_text();report=[]
fixture="""const m=new Map();Object.defineProperty(window,'localStorage',{value:{getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),key:i=>[...m.keys()][i],get length(){return m.size;}}});"""
with sync_playwright() as w:
 b=w.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox']);p=b.new_page();errs=[];p.on('pageerror',lambda e:errs.append(str(e)));p.evaluate(fixture);p.set_content(html,wait_until='domcontentloaded');p.evaluate('document.querySelectorAll("dialog[open]").forEach(d=>d.close())')
 p.evaluate('''document.body.insertAdjacentHTML('beforeend','<div id="name-test"><div class="player"><strong>\\u7b49\\u5f85\\u52a0\\u5165</strong></div><div class="player"><strong>\\u81ea\\u8a02\\u66b1\\u7a31</strong></div><div class="player-name">\\u7df4\\u7fd2\\u4e2d\\u7684\\u6a02\\u624b \\u00b7 \\u4f60</div><div class="player-name">\\u81ea\\u8a02\\u66b1\\u7a31 \\u00b7 \\u4f60</div></div>');''')
 for lang in ['en','de','zh-TW','en']:
  p.evaluate('(l)=>ArcoI18n.select(l)',lang);report.append({'lang':lang,'names':p.locator('#name-test').inner_text()});assert p.locator('#name-test .player strong').nth(1).inner_text()=='\u81ea\u8a02\u66b1\u7a31'
 assert 'Waiting for player' in report[0]['names']
 assert 'Warte auf Beitritt' in report[1]['names']
 assert '\u81ea\u8a02\u66b1\u7a31 \u00b7 Du' in report[1]['names']
 assert not errs,errs
 b.close()
(R/'tests/nickname-preservation-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print('Nicknames preserved; built-in labels localized across repeated switches.')
