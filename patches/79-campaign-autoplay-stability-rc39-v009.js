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
 let axis=.88,jumpPlanned=false;

 if(!this.proofWalk&&x>720&&x<930&&grounded){axis=.42;if(this.pulseAttack(t,'campaign_proof_attack_walk',95))this.proofWalk=true;}
 if(!this.proofRun&&x>1370&&x<1600&&grounded){axis=.96;if(this.pulseAttack(t,'campaign_proof_attack_run',95))this.proofRun=true;}

 s.pitRanges.forEach(([a,b],idx)=>{const st=this.pitState[idx];if(st.cleared)return;if(x>b+60){st.cleared=true;this.log('pit_cleared',{idx});return;}
   const dist=a-playerRight;if(!st.primary&&grounded&&dist<=96&&dist>=45&&!jumpPlanned){if(this.pulseJump(t,'pit_'+idx+'_primary',270)){st.primary=true;jumpPlanned=true;}}
   if(st.primary&&!st.double&&!grounded&&p.airJumpsRemaining>0&&x>=a+5&&x<=b-6&&vy>5&&!jumpPlanned){if(this.pulseJump(t,'pit_'+idx+'_double',235)){st.double=true;jumpPlanned=true;}}
   if(st.primary&&x<=b+50)axis=Math.max(axis,.94);
 });

 let activeHazard=null;
 for(let idx=0;idx<s.hazards.length;idx++){
   const h=s.hazards[idx];if(this.hazardState[idx])continue;if(x>h.right+60){this.hazardState[idx]=true;continue;}
   const d=h.left-playerRight;if(d>-55&&d<210){activeHazard={h,idx,d};break;}
 }
 let hazardPriority=false;
 if(activeHazard){const {h,idx,d}=activeHazard;const late=idx>=3;hazardPriority=d<165&&x<h.right+35;
   const max=late?125:88,min=late?72:52;
   if(grounded&&d<=max&&d>=min&&!jumpPlanned){if(this.pulseJump(t,'hazard_'+idx+'_v009_takeoff',late?345:320)){jumpPlanned=true;axis=late?.94:.84;}}
   const crossing=x>=h.left-22&&x<=h.right+30;
   if(!grounded&&p.airJumpsRemaining>0&&crossing&&vy>(late?-50:0)&&!jumpPlanned){if(this.pulseJump(t,'hazard_'+idx+'_v009_extend',late?305:285)){jumpPlanned=true;}}
   if(late&&hazardPriority)axis=Math.max(axis,.95);else if(crossing)axis=Math.min(axis,.72);else if(d<120)axis=Math.min(axis,.84);
   if(hazardPriority)this.attackUntil=0;
 }

 const cues=[[1020,1140,'single'],[5030,5150,'single'],[5480,5600,'single'],[12680,12810,'single'],[13010,13140,'single'],[13350,13490,'double'],[13720,13860,'single'],[20180,20320,'single'],[22030,22170,'double'],[23920,24060,'single'],[24300,24440,'single'],[24720,24860,'double'],[27520,27650,'single'],[27780,27910,'single'],[28010,28140,'single'],[28240,28370,'single'],[28470,28600,'single'],[31760,31900,'single'],[33440,33580,'double']];
 for(let i=0;i<cues.length;i++){const [a,b,kind]=cues[i];if(x<a||x>b||jumpPlanned)continue;
   if(grounded){if(this.pulseJump(t,'cue_'+i,255))jumpPlanned=true;}else if(kind==='double'&&p.airJumpsRemaining>0&&vy>-80){if(this.pulseJump(t,'cue_'+i+'_double',225))jumpPlanned=true;}
 }

 if(!hazardPriority){
   let nearest=null,best=1e9;
   s.enemies.forEach((e,idx)=>{if(!e.alive||!e.sprite?.active)return;const d=e.sprite.x-x;if(d<-38||d>190)return;const score=Math.abs(d)+(e.flying?18:0);if(score<best){best=score;nearest={e,idx,d};}});
   if(nearest){const {e,idx,d}=nearest,ad=Math.abs(d);
     if(e.flying){if(d>0&&d<155){axis=Math.min(axis,.45);this.pulseAttack(t,'flying_v009_'+idx,105);if(grounded&&!jumpPlanned){if(this.pulseJump(t,'flying_jump_v009_'+idx,265))jumpPlanned=true;}}}
     else if(d>=0){if(d<150){axis=d>105?.36:d>78?.12:0;this.pulseAttack(t,'ground_hold_v009_'+idx,110);}if(d<62&&!jumpPlanned&&grounded){if(this.pulseJump(t,'ground_vault_v009_'+idx,275))jumpPlanned=true;}}
     else if(ad<38){axis=0;this.pulseAttack(t,'ground_overlap_v009_'+idx,110);}
   }
 }

 const gate=this.closedGateNear(x);if(gate&&!hazardPriority){const alive=this.aliveForGate(gate);if(alive.length){axis=Math.min(axis,.18);}else axis=.22;}
 if(t-this.lastProgressAt>2300&&!jumpPlanned){if(this.pulseJump(t,'stuck_recovery_v009',250)){this.recoveries++;this.lastProgressAt=t;}}
 this.r.setVirtualAxis(axis,0);this.r.setVirtual('jump',t<this.jumpUntil);this.r.setVirtual('attack',!hazardPriority&&t<this.attackUntil);this.publish();
};
proto.snapshot=function(){const s=oldSnapshot.call(this);s.version='RC39_V009_INPUT_ONLY';return s;};
P.CampaignAutoplayRC39V009=C;
window.__KELVOR_RC39_V009_AUTOPLAY_PATCH_READY__=true;
})(PlatformerSNESV04);
