// v2.3.4 placement: sampling stays stratified; a completed exam cannot be rerolled.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const {webcrypto}=require('node:crypto');const root=path.resolve(__dirname,'..');
const D=JSON.parse(fs.readFileSync(path.join(root,'src/curriculum.json'),'utf8'));
const Q=new Map(D.levels.flatMap(l=>l.questions.map(q=>[q.id,{...q,level:l.id}])));
let S,saves=0,seed=9127,lastHTML='';const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
const shuffle=v=>{const a=[...v];for(let i=a.length-1;i>0;i--){const j=Math.floor(rand()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
const stub={open:false,focus(){},close(){},showModal(){},addEventListener(){}};
const c={console,crypto:webcrypto,setTimeout:()=>0,location:{hash:'#home'},document:{querySelector:()=>stub,addEventListener(){}},scrollTo(){}};c.window=c;
c.ARCO={D,Q,escape:s=>String(s),icon:()=>'',brandMark:()=>'',getState:()=>S,save:()=>saves++,shuffle,stopAudio(){},notify(){},lesson:n=>D.levels[n-1],setContent:s=>lastHTML=s,audioCard:()=>'',staffView:()=>'',hasStart:()=>!!S.placement||S.learningPath==='from-first',unlock:()=>S.placement?.start||1,confirmAction:({onConfirm})=>onConfirm(),go:r=>{c.location.hash='#'+r;if(r==='placement')c.ArcoPlacement.render();}};
vm.createContext(c);vm.runInContext(fs.readFileSync(path.join(root,'src/placement.js'),'utf8'),c);const P=c.ArcoPlacement;
const reset=()=>{P.leaveRoute(true);S={placement:null,placementRecord:null,placementSeen:[],learningPath:null,best:{},testBest:{},testMode:false};};
const snap=()=>JSON.parse(JSON.stringify(P.getRun()));
function take(scores){P.start();for(let i=0;i<15;i++){const q=P.current();P.answer(i%3<scores[Math.floor(i/3)]?q.correct:-1);P.next();}return snap();}
const checks=[],ok=s=>{checks.push(s);console.log('PASS',s);};
reset();
for(let i=0;i<1000;i++){
 const qs=P.sample();assert.equal(qs.length,15);assert.equal(new Set(qs.map(q=>q.id)).size,15);
 for(let t=0;t<5;t++){const g=qs.filter(q=>q.tier===t);assert.equal(g.length,3);assert.equal(g[0].difficulty,1);assert.equal(g[1].difficulty,2);assert(g[2].difficulty>=3);assert(g.every(q=>q.level>=t*20+1&&q.level<=(t+1)*20));}
 for(const q of qs)assert.deepEqual([...q.order].sort(),[0,1,2,3]);
}
ok('1000 exams: unique questions, five difficulty tiers, 3 per tier and valid shuffled options');
reset();let used=new Set();for(let k=0;k<20;k++){const qs=P.sample();for(const q of qs){assert(!used.has(q.id));used.add(q.id);S.placementSeen.push(q.id);}}
ok('Sampling still avoids 300 recently exposed question IDs across simulated draws');
for(const [scores,start] of [[[0,0,0,0,0],1],[[3,0,0,0,0],20],[[3,3,0,0,0],40],[[2,2,2,0,0],60],[[3,3,3,2,0],80],[[3,3,3,3,3],100],[[1,3,3,3,3],1]]){reset();assert.equal(take(scores).start,start);}
ok('Original conservative placement boundaries 1/20/40/60/80/100 remain unchanged');
reset();P.start();let token=P.questionToken();P.answer(P.current().correct,token);P.next(token);P.next(token);P.answer(P.current().correct,token);assert.equal(P.getRun().responses.length,1);assert.equal(P.getRun().selection,null);
ok('Repeated and stale submissions cannot advance or answer a different question');
reset();let result=take([3,3,0,0,0]),ids=result.questions.map(q=>q.id),id=result.id;
assert.equal(S.placementRecord.responses.length,15);assert(!lastHTML.includes('data-action="placement-start"'));
P.start();assert.equal(P.getRun().id,id);assert.deepEqual(snap().questions.map(q=>q.id),ids);
ok('Completed result has no retest button and start() cannot reroll it');
P.leaveRoute(true);P.render();assert.equal(P.getRun().start,40);assert.deepEqual(snap().questions.map(q=>q.id),ids);
ok('Saved completion restores original chosen answers and question order');
P.accept(id);assert.equal(S.placement.start,40);assert.equal(S.placement.total,15);assert.equal(Object.keys(S.best).length,0);let before=saves;P.accept(id);assert.equal(saves,before);
P.start();assert.equal(P.getRun().id,id);assert(!lastHTML.includes('data-action="placement-start"'));assert(!lastHTML.includes('data-action="placement-accept"'));
ok('Adoption is idempotent and accepted placement cannot be retaken without initialization');
reset();S.placement={start:60,total:15,correct:9};P.start();assert.equal(P.getRun(),null);assert(!lastHTML.includes('data-action="placement-start"'));
ok('Legacy completed placement is recognized without inventing historical answers');
fs.writeFileSync(path.join(root,'tests/placement-report.json'),JSON.stringify({version:'2.3.4',status:'passed',checks},null,2));
