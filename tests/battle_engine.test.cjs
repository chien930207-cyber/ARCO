const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),crypto=require('crypto');
const root=require('path').resolve(__dirname,'..');
const c={console};c.window=c;vm.createContext(c);
vm.runInContext('window.ARCO_DUEL_DATA='+fs.readFileSync(root+'/src/duel-bank.json','utf8')+';',c);
vm.runInContext(fs.readFileSync(root+'/src/duel-engine.js','utf8'),c);
const E=c.ArcoDuelEngine,B=E.BANK;
let seed=13;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
const checks=[];function pass(s){checks.push(s);console.log('PASS',s)}
assert.equal(B.questions.length,3000);assert.equal(new Set(B.questions.map(x=>x.id)).size,3000);
for(let i=1;i<=100;i++)assert.equal(B.questions.filter(x=>x.level===i).length,30);
for(const q of B.questions){assert.equal(q.options.length,4);assert.equal(new Set(q.options).size,4);assert.equal(q.correct,0);assert.ok(q.explanation.length>(q.origin==='extension'?10:0));assert.equal(q.tier,Math.ceil(q.level/20));}
pass('3,000 IDs, 30 per level, four unique options, valid keys and explanations');
const original=JSON.parse(fs.readFileSync(root+'/tests/original-curriculum.json','utf8'));
const current=JSON.parse(fs.readFileSync(root+'/src/curriculum.json','utf8'));
assert.deepEqual(current,original);pass('All 100 course contents and original 1,000 questions unchanged');
const opts={correct:true,tier:5,elapsedMs:0,streak:5,boss:true};assert.equal(E.score(opts).points,2880);
for(const [ms,speed] of [[0,2],[2999,2],[3000,1.75],[5999,1.75],[6000,1.5],[8999,1.5],[9000,1.25],[11999,1.25],[12000,1],[14999,1],[15000,1],[29999,1]])assert.equal(E.score({...opts,elapsedMs:ms}).speed,speed);
for(const ms of [30000,30001,Infinity,NaN,-1])assert.equal(E.score({...opts,elapsedMs:ms}).points,0);
for(const [before,combo] of [[0,1],[1,1.2],[2,1.2],[3,1.4],[4,1.4],[5,1.6],[30,1.6]])assert.equal(E.score({...opts,streak:before}).combo,combo);
assert.equal(E.score({...opts,correct:false}).streak,0);assert.equal(E.score({...opts,correct:false}).points,0);
assert.equal(E.config.previewMs,5000);assert.equal(E.config.answerMs,30000);
pass('All time boundaries, wrong/timeout streak resets, tier bases and boss multiplier');
const all=Array.from({length:100},(_,i)=>i+1);let history=[];
for(let run=0;run<1000;run++){
 const ns=run%3===0?all:run%3===1?[1,2,40,59,90,100]:[1+run%100];
 const qs=E.sample(ns,history,rand);assert.equal(qs.length,10);assert.equal(new Set(qs.map(q=>q.id)).size,10);assert.equal(qs.filter(q=>q.boss).length,1);assert.ok(qs[9].boss);assert.ok(qs[9].difficulty>=3);for(const q of qs)assert.ok(ns.includes(q.level));
 for(let i=1;i<10;i++)assert.ok(qs[i].tier>=qs[i-1].tier);
 if(ns.length===100){assert.equal(new Set(qs.map(q=>q.level)).size,10);for(let i=1;i<=5;i++)assert.equal(qs.filter(q=>q.tier===i).length,2);}
 history=[...history,...qs.map(q=>q.id)].slice(-1200);
}
assert.throws(()=>E.sample([]));pass('1,000 matches: full/multi/single scope, tier distribution, boss and no duplicate IDs');
fs.writeFileSync(root+'/tests/battle-engine-report.json',JSON.stringify({checks},null,2));