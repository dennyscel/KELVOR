'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const C=require('../patches/120-world1-content-v048.js'),M=require('../patches/121-world1-physics-v048.js');
const copy=x=>JSON.parse(JSON.stringify(x));
function harness(initialStorage={}){
  const storage=new Map(Object.entries(initialStorage)),registrations=[],completed=[],writes=[],starts=[];
  const state={version:2,currentWorld:'W01',selected:'W01_L01',worlds:Object.fromEntries(['W01','W02','W03','W04','W05'].map(w=>[w,{unlocked:w==='W01',completed:false,secretExit:false,nodes:{L01:w==='W01'?'AVAILABLE':'LOCKED',L02:'LOCKED',L03:'LOCKED',SECRET:'LOCKED',BOSS:'LOCKED'},bonusRooms:{B01:false},bonusRewards:{B01:null}}]))};
  // RC4 service boundary: the real scene is exercised; this stub records its requests and simulates the documented forward-only campaign contract.
  const P={World1ContentV048:C,World1PhysicsV048:M,levelRegistryRC4:{events:[],register:d=>registrations.push(d)},
    KelvorCampaignRC1:{load:()=>copy(state),save:s=>{Object.assign(state,copy(s));writes.push(copy(s));}},
    campaignStateRC4:{markCompleted:(id,result)=>{completed.push({id,result:copy(result)});const [w,n]=id.split('_'),d=state.worlds[w];d.nodes[n]='COMPLETED';if(n==='L01')d.nodes.L02='AVAILABLE';if(n==='L02')d.nodes.L03='AVAILABLE';if(n==='L03')d.nodes.BOSS='AVAILABLE';if(result.secretExit){d.secretExit=true;d.nodes.SECRET='AVAILABLE';}if(n==='BOSS'){d.completed=true;state.worlds.W02.unlocked=true;state.worlds.W02.nodes.L01='AVAILABLE';}state.currentWorld=w;state.selected=id;return copy(state);}}
  };
  const sandbox={window:{PlatformerSNESV04:P},Phaser:{Scene:class{constructor(key){this.sys={settings:{key}};this.events={once(){}};}}},localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,String(v))},console};
  vm.runInNewContext(fs.readFileSync(require.resolve('../patches/122-world1-scene-v048.js'),'utf8'),sandbox);
  function scene(id){const s=new P.World1LivingSceneV048(id);s.defV048=C.getLevel(id);s.modelV048=new M.World(s.defV048);s.scene={start:(...args)=>starts.push(copy(args))};s.toastV048=()=>{};return s;}
  return {P,sandbox,state,storage,registrations,completed,writes,starts,scene,json:k=>JSON.parse(storage.get(k)||'null')};
}

test('registry replacements cover only five W01 nodes and use independent new scenes with return-to-map contract',()=>{
  const h=harness();assert.deepEqual(h.registrations.map(r=>r.id),Object.keys(C.levels));for(const r of h.registrations){assert.equal(r.completion,'RETURN_TO_MAP');assert.equal(r.contentStatus,'REAL');assert.equal(r.metadata.optionalCombat,true);assert.equal(new r.sceneClass().levelId,r.id);assert.ok(r.sceneKey.startsWith('World1LivingV048_W01_'));}
});

test('finishing is idempotent and starts only WorldMapSceneRC1 with the completed node',()=>{
  const h=harness(),s=h.scene('W01_L01');s.resultV048={type:'complete',coins:7};s.commitFinishV048();s.commitFinishV048();assert.equal(h.completed.length,1);assert.equal(h.starts.length,0);s.finishV048();s.finishV048();assert.equal(h.completed.length,1);assert.deepEqual(h.starts,[['WorldMapSceneRC1',{returnFromLevel:'W01_L01',result:{type:'complete',coins:7}}]]);assert.equal(h.sandbox.window.__KELVOR_CAMPAIGN_ACTIVE_LEVEL__,null);assert.equal(h.sandbox.window.__KELVOR_CAMPAIGN_LAST_COMPLETED__,'W01_L01');
});

test('ordinary completion never invents a secret discovery or a guardian victory',()=>{
  const h=harness(),s=h.scene('W01_L02');s.commitFinishV048();assert.equal(h.completed[0].result.secretExit,false);assert.equal(h.completed[0].result.guardianDefeated,false);assert.equal(h.state.worlds.W01.nodes.SECRET,'LOCKED');assert.equal(h.state.worlds.W01.nodes.L03,'AVAILABLE');assert.equal(h.state.worlds.W02.unlocked,false);
});

