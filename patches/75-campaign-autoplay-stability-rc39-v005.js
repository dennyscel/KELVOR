(function(P){
'use strict';
const q=new URLSearchParams(location.search);
const ENABLED=(q.get('rc37')==='1'&&q.get('autotest')==='1'&&(q.get('campaignrc38')==='1'||q.get('campaignhero')==='1'));
if(!ENABLED||!P.World01Level01AAAReferenceSceneRC37)return;

const TARGET_MIN_MS=180000,TARGET_MAX_MS=300000;
const JUMP_CUES=[
 [1020,1140,'single'],[5030,5150,'single'],[5480,5600,'single'],[12680,12810,'single'],[13010,13140,'single'],[13350,13490,'double'],[13720,13860,'single'],
 [20180,20320,'single'],[22030,22170,'double'],[23920,24060,'single'],[24300,24440,'single'],[24720,24860,'double'],[27520,27650,'single'],[27780,27910,'single'],
 [28010,28140,'single'],[28240,28370,'single'],[28470,28600,'single'],[31760,31900,'single'],[33440,33580,'double']
];

class CampaignAutoplayRC39V005{
 constructor(scene){
  this.s=scene;this.r=scene.router;this.status='RUNNING';this.startedAt=scene.time.now;this.wallStartedAt=Date.now();
  this.jumpUntil=0;this.attackUntil=0;this.nextJumpAt=0;this.nextAttackAt=0;this.lastProgressAt=scene.time.now;this.lastX=scene.player?.x||scene.spawn.x;
  this.pitState=scene.pitRanges.map(()=>({primary:false,double:false,cleared:false}));this.hazardState=scene.hazards.map(()=>false);
  this.recoveries=0;this.trace=[];this.failReason='';this.lastHearts=scene.hearts;this.damageCount=0;this.proofWalk=false;this.proofRun=false;
  this.publish('start_v005');
 }
 log(event,data={}){this.trace.push({t:Math.round(this.s.time.now-this.startedAt),x:Math.round(this.s.player?.x||0),event,...data});if(this.trace.length>220)this.trace.shift();}
 pulseJump(t,reason,hold=225){if(t<this.nextJumpAt)return false;this.jumpUntil=t+hold;this.nextJumpAt=t+hold+120;this.log('jump',{reason});return true;}
 pulseAttack(t,reason,hold=90){if(t<this.nextAttackAt)return false;this.attackUntil=t+hold;this.nextAttackAt=t+hold+175;this.log('attack',{reason});return true;}
 closedGateNear(x){return this.s.lockGatesRC37.find(g=>!g.open&&Math.abs(g.x-x)<250)||null;}
 aliveForGate(g){return this.s.enemies.filter(e=>e.alive&&e.arenaId===g.arenaId);}
 nearestEnemy(x){let best=null,score=1e9;this.s.enemies.forEach((e,idx)=>{if(!e.alive||!e.sprite?.active)return;const d=e.sprite.x-x;if(d<-70||d>185)return;const s=Math.abs(d)+(e.flying?12:0);if(s<score){score=s;best={e,idx,d};}});return best;}
 hazardAhead(x,playerRight){let best=null,dist=1e9;this.s.hazards.forEach((h,idx)=>{if(this.hazardState[idx])return;if(x>h.right+65){this.hazardState[idx]=true;return;}const d=h.left-playerRight;if(d>=-30&&d<dist){dist=d;best={h,idx,d};}});return best;}
 update(t){
  if(this.status!=='RUNNING')return;const p=this.s.player;if(!p)return;
  if(this.s.goalReached){this.status='PASS';this.r.resetVirtual();this.publish('goal_pass');return;}
  if(Date.now()-this.wallStartedAt>330000){this.status='FAIL';this.failReason='timeout_330s_without_goal';this.r.resetVirtual();this.publish('timeout');return;}
  if(this.s.hearts<this.lastHearts){this.damageCount+=this.lastHearts-this.s.hearts;this.log('damage',{from:this.lastHearts,to:this.s.hearts,source:this.s.lastDamageSource||this.s.lastDeathReason||null});this.lastHearts=this.s.hearts;}
  if(this.s.lifeCycle==='gameover'){this.status='FAIL';this.failReason='game_over_before_goal';this.r.resetVirtual();this.publish('game_over');return;}
  if(this.s.lifeCycle!=='active'){this.r.setVirtualAxis(0,0);this.r.setVirtual('jump',false);this.r.setVirtual('attack',false);this.publish();return;}

  const x=p.x,grounded=p.grounded,vy=p.velocityY,playerRight=x+P.TUNING.bodyWidth*.5;let axis=.88,jumpPlanned=false;
  if(x>this.lastX+10){this.lastX=x;this.lastProgressAt=t;}

  // Explicitly exercise both validated moving attack bindings on safe, obstacle-free early ground.
  if(!this.proofWalk&&x>720&&x<930&&grounded){axis=.42;if(this.pulseAttack(t,'campaign_proof_attack_walk',95))this.proofWalk=true;}
  if(!this.proofRun&&x>1370&&x<1600&&grounded){axis=.96;if(this.pulseAttack(t,'campaign_proof_attack_run',95))this.proofRun=true;}

  const gate=this.closedGateNear(x);
  if(gate){
   const alive=this.aliveForGate(gate);
   if(alive.length){const target=alive.sort((a,b)=>Math.abs(a.sprite.x-x)-Math.abs(b.sprite.x-x))[0];const d=target.sprite.x-x;
    axis=Math.abs(d)<78?Math.sign(d||1)*.18:Math.sign(d||1)*.52;
    if(Math.abs(d)<128)this.pulseAttack(t,'arena_'+gate.arenaId,100);
    if(target.flying&&Math.abs(d)<145&&grounded&&!jumpPlanned){if(this.pulseJump(t,'arena_flying_'+gate.arenaId,260))jumpPlanned=true;}
   } else axis=.22;
  }

  // Proactive combat steering. Attack before contact, reduce closing speed, and re-face an enemy that slipped slightly behind.
  const foe=this.nearestEnemy(x);
  if(foe&&!gate){
   const ad=Math.abs(foe.d);if(ad<135)this.pulseAttack(t,'safety_enemy_'+foe.idx,100);
   if(foe.d<0&&ad<70)axis=-.30;else if(foe.d>=0&&ad<92)axis=.20;else if(foe.d>=0&&ad<150)axis=.52;
   if(foe.e.flying&&foe.d>15&&foe.d<150&&grounded&&!jumpPlanned){if(this.pulseJump(t,'safety_flying_'+foe.idx,255))jumpPlanned=true;}
  }

  // Hazard jumps start earlier than RC37 and keep forward momentum; double-jump only while actually crossing/descending.
  const hz=this.hazardAhead(x,playerRight);
  if(hz){
   if(grounded&&hz.d<=165&&hz.d>=55&&!jumpPlanned){if(this.pulseJump(t,'hazard_'+hz.idx+'_early',270))jumpPlanned=true;}
   if(!grounded&&p.airJumpsRemaining>0&&hz.d<38&&x<hz.h.right+12&&vy>30&&!jumpPlanned){if(this.pulseJump(t,'hazard_'+hz.idx+'_cross',220))jumpPlanned=true;}
   if(hz.d<185&&hz.d>-35)axis=Math.max(axis,.92);
  }

  this.s.pitRanges.forEach(([a,b],idx)=>{const st=this.pitState[idx];if(st.cleared)return;if(x>b+60){st.cleared=true;this.log('pit_cleared',{idx});return;}
   const dist=a-playerRight;if(!st.primary&&grounded&&dist<=118&&dist>=54&&!jumpPlanned){if(this.pulseJump(t,'pit_'+idx+'_primary',270)){st.primary=true;jumpPlanned=true;}}
   if(st.primary&&!st.double&&!grounded&&p.airJumpsRemaining>0&&x>=a+8&&x<=b-4&&vy>15&&!jumpPlanned){if(this.pulseJump(t,'pit_'+idx+'_double',230)){st.double=true;jumpPlanned=true;}}
   if(st.primary&&x<=b+55)axis=Math.max(axis,.96);
  });

  for(let i=0;i<JUMP_CUES.length;i++){const [a,b,kind]=JUMP_CUES[i];if(x<a||x>b||jumpPlanned)continue;
   if(grounded){if(this.pulseJump(t,'cue_'+i,255))jumpPlanned=true;}else if(kind==='double'&&p.airJumpsRemaining>0&&vy>-60){if(this.pulseJump(t,'cue_'+i+'_double',220))jumpPlanned=true;}
  }

  if(t-this.lastProgressAt>2100&&!jumpPlanned){if(this.pulseJump(t,'stuck_recovery',250)){this.recoveries++;this.lastProgressAt=t;}}
  this.r.setVirtualAxis(axis,0);this.r.setVirtual('jump',t<this.jumpUntil);this.r.setVirtual('attack',t<this.attackUntil);this.publish();
 }
 onGoal(){if(this.status==='RUNNING'){this.status='PASS';this.r.resetVirtual();this.publish('goal_pass');}}
 snapshot(){return{status:this.status,version:'RC39_V005_INPUT_ONLY',elapsedMs:Math.round(this.s.time.now-this.startedAt),wallElapsedMs:Date.now()-this.wallStartedAt,targetWindowMs:[TARGET_MIN_MS,TARGET_MAX_MS],x:Math.round(this.s.player?.x||0),hearts:this.s.hearts,coins:this.s.coinsCollected,deaths:this.s.deathSerial,damageCount:this.damageCount,recoveries:this.recoveries,seals:this.s.sealsCollectedRC37||0,checkpoints:this.s.checkpointsActivatedRC37||0,gates:this.s.lockGatesRC37?.map(g=>({id:g.id,open:g.open,defeated:g.defeated,required:g.required}))||[],goalReached:!!this.s.goalReached,failReason:this.failReason,proofWalk:this.proofWalk,proofRun:this.proofRun,trace:this.trace.slice(-45)};}
 publish(event){if(event)this.log(event);const snap=this.snapshot();window.__KELVOR_W01_L01_RC37_QA__=snap;window.__PLATFORMER_AUTOTEST_V04__=snap;window.__KELVOR_RC39_V005_AUTOPLAY_QA__=snap;}
}

const SP=P.World01Level01AAAReferenceSceneRC37.prototype;
SP.startRC37Autotest=function(){
 if(!this.autoplayRC37||this.autoplayRC37.status!=='RUNNING')this.autoplayRC37=new CampaignAutoplayRC39V005(this);
 this.autoPilot=this.autoplayRC37;return this.autoplayRC37.snapshot();
};
P.CampaignAutoplayRC39V005=CampaignAutoplayRC39V005;
window.__KELVOR_RC39_V005_AUTOPLAY_PATCH_READY__=true;
})(PlatformerSNESV04);
