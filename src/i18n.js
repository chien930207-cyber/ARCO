'use strict';
/** Display-only localization. Never changes question IDs, answer indices or game state. */
window.ArcoI18n = (()=>{
 const KEY='arco.locale.v1', DATA=window.ARCO_LOCALE_DATA;
 const supported=['zh-TW','en','de'], sourceText=new WeakMap(), sourceAttrs=new WeakMap(), missing=new Set();
 let locale='zh-TW', observer=null, scheduled=false, applying=false, controlId=0;
 try{const saved=localStorage.getItem(KEY);if(supported.includes(saved))locale=saved;}catch(_){}
 const labels={
  'zh-TW':{settings:'\u8a2d\u5b9a',language:'\u8a9e\u8a00',new:'\u65b0\u529f\u80fd',preview:'',source:'\u539f\u6587'},
  en:{settings:'Settings',language:'Language',new:'New feature',preview:'',source:'Original: Traditional Chinese'},
  de:{settings:'Einstellungen',language:'Sprache',new:'Neue Funktion',preview:'',source:'Original: Traditionelles Chinesisch'}
 };
 const CJK=/[\u3400-\u9fff]/;
 function norm(text){const vals=[];return {key:text.replace(/[A-Za-z0-9][A-Za-z0-9\s\u00b0\u00b7\u2013\u2014\u2192\u266d\u266f\u00d7/.,+#=\-:;()\[\]<>%]*/g,m=>'{'+(vals.push(m.trim())-1)+'}'),vals};}
 function exact(text){if(locale==='zh-TW')return text;const col=locale==='en'?0:1;let value=DATA.direct[text]?.[col];if(value!==undefined)return value;const {key,vals}=norm(text);value=DATA.patterns[key]?.[col];return value===undefined?null:value.replace(/\{(\d+)\}/g,(_,n)=>vals[Number(n)]??'');}
 function t(text,depth=0){
  text=String(text??'');if(locale==='zh-TW')return text;
  if(!CJK.test(text)){const plain=DATA.direct[text.trim()]?.[locale==='en'?0:1];return plain===undefined?text:plain;}
  const trim=text.trim(),hit=exact(trim);if(hit!==null)return text.slice(0,text.indexOf(trim))+hit+text.slice(text.indexOf(trim)+trim.length);
  // Compose only known UI templates; canonical question data stays unchanged.
  if(depth<5){
   let m;
   const de=locale==='de';
   const join=(prefix,tail)=>{const v=t(tail,depth+1);return CJK.test(v)?null:prefix+v;};
   if((m=trim.match(/^\u5f48\u594f\s+(.+)$/)))return (de?'Spielen: ':'Play ')+m[1];
   if((m=trim.match(/^\u8f38\u5165 (.+) \u7b2c (\d+) \u516b\u5ea6$/)))return de?`${m[1]} in Oktave ${m[2]} eingeben`:`Enter ${m[1]} in octave ${m[2]}`;
   if((m=trim.match(/^\u79fb\u9664\u7b2c (\d+) \u500b\u97f3 (.+)$/)))return de?`Ton ${m[1]} (${m[2]}) entfernen`:`Remove note ${m[1]} (${m[2]})`;
   if((m=trim.match(/^(\u9ad8|\u4f4e)\u97f3\u8b5c\u8868\uff0c\u97f3\u7b26\u4f4d\u65bc\u81ea\u6700\u4e0b\u65b9\u7dda\u8d77\u7b97\u7b2c (-?\d+) \u500b\u534a\u7dda\u8ddd$/)))return de?`${m[1]==='\u9ad8'?'Violinschl\u00fcssel':'Bassschl\u00fcssel'}: Notenposition ${m[2]} in halben Linienabst\u00e4nden ab der untersten Linie.`:`${m[1]==='\u9ad8'?'Treble':'Bass'} staff: note position ${m[2]}, measured in half-line spaces from the bottom line.`;
   if((m=trim.match(/^(\d+\s+)(.+)$/s))){const v=join(m[1],m[2]);if(v!==null)return v;}

   if((m=trim.match(/^\u7b2c 1[\u2013-](\d+) \u7d1a\u958b\u653e\u8907\u7fd2$/)))return de?`Stufen 1\u2013${m[1]} zum Wiederholen freigeschaltet`:`Levels 1\u2013${m[1]} open for review`;
   if((m=trim.match(/^\u5f9e\u7b2c (\d+) \u7d1a\u8d77\uff0c\u6bcf\u95dc\u7b54\u5c0d 8 \u984c\u5373\u53ef\u89e3\u9396\u4e0b\u4e00\u95dc\u3002$/)))return de?`Ab Stufe ${m[1]} schaltest du mit jeweils 8 richtigen Antworten die n\u00e4chste Stufe frei.`:`From level ${m[1]}, answer 8 questions correctly to unlock each next level.`;
   if((m=trim.match(/^\u5df2\u4f5c\u7b54 (\d+) \u984c\uff0c\u5171 (\d+) \u984c$/)))return de?`${m[1]} von ${m[2]} Fragen beantwortet`:`Answered ${m[1]} of ${m[2]} questions`;
   if((m=trim.match(/^\/ (\d+) \u984c\u7b54\u5c0d$/)))return de?`/ ${m[1]} richtig`:`/ ${m[1]} correct`;
   if((m=trim.match(/^\u7b54\u5c0d (\d+) \u984c\uff0c\u9084\u5dee (\d+) \u984c\u5230\u9054\u904e\u95dc\u9580\u6abb\u3002\u770b\u4e00\u4e0b\u539f\u56e0\uff0c\u518d\u6311\u6230\u4e00\u6b21\u3002$/)))return de?`${m[1]} richtige Antworten; zum Bestehen fehlen noch ${m[2]}. Lies die Erkl\u00e4rungen und versuche es erneut.`:`${m[1]} correct; ${m[2]} more needed to pass. Review the explanations and try again.`;
   if((m=trim.match(/^\uff0f\u7b54\u932f (\d+) \u6b21$/)))return de?`/ ${m[1]} Fehlversuche`:`/ ${m[1]} incorrect attempts`;
   if((m=trim.match(/^\u5df2\u5b8c\u6210\u7b2c (\d+) \u5c40\uff0c\u5c0d\u6230\u4e0d\u5f71\u97ff\u8ab2\u7a0b\u6649\u7d1a\u3002$/)))return de?`Runde ${m[1]} abgeschlossen. Duelle ver\u00e4ndern deinen Kursfortschritt nicht.`:`Match ${m[1]} complete. Duels do not affect course progression.`;
   if((m=trim.match(/^(.*?) (\d+) \u52dd \/ (.*?) (\d+) \u52dd\u3002\u5e73\u624b\u4e0d\u8a08\u52dd\u5834\u3002$/)))return de?`${t(m[1],depth+1)}: ${m[2]} Siege / ${t(m[3],depth+1)}: ${m[4]} Siege. Unentschieden z\u00e4hlen nicht als Sieg.`:`${t(m[1],depth+1)}: ${m[2]} wins / ${t(m[3],depth+1)}: ${m[4]} wins. Draws do not count as wins.`;

   if((m=trim.match(/^\u7b2c (\d+) \u7d1a\u5df2\u89e3\u9396\u3002\u6e96\u5099\u597d\u518d\u7e7c\u7e8c\u3002$/)))return de?`Stufe ${m[1]} ist freigeschaltet. Mache weiter, sobald du bereit bist.`:`Level ${m[1]} unlocked. Continue when you are ready.`;
   if((m=trim.match(/^\u5df2\u8907\u7fd2 (\d+) \u984c\uff0c\u7b54\u5c0d\u7684\u984c\u76ee\u5df2\u5f9e\u932f\u984c\u672c\u79fb\u9664\u3002$/)))return de?`${m[1]} Fragen wiederholt. Richtig beantwortete Fragen wurden aus dem Fehlerheft entfernt.`:`Reviewed ${m[1]} questions. Correct answers have been removed from the mistake notebook.`;
   if((m=trim.match(/^\u7b2c ([0-9\u2013\u3001 -]+) \u7d1a$/)))return (de?'Stufen ':'Levels ')+m[1].replace(/\u3001/g,', ');

   if((m=trim.match(/^(\u5206\u9801\u6e2c\u8a66|\u96d9\u4eba\u5c0d\u6230) \u00b7 \u623f\u865f (\d+)$/)))return de?`${m[1]==='\u5206\u9801\u6e2c\u8a66'?'Tab-Test':'Zweispielerduell'} - Raum ${m[2]}`:`${m[1]==='\u5206\u9801\u6e2c\u8a66'?'Two-tab test':'Two-player duel'} - room ${m[2]}`;
   const prefixes=[
    ['\u9019\u6b21\u9084\u6c92\u7b26\u5408\u76ee\u6a19\u3002',de?'Noch nicht richtig. ':'Not quite yet. '],
    ['\u6838\u5c0d\u6210\u529f\u3002\u63a5\u8457\u7528\u81ea\u5df1\u7684\u6a02\u5668\u5b8c\u6210\u4e0b\u65b9\u4efb\u52d9\uff0c\u518d\u4ee5\u6210\u529f\u6a19\u6e96\u6aa2\u67e5\u3002',de?'Richtig. Probiere die Aufgabe nun am Instrument und pr\u00fcfe die Erfolgskriterien. ':'Correct. Now try the task on your instrument and check it against the success criteria. ']
   ];
   for(const [src,dst] of prefixes){if(trim.startsWith(src)){const v=join(dst,trim.slice(src.length).trim());if(v!==null)return v;}}
   if((m=trim.match(/^\u6e2c\u9a57\u8d77\u9ede\uff1a\u7b2c (\d+) \u7d1a\u3002\u76ee\u524d\u7e7c\u7e8c\u7b2c (\d+) \u7d1a\u3002\u6bcf\u95dc\u7b54\u5c0d 8 \/ 10 \u984c\uff0c\u4f9d\u5e8f\u89e3\u9396\u4e0b\u4e00\u95dc\u3002$/)))return de?`Einstufung: Stufe ${m[1]}. Weiter bei Stufe ${m[2]}. Mit 8 von 10 richtigen Antworten schaltest du jeweils die n\u00e4chste Stufe frei.`:`Placement: level ${m[1]}. Continue at level ${m[2]}. Answer 8 out of 10 correctly to unlock each next level.`;
   if((m=trim.match(/^\u5f9e\u7b2c 1 \u7d1a\u8d77\u6b65\uff0c\u76ee\u524d\u7e7c\u7e8c\u7b2c (\d+) \u7d1a\u3002\u6bcf\u95dc\u7b54\u5c0d 8 \/ 10 \u984c\uff0c\u4f9d\u5e8f\u89e3\u9396\u4e0b\u4e00\u95dc\u3002$/)))return de?`Beginn bei Stufe 1. Weiter bei Stufe ${m[1]}. Mit 8 von 10 richtigen Antworten schaltest du jeweils die n\u00e4chste Stufe frei.`:`Started at level 1. Continue at level ${m[1]}. Answer 8 out of 10 correctly to unlock each next level.`;
  }

  if(depth<3){
   const parts=trim.split(/([\u3002\uff1a\uff1b\u00b7\u30fb\n]|\s[|]\s)/);let changed=false,untranslated=false;
   if(parts.length>1){const v=parts.map(s=>{if(!CJK.test(s))return s.replace(/\u3002/g,'. ').replace(/\uff1a/g,': ').replace(/\uff1b/g,'; ');const r=t(s,depth+1);if(r===s&&CJK.test(r))untranslated=true;else changed=true;return r;});if(changed&&!untranslated)return v.join('');}
   const lead=trim.match(/^([0-9]+[.\u3001]\s*)(.+)$/s);if(lead){const r=t(lead[2],depth+1);if(r!==lead[2])return lead[1]+r;}
   const level=trim.match(/^\u7b2c\s*(\d+)\s*\u7d1a(\s*[\u00b7:\uff1a]\s*)(.*)$/s);
   if(level){const r=t(level[3],depth+1);if(!CJK.test(r))return (locale==='de'?'Stufe ':'Level ')+level[1]+' - '+r;}
  }
  missing.add(trim);return text;
 }
 function localizeNode(node){
  if(!node.parentElement||node.parentElement.closest('script,style,textarea,[data-no-translate]'))return;
  const now=node.nodeValue;let rec=sourceText.get(node);
  if(!rec||now!==rec.rendered)rec={source:now,rendered:now};
  const player=node.parentElement.closest('.player strong,.score-name,.player-name');
  let playerText=null;
  if(player){const m=rec.source.trim().match(/^(.*?)( · 你)?$/);const builtIn=['房主','等待加入','練習中的樂手','入門陪練','標準對手','進階樂手'];if(!builtIn.includes(m[1])&&!m[2])return;playerText=(builtIn.includes(m[1])?t(m[1]):m[1])+(m[2]?(locale==='de'?' · Du':locale==='en'?' · You':m[2]):'');}
  const rendered=playerText===null?t(rec.source):playerText;if(rendered!==now)node.nodeValue=rendered;rec.rendered=rendered;sourceText.set(node,rec);if(locale!=='zh-TW'&&CJK.test(rendered)&&!node.parentElement.hasAttribute('lang')){node.parentElement.dataset.arcoSourceLang='';node.parentElement.lang='zh-Hant';}
 }
 const choices=[['zh-TW','TW','\u7e41\u9ad4\u4e2d\u6587'],['en','EN','English'],['de','DE','Deutsch']];
 function controls(){
  const l=labels[locale],choice=choices.find(c=>c[0]===locale);
  document.querySelectorAll('.language-option[data-locale]').forEach(n=>{
   const active=n.dataset.locale===locale;
   n.classList.toggle('is-active',active);n.setAttribute('aria-checked',String(active));
  });
  document.querySelectorAll('.language-switch').forEach(n=>{
   const trigger=n.querySelector('[data-language-toggle]');
   trigger.setAttribute('aria-label',l.language+': '+choice[2]);
   trigger.setAttribute('title',l.language+': '+choice[2]);
   n.querySelector('[data-current-locale]').textContent=choice[1];
   n.querySelector('[role="menu"]').setAttribute('aria-label',l.language);
  });
  const note=document.getElementById('locale-note');if(note){note.hidden=true;note.textContent='';}
 }
 function apply(){
  scheduled=false;if(applying)return;applying=true;observer?.disconnect();
  document.querySelectorAll('[data-arco-source-lang]').forEach(el=>{el.removeAttribute('lang');el.removeAttribute('data-arco-source-lang');});
  const tw=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;while((n=tw.nextNode()))localizeNode(n);
  document.querySelectorAll('[aria-label],[title],[placeholder],[alt]').forEach(el=>{
   if(el.closest('[data-no-translate]'))return;
   let records=sourceAttrs.get(el)||{};
   for(const name of ['aria-label','title','placeholder','alt']){if(!el.hasAttribute(name))continue;const current=el.getAttribute(name);let r=records[name];if(!r||r.rendered!==current)r={source:current,rendered:current};const val=t(r.source);if(val!==current)el.setAttribute(name,val);r.rendered=val;records[name]=r;}
   sourceAttrs.set(el,records);
  });
  document.documentElement.lang=locale==='zh-TW'?'zh-Hant':locale;document.documentElement.dataset.locale=locale;
  document.title=locale==='zh-TW'?'ARCO | \u6a02\u7406\u7df4\u7fd2\u5ba4':locale==='de'?'ARCO | Musiktheorie praktisch lernen':'ARCO | Music theory into practice';
  const meta=document.querySelector('meta[name=description]');if(meta){meta.content=locale==='zh-TW'?"100 \u7d1a\u6a02\u7406\u7df4\u7fd2\u3002\u6bcf\u8ab2\u4e00\u500b\u89c0\u5ff5\uff0c\u5148\u807d\u518d\u8a66\uff0c\u628a\u77e5\u8b58\u5e36\u9032\u6f14\u594f\u3002":locale==='de'?'100 Lektionen Musiktheorie mit Hörbeispielen, praktischen Übungen und Duellen.':'100 music theory lessons with listening examples, practical exercises and duels.';}
  controls();applying=false;observer?.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['aria-label','title','placeholder','alt']});
  document.dispatchEvent(new CustomEvent('arco:localized',{detail:{locale}}));
 }
 function schedule(){if(scheduled||applying)return;scheduled=true;requestAnimationFrame(apply);}
 function closeMenu(root,restoreFocus=false){
  const trigger=root.querySelector('[data-language-toggle]'),menu=root.querySelector('[role="menu"]');
  if(!trigger||!menu)return;
  // Move focus before hiding its old ancestor, including inside the welcome dialog.
  if(restoreFocus&&root.isConnected)trigger.focus({preventScroll:true});
  trigger.setAttribute('aria-expanded','false');menu.hidden=true;root.classList.remove('is-open');
 }
 function closeAll(restoreFocus=false){
  document.querySelectorAll('.language-switch.is-open').forEach(root=>closeMenu(root,restoreFocus));
 }
 function openMenu(root,edge=null){
  closeAll();
  const trigger=root.querySelector('[data-language-toggle]'),menu=root.querySelector('[role="menu"]');
  trigger.setAttribute('aria-expanded','true');menu.hidden=false;root.classList.add('is-open');
  const options=[...menu.querySelectorAll('.language-option')];
  (edge==='first'?options[0]:edge==='last'?options.at(-1):options.find(n=>n.dataset.locale===locale))?.focus({preventScroll:true});
 }
 function select(value){
  if(!supported.includes(value))return;
  closeAll(true);
  if(value===locale)return;
  locale=value;missing.clear();try{localStorage.setItem(KEY,locale);}catch(_){}apply();
 }
 function markup(){
  const id='arco-language-'+(++controlId),choice=choices.find(c=>c[0]===locale);
  return `<div class="language-switch" data-no-translate>
   <button type="button" class="language-trigger" id="${id}-trigger" data-language-toggle aria-haspopup="menu" aria-controls="${id}-menu" aria-expanded="false" aria-label="Language: ${choice[2]}">
    <svg class="language-globe" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c5 5 5 13 0 18-5-5-5-13 0-18Z"/></svg><span data-current-locale>${choice[1]}</span>
    <svg class="language-chevron" viewBox="0 0 16 16" aria-hidden="true"><path d="m4 6 4 4 4-4"/></svg>
   </button>
   <div class="language-menu" id="${id}-menu" role="menu" aria-label="Language" hidden>${choices.map(([value,short,name])=>`
    <button type="button" class="language-option" role="menuitemradio" tabindex="-1" data-locale="${value}" aria-checked="${value===locale}">
     <span class="language-code">${short}</span><span class="language-name" lang="${value==='zh-TW'?'zh-Hant':value}">${name}</span>${value!=='zh-TW'?'<span class="new-tag" aria-hidden="true">NEW</span>':'<span class="language-new-space" aria-hidden="true"></span>'}
     <svg class="language-check" viewBox="0 0 16 16" aria-hidden="true"><path d="m3 8 3 3 7-7"/></svg>
    </button>`).join('')}</div>
  </div>`;
 }
 function mount(){
  const tools=document.querySelector('.header-tools');
  if(tools&&!tools.querySelector('.language-switch'))tools.insertAdjacentHTML('beforeend',markup());
  const welcome=document.querySelector('#welcome .welcome-copy');
  if(welcome&&!welcome.querySelector('.welcome-tools')){
   const row=document.createElement('div');row.className='welcome-tools';row.dataset.noTranslate='';row.innerHTML=markup();welcome.prepend(row);
  }
 }
 function reset(){closeAll();locale='zh-TW';missing.clear();apply();}
 document.addEventListener('click',e=>{
  const toggle=e.target.closest('[data-language-toggle]');
  if(toggle){e.preventDefault();const root=toggle.closest('.language-switch');root.classList.contains('is-open')?closeMenu(root,true):openMenu(root);return;}
  const option=e.target.closest('.language-option[data-locale]');
  if(option){e.preventDefault();select(option.dataset.locale);return;}
  if(!e.target.closest('.language-switch'))closeAll();
 });
 document.addEventListener('pointerdown',e=>{if(!e.target.closest('.language-switch'))closeAll();});
 document.addEventListener('focusin',e=>{
  document.querySelectorAll('.language-switch.is-open').forEach(root=>{if(!root.contains(e.target))closeMenu(root);});
 });
 document.addEventListener('keydown',e=>{
  const root=e.target.closest('.language-switch');if(!root)return;
  const opened=root.classList.contains('is-open');
  // Do not let answer shortcuts fire while focus is in the language control.
  if(/^[1-4]$/.test(e.key)){e.preventDefault();e.stopImmediatePropagation();return;}
  if(e.key==='Escape'&&opened){e.preventDefault();e.stopImmediatePropagation();closeMenu(root,true);return;}
  if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)){
   e.preventDefault();e.stopImmediatePropagation();
   if(!opened){openMenu(root,e.key==='End'||e.key==='ArrowUp'?'last':'first');return;}
   const options=[...root.querySelectorAll('.language-option')],i=options.indexOf(document.activeElement);
   const next=e.key==='Home'?0:e.key==='End'?options.length-1:(i+(e.key==='ArrowDown'?1:-1)+options.length)%options.length;
   options[next].focus({preventScroll:true});
  }
 },true);
 // A new route or native dialog must not leave an old popover open underneath it.
 window.addEventListener('hashchange',()=>closeAll());
 document.addEventListener('close',()=>closeAll(),true);
 observer=new MutationObserver(()=>{mount();schedule();});mount();apply();
 return {t,select,apply,schedule,markup,reset,get locale(){return locale;},get missing(){return [...missing];},labels};
})();
