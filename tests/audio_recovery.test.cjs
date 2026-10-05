'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../src/audio.js'),'utf8');
function setup(initial='suspended',hold=false,stay=false,volume=.28){
 const contexts=[],notes=[],messages=[];let release=null;
 const param=()=>({value:0,setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){},cancelScheduledValues(){}});
 class Context{
  constructor(){this.state=initial;this.currentTime=0;this.destination={};this.resumes=0;contexts.push(this);}
  resume(){this.resumes++;if(hold)return new Promise(resolve=>{release=()=>{this.state='running';resolve();};});if(!stay)this.state='running';return Promise.resolve();}
  createGain(){return {gain:param(),connect(){},disconnect(){}};}
  createOscillator(){return {frequency:{value:0},connect(){},start(){notes.push(this.frequency.value)},stop(){}};}
 }
 const window={AudioContext:Context},sandbox={window,document:{dispatchEvent(){}},Event:class{},setTimeout,clearTimeout,console};vm.createContext(sandbox);vm.runInContext(source,sandbox);
 window.ArcoAudio.configure({settings:()=>({volume,sfx:false}),notify:m=>messages.push(m)});
 return {A:window.ArcoAudio,notes,contexts,messages,release:()=>release()};
}
(async()=>{
 let e=setup();await e.A.key(61);assert.equal(e.contexts[0].resumes,1);assert.equal(e.notes.length,3);console.log('PASS suspended context resumes; SFX-off does not mute piano');
 e=setup('interrupted');await e.A.key(66);assert.equal(e.contexts[0].resumes,1);assert.equal(e.notes.length,3);console.log('PASS interrupted context attempts resume on the next key gesture');
 e.contexts[0].state='closed';await e.A.key(70);assert.equal(e.contexts.length,2);assert.equal(e.notes.length,6);console.log('PASS closed context is replaced');
 e=setup('interrupted',false,true);await e.A.key(60);assert.equal(e.notes.length,0);assert.equal(e.messages.length,1);console.log('PASS unresolved interruption reports failure instead of silent success');
 e=setup('suspended',true);const waiting=e.A.key(61);e.A.stop();e.release();await waiting;assert.equal(e.notes.length,0);console.log('PASS stop/navigation cancels a key awaiting audio recovery');
 e=setup('running',false,false,0);await e.A.key(61);assert.equal(e.notes.length,0);console.log('PASS volume zero generates no sound');
 e=setup('running');await e.A.key(NaN);await e.A.key(128);assert.equal(e.notes.length,0);console.log('PASS invalid pitches do not create oscillators');
 console.log('Audio recovery suite passed');
})().catch(e=>{console.error(e);process.exitCode=1;});
