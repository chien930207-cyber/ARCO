'use strict';
window.ArcoPractice=(()=>{
 const A=window.ARCO, E=A.escape, $=s=>document.querySelector(s);
 const names=['C','C♯ / D♭','D','D♯ / E♭','E','F','F♯ / G♭','G','G♯ / A♭','A','A♯ / B♭','B'];
 const compact=['C','C♯','D','E♭','E','F','F♯','G','A♭','A','B♭','B'];
 let session=null;
 const label=m=>compact[m%12]+(Math.floor(m/12)-1);
 function record(){const s=A.getState();s.practices=s.practices||{};return s.practices[session.id]||(s.practices[session.id]={verified:false,steps:[false,false,false],at:0});}
 function mount(l){if(!l.workshop||!$('#practice-studio'))return;if(!session||session.id!==l.id)session={id:l.id,w:l.workshop,notes:[],selected:[],choice:null,octave:l.workshop.kind==='keys'?Math.floor(Math.min(...l.workshop.target)/12)-1:4,bpm:l.workshop.bpm||80,feedback:'',correct:false};draw();}
 function draw(){if(!session||!$('#practice-studio'))return;const t=session,w=t.w,r=record();
 let controls='';
 if(w.kind==='keys') controls=`<div class="studio-tools"><label>琴鍵音域 <select id="practice-octave" aria-label="琴鍵八度">${[2,3,4,5,6].map(n=>`<option value="${n}" ${n===t.octave?'selected':''}>第 ${n} 八度</option>`).join('')}</select></label><span>${w.mode==='chord'?'和弦：音級核對，不限八度':w.mode==='voicing'?'配置：順序與八度都要相符':'旋律：順序與八度都要相符'}</span></div><div class="key-pads" role="group" aria-label="十二個音高按鍵">${names.map((n,i)=>`<button class="key-pad ${[1,3,6,8,10].includes(i)?'accidental':''}" data-action="practice-key" data-midi="${(t.octave+1)*12+i}" aria-label="輸入 ${n} 第 ${t.octave} 八度">${n}<small>${t.octave}</small></button>`).join('')}</div><div class="note-tray" aria-label="目前輸入的音">${t.notes.length?t.notes.map((n,i)=>`<button class="note-chip" data-action="practice-remove" data-index="${i}" aria-label="移除第 ${i+1} 個音 ${label(n)}">${E(label(n))}<span aria-hidden="true">×</span></button>`).join(''):'<span class="muted">點選琴鍵，建立你的音型。點已輸入的音可移除。</span>'}</div>`;
 else if(w.kind==='rhythm')controls=`<p class="studio-help">每格的時值依上方題目；只標「重新起音」的位置。深色為已選，空格仍保留時間。</p><div class="rhythm-grid" style="--steps:${w.steps}" role="group" aria-label="節奏起音格">${Array.from({length:w.steps},(_,i)=>`<button class="rhythm-cell ${t.selected.includes(i)?'selected':''} ${w.group&&i%w.group===0?'group-start':''}" data-action="practice-cell" data-index="${i}" aria-pressed="${t.selected.includes(i)}"><small>格</small><strong>${i+1}</strong><span>${t.selected.includes(i)?'起音':'留空'}</span></button>`).join('')}</div><label class="studio-tempo">示範速度 <input type="range" min="40" max="160" step="5" value="${t.bpm}" id="practice-bpm" aria-label="示範速度"><output id="practice-bpm-label">${t.bpm}</output><span>${E(w.beatUnit||'四分音符／分鐘')}</span></label>`;
 else controls=`<div class="practice-choices" role="group" aria-label="實作判斷選項">${w.choices.map((s,i)=>`<button class="practice-choice ${t.choice===i?'selected':''}" data-action="practice-choice" data-index="${i}" aria-pressed="${t.choice===i}">${E(s)}</button>`).join('')}</div>`;
 $('#practice-studio').innerHTML=`<div class="studio-head"><div><h3>這次的練習</h3></div><span class="badge ${r.verified?'verified':''}">${r.verified?'已核對成功':'互動實作'}</span></div><p class="studio-prompt">${E(w.prompt)}</p>${controls}<div class="studio-actions"><button class="btn small" data-action="practice-check">核對我的答案</button>${w.kind!=='choice'?`<button class="btn secondary small" data-action="practice-play">${A.icon('play')}聽我的版本</button><button class="text-button" data-action="practice-example">聽目標示範</button>`:''}<button class="text-button" data-action="practice-clear">重新練習</button><button class="text-button" data-action="practice-stop">停止聲音</button></div><div id="practice-feedback" class="practice-feedback ${t.feedback?(t.correct?'good':'needs-work'):''}" role="status" aria-live="polite">${E(t.feedback)}</div><p class="studio-limit">${w.kind==='keys'?'核對的是固定琴鍵音高；同音異名視為同音，不檢測指法、節奏或音準。':w.kind==='rhythm'?'核對起音格的位置；不量測真人拍點、延音與演奏力度。':'這是編配判斷練習；完成後，仍請用自己的樂器實際演奏比較。'}不會因完成實作直接解鎖下一級。</p>`;
 }
 function current(){return session;}
 function changed(){session.feedback='';session.correct=false;draw();}
 function check(){const t=session,w=t.w;let ok=false,why='';
 if(w.kind==='keys'){
  if(!t.notes.length){t.feedback='先用琴鍵輸入你的版本。';draw();return;}
  const normal=arr=>w.mode==='chord'?[...new Set(arr.map(n=>n%12))].sort((a,b)=>a-b):arr;
  ok=JSON.stringify(normal(t.notes))===JSON.stringify(normal(w.target));
  why=w.mode==='chord'?'逐一檢查根音、三音與其餘和弦音；此題不限制八度。':'請一起檢查音的順序與八度；同音異名在鍵盤上視為同音。';
 }else if(w.kind==='rhythm'){ok=JSON.stringify([...t.selected].sort((a,b)=>a-b))===JSON.stringify([...w.target].sort((a,b)=>a-b));why='先完整數出每一格，確認哪些位置要重新起音，哪些位置只延續或休止。';}
 else{if(t.choice===null){t.feedback='先選擇你的編配判斷。';draw();return;}ok=w.choices[t.choice]===w.answer;why=w.explanation;}
 t.correct=ok;t.feedback=ok?'核對成功。接著用自己的樂器完成下方任務，再以成功標準檢查。'+(w.kind==='choice'?' '+w.explanation:''):('這次還沒符合目標。'+why);
 if(ok){const r=record();r.verified=true;r.at=Date.now();A.save();}ArcoAudio.effect(ok);draw();
 }
 async function play(example=false){const t=session,w=t.w;if(w.kind==='choice')return;let events=[];
 if(w.kind==='keys'){const ns=example?w.target:t.notes;if(!ns.length){A.notify('先加入幾個音，再播放你的版本。');return;}events=w.mode==='sequence'?ns.map((n,i)=>({at:i*.5,dur:.42,notes:[n],vel:.6})):[{at:0,dur:1.5,notes:ns,vel:Math.min(.65,1.7/ns.length)}];}
 else{const ns=example?w.target:t.selected,dt=60/t.bpm/(w.gridPerBeat||w.group||2);for(let i=0;i<w.steps;i++){events.push({at:i*dt,dur:.045,notes:[w.group&&i%w.group===0?88:84],vel:.06});if(ns.includes(i))events.push({at:i*dt,dur:Math.min(.18,dt*.8),notes:[60],vel:.6});}}
 await ArcoAudio.play({label:example?'目標示範':'你的版本',events});
 }
 function restoreFocus(a,el){let selector=`[data-action="${a}"]`;if(el.dataset.midi)selector+=`[data-midi="${el.dataset.midi}"]`;else if(el.dataset.index)selector+=`[data-index="${el.dataset.index}"]`;const target=$('#practice-studio '+selector)||$('#practice-studio [data-action="practice-clear"]');target?.focus({preventScroll:true});}
 function action(a,el){if(!session&&a!=='practice-step')return;
 if(a==='practice-key'){if(session.notes.length>=32){A.notify('這次最多輸入 32 個音；可先移除或清空。');return;}const n=Number(el.dataset.midi);session.notes.push(n);ArcoAudio.key(n);changed();}
 else if(a==='practice-remove'){session.notes.splice(Number(el.dataset.index),1);changed();}
 else if(a==='practice-cell'){const i=Number(el.dataset.index),j=session.selected.indexOf(i);if(j<0)session.selected.push(i);else session.selected.splice(j,1);changed();}
 else if(a==='practice-choice'){session.choice=Number(el.dataset.index);changed();}
 else if(a==='practice-check')check();else if(a==='practice-play')play(false);else if(a==='practice-example')play(true);
 else if(a==='practice-clear'){ArcoAudio.stop();session.notes=[];session.selected=[];session.choice=null;changed();}
 else if(a==='practice-stop')ArcoAudio.stop();
 if(['practice-key','practice-remove','practice-cell','practice-choice','practice-check','practice-clear'].includes(a))restoreFocus(a,el);
 }
 document.addEventListener('change',e=>{if(e.target.id==='practice-octave'&&session){session.octave=Number(e.target.value);draw();$('#practice-octave')?.focus({preventScroll:true});}if(e.target.matches('[data-practice-step]')&&session){const r=record();r.steps[Number(e.target.dataset.practiceStep)]=e.target.checked;A.save();}});
 document.addEventListener('input',e=>{if(e.target.id==='practice-bpm'&&session){session.bpm=Number(e.target.value);$('#practice-bpm-label').textContent=session.bpm;}});
 return {mount,action,current,check,reset(){session=null;}};
})();
if(/^#lesson\//.test(location.hash))window.ArcoPractice.mount(ARCO.lesson(Number(location.hash.split('/')[1])));