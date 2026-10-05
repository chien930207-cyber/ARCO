"""Rebuild ARCO's self-contained site. Requires only Python 3.10+."""
from pathlib import Path
import json
ROOT=Path(__file__).resolve().parent
NAMES=['curriculum.json','audio.js','icons.js','visual.js','app.js','practice.js','placement.js','duel-bank.json','duel-engine.js','duel.js','translations.json','i18n.js']
ASSIGN={0:'window.ARCO_DATA=',7:'window.ARCO_DUEL_DATA=',10:'window.ARCO_LOCALE_DATA='}
text=(ROOT/'src/page.html').read_text(encoding='utf-8')
for i,name in enumerate(NAMES):
    path=ROOT/'locales'/name if i==10 else ROOT/'src'/name
    value=path.read_text(encoding='utf-8')
    if i==10:value=json.dumps(json.loads(value),ensure_ascii=False,separators=(',',':'))
    if i in ASSIGN:value=ASSIGN[i]+value.strip().replace('</','<\\/')+';'
    text=text.replace(f'@@ARCO_SCRIPT_{i}@@',value)
if '@@ARCO_SCRIPT_' in text:raise RuntimeError('A source module is missing.')
(ROOT/'index.html').write_text(text,encoding='utf-8')
print(f'Built index.html ({len(text.encode("utf-8")):,} bytes)')
