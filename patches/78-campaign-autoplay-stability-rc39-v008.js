(function(P){
'use strict';
const C=P.CampaignAutoplayRC39V006;if(typeof C!=='function')return;
const proto=C.prototype;
const oldSnapshot=proto.snapshot;

proto.update=function(t){
 if(this.status!=='RUNNING')return;const s=this.s,p=s.player;if(!p)return;
 if(s.goalReached){this.status='PASS';this.r.resetVirtual();this.publish('goal_pass');return;}
 if(Date.now()-this.wallStartedAt>330000){this.status='FAIL';this.failReason='timeout_330s_without_goal';this.r.resetVirtual();this.publish('timeout');return;}
 if(s.lifeCycle==='gameover'){this.status='FAIL';this.failReason='game_over_before_goal';this.r.resetVirtual();this.publish('game_over');return;}
 if(s.hearts<this.lastHearts){this.damageCount+=this.lastHearts-s.hearts;this.log('damage',{from:this.lastHearts,to:s.hearts,source:s.lastDamageSource||s.lastDeathReason||null});this.lastHearts=s.hearts;}
 if(s.lifeCycle!=='active'){this.r.setVirtualAxis(0,0);this.r.setVirtual('jump',false);this.r.setVirtual('attack',false);this.publish();return;}
 const x=p.x,grounded=p.grounded,vy=p.velocityY,playerRight=x+P.TUNING.bodyWidth*.5;
 if(x>this.lastX+10){this.lastX=x;this.lastProgressAt=t;}
 let axis=.90,jumpPlanned=false;

 if(!this.proofWalk&&x>720&&x<930&&grounded){axis=.42;if(this.pulseAttack(t,'campaign_proof_attack_walk',95))this.proofWalk=true;}
 if(!this.proofRun&&x>1370&&x<1600&&grounded){axis=.96;if(this.pulseAttack(t,'campaign_proof_attack_run',95))this.proofRun=true;}

 // Pit traversal: proven v006 timing, with full forward pressure while airborne.
 s.pitRanges.forEach(([a,b],idx)=>{const st=this.pitState[idx];if(st.cleared)return;if(x>b+60){st.cleared=true;this.log('pit_cleared',{idx});return;}
   const dist=a-playerRight;
   if(!st.primary&&grounded&&dist<=100&&dist>=48&&!jumpPlanned){if(this.pulseJump(t,'pit_'+idx+'_primary',280)){st.primary=true;jumpPlanned=true;}}
   if(st.primary&&!st.double&&!grounded&&p.airJumpsRemaining>0&&x>=a+2&&x<=b-4&&vy>-5&&!jumpPlanned){if(this.pulseJump(t,'pit_'+idx+'_double',245)){st.double=true;jumpPlanned=true;}}
   if(st.primary&&x<=b+55)axis=Math.max(axis,.96);
 });

 // Hazard priority v008. Never stop to fight while a hazard is the immediate geometry problem.
 let activeHazard=null;
 for(let idx=0;idx<s.hazards.length;idx++){
   const h=s.hazards[idx];if(this.hazardState[idx])continue;if(x>h.right+70){this.hazardState[idx]=true;continue;}
   const d=h.left-playerRight;if(d>-70&&d<225){activeHazard={h,idx,d};break;}
 }
 let hazardPriority=false;
 if(activeHazard){const {h,idx,d}=activeHazard;hazardPriority=d<175;
   if(grounded&&d<=112&&d>=54&&!jumpPlanned){if(this.pulseJump(t,'hazard_'+idx+'_v008_takeoff',330)){jumpPlanned=true;}}
   if(grounded&&d<54&&d>-20&&!jumpPlanned){if(this.pulseJump(t,'hazard_'+idx+'_v008_emergency',340)){jumpPlanned=true;}}
   const crossing=x>=h.left-30&&x<=h.right+42;
   if(!grounded&&p.airJumpsRemaining>0&&crossing&&vy>-70&&!jumpPlanned){if(this.pulseJump(t,'hazard_'+idx+'_v008_extend',295)){jumpPlanned=true;}}
   // Speed through the narrow danger region; slowing inside it caused v007 regression.
   if(d<175||crossing)axis=Math.max(axis,.94);
 }

 // Authored seal routes. Ordinary jump inputs only; no teleport or collision bypass.
 const seals=s.sealsCollectedRC37||0;
 if(seals<1&&x>=12740&&x<=13480){
   axis=Math.min(axis,.62);
   if(grounded&&x>=12880&&x<=13120&&!jumpPlanned){if(this.pulseJump(t,'seal_dawn_v008_primary',320))jumpPlanned=true;}
   if(!grounded&&p.airJumpsRemaining>0&&x>=13100&&x<=13380&&vy>-110&&!jumpPlanned){if(this.pulseJump(t,'seal_dawn_v008_double',285))jumpPlanned=true;}
 }
 if(seals<2&&x>=21620&&x<=22280){
   axis=Math.min(axis,.58);
   if(grounded&&x>=21720&&x<=21950&&!jumpPlanned){if(this.pulseJump(t,'seal_spirit_v008_primary',325))jumpPlanned=true;}
   if(!grounded&&p.airJumpsRemaining>0&&x>=21920&&x<=22180&&vy>-110&&!jumpPlanned){if(this.pulseJump(t,'seal_spirit_v008_double',285))jumpPlanned=true;}
 }
 if(seals<3&&x>=33000&&x<=33720){
   axis=Math.min(axis,.58);
   if(grounded&&x>=33120&&x<=33320&&!jumpPlanned){if(this.pulseJump(t,'seal_guardian_v008_primary',325))jumpPlanned=true;}
   if(!grounded&&p.airJumpsRemaining>0&&x>=33300&&x<=33600&&vy>-110&&!jumpPlanned){if(this.pulseJump(t,'seal_guardian_v008_double',290))jumpPlanned=true;}
 }

 const cues=[[1020,1140,'single'],[5030,5150,'single'],[5480,5600,'single'],[12680,12810,'single'],[13010,13140,'single'],[13350,13490,'double'],[13720,13860,'single'],[20180,20320,'single'],[22030,22170,'double'],[23920,24060,'single'],[24300,24440,'single'],[24720,24860,'double'],[27520,27650,'single'],[27780,27910,'single'],[28010,28140,'single'],[28240,28370,'single'],[28470,28600,'single'],[31760,31900,'single'],[33440,33580,'double']];
 for(let i=0;i<cues.length;i++){const [a,b,kind]=cues[i];if(x<a||x>b||jumpPlanned)continue;
   if(grounded){if(this.pulseJump(t,'cue_'+i,255))jumpPlanned=true;}else if(kind==='double'&&p.airJumpsRemaining>0&&vy>-80){if(this.pulseJump(t,'cue_'+i+'_double',225))jumpPlanned=true;}
 }

 const gate=this.closedGateNear(x);
 if(gate&&!hazardPriority){
   const alive=this.aliveForGate(gate);
   if(alive.length){
     alive.sort((a,b)=>Math.abs(a.sprite.x-x)-Math.abs(b.sprite.x-x));const target=alive[0];const d=target.sprite.x-x,ad=Math.abs(d);
     axis=ad<28?0:Math.sign(d)*.48;
     if(ad<105)this.pulseAttack(t,'arena_v008_'+gate.arenaId,110);
     if(target.flying&&ad<140&&grounded&&!jumpPlanned){if(this.pulseJump(t,'arena_flying_v008_'+gate.arenaId,285))jumpPlanned=true;}
     if(!target.flying&&ad<72&&grounded&&!jumpPlanned){if(this.pulseJump(t,'arena_ground_v008_'+gate.arenaId,285))jumpPlanned=true;}
   }else axis=.22;
 } else if(!hazardPriority){
   // Outside locked arenas, survival beats unnecessary combat: vault ordinary enemies and keep moving.
   let nearest=null,best=1e9;
   s.enemies.forEach((e,idx)=>{if(!e.alive||!e.sprite?.active||e.arenaId)return;const d=e.sprite.x-x;if(d<-25||d>165)return;if(Math.abs(d)<best){best=Math.abs(d);nearest={e,idx,d};}});
   if(nearest){const {e,idx,d}=nearest;
     if(d>0&&d<145){
       if(grounded&&!jumpPlanned){if(this.pulseJump(t,'avoid_enemy_v008_'+idx,e.flying?300:285))jumpPlanned=true;}
       if(Math.abs(d)<105)this.pulseAttack(t,'pass_attack_v008_'+idx,105);
       axis=Math.max(axis,.88);
     }
   }
 } else {
   // Attack is allowed during a danger crossing, but movement is never reduced or stopped.
   let near=null,best=1e9;
   s.enemies.forEach((e,idx)=>{if(!e.alive||!e.sprite?.active)return;const d=e.sprite.x-x;if(d<-35||d>110)return;if(Math.abs(d)<best){best=Math.abs(d);near={idx,d};}});
   if(near&&Math.abs(near.d)<90)this.pulseAttack(t,'hazard_pass_attack_v008_'+near.idx,100);
   axis=Math.max(axis,.94);
 }

 if(t-this.lastProgressAt>2400&&!jumpPlanned){if(this.pulseJump(t,'stuck_recovery_v008',270)){this.recoveries++;this.lastProgressAt=t;}}
 this.r.setVirtualAxis(axis,0);this.r.setVirtual('jump',t<this.jumpUntil);this.r.setVirtual('attack',t<this.attackUntil);this.publish();
};
proto.snapshot=function(){const s=oldSnapshot.call(this);s.version='RC39_V008_INPUT_ONLY';return s;};
P.CampaignAutoplayRC39V008=C;
window.__KELVOR_RC39_V008_AUTOPLAY_PATCH_READY__=true;
})(PlatformerSNESV04);