test('secret discovery is forwarded only from actual model state and preserves five-world progress',()=>{
  const h=harness(),s=h.scene('W01_L02');h.state.worlds.W04.unlocked=true;h.state.worlds.W04.nodes.L02='MASTERED';s.modelV048.secretExit=true;s.commitFinishV048();assert.equal(h.completed[0].result.secretExit,true);assert.equal(h.state.worlds.W01.nodes.SECRET,'AVAILABLE');assert.equal(h.state.worlds.W01.secretExit,true);assert.equal(h.state.worlds.W04.nodes.L02,'MASTERED');assert.equal(h.state.worlds.W04.unlocked,true);
});

test('passing a living dormant Guardian completes its node and opens W02 without fabricating defeat mastery',()=>{
  const h=harness(),s=h.scene('W01_BOSS');s.commitFinishV048();assert.equal(h.completed[0].result.guardianDefeated,false);assert.equal(h.state.worlds.W01.nodes.BOSS,'COMPLETED');assert.equal(h.state.worlds.W01.completed,true);assert.equal(h.state.worlds.W02.unlocked,true);assert.equal(h.state.worlds.W02.nodes.L01,'AVAILABLE');assert.equal(h.json('kelvor_world1_v048_mastery').W01_BOSS.guardianDefeated,false);
});

test('earned Guardian victory persists in mastery when a later replay takes the peaceful route',()=>{
  const h=harness(),win=h.scene('W01_BOSS');win.modelV048.boss.defeated=true;win.commitFinishV048();assert.equal(h.json('kelvor_world1_v048_mastery').W01_BOSS.guardianDefeated,true);const peaceful=h.scene('W01_BOSS');peaceful.commitFinishV048();assert.equal(h.completed.at(-1).result.guardianDefeated,false);assert.equal(h.json('kelvor_world1_v048_mastery').W01_BOSS.guardianDefeated,true);
});

test('bossDefeat event immediately persists victory before portal completion or return to map',()=>{
  const h=harness({'kelvor_world1_v048_mastery':JSON.stringify({W01_BOSS:{coins:2,bestDeaths:1},W01_L01:{completed:true}})}),s=h.scene('W01_BOSS');s.scoreV048={effect(){}};s.particlesV048Burst=()=>{};s.modelV048.boss.defeated=true;s.modelV048.emit('bossDefeat',{x:1620,y:900});s.eventsV048();const data=h.json('kelvor_world1_v048_mastery');assert.equal(data.W01_BOSS.guardianDefeated,true);assert.equal(data.W01_BOSS.coins,2);assert.equal(data.W01_BOSS.bestDeaths,1);assert.equal(data.W01_L01.completed,true);assert.equal(h.completed.length,0);assert.equal(h.starts.length,0);assert.equal(h.state.worlds.W02.unlocked,false);
});

test('mastery counts authored collected leaves, not extra coins awarded by crates or enemies',()=>{
  const h=harness(),s=h.scene('W01_L01');s.modelV048.player.coins=999;s.modelV048.entities.filter(e=>e.type==='coin').slice(0,3).forEach(e=>e.alive=false);s.commitFinishV048();const mastery=h.json('kelvor_world1_v048_mastery').W01_L01;assert.equal(mastery.coins,3);assert.equal(mastery.totalCoins,C.levels.W01_L01.entities.filter(e=>e.type==='coin').length);assert.equal(mastery.bells,0);assert.deepEqual(mastery.bonusIds,[]);assert.equal(mastery.guardianDefeated,false);
});

test('bonus save uses distinct B01/B02/B03 flags without replacing previous rewards or other nodes',()=>{
  const h=harness(),s=h.scene('W01_SECRET');h.state.worlds.W01.bonusRooms.B01=true;h.state.worlds.W01.bonusRewards.B01='existing reward';h.state.worlds.W01.nodes.L01='MASTERED';s.saveBonusV048('B02');s.saveBonusV048('B03');assert.deepEqual(h.state.worlds.W01.bonusRooms,{B01:true,B02:true,B03:true});assert.equal(h.state.worlds.W01.bonusRewards.B01,'existing reward');assert.equal(h.state.worlds.W01.nodes.L01,'MASTERED');assert.equal(h.completed.length,0);assert.equal(h.starts.length,0);
});

