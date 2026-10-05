'use strict';
// Locally synthesized demonstrations: no recordings, autoplay, or external audio dependencies.
window.ArcoAudio=(()=>{
 let ctx=null, voices=[], timers=[], generation=0, settings=()=>({volume:.28,sfx:true}), notify=()=>{}, onStop=()=>{};
 async function context(){
  const Constructor=window.AudioContext||window.webkitAudioContext;
  if(!Constructor){notify('這個瀏覽器不支援試聽，請改用 Chrome、Edge 或 Safari。');return null;}
  if(!ctx||ctx.state==='closed')ctx=new Constructor();
  // Resume on a user gesture, including interruption after switching apps.
  if(ctx.state==='suspended'||ctx.state==='interrupted')await ctx.resume();
  if(ctx.state!=='running'){notify('聲音暫時無法播放，請再點一次琴鍵。');return null;}
  return ctx;
 }
 function note(c,midi,start,duration,volume=1,percussive=false){
  if(!Number.isFinite(midi)||midi<0||midi>127)return;
  const envelope=c.createGain();envelope.connect(c.destination);
  const gain=Math.min(.22,Math.max(0,Number(settings().volume)||0)*.24)*volume;
  if(gain<=0){envelope.disconnect();return;}
  const attack=percussive?.003:.012;
  envelope.gain.setValueAtTime(0,start);envelope.gain.linearRampToValueAtTime(gain,start+attack);
  envelope.gain.exponentialRampToValueAtTime(Math.max(.0001,gain*.38),start+Math.max(.04,duration*.45));
  envelope.gain.exponentialRampToValueAtTime(.0001,start+duration+.14);
  const oscillators=[];
  [1,2,3].forEach((harmonic,i)=>{
   const o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.value=440*Math.pow(2,(midi-69)/12)*harmonic;g.gain.value=[1,.28,.09][i];o.connect(g);g.connect(envelope);o.start(start);o.stop(start+duration+.18);oscillators.push(o);
  });
  const voice={oscillators,envelope};voices.push(voice);
  oscillators[0].onended=()=>{envelope.disconnect();voices=voices.filter(x=>x!==voice);};
 }
 function stop(){generation++;timers.forEach(clearTimeout);timers=[];voices.forEach(v=>{try{v.envelope.gain.cancelScheduledValues(0);v.envelope.gain.value=0;v.oscillators.forEach(o=>{try{o.stop();}catch(e){}});}catch(e){}});voices=[];onStop();document.dispatchEvent(new Event('arco:audio-stop'));}
 async function play(demo,{onNote=null,onEnd=null}={}){
  stop();const token=generation;let c;try{c=await context();}catch(e){notify('無法啟用聲音，請再點一次播放。');return;}
  if(!c||token!==generation)return;
  const events=Array.isArray(demo?.events)?demo.events:[];
  if(events.length)document.dispatchEvent(new Event('arco:audio-start'));
  let end=0;
  events.forEach(e=>{
   if(!Array.isArray(e.notes))return;
   e.notes.forEach(n=>note(c,n,c.currentTime+.06+e.at,e.dur,(e.vel??.8)/Math.sqrt(e.notes.length),e.dur<.12));
   end=Math.max(end,e.at+e.dur+.2);
   if(onNote)timers.push(setTimeout(()=>{if(token===generation)onNote(e.notes);},60+e.at*1000));
  });
  timers.push(setTimeout(()=>{if(token===generation){onStop();document.dispatchEvent(new Event('arco:audio-stop'));if(onEnd)onEnd();}},(end+.1)*1000));
 }
 async function key(midi){const token=generation;try{const c=await context();if(c&&token===generation)note(c,Number(midi),c.currentTime+.008,.7,.85);}catch(e){notify('聲音尚未啟用，請再點琴鍵。');}}
 async function effect(correct){if(!settings().sfx)return;const token=generation;try{const c=await context();if(!c||token!==generation)return;[correct?76:60,correct?79:58].forEach((n,i)=>note(c,n,c.currentTime+i*.07,.12,.3));}catch(e){}}
 return {configure(options){settings=options.settings||settings;notify=options.notify||notify;onStop=options.onStop||onStop;},play,key,effect,stop};
})();