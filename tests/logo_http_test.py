"""Real local HTTP path checks; browser UI/install behavior is tested separately."""
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from pathlib import Path
from threading import Thread
from urllib.request import urlopen
from urllib.parse import urlsplit,urljoin
from bs4 import BeautifulSoup
import json
ROOT=Path(__file__).resolve().parents[1]
class Handler(SimpleHTTPRequestHandler):
 def __init__(self,*a,**kw):super().__init__(*a,directory=str(ROOT),**kw)
 def log_message(self,*args):pass
 def translate_path(self,path):
  if path.startswith('/arco/'):path=path[len('/arco'):]
  return super().translate_path(path)
srv=ThreadingHTTPServer(('127.0.0.1',0),Handler)
Thread(target=srv.serve_forever,daemon=True).start()
report=[]
try:
 for folder in ['', 'arco/']:
  base=f'http://127.0.0.1:{srv.server_port}/{folder}'
  with urlopen(base) as r:doc=BeautifulSoup(r.read(),'html.parser');assert r.status==200
  assert doc.select_one('meta[name="arco-icon-release"]')['content']=='gold-r3'
  paths=[el['href'] for el in doc.select('head link[rel~="icon"],head link[rel="apple-touch-icon"],head link[rel="manifest"]')]
  mu=urljoin(base,doc.select_one('link[rel="manifest"]')['href'])
  with urlopen(mu) as r:mf=json.load(r)
  paths.extend(row['src'] for row in mf['icons'])
  paths.extend(['./favicon.ico','./apple-touch-icon.png','./logo-check.html'])
  for path in paths:
   with urlopen(urljoin(base,path)) as r:
    assert r.status==200;body=r.read();assert len(body)>0
    report.append({'path':urlsplit(r.url).path,'status':r.status,'bytes':len(body),'content_type':r.headers.get('Content-Type')})
finally:srv.shutdown()
(ROOT/'docs/logo-http-report.json').write_text(json.dumps(report,indent=2)+'\n')
print('PASS',len(report),'HTTP requests across / and /arco/.')