test('checkpoint round trip restores keys, local gate state, bonuses and secret without advancing campaign',()=>{
  const h=harness(),s=h.scene('W01_L02'),m=s.modelV048,checkpoint=m.entities.find(e=>e.type==='checkpoint');m.checkpoint={x:checkpoint.x,y:checkpoint.y};m.player.coins=13;m.secretExit=true;m.bonusIds.add('B02');const key=m.entities.find(e=>e.type==='key'),door=m.entities.find(e=>e.type==='door');key.alive=false;m.keys.add(key.keyId);door.open=1;s.saveCheckpointV048();const restored=h.scene('W01_L02');restored.restoreCheckpointV048();assert.equal(restored.modelV048.player.x,checkpoint.x);assert.equal(restored.modelV048.player.y,checkpoint.y);assert.equal(restored.modelV048.player.coins,13);assert.ok(restored.modelV048.keys.has(key.keyId));assert.equal(restored.modelV048.entities.find(e=>e.id===key.id).alive,false);assert.equal(restored.modelV048.entities.find(e=>e.id===door.id).open,1);assert.equal(restored.modelV048.secretExit,true);assert.ok(restored.modelV048.bonusIds.has('B02'));assert.equal(h.completed.length,0);assert.equal(h.state.worlds.W01.nodes.SECRET,'LOCKED');
});

test('invalid checkpoint coordinates in a ravine are ignored instead of spawning into a softlock',()=>{
  const h=harness({'kelvor_world1_v048_checkpoints':JSON.stringify({W01_L01:{version:1,checkpoint:{x:2400,y:900},keys:['orvalho'],entities:[]}})}),s=h.scene('W01_L01');s.restoreCheckpointV048();assert.equal(s.modelV048.player.x,C.levels.W01_L01.spawn.x);assert.equal(s.modelV048.keys.size,0);
});

test('finishing clears only that level checkpoint and preserves settings and other unfinished levels',()=>{
  const h=harness({'kelvor_world1_v048_checkpoints':JSON.stringify({W01_L01:{version:1},W01_L02:{version:1,checkpoint:{x:2820,y:900}}}),'kelvor_settings_v001':'{"masterVolume":42}'}),s=h.scene('W01_L01');s.commitFinishV048();assert.deepEqual(Object.keys(h.json('kelvor_world1_v048_checkpoints')),['W01_L02']);assert.equal(h.storage.get('kelvor_settings_v001'),'{"masterVolume":42}');
});

