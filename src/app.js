'use strict';
(()=>{
 const D=window.ARCO_DATA, storageKey='arco.learning.visual.v1', $=s=>document.querySelector(s), main=$('#main');
 const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const icon=(name,cls='')=>window.ArcoIcons.render(name,cls);
 const brandMark=(cls='')=>window.ArcoIcons.mark(cls);
 const Q=new Map();D.levels.forEach(l=>l.questions.forEach(q=>Q.set(q.id,{...q,level:l.id})));
 const fresh=()=>({version:3,onboardingSeen:false,learningPath:null,placement:null,placementRecord:null,placementSeen:[],practices:{},testMode:false,best:{},testBest:{},wrong:{},attempts:[],lastLevel:1,volume:.28,sfx:true,name:'',visited:{}});
 function sanitize(raw){
  if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Error('invalid');
  const out=fresh();out.learningPath=raw.learningPath==='from-first'?'from-first':raw.learningPath==='placement'?'placement':null;out.testMode=false; // Legacy test results stay archived; never unlock courses.
  for(const key of ['best','testBest']){for(let i=1;i<=100;i++){let v=raw[key]?.[i];if(Number.isInteger(v)&&v>=0&&v<=10)out[key][i]=v;}}
  if(raw.wrong&&typeof raw.wrong==='object')for(const id of Object.keys(raw.wrong)){if(!Q.has(id))continue;const entry=raw.wrong[id];out.wrong[id]={misses:Math.min(999,Math.max(1,Number(entry?.misses)||1)),last:Math.max(0,Number(entry?.last)||0)};}
  out.volume=Number.isFinite(raw.volume)?Math.min(.75,Math.max(0,raw.volume)):.28;out.sfx=raw.sfx!==false;
  out.lastLevel=Number.isInteger(raw.lastLevel)&&raw.lastLevel>=1&&raw.lastLevel<=100?raw.lastLevel:1;
  out.name=typeof raw.name==='string'?raw.name.trim().slice(0,12):'';
  if(Array.isArray(raw.attempts))out.attempts=raw.attempts.slice(-300).filter(a=>a&&Number.isInteger(a.level)&&a.level>=1&&a.level<=100&&Number.isInteger(a.score)&&a.score>=0&&a.score<=10).map(a=>({level:a.level,score:a.score,test:a.test===true,at:Number(a.at)||0}));
  for(let i=1;i<=100;i++)if(raw.visited?.[i]===true)out.visited[i]=true;
  out.onboardingSeen=raw.onboardingSeen===true;
  const p=raw.placement;
  if(p&&Number.isInteger(p.start)&&p.start>=1&&p.start<=100){
   const total=Math.min(20,Math.max(0,Math.trunc(Number(p.total)||0)));
   out.placement={start:p.start,suggested:Number.isInteger(p.suggested)&&p.suggested>=1&&p.suggested<=100?p.suggested:p.start,at:Math.max(0,Number(p.at)||0),total,correct:Math.min(total,Math.max(0,Math.trunc(Number(p.correct)||0))),weak:Array.isArray(p.weak)?[...new Set(p.weak.filter(n=>Number.isInteger(n)&&n>=1&&n<=100))].slice(0,20):[],method:p.method==='stratified-15-v1'?p.method:'legacy',bandScores:Array.isArray(p.bandScores)?p.bandScores.slice(0,5).map(n=>Math.min(3,Math.max(0,Math.trunc(Number(n)||0)))):[]};
  }
  const record=raw.placementRecord;
  if(record && typeof record==='object' && Array.isArray(record.responses) && record.responses.length===15){
   const responses=record.responses.filter(r=>r&&Q.has(r.qid)&&Number.isInteger(r.choice)&&r.choice>=-1&&r.choice<=3&&Array.isArray(r.order)&&[...r.order].sort().join('')==='0123');
   if(responses.length===15 && new Set(responses.map(r=>r.qid)).size===15 && [0,1,2,3,4].every(t=>responses.filter(r=>Math.floor((Q.get(r.qid).level-1)/20)===t).length===3)){
    out.placementRecord={id:String(record.id||'saved-result').slice(0,100),at:Math.max(0,Number(record.at)||0),responses:responses.map(r=>({qid:r.qid,choice:r.choice,order:[...r.order]}))};
   }
  }
  if(Array.isArray(raw.placementSeen))out.placementSeen=[...new Set(raw.placementSeen.filter(id=>typeof id==='string'&&Q.has(id)))].slice(-1000);
  for(let i=1;i<=100;i++){const r=raw.practices?.[i];if(r&&typeof r==='object')out.practices[i]={verified:r.verified===true,at:Math.max(0,Number(r.at)||0),steps:[0,1,2].map(j=>r.steps?.[j]===true)};}
  return out;
 }
 const backupKey='arco.backup.before.2.3.4',resetKey='arco.reset.epoch.v1';
 let resetEpoch='';try{resetEpoch=localStorage.getItem(resetKey)||'';}catch(_){}
 let S=fresh(),saveWarning=false,loadedProgress=false;
 try {
  const candidates=[storageKey,'arco.learning.v1'];
  const snapshot={format:'arco-upgrade-backup-v1',at:new Date().toISOString(),records:{}};
  for(const key of [...candidates,'arco.duel.preferences.v230','arco.visual.preferences.v1']){
   const raw=localStorage.getItem(key);if(raw!==null)snapshot.records[key]=raw;
  }
  if(Object.keys(snapshot.records).length&&!localStorage.getItem(backupKey)){
   try{localStorage.setItem(backupKey,JSON.stringify(snapshot));}catch(e){saveWarning=true;}
  }
  for(const key of candidates){
   const raw=snapshot.records[key];if(!raw)continue;
   try{S=sanitize(JSON.parse(raw));loadedProgress=true;break;}catch(e){saveWarning=true;}
  }
 }catch(e){saveWarning=true;}

 let quiz=null,homeChapter=0,toastTimer,catalogFilter='all',catalogSearch='',catalogStatus='all',currentRoute='',lastAudioButton=null,pendingConfirmation=null;
 function notify(message){const w=$('#welcome');if(w?.open){let msg=w.querySelector('[data-welcome-status]');if(!msg){msg=document.createElement('p');msg.dataset.welcomeStatus='';msg.setAttribute('role','status');w.querySelector('.welcome-copy')?.append(msg);}msg.textContent=message;}const t=$('#toast');t.textContent=message;t.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('show'),4300);}
 function save(){try{const epoch=localStorage.getItem(resetKey)||'';if(epoch!==resetEpoch){resetEpoch=epoch;resetInMemory();return;}localStorage.setItem(storageKey,JSON.stringify(S));}catch(e){if(!saveWarning){notify('瀏覽器未允許儲存，請匯出進度備份。');saveWarning=true;}}updateHeader();}
 const scoreMap=()=>S.best;
 const hasStart=()=>Boolean(S.placement)||S.learningPath==='from-first';
 const placementStart=()=>S.placement?.start||1;
 const unlock=()=>{if(!hasStart())return 0;for(let n=placementStart();n<=100;n++)if((S.best[n]||0)<8)return n;return 100;};
 const accessible=id=>Number.isInteger(id)&&id>=1&&id<=100&&hasStart()&&id<=unlock();
 const placementOpen=id=>Boolean(S.placement)&&id<=placementStart();
 const recommended=()=>{if(!hasStart())return 1;for(let n=placementStart();n<=100;n++)if((scoreMap()[n]||0)<8)return n;return 100;};
 const lesson=id=>D.levels[Number(id)-1];
 const shuffle=values=>{const a=[...values];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
 function updateHeader(){
  const n=Object.keys(S.wrong).length;$('#wrong-count').textContent=n?String(n):'';
 }
 function placementGate(){
  setContent(`<section class="placement-intro release-gate"><div class="feature-mark">${icon('placement')}</div><h1>先找到起點，再一關一關往前。</h1><p>可透過 15 題程度測驗找起點，也能不測驗，從第 1 級學起。之後每關答對至少 8 / 10 題，才能解鎖下一關。</p><div class="studio-actions"><button class="btn" data-action="placement-start">開始 15 題測驗 ${icon('arrow')}</button><button class="btn secondary" data-action="start-from-first">不測驗，從第 1 級開始</button><button class="text-button" data-action="import">匯入舊進度</button><a class="text-button" href="#courses">查看課程路線</a></div><p class="hint">已有完整測驗紀錄的舊使用者，可接續進度，不用重測。</p></section>`);
 }

 function startFromFirst(){
  const proceed=()=>{window.ArcoPlacement?.leaveRoute(true);stopAudio();for(const id of ['welcome','settings']){const d=$('#'+id);if(d?.open)d.close();}S.learningPath=S.placement?'placement':'from-first';S.onboardingSeen=true;S.testMode=false;S.lastLevel=1;save();go('lesson/1');notify('已從第 1 級開始，每關答對 8 題解鎖下一關。');};
  if(window.ArcoPlacement?.active()){confirmAction({title:'從第 1 級開始？',message:'這次未完成的程度測驗不會計分。舊有成績與錯題仍會保留。',confirmText:'從第 1 級開始',onConfirm:proceed});}else proceed();
 }

 ArcoAudio.configure({settings:()=>S,notify,onStop:()=>{if(lastAudioButton&&lastAudioButton.isConnected){lastAudioButton.innerHTML=icon('play');lastAudioButton.setAttribute('aria-label','播放示範');}lastAudioButton=null;document.querySelectorAll('.piano .active').forEach(e=>e.classList.remove('active'));}});
 function stopAudio(){ArcoAudio.stop();}
 function setContent(html){main.innerHTML=html;main.dataset.screen=(location.hash.slice(1)||'home').split('/')[0];updateHeader();window.ArcoVisual?.refresh();}
 // Page-owned confirmation stays visible when the browser suppresses native confirm().
 function confirmAction({title,message,confirmText='確定離開',cancelText='繼續作答',onConfirm}){
  if(pendingConfirmation)return;
  const dialog=$('#leave-confirm'),returnFocus=document.activeElement;
  pendingConfirmation={onConfirm,returnFocus};
  stopAudio();
  dialog.innerHTML=`<div class="exit-dialog-mark" aria-hidden="true">${icon('back')}</div><div class="dialog-head"><h2 id="leave-title">${escape(title)}</h2></div><p id="leave-description">${escape(message)}</p><div class="exit-dialog-actions"><button type="button" class="btn secondary" data-action="exit-stay" autofocus>${escape(cancelText)}</button><button type="button" class="btn" data-action="exit-confirm">${escape(confirmText)} ${icon('arrow')}</button></div>`;
  dialog.showModal();
  dialog.querySelector('[data-action="exit-stay"]').focus({preventScroll:true});
 }
 function settleConfirmation(accepted){
  if(!pendingConfirmation)return;
  const pending=pendingConfirmation;pendingConfirmation=null;
  $('#leave-confirm').close();
  if(accepted)pending.onConfirm();
  else if(pending.returnFocus?.isConnected)pending.returnFocus.focus({preventScroll:true});
 }
 function routeLabel(route){
  if(route.startsWith('lesson/'))return '返回課程';
  if(route==='courses')return '返回課程列表';
  if(route==='review')return '返回錯題本';
  if(route==='home')return '返回練習室';
  return '離開測驗';
 }
 function guardNavigation(route){
  if(pendingConfirmation)return false;
  if(quiz&&!quiz.finished&&route!=='quiz'){
   const activeQuiz=quiz;
   confirmAction({title:activeQuiz.review?'離開這次複習？':'離開這次挑戰？',
    message:`已作答 ${activeQuiz.answers.length} / ${activeQuiz.questions.length} 題。離開後，這次未完成的挑戰不計成績；原有成績與已記錄的錯題都會保留。`,
    confirmText:routeLabel(route),onConfirm:()=>{if(quiz===activeQuiz)quiz=null;go(route);}});
   return false;
  }
  if(currentRoute==='placement'&&route!=='placement'&&window.ArcoPlacement?.active()){
   const run=ArcoPlacement.getRun();
   confirmAction({title:'離開程度測驗？',
    message:`已作答 ${run.responses.length} / ${run.questions.length} 題。未完成的測驗不會更改起點或已開放的課程；已看過的題目會保留，供下次抽題避重。`,
    confirmText:routeLabel(route),onConfirm:()=>{ArcoPlacement.leaveRoute(true);go(route);}});
   return false;
  }
if(currentRoute==='duel'&&route!=='duel'&&window.ArcoDuel?.active()){
   const r=ArcoDuel.getRoom();
   if(['syncing','preview','playing','reveal'].includes(r.status)){
    confirmAction({title:'離開這場對戰？',message:'離開會結束本局，不會改變課程進度。確認視窗開啟時，倒數仍會繼續。',confirmText:routeLabel(route),cancelText:'繼續對戰',onConfirm:()=>{ArcoDuel.leave(false);go(route);}});
    return false;
   }
  }  return true;
 }
 function restoreRouteHash(){
  const hash='#'+(currentRoute||'home');
  if(location.hash===hash)return;
  // A rejected hash/back navigation must not redraw or discard the current answer.
  try{history.replaceState(history.state,'',hash);}catch(e){location.hash=hash;}
 }
 function go(hash){
  const route=String(hash).replace(/^#/,'');
  if(route==='main'){main.focus();return;}
  if(!guardNavigation(route))return;
  const next='#'+route;if(location.hash===next)renderRoute();else location.hash=route;
 }
 function renderRoute(){
  const route=location.hash.slice(1)||'home';if(route==='main'){main.focus();return;}
  if(!guardNavigation(route)){restoreRouteHash();return;}
  if(currentRoute==='placement'&&route!=='placement'&&window.ArcoPlacement)ArcoPlacement.leaveRoute();
  if(currentRoute.startsWith('duel')&&!route.startsWith('duel')&&window.ArcoDuel)window.ArcoDuel.leave(false);
  stopAudio();currentRoute=route;
  document.querySelectorAll('[data-nav]').forEach(el=>{const active=el.dataset.nav===(route.startsWith('lesson')||route==='quiz'||route==='result'?'courses':route.split('/')[0]);el.classList.toggle('active',active);if(active)el.setAttribute('aria-current','page');else el.removeAttribute('aria-current');});
  if(route==='home')renderHome();
  else if(route==='courses')renderCatalog();
  else if(/^lesson\/\d+$/.test(route))renderLesson(Number(route.split('/')[1]));
  else if(route==='quiz'&&quiz&&!quiz.finished)renderQuiz();
  else if(route==='result'&&quiz?.finished)renderResult();
  else if(route==='review'){if(hasStart())renderReview();else placementGate();}
  else if(route==='placement'){if(window.ArcoPlacement)ArcoPlacement.render();else setTimeout(()=>window.ArcoPlacement?.render(),0);}
  else if(route==='duel'){if(window.ArcoDuel)ArcoDuel.render();else setTimeout(()=>window.ArcoDuel?.render(),0);}
  else{location.replace('#home');return;}
  window.scrollTo({top:0,behavior:'instant'});main.focus({preventScroll:true});
 }
 function piano(){
  const naturals=[['C',60],['D',62],['E',64],['F',65],['G',67],['A',69],['B',71],['C',72]];
  return `<div class="instrument" aria-label="可試彈的鋼琴"><div class="instrument-top"><div class="instrument-title">${icon('music')}<span>先聽聽看</span></div><button class="text-button" data-action="home-demo">播放 C 大調</button></div><div class="instrument-note"><span class="note-name" id="piano-note">C</span><span class="note-detail" id="piano-detail">中央 C · C4</span></div><div class="piano">${naturals.map(([name,m])=>`<button class="white-key" data-action="piano" data-midi="${m}" aria-label="彈奏 ${name}${m===72?'5':'4'}">${name}</button>`).join('')}${[[12.5,61,'C♯'],[25,63,'D♯'],[50,66,'F♯'],[62.5,68,'G♯'],[75,70,'A♯']].map(([left,m,n])=>`<button class="black-key" style="left:${left}%" data-action="piano" data-midi="${m}" aria-label="彈奏 ${n}4"></button>`).join('')}</div><div class="instrument-bottom"><span>點選琴鍵，聽見音與音的距離。</span><span class="key-tag">C major</span></div></div>`;
 }
 function markKey(notes){document.querySelectorAll('.piano .active').forEach(e=>e.classList.remove('active'));notes.forEach(m=>{const k=$(`[data-midi="${m}"]`);if(k)k.classList.add('active');});const m=notes[0];if($('#piano-note')){$('#piano-note').textContent=['C','C♯','D','E♭','E','F','F♯','G','A♭','A','B♭','B'][m%12];$('#piano-detail').textContent=`${m===60?'中央 C · ':''}${$('#piano-note').textContent}${Math.floor(m/12)-1}`;}}
 function chapterArt(chapter){return [0,8].includes(chapter)?'score':chapter>=6?'city':'piano';}
 function chapterIcon(chapter){return ['book','metronome','headphones','piano','layers','music','layers','piano','music','placement'][chapter]||'music';}
 function chapterFeature(index){const c=D.chapters[index],levels=D.levels.filter(l=>l.chapter===index),open=levels.filter(l=>accessible(l.id)).length;return `<div class="chapter-feature" id="chapter-feature"><img src="${ArcoVisual.art.piano}" alt="" loading="lazy" width="2172" height="724"><div class="chapter-feature-copy"><span class="chapter-range">${String(index*10+1).padStart(2,'0')}–${(index+1)*10} 級</span><h3>${escape(c.title)}</h3><p>${escape(c.description)}</p></div><span class="chapter-access">${open} / 10 課可直接進入</span></div>`;}
 function courseCard(l){
  const val=scoreMap()[l.id],passed=val>=8,locked=!accessible(l.id),isNext=hasStart()&&l.id===recommended();
  const status=locked?'未解鎖':passed?'已通過':isNext?'目前關卡':placementOpen(l.id)?'可複習':'可開始';
  return `<button class="course ${passed?'passed':''} ${locked?'locked':''} ${isNext?'current':''}" data-action="lesson" data-id="${l.id}" aria-label="第 ${l.id} 級 ${escape(l.title)}，${status}"><div class="course-top"><span class="level-number">${String(l.id).padStart(2,'0')}</span><span class="course-status">${locked?icon('lock'):passed?icon('check'):''}${status}</span></div><h3>${escape(l.title)}</h3><p class="course-english">${escape(l.english)}</p><div class="course-bottom"><span>${val!==undefined?`最佳 ${val} / 10`:placementOpen(l.id)?'可直接進入':'10 題練習'}</span><span class="course-go">${icon(locked?'lock':passed?'check':'arrow')}</span></div>${val!==undefined?`<div class="course-meter" aria-hidden="true"><span style="transform:scaleX(${val/10})"></span></div>`:''}</button>`;
 }
 function renderHome(){
  const ready=hasStart(),id=recommended(),l=lesson(id),passed=Object.values(scoreMap()).filter(v=>v>=8).length;
  const attempts=S.attempts.filter(a=>!a.test),total=attempts.length*10,correct=attempts.reduce((s,a)=>s+a.score,0),practices=Object.values(S.practices||{}).filter(p=>p.verified).length;
  homeChapter=Math.floor((id-1)/10);
  setContent(`<section class="hero visual-hero"><div class="hero-copy"><div class="hero-signature">${brandMark()}<span>ARCO <small>樂理練習室</small></span></div><h1>從樂理，<br>走向真正的音樂。</h1><p class="intro">先聽、再練，把樂理帶進演奏。</p><div class="hero-actions"><button class="btn" data-action="${ready?'lesson':'placement-start'}" data-id="${id}">${ready?'繼續第 '+id+' 級':'開始 15 題程度測驗'} ${icon('arrow')}</button>${!ready?'<button class="btn secondary" data-action="start-from-first">從第 1 級開始</button>':'<a class="text-button" href="#courses">查看學習路線</a>'}</div><div class="hero-rules"><span>100 級系統課程</span><i></i><span>每關 10 題</span><i></i><span>8 題答對晉級</span></div></div><div class="hero-scene brandkit-scene"><div class="scene-frame"><img class="scene-image" src="${ArcoVisual.art.piano}" alt="BRANDKIT 音樂琴房主視覺：平台鋼琴、樂譜與弦樂樂器" width="2172" height="724" fetchpriority="high"></div><div class="scene-details"><figure><img src="${ArcoVisual.art.score}" alt="鋼琴譜架上的樂譜與琴鍵" width="440" height="440"><figcaption><span class="caption-line">讓觀念，</span><span class="caption-line">成為聽得懂的音樂。</span></figcaption></figure><figure><img src="${ArcoVisual.art.city}" alt="琴房裡的大提琴" width="600" height="600"><figcaption><span class="caption-line">學完一點，</span><span class="caption-line">就試著演奏。</span></figcaption></figure></div>${ArcoVisual.staff()}<div class="scene-label"><span class="scene-rule"></span>把樂理，帶進演奏。</div></div></section>
  <section class="release-journey" aria-label="正式學習流程"><div><span>01</span><strong>${S.placement?'15 題找起點':ready?'從第 1 級起步':'選擇你的起點'}</strong><small>${S.placement?'已完成程度測驗':ready?'基礎路線，逐關解鎖':'先測驗，或直接從第 1 級開始'}</small></div><div><span>02</span><strong>${ready?'目前第 '+id+' 級':'依結果安排起點'}</strong><small>${ready?escape(l.title):'先理解，再動手練習'}</small></div><div><span>03</span><strong>8 / 10 解鎖下一關</strong><small>已開放的課程可隨時複習</small></div></section>
  <section class="home-actions"><div class="placement-banner"><div class="action-symbol">${icon('book')}</div><div><span class="subtle-label">${ready?'接著上次的進度':'第一步'}</span><h2>${ready?'第 '+id+' 級：'+escape(l.title):'找起點，或從基礎開始。'}</h2><p>${ready?'通過這關後，繼續解鎖下一個觀念。':'不限時。不熟悉的觀念可選「還不熟悉」，不必猜答案。'}</p><button class="text-button" data-action="${ready?'lesson':'placement-start'}" data-id="${id}">${ready?'繼續學習':'開始測驗'} ${icon('arrow')}</button></div></div><a class="home-game-entry" href="#duel"><div class="action-symbol">${icon('users')}</div><div><span class="subtle-label">附加練習</span><h2>雙人對戰與 AI 陪練</h2><p>和朋友比一場，或自己挑選題庫練習。</p><span class="entry-link">進入對戰大廳 ${icon('arrow')}</span></div></a></section>
  <section class="progress-strip" aria-label="學習進度"><div class="stat"><span class="stat-label">實際通過關卡</span><div class="stat-value">${passed}<span>/ 100 級</span></div><div class="tiny-progress" aria-hidden="true"><div style="width:${passed}%"></div></div></div><div class="stat"><span class="stat-label">近期完成作答</span><div class="stat-value">${total}<span>題</span></div></div><div class="stat"><span class="stat-label">${total?'近期答對率':'學習步調'}</span><div class="stat-value">${total?Math.round(correct/total*100)+'%':'不限時'}<span>${total?'依已完成練習':'先理解，再作答'}</span></div></div><div class="stat"><span class="stat-label">已核對互動實作</span><div class="stat-value">${practices}<span>/ 100 個</span></div></div></section>
  <section class="home-path"><div class="section-heading"><div><h2>你的學習路線</h2><p>已開放的課程可隨時複習。</p></div><a class="text-button" href="#courses">全部課程 ${icon('arrow')}</a></div><div class="chapter-tabs" role="group" aria-label="檢視課程階段">${D.chapters.map(c=>`<button class="chapter-tab ${homeChapter===c.id?'active':''}" data-action="chapter" data-id="${c.id}" aria-pressed="${homeChapter===c.id}"><span>${String(c.id+1).padStart(2,'0')}</span>${escape(c.title)}</button>`).join('')}</div>${chapterFeature(homeChapter)}<div class="course-grid" id="home-courses">${D.levels.slice(homeChapter*10,homeChapter*10+10).map(courseCard).join('')}</div></section>
  <section class="home-instrument"><div class="instrument-copy"><span class="action-symbol">${icon('piano')}</span><h2>先彈幾個音，<br>聽聽它們的距離。</h2><p>點選琴鍵，或播放示範。</p><span class="small-note">點擊後才會發聲，音量可在設定調整。</span></div>${piano()}</section>`);
 }

 function renderCatalog(){setContent(`<div class="page-head catalog-head"><div><h1>100 級，慢慢練成你的。</h1><p>每級一個樂理觀念，10 題練習，答對 8 題晉級。</p></div><span class="badge ">${hasStart()?'目前關卡：第 '+unlock()+' 級':'測驗找起點，或從第 1 級開始'}</span></div>${!hasStart()?`<div class="release-notice"><p>可先測驗找到起點，也能不測驗，直接從第 1 級學起。之後每關答對 8 題晉級。</p><button class="btn" data-action="placement-start">開始 15 題測驗 ${icon('arrow')}</button><button class="btn secondary" data-action="start-from-first">從第 1 級開始</button></div>`:''}<div class="toolbar"><div class="search-box">${icon('search')}<input id="course-search" type="search" value="${escape(catalogSearch)}" placeholder="搜尋主題或級數，例如：和弦、72" aria-label="搜尋課程"></div><select id="chapter-filter" aria-label="篩選課程階段"><option value="all">全部階段</option>${D.chapters.map(c=>`<option value="${c.id}" ${String(c.id)===catalogFilter?'selected':''}>${String(c.id+1).padStart(2,'0')} ${escape(c.title)}</option>`).join('')}</select><select id="status-filter" aria-label="篩選學習狀態"><option value="all">全部狀態</option><option value="passed" ${catalogStatus==='passed'?'selected':''}>已通過</option><option value="unpassed" ${catalogStatus==='unpassed'?'selected':''}>尚未通過</option><option value="open" ${catalogStatus==='open'?'selected':''}>可直接進入</option><option value="placement" ${catalogStatus==='placement'?'selected':''}>測驗開放</option></select><span class="result-count" id="catalog-count"></span></div><div id="catalog-results"></div>`);updateCatalog();}
 function updateCatalog(){const term=catalogSearch.trim().toLowerCase();let count=0;let html='';for(const c of D.chapters){if(catalogFilter!=='all'&&String(c.id)!==catalogFilter)continue;const levels=D.levels.filter(l=>l.chapter===c.id&&(!term||(String(l.id)===term||`${l.title} ${l.english} ${window.ArcoI18n?.t(l.title)||''}`.toLowerCase().includes(term)))&&(catalogStatus==='all'||(catalogStatus==='open'?accessible(l.id):catalogStatus==='placement'?placementOpen(l.id):catalogStatus==='passed'?(scoreMap()[l.id]||0)>=8:(scoreMap()[l.id]||0)<8)));if(!levels.length)continue;count+=levels.length;html+=`<section class="catalog-section"><div class="catalog-section-head"><span class="chapter-num">${String(c.id+1).padStart(2,'0')}</span><div><h2>${escape(c.title)}</h2><p>${escape(c.description)}</p></div></div><div class="course-grid">${levels.map(courseCard).join('')}</div></section>`;}$('#catalog-count').textContent=`${count} 個課程`;$('#catalog-results').innerHTML=html||`<div class="empty-state">${icon('search')}<h2>還沒有符合的課程</h2><p>試著縮短關鍵字，或將階段與狀態改成全部。</p><button class="btn secondary" data-action="clear-search">清除篩選</button></div>`;}
 function staffView(s){if(!s)return '';const y=110-s.step*7,ledger=[];for(let i=-2;i>=s.step;i-=2)ledger.push(i);for(let i=10;i<=s.step;i+=2)ledger.push(i);const up=s.step<4;return `<svg viewBox="0 0 280 155" class="staff" role="img" aria-label="${s.clef==='bass'?'低':'高'}音譜表，音符位於自最下方線起算第 ${s.step} 個半線距"><title>請依音符在五線譜的位置讀出音名</title>${[0,2,4,6,8].map(i=>`<path d="M22 ${110-i*7}H258"/>`).join('')}<text x="33" y="${s.clef==='bass'?100:110}" font-size="${s.clef==='bass'?68:82}">${s.clef==='bass'?'𝄢':'𝄞'}</text>${ledger.map(i=>`<path d="M132 ${110-i*7}h36"/>`).join('')}<ellipse cx="150" cy="${y}" rx="9" ry="6" transform="rotate(-18 150 ${y})"/><path d="M${up?158:142} ${y}v${up?-36:36}" stroke-width="1.8"/></svg>`;}
 const sourceLink=(url,label)=>`<a class="source-link" href="${escape(url)}" target="_blank" rel="noopener noreferrer">${escape(label)} ${icon('external')}</a>`;
 function audioCard(demo,kind='lesson',id=''){return `<div class="audio-card"><div class="audio-head"><button class="play-button" data-action="play-audio" data-kind="${kind}" data-id="${escape(id)}" aria-label="播放示範">${icon('play')}</button><strong>聽聽這個例子</strong></div><p>${escape(demo.label)}</p><p class="audio-note">合成示範</p></div>`;}
function lessonExplanation(text){
  const split=text.indexOf('。');
  if(split<0||split===text.length-1)return `<p>${escape(text)}</p>`;
  return `<p class="concept-lead">${escape(text.slice(0,split+1))}</p><p>${escape(text.slice(split+1))}</p>`;
 }
 function lessonStep(number,title,id){return `<div class="lesson-section-heading"><span class="lesson-step" aria-hidden="true">${number}</span><h2${id?` id="${id}"`:''}>${title}</h2></div>`;}
 function renderLesson(id){
  const l=lesson(id);
  if(!l){go('courses');return;}
  if(!hasStart()){placementGate();return;}
  if(!accessible(id)){
   setContent(`<div class="empty-state">${icon('lock')}<h1>這一級還沒解鎖</h1><p>請先完成目前的第 ${unlock()} 級，答對至少 8 題後解鎖下一關。</p><button class="btn" data-action="lesson" data-id="${unlock()}">前往第 ${unlock()} 級</button><a class="text-button" href="#courses">返回課程路線</a></div>`);return;
  }
  S.lastLevel=id;S.visited[id]=true;save();
  const c=D.chapters[l.chapter],m=l.mission,p=S.practices?.[id],skipped=placementOpen(id)&&(S.best[id]||0)<8;
  setContent(`<div class="lesson-page">
   <div class="breadcrumb"><a href="#courses">${icon('back')}所有課程</a><span>/</span><span>${escape(c.title)}</span><span>/</span><span>第 ${id} 級</span></div>
   <header class="lesson-heading chapter-${l.chapter}" data-art="${chapterArt(l.chapter)}">
    <div class="lesson-title-row"><div><h1><span class="lesson-title-number">${String(id).padStart(2,'0')}</span>${escape(l.title)}</h1><p class="english">${escape(l.english)}</p></div><span class="badge ">${id===recommended()?'目前關卡':skipped?'測驗開放 · 可複習':'正式闖關'}</span></div>
    <div class="lesson-purpose">${icon('flag')}<div><span>學完這課，你可以</span><strong>${escape(m.goal)}</strong><p>應用情境：${escape(m.scene)}</p></div></div>
   </header>
   <nav class="lesson-tabs lesson-roadmap" aria-label="本課閱讀順序">
    ${[['01','理解觀念','lesson-read'],['02','動手練習','lesson-practice'],['03','帶進演奏','lesson-mission'],['04','開始挑戰','lesson-challenge']].map(([n,t,d])=>`<button type="button" data-action="lesson-anchor" data-target="${d}"><span aria-hidden="true">${n}</span><strong>${t}</strong>${icon('arrow')}</button>`).join('')}
   </nav>
   <div class="lesson-layout">
    <article class="lesson-body" aria-label="第 ${id} 級教材">
     <section id="lesson-read" class="lesson-section" tabindex="-1" aria-labelledby="lesson-read-title">
      ${lessonStep('01','理解觀念','lesson-read-title')}
      <div class="lesson-keypoint"><h3>本課重點</h3><p>${escape(l.summary)}</p></div>
      <div class="concept-stack">${l.understand.map(t=>`<div class="concept-explanation">${lessonExplanation(t)}</div>`).join('')}</div>
      <div class="worked-example"><h3>看一個實際例子</h3><p>${escape(l.worked)}</p></div>
      <details class="foundation-example"><summary>基礎例題與解析<span class="details-indicator" aria-hidden="true">+</span></summary><div class="foundation-content">${l.questions[0].staff?staffView(l.questions[0].staff):''}${l.questions[0].audio?`<button class="text-button" data-action="play-audio" data-kind="example" data-id="${id}">${icon('play')}播放例題</button>`:''}<p class="foundation-question">${escape(l.example.prompt)}</p><div class="foundation-answer"><span>答案</span><strong>${escape(l.example.answer)}</strong></div><p>${escape(l.example.explanation)}</p></div></details>
      <div class="pitfall"><h3>容易混淆的地方</h3><p>${escape(l.trap)}</p></div>
      ${audioCard(l.demo,'lesson',id)}
      <div class="lesson-section-end"><button class="text-button" data-action="lesson-anchor" data-target="lesson-practice">接著動手練習 ${icon('arrow')}</button></div>
     </section>
     <section id="lesson-practice" class="lesson-section practice-stage" tabindex="-1" aria-labelledby="lesson-practice-title">
      ${lessonStep('02','動手練習','lesson-practice-title')}
      <p class="section-intro">先照題目操作，再核對答案。需要時可以重聽、重做。</p>
      <div id="practice-studio" class="practice-studio" aria-label="互動實作"></div>
      <div class="lesson-section-end"><button class="text-button" data-action="lesson-anchor" data-target="lesson-mission">把練習帶進演奏 ${icon('arrow')}</button></div>
     </section>
     <section id="lesson-mission" class="lesson-section lesson-mission" tabindex="-1" aria-labelledby="lesson-mission-title">
      ${lessonStep('03','帶進演奏','lesson-mission-title')}
      <h3 class="mission-scene">${escape(m.scene)}</h3><p class="mission-goal">${escape(m.goal)}</p>
      <ol class="mission-steps">${m.steps.map((t,i)=>`<li><label><input type="checkbox" data-practice-step="${i}" ${p?.steps?.[i]?'checked':''}><span><small>步驟 ${i+1}</small>${escape(t)}</span></label></li>`).join('')}</ol>
      <div class="success-standard"><strong>做到這樣，就有掌握</strong><p>${escape(m.check)}</p></div>
      <p class="studio-limit">勾選記錄自我練習，不錄音或自動評分。</p>
      <div class="lesson-section-end"><button class="text-button" data-action="lesson-anchor" data-target="lesson-challenge">準備好，前往挑戰 ${icon('arrow')}</button></div>
     </section>
     <section class="lesson-extras" aria-label="延伸閱讀">
      <details class="lesson-extra trivia"><summary>${icon('music')}冷知識<span class="details-indicator" aria-hidden="true">+</span></summary><div class="extra-content"><p>${escape(l.trivia)}</p></div></details>
      <details class="lesson-extra"><summary>${icon('book')}延伸教材與影音<span class="details-indicator" aria-hidden="true">+</span></summary><div class="extra-content"><div class="source-links">${l.sources.map(k=>sourceLink(D.sources[k].url,D.sources[k].title+'（'+D.sources[k].kind+'）')).join('')}${sourceLink('https://www.youtube.com/results?search_query='+encodeURIComponent(l.videoQuery),'搜尋這一課的教學影片')}</div><p class="sources-note">外部教材需連網；影片為主題搜尋結果。</p></div></details>
     </section>
    </article>
    <div class="lesson-sidebar"><div class="lesson-cover" aria-hidden="true"><img src="${ArcoVisual.art[chapterArt(l.chapter)]}" alt="" width="2172" height="724"><div class="lesson-cover-caption">${brandMark()}<span>${String(id).padStart(2,'0')}<small>${escape(c.english)}</small></span></div></div>
     <aside id="lesson-challenge" class="lesson-aside" tabindex="-1" aria-labelledby="lesson-challenge-title">
      ${lessonStep('04','開始挑戰','lesson-challenge-title')}
      <p class="challenge-intro">理解後，用 10 題確認自己。</p>
      <div class="challenge-metrics"><div><strong>10<span> 題</span></strong><span>每級題數</span></div><div><strong>8<span> 題</span></strong><span>答對即可過關</span></div></div>
      <div class="aside-stat"><span>作答時間</span><strong>不限時</strong></div><div class="aside-stat"><span>最佳成績</span><strong>${scoreMap()[id]!==undefined?scoreMap()[id]+' / 10':'還沒挑戰'}</strong></div>
      <button class="btn light" data-action="start-quiz" data-id="${id}">開始 10 題挑戰 ${icon('arrow')}</button>
      <p class="challenge-note">${skipped?'測驗已開放本課，可隨時複習。':'答錯可以回教材找原因，再重新挑戰。'}</p>
      <details class="challenge-details"><summary>10 題怎麼安排<span class="details-indicator" aria-hidden="true">+</span></summary><div class="question-ladder"><span>01–02　觀念確認</span><span>03–06　推算與辨讀</span><span>07–08　情境應用</span><span>09–10　分析與整合</span></div><p>後段會要求判斷聲部、節奏或編配情境。</p></details>
      <button class="text-button aside-practice" data-action="lesson-anchor" data-target="lesson-practice">先做互動實作</button>
     </aside>
     ${id<100?`<div class="aside-next"><span>下一級</span><button data-action="lesson" data-id="${id+1}">${String(id+1).padStart(2,'0')} ${escape(lesson(id+1).title)} ${icon(accessible(id+1)?'arrow':'lock')}<span class="sr-only">${accessible(id+1)?'可直接進入':'未解鎖'}</span></button></div>`:''}
     <a class="text-button all-courses-link" href="#courses">${icon('back')}返回所有課程</a>
    </div>
   </div>
  </div>`);
  if(window.ArcoPractice)ArcoPractice.mount(l);else setTimeout(()=>window.ArcoPractice?.mount(l),0);
 }
 function startQuiz(id,review=false){if(!hasStart()){go('placement');return;}stopAudio();let items;if(review){items=shuffle(Object.keys(S.wrong)).slice(0,10).map(k=>Q.get(k));if(!items.length){notify('目前沒有待複習的錯題。');return;}}else{if(!accessible(id)){notify('請先通過目前關卡，再解鎖下一級。');return;}items=lesson(id).questions.map(q=>Q.get(q.id));}
  quiz={level:id,review,test:false,index:0,questions:items.map(q=>({...q,order:shuffle([0,1,2,3])})),answers:[],finished:false,committed:false};go('quiz');
 }
 function questionMarkup(q,answered=null){const answeredFlag=answered!==null;return `<h1 id="question-heading">${escape(q.prompt)}</h1>${q.staff?staffView(q.staff):''}${q.audio?audioCard(q.audio,'question',q.id):''}<div class="options" role="group" aria-label="答案選項">${q.order.map((original,j)=>`<button class="option ${answeredFlag?(original===q.correct?'correct':original===answered?'wrong':'dim'):''}" data-action="answer" data-choice="${original}" ${answeredFlag?'disabled':''}><span class="letter">${'ABCD'[j]}</span><span class="option-copy">${escape(q.options[original])}</span>${answeredFlag&&original===q.correct?icon('check'):answeredFlag&&original===answered?icon('close'):''}</button>`).join('')}</div>`;}
 function renderQuiz(){if(!quiz)return;const q=quiz.questions[quiz.index],a=quiz.answers[quiz.index],done=a!==undefined;const correct=quiz.answers.filter(x=>x.correct).length;
  setContent(`<div class="quiz-wrap"><div class="quiz-top"><button class="text-button" data-action="leave-quiz">${icon('back')}${quiz.review?'返回錯題本':'返回課程'}</button><div class="quiz-meta"><b>${quiz.review?'錯題複習':'第 '+quiz.level+' 級 · '+escape(lesson(quiz.level).title)}</b><br>${quiz.review?'複習不影響過關':'正式闖關'} · 不限時</div></div><div class="question-progress" aria-label="已作答 ${quiz.answers.length} 題，共 ${quiz.questions.length} 題" style="grid-template-columns:repeat(${quiz.questions.length},1fr)">${quiz.questions.map((_,i)=>`<i class="${quiz.answers[i]?(quiz.answers[i].correct?'right':'wrong'):i===quiz.index?'current':''}"></i>`).join('')}</div><article class="quiz-card"><div class="question-label"><span>第 ${quiz.index+1} 題 / ${quiz.questions.length}</span><span>已答對 ${correct} 題</span></div><div class="question-phase">${escape(q.phase||'觀念練習')}</div>${questionMarkup(q,done?a.choice:null)}${done?`<div class="answer-feedback ${a.correct?'':'bad'}" tabindex="-1" role="status"><strong>${a.correct?'答對了。':'這題先記下來。'}</strong><p>${!a.correct?'正確答案：'+escape(q.options[q.correct])+'。 ':''}${escape(q.explanation)}</p></div>`:''}<div class="quiz-bottom"><p class="hint">${done?'':'鍵盤 1–4 作答'}</p>${done?`<button class="btn" data-action="next-question">${quiz.index===quiz.questions.length-1?'查看結果':'下一題'} ${icon('arrow')}</button>`:''}</div></article></div>`);
  if(done)$('[data-action="next-question"]')?.focus({preventScroll:true});
 }
 function answer(choice){if(!quiz||quiz.finished||quiz.answers[quiz.index]!==undefined||!Number.isInteger(choice)||choice<0||choice>3)return;const q=quiz.questions[quiz.index],correct=choice===q.correct;quiz.answers.push({choice,correct});if(!correct){const prev=S.wrong[q.id];S.wrong[q.id]={misses:(prev?.misses||0)+1,last:Date.now()};}else if(quiz.review)delete S.wrong[q.id];save();stopAudio();ArcoAudio.effect(correct);renderQuiz();}
 function nextQuestion(){if(!quiz||!quiz.answers[quiz.index])return;stopAudio();if(quiz.index<quiz.questions.length-1){quiz.index++;renderQuiz();$('#question-heading')?.scrollIntoView({block:'nearest'});}else{finishQuiz();go('result');}}
 function finishQuiz(){if(!quiz||quiz.committed||quiz.answers.length!==quiz.questions.length)return;quiz.finished=true;quiz.committed=true;const score=quiz.answers.filter(a=>a.correct).length;quiz.score=score;if(!quiz.review){const bucket='best';S[bucket][quiz.level]=Math.max(score,S[bucket][quiz.level]||0);S.attempts.push({level:quiz.level,score,test:quiz.test,at:Date.now()});S.attempts=S.attempts.slice(-300);}save();}
 function answerReview(q,a,i){return `<details class="answer-item ${a.correct?'':'bad'}" ${a.correct?'':'open'}><summary><span class="answer-status">${a.correct?'答對':'再練'}</span><span>${i+1}. ${escape(q.prompt)}</span></summary><div class="answer-detail"><p>正確答案：${escape(q.options[q.correct])}</p>${!a.correct?`<p class="muted">你的答案：${escape(q.options[a.choice]??'未作答')}</p>`:''}<p class="muted">${escape(q.explanation)}</p></div></details>`;}
 function renderResult(){if(!quiz)return;const passed=quiz.score>=8,title=quiz.review?'再練一次，就更清楚。':passed?'這一級，通過了。':'再練一次，就會更熟。';
  let description=quiz.review?`已複習 ${quiz.questions.length} 題，答對的題目已從錯題本移除。`:passed?(quiz.level===100?'你已完成這一級的全部練習。':'第 '+(quiz.level+1)+' 級已解鎖。準備好再繼續。'):`答對 ${quiz.score} 題，還差 ${8-quiz.score} 題到達過關門檻。看一下原因，再挑戰一次。`;
  setContent(`<div class="quiz-wrap"><a class="text-button" href="${quiz.review?'#review':'#lesson/'+quiz.level}">${icon('back')}${quiz.review?'返回錯題本':'返回課程'}</a><section class="result-hero"><div class="score-circle"><strong>${quiz.score}</strong><span>/ ${quiz.questions.length} 題答對</span></div><div><h1>${title}</h1><p>${description}</p><div class="result-actions">${!quiz.review&&passed&&quiz.level<100?`<button class="btn light" data-action="lesson" data-id="${quiz.level+1}">前往第 ${quiz.level+1} 級 ${icon('arrow')}</button>`:''}<button class="btn light" data-action="${quiz.review?'review-quiz':'start-quiz'}" data-id="${quiz.level}">${quiz.review?'繼續複習':'再練這一級'}</button><a class="btn light" href="#courses">查看課程路線</a></div></div></section><div class="section-heading"><div><h2>作答回顧</h2><p>展開查看解析。</p></div><a class="text-button" href="#review">錯題本 ${icon('arrow')}</a></div><div class="answer-list">${quiz.questions.map((q,i)=>answerReview(q,quiz.answers[i],i)).join('')}</div></div>`);
 }
 function renderReview(){const ids=Object.keys(S.wrong).sort((a,b)=>S.wrong[b].last-S.wrong[a].last);setContent(`<div class="page-head"><div><h1>錯題本</h1><p>${ids.length?`${ids.length} 題待複習。不限時，也不影響闖關成績。`:'答錯的題目會自動留在這裡。'}</p></div>${ids.length?`<button class="btn" data-action="review-quiz">複習 ${Math.min(10,ids.length)} 題 ${icon('arrow')}</button>`:''}</div>${!ids.length?`<div class="empty-state">${icon('book')}<h2>目前沒有待複習的題目</h2><p>課程答錯的題目會自動收錄。</p><a class="btn" href="#courses">去看看課程 ${icon('arrow')}</a></div>`:`<div class="answer-list">${ids.map(id=>{const q=Q.get(id),l=lesson(q.level);return `<article class="answer-item review-row"><div class="review-row-head"><span>第 ${q.level} 級 · ${escape(l.title)}</span><span>／答錯 ${S.wrong[id].misses} 次</span></div><h3>${escape(q.prompt)}</h3>${q.staff?staffView(q.staff):''}<p class="correct-answer">正確答案：${escape(q.options[q.correct])}</p><p>${escape(q.explanation)}</p><div class="review-actions"><button class="text-button" data-action="lesson" data-id="${q.level}">回到這一課 ${icon('arrow')}</button>${q.audio?`<button class="text-button" data-action="play-audio" data-kind="review" data-id="${id}">${icon('play')}重聽音程</button>`:''}<button class="text-button" data-action="mastered" data-id="${id}">${icon('check')}已經弄懂，移出錯題本</button></div></article>`;}).join('')}</div>`}`);}
 function openSettings(){
  const dialog=$('#settings');dialog.innerHTML=`<div class="dialog-head"><h2 id="settings-title">設定</h2><button class="icon-button" data-action="close-dialog" aria-label="關閉設定">${icon('close')}</button></div><div class="setting-row"><div><h3>正式學習路線</h3><p>${S.placement?'測驗起點：第 '+S.placement.start+' 級。目前繼續第 '+recommended()+' 級。':S.learningPath==='from-first'?'從第 1 級起步，目前繼續第 '+recommended()+' 級。':'可先測驗，或從第 1 級開始。'}每關答對 8 / 10 題，依序解鎖下一關。</p>${!S.placement?`<button class="text-button" data-action="placement-start">${S.placementRecord?'查看測驗結果':'開始 15 題測驗'}</button>`:''}</div></div><div class="setting-row"><div><h3>試聽音量</h3><p>控制琴鍵、教學音檔與答題音效。</p></div><input id="setting-volume" type="range" min="0" max="75" value="${Math.round(S.volume*100)}" aria-label="試聽音量"></div><div class="setting-row"><div><h3>答題音效</h3><p>關閉後，教學試聽仍可正常播放。</p></div><label class="switch"><input id="setting-sfx" type="checkbox" ${S.sfx?'checked':''} aria-label="答題音效"><span></span></label></div><div class="setting-row"><div><h3>進度保存在這個瀏覽器</h3><p>更新沿用舊存檔。換裝置或網址前請先匯出進度；目前沒有雲端同步。</p></div></div><div class="settings-buttons"><button class="btn secondary" data-action="export">${icon('download')}匯出進度</button><button class="btn secondary" data-action="import">${icon('upload')}匯入進度</button></div><section class="factory-reset-section" aria-labelledby="factory-reset-title"><div><h3 id="factory-reset-title">恢復原廠設定</h3><p>清除本機學習紀錄與偏好，回到首次使用。</p></div><button class="btn secondary danger-button" data-action="factory-reset">初始化</button></section>`;if(!dialog.open)dialog.showModal();
 }


 function resetInMemory(){
  window.ArcoI18n?.reset();window.ArcoDuel?.resetPreferences();window.ArcoPlacement?.leaveRoute(true);window.ArcoPractice?.reset();stopAudio();
  S=fresh();quiz=null;loadedProgress=false;homeChapter=0;catalogFilter='all';catalogSearch='';catalogStatus='all';currentRoute='';
  clearTimeout(toastTimer);$('#toast').classList.remove('show');$('#import-file').value='';pendingConfirmation=null;
  document.querySelectorAll('dialog[open]').forEach(d=>d.close());window.ArcoVisual?.resetPreferences();
  try{history.replaceState(history.state,'','#home');}catch(_){location.hash='home';}
  renderRoute();setTimeout(()=>window.ArcoPlacement?.welcome(),0);
 }
 function factoryReset(){
  try{
   const epoch=String(Date.now())+'-'+crypto.getRandomValues(new Uint32Array(1))[0];
   localStorage.setItem(resetKey,epoch);resetEpoch=epoch;
   const keys=[];for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i);if(/^arco\.(?:learning\.|backup\.before\.|duel\.preferences\.|visual\.preferences\.|locale\.|tutorial\.)/.test(key||''))keys.push(key);}
   keys.forEach(key=>localStorage.removeItem(key));
   localStorage.setItem(storageKey,JSON.stringify(fresh()));resetInMemory();
  }catch(_){notify('初始化未完成；瀏覽器未允許更改儲存資料。請先匯出備份再試。');}
 }
 window.addEventListener('storage',e=>{
  if(e.key!==resetKey||!e.newValue||e.newValue===resetEpoch)return;
  resetEpoch=e.newValue;resetInMemory();
 });

 function closeDialog(){$('#settings').close();}
 function about(){const d=$('#settings');d.innerHTML=`<div class="dialog-head"><h2 id="settings-title">關於 ARCO</h2><button class="icon-button" data-action="close-dialog" aria-label="關閉說明">${icon('close')}</button></div><div class="about-body"><p>ARCO。100 級課程、1,000 題課程挑戰、3,000 題對戰題庫。</p><p>課程為自編學習路線，不對應官方檢定。實作核對輸入內容，不錄音或自動評分演奏。</p><h3>教材與影音</h3>${['mt','omt','ableton'].map(k=>sourceLink(D.sources[k].url,D.sources[k].title)).join('')}<p>課程另附合成示範。YouTube 連結為主題搜尋，並非逐支審核的播放清單。</p><h3>進度與隱私</h3><p>進度存在這個瀏覽器，沒有雲端同步。換裝置或網址前請先匯出。單人功能在本機執行，不載入外部字型或分析追蹤。</p><p>網路對戰使用 PeerJS / WebRTC 與第三方訊號服務，對手會收到暱稱與答題資料，也可能得知網路位址。房號不是密碼，請勿使用敏感資料。本站未提供私人 TURN 中繼或競賽級防作弊。</p></div>`;d.showModal();}
 function exportProgress(){const blob=new Blob([JSON.stringify({format:'arco-progress-v3',exportedAt:new Date().toISOString(),state:S},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='ARCO-progress-'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);notify('進度已匯出。');}
 document.addEventListener('click',async e=>{
  const internal=e.target.closest('a[href^="#"]');
  if(internal&&!e.ctrlKey&&!e.metaKey&&!e.shiftKey&&!e.altKey&&e.button===0&&!internal.target){e.preventDefault();go(internal.getAttribute('href').slice(1));return;}
  const el=e.target.closest('[data-action]');if(!el||el.disabled)return;const a=el.dataset.action;
  if(a==='exit-stay'||a==='exit-confirm'){settleConfirmation(a==='exit-confirm');return;}
  if(pendingConfirmation)return;
  if(a.startsWith('practice-')){window.ArcoPractice?.action(a,el);return;}
  if(a==='start-from-first'){startFromFirst();return;}
  if(a.startsWith('placement-')){if(e.detail>1)return;if(a==='placement-start'&&quiz&&!quiz.finished){notify('先完成或離開目前這次練習，再開始程度測驗。');return;}window.ArcoPlacement?.action(a,el);return;}
  if(a==='lesson-anchor'){
   const target=document.getElementById(el.dataset.target);
   if(target){const top=Math.max(0,scrollY+target.getBoundingClientRect().top-$('.header').getBoundingClientRect().bottom-18);target.focus({preventScroll:true});window.scrollTo({top,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}return;
  }
  if(a.startsWith('duel-')){window.ArcoDuel?.action(a,el);return;}
  if(a==='lesson'){go('lesson/'+Number(el.dataset.id));}
  else if(a==='chapter'){homeChapter=Number(el.dataset.id);document.querySelectorAll('.chapter-tab').forEach(b=>{b.classList.toggle('active',Number(b.dataset.id)===homeChapter);b.setAttribute('aria-pressed',String(Number(b.dataset.id)===homeChapter));});$('#home-courses').innerHTML=D.levels.slice(homeChapter*10,homeChapter*10+10).map(courseCard).join('');$('#chapter-feature').outerHTML=chapterFeature(homeChapter);window.ArcoVisual?.refresh();}
  else if(a==='settings')openSettings();else if(a==='about')about();else if(a==='close-dialog')closeDialog();
  else if(a==='piano'){const m=Number(el.dataset.midi);stopAudio();markKey([m]);ArcoAudio.key(m);setTimeout(()=>el.classList.remove('active'),450);}
  else if(a==='home-demo'){if(document.body.dataset.sound==='playing')stopAudio();else ArcoAudio.play(lesson(31).demo,{onNote:markKey});}
  else if(a==='play-audio'){
   if(el===lastAudioButton){stopAudio();return;}
   let demo;if(el.dataset.kind==='lesson')demo=lesson(el.dataset.id)?.demo;else if(el.dataset.kind==='example')demo=lesson(el.dataset.id)?.questions[0]?.audio;else demo=(el.dataset.kind==='duel'?window.ArcoDuel?.question(el.dataset.id):Q.get(el.dataset.id))?.audio;
   if(demo){const promise=ArcoAudio.play(demo);lastAudioButton=el;el.innerHTML=icon('stop');el.setAttribute('aria-label','停止示範');await promise;}
  }
  else if(a==='start-quiz')startQuiz(Number(el.dataset.id));else if(a==='review-quiz')startQuiz(0,true);
  else if(a==='answer')answer(Number(el.dataset.choice));else if(a==='next-question')nextQuestion();
  else if(a==='leave-quiz')go(quiz?.review?'review':'lesson/'+quiz?.level);
  else if(a==='clear-search'){catalogSearch='';catalogFilter='all';catalogStatus='all';renderCatalog();}
  else if(a==='mastered'){delete S.wrong[el.dataset.id];save();renderReview();notify('已移出錯題本。');}
  else if(a==='export')exportProgress();else if(a==='import')$('#import-file').click();
  else if(a==='factory-reset'){closeDialog();confirmAction({title:'恢復原廠設定？',message:'將清除這個瀏覽器的 ARCO 測驗結果、課程進度、錯題、練習紀錄、偏好與自動備份。無法復原，請先匯出進度備份。',confirmText:'確定初始化',cancelText:'保留紀錄',onConfirm:factoryReset});}

 });
 document.addEventListener('input',e=>{if(e.target.id==='course-search'){catalogSearch=e.target.value;updateCatalog();}else if(e.target.id==='setting-volume'){S.volume=Number(e.target.value)/100;save();}});
 document.addEventListener('change',e=>{
  if(e.target.id==='chapter-filter'){catalogFilter=e.target.value;updateCatalog();}
  else if(e.target.id==='status-filter'){catalogStatus=e.target.value;updateCatalog();}
  else if(e.target.id==='setting-sfx'){S.sfx=e.target.checked;save();}

 });
 $('#import-file').addEventListener('change',async e=>{
  const file=e.target.files?.[0];e.target.value='';if(!file)return;
  if(file.size>2*1024*1024){notify('檔案太大，請選擇 ARCO 匯出的進度 JSON。');return;}
  try{
   const obj=JSON.parse(await file.text());if(!['arco-progress-v1','arco-progress-v2','arco-progress-v3'].includes(obj.format))throw Error('format');
   const candidate=sanitize(obj.state);
   confirmAction({title:'匯入這份進度？',message:'匯入會取代目前的學習紀錄。舊測試成績只封存，不會開放未解鎖關卡。',confirmText:'匯入進度',cancelText:'取消匯入',onConfirm:()=>{S=candidate;quiz=null;window.ArcoPlacement?.leaveRoute(true);$('#welcome').close();save();closeDialog();go('home');notify('進度已匯入。');}});
  }catch(err){notify('讀不到有效的 ARCO 進度，請使用本站匯出的 JSON。');}
 });
 document.addEventListener('keydown',e=>{if(document.querySelector('dialog[open]')||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)||e.ctrlKey||e.metaKey||e.altKey||e.repeat)return;if(currentRoute==='quiz'&&quiz&&!quiz.finished){if(/^[1-4]$/.test(e.key)&&quiz.answers[quiz.index]===undefined){e.preventDefault();answer(quiz.questions[quiz.index].order[Number(e.key)-1]);}else if(e.key==='Enter'&&quiz.answers[quiz.index]!==undefined&&e.target===document.body){e.preventDefault();nextQuestion();}}});
 $('#settings').addEventListener('click',e=>{if(e.target===$('#settings')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeDialog();}});
 $('#leave-confirm').addEventListener('keydown',e=>{
  if(e.key!=='Tab')return;
  const buttons=[...e.currentTarget.querySelectorAll('button:not([disabled])')];
  const first=buttons[0],last=buttons[buttons.length-1];
  if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
  else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
 });
 $('#leave-confirm').addEventListener('cancel',e=>{e.preventDefault();settleConfirmation(false);});
 $('#leave-confirm').addEventListener('close',()=>{if(pendingConfirmation&&!$('#leave-confirm').open)settleConfirmation(false);});
 window.addEventListener('hashchange',renderRoute);
 window.addEventListener('beforeunload',e=>{stopAudio();if((quiz&&!quiz.finished)||window.ArcoDuel?.active()||window.ArcoPlacement?.active()){e.preventDefault();e.returnValue='';}});
 window.ARCO={D,Q,escape,icon,brandMark,lesson,staffView,questionMarkup,setContent,notify,go,confirmAction,shuffle,getState:()=>S,save,render:renderRoute,unlock,accessible,placementStart,placementOpen,hasStart,startFromFirst,setName:n=>{S.name=n.slice(0,12);save();},stopAudio,audioCard,sourceLink};
 /*RELEASE_TEST_INJECTION*/
 if(loadedProgress)save();updateHeader();renderRoute();if(saveWarning)setTimeout(()=>notify('無法讀取已儲存的進度；可在設定匯入備份。'),700);
})();