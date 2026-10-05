const fs=require('fs'),p=require("path").resolve(__dirname,"..");
const L=JSON.parse(fs.readFileSync(p+'/locales/translations.json'));const D=JSON.parse(fs.readFileSync(p+'/src/curriculum.json'));const B=JSON.parse(fs.readFileSync(p+'/src/duel-bank.json'));
const code=fs.readFileSync(p+'/src/i18n.js','utf8');const core=code.slice(code.indexOf(' const CJK='),code.indexOf(' function localizeNode'));const make=new Function('DATA','locale','missing',core+';return t');
let bank=[];function qs(v){if(!v||typeof v!=='object')return;if(Array.isArray(v.options)&&v.correct!==undefined)bank.push(v);else for(const x of Object.values(v))if(typeof x==='object')qs(x);}qs(D);qs(B);
let report={questionCount:bank.length,errors:[],optionCollisions:[],numbers:[],patterns:[]};
const all=new Set();function collect(v){if(typeof v==='string'&&/[\u3400-\u9fff]/.test(v))all.add(v);else if(v&&typeof v==='object')Object.values(v).forEach(collect);}collect(D);collect(B);const rows=[...all].map(source=>({source}));
for(const lang of ['en','de']){const t=make(L,lang,new Set());for(const r of rows){const v=t(r.source);if(/[\u3400-\u9fff]/.test(v)||!v.trim())report.errors.push({lang,source:r.source,value:v});}for(const q of bank){let seen=new Map();q.options.forEach(s=>{const v=t(s);if(seen.has(v)&&seen.get(v)!==s)report.optionCollisions.push({lang,qid:q.id,a:seen.get(v),b:s,value:v});seen.set(v,s);});}}
for(const [s,vs] of Object.entries(L.patterns)){const a=[...s.matchAll(/\{\d+\}/g)].map(m=>m[0]).sort().join();for(let i=0;i<2;i++){let b=[...vs[i].matchAll(/\{\d+\}/g)].map(m=>m[0]).sort().join();if(a!==b)report.patterns.push({s,i,a,b});}}
fs.writeFileSync(p+'/tests/translation-data-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify({questions:report.questionCount,untranslated:report.errors.length,optionCollisions:report.optionCollisions.length,badPatterns:report.patterns.length}));console.log(report.optionCollisions.slice(0,50));

if(report.errors.length||report.optionCollisions.length||report.patterns.length)process.exitCode=1;
