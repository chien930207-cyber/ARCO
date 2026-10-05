'use strict';
/** Shared deterministic scoring/selection for people and local AI. No UI side effects. */
window.ArcoDuelEngine=(()=>{
 const BANK=window.ARCO_DUEL_DATA;
 const Q=new Map(BANK.questions.map(q=>[q.id,q]));
 const config=Object.freeze({rounds:10,previewMs:5000,answerMs:30000,base:[100,150,200,250,300],tierNames:['入門','基礎','進階','挑戰','高階'],version:'arco-battle-230'});
 const normalizeLevels=values=>[...new Set((Array.isArray(values)?values:[]).map(Number).filter(n=>Number.isInteger(n)&&n>=1&&n<=100))].sort((a,b)=>a-b);
 function score({correct,tier,elapsedMs,streak,boss=false}){
  const elapsed=Number(elapsedMs),valid=correct===true&&Number.isFinite(elapsed)&&elapsed>=0&&elapsed<config.answerMs;
  const t=Math.max(1,Math.min(5,Math.trunc(Number(tier)||1))),base=config.base[t-1];
  const nextStreak=valid?Math.max(0,Math.floor(Number(streak)||0))+1:0;
  const speed=elapsed<3000?2:elapsed<6000?1.75:elapsed<9000?1.5:elapsed<12000?1.25:1;
  const combo=nextStreak>=6?1.6:nextStreak>=4?1.4:nextStreak>=2?1.2:1;
  const bossMultiplier=boss?3:1;
  return {points:valid?Math.round(base*speed*combo*bossMultiplier):0,base,tier:t,speed:valid?speed:0,combo:valid?combo:1,boss:bossMultiplier,streak:nextStreak,elapsedMs:Math.max(0,Math.min(config.answerMs,Number.isFinite(elapsed)?elapsed:config.answerMs)),correct:valid};
 }
 function randomIndex(n,random){return Math.min(n-1,Math.floor(random()*n));}
 function sample(levels,history=[],random=Math.random){
  const allowed=new Set(normalizeLevels(levels)),pool=BANK.questions.filter(q=>allowed.has(q.level));
  if(pool.length<10)throw Error('請至少選擇一個課程範圍。');
  const availableTiers=[...new Set(pool.map(q=>q.tier))].sort(),picked=[],used=new Set(),usedLevels=new Set();
  const last=new Map(history.map((id,i)=>[id,i]));
  function pick(candidates){
   candidates=candidates.filter(q=>!used.has(q.id));
   let fresh=candidates.filter(q=>!last.has(q.id));
   if(!fresh.length){const oldest=Math.min(...candidates.map(q=>last.get(q.id)??-1));fresh=candidates.filter(q=>(last.get(q.id)??-1)===oldest);}
   const distinctTopic=fresh.filter(q=>!usedLevels.has(q.level));if(distinctTopic.length)fresh=distinctTopic;
   const chosen=fresh[randomIndex(fresh.length,random)];if(!chosen)throw Error('題庫抽樣失敗，請重新選擇範圍。');used.add(chosen.id);usedLevels.add(chosen.level);return chosen;
  }
  // Two questions per tier across full scope. Narrow AI scope uses its available tiers only.
  for(let i=0;i<10;i++){
   const tier=availableTiers[Math.min(availableTiers.length-1,Math.floor(i*availableTiers.length/10))];
   let candidates=pool.filter(q=>q.tier===tier);
   if(i===9){const hard=candidates.filter(q=>q.difficulty>=3);if(hard.length>=1)candidates=hard;}
   picked.push({...pick(candidates),boss:i===9});
  }
  // Ascending within each tier; preserve final high-complexity boss and all unique IDs.
  const boss=picked.pop();picked.sort((a,b)=>a.tier-b.tier||a.difficulty-b.difficulty||a.level-b.level);picked.push(boss);
  return picked;
 }
 function describe(levels){
  const ns=normalizeLevels(levels);if(ns.length===100)return '全範圍 1–100 級';if(!ns.length)return '尚未選擇範圍';
  const ranges=[];let start=ns[0],end=start;for(let i=1;i<=ns.length;i++){if(ns[i]===end+1){end=ns[i];continue;}ranges.push(start===end?String(start):start+'–'+end);start=end=ns[i];}
  return '第 '+ranges.join('、')+' 級';
 }
 return {Q,BANK,config,normalizeLevels,score,sample,describe};
})();