function uiHarness(){
  const h=harness(),listeners=new Map(),doc={activeElement:null,hidden:false,documentElement:{dataset:{}},addEventListener(){}};
  class Element{
    constructor(tag='div'){this.tag=tag;this.hidden=false;this.children=[];this.style={};this.dataset={};this.buttons=[];this.parts=new Map();this.textContent='';}
    set innerHTML(value){this.html=value;this.buttons=[...value.matchAll(/<button[^>]*data-do="([^"]+)"[^>]*>/g)].map(m=>{const b=new Element('button');b.do=m[1];return b;});}
    get innerHTML(){return this.html||'';}
    setAttribute(){}addEventListener(){}appendChild(e){this.children.push(e);}remove(){}getContext(){return {};}
    getBoundingClientRect(){return{width:1280,height:720};}
    querySelector(selector){if(selector==='button')return this.buttons[0]||null;const data=selector.match(/^\[data-do=['"]?([^'"\]]+)['"]?\]$/);if(data)return this.buttons.find(b=>b.do===data[1])||null;
      if(!this.parts.has(selector)){const e=new Element(selector==='canvas'?'canvas':'div');if(selector==='.w148-modal')e.hidden=true;this.parts.set(selector,e);}return this.parts.get(selector);
    }
    querySelectorAll(selector){if(selector==='.w148-modal button')return this.querySelector('.w148-modal').buttons;return[];}
    contains(e){return this===e||this.buttons.includes(e)||this.children.includes(e);}
    focus(){doc.activeElement=this;}click(){this.onclick?.();}
  }
  doc.body=new Element();doc.head=new Element();doc.getElementById=()=>null;doc.createElement=tag=>new Element(tag);
  const pad={connected:true,axes:[0,0],buttons:Array.from({length:16},()=>({pressed:false}))};
  Object.assign(h.sandbox,{document:doc,navigator:{getGamepads:()=>[pad]},AbortController,devicePixelRatio:1,Image:class{set src(_value){} }});
  h.sandbox.Phaser.Scenes={Events:{SHUTDOWN:'shutdown'}};
  h.sandbox.window.addEventListener=(type,fn)=>{if(!listeners.has(type))listeners.set(type,[]);listeners.get(type).push(fn);};
  h.P.World1InputV048=class{setEnabled(value){this.enabled=value;}destroy(){}};
  h.P.World1ScoreV048=class{constructor(){this.started=false;}start(){this.started=true;}effect(){}finale(){}destroy(){}};
  const s=h.scene('W01_L01');s.create();
  const setPad=(buttons=[],axes=[0,0])=>{pad.axes=axes;pad.buttons.forEach((b,i)=>b.pressed=buttons.includes(i));};
  const poll=()=>{s.elapsedV048+=.02;s.dialogPadV048();};
  const key=(name,extra={})=>{const e={key:name,repeat:false,shiftKey:false,prevented:false,preventDefault(){this.prevented=true;},...extra};for(const fn of listeners.get('keydown')||[])fn(e);return e;};
  return {...h,s,doc,pad,setPad,poll,key,modal:()=>s.hostV048.querySelector('.w148-modal')};
}

test('pause gamepad waits for a neutral release, wraps focus and confirms once while a button is held',()=>{
  const h=uiHarness(),s=h.s;s.pauseV048(true);assert.equal(h.doc.activeElement.do,'resume');h.setPad([9]);h.poll();assert.equal(s.pausedV048,true,'held Start cannot instantly dismiss new pause');h.setPad();h.poll();assert.equal(s.modalPadNeutralV048,true);h.setPad([13]);h.poll();assert.equal(h.doc.activeElement.do,'checkpoint');h.setPad();h.poll();h.setPad([12]);s.elapsedV048+=.3;h.poll();assert.equal(h.doc.activeElement.do,'resume');h.setPad();h.poll();h.setPad([0]);h.poll();assert.equal(s.pausedV048,false);assert.equal(s.inputV048.enabled,true);h.poll();assert.equal(s.pausedV048,false);assert.equal(h.starts.length,0);
});

test('gamepad B dismisses pause after neutral input; confirmation on finish goes only to the map once',()=>{
  const h=uiHarness(),s=h.s;s.pauseV048(true);h.setPad();h.poll();h.setPad([1]);h.poll();assert.equal(s.pausedV048,false);s.celebrateAt=0;s.showFinishV048();assert.equal(h.doc.activeElement.do,'finish');h.setPad([0]);h.poll();assert.equal(h.starts.length,0,'new finish needs neutral');h.setPad();h.poll();h.setPad([0]);h.poll();h.poll();assert.equal(h.starts.length,1);assert.equal(h.starts[0][0],'WorldMapSceneRC1');assert.equal(h.completed.length,1);
});

test('modal keyboard arrows and Tab stay inside the dialog, and Escape resumes without restarting',()=>{
  const h=uiHarness(),s=h.s;s.pauseV048(true);assert.equal(h.doc.activeElement.do,'resume');assert.equal(h.key('ArrowUp').prevented,true);assert.equal(h.doc.activeElement.do,'map');assert.equal(h.key('Tab').prevented,true);assert.equal(h.doc.activeElement.do,'resume');assert.equal(h.key('Tab',{shiftKey:true}).prevented,true);assert.equal(h.doc.activeElement.do,'map');assert.equal(h.key('ArrowDown').prevented,true);assert.equal(h.doc.activeElement.do,'resume');assert.equal(h.key('Escape').prevented,true);assert.equal(s.pausedV048,false);assert.equal(h.modal().hidden,true);assert.equal(s.inputV048.enabled,true);assert.equal(h.starts.length,0);
});

test('reusing a scene instance resets previous finish flags when a new adventure is created',()=>{
  const h=uiHarness(),s=h.s;s.savedFinishV048=true;s.endShownV048=true;s.completingV048=true;s.create();assert.equal(s.savedFinishV048,false);assert.equal(s.endShownV048,false);assert.equal(s.completingV048,false);assert.equal(s.celebrateAt,null);
});
