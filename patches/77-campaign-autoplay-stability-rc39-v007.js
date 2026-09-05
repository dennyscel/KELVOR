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
 const cautious=s.hearts<=1;
 if(x>this.lastX+10){this.lastX=x;this.lastProgressAt=t;}
 let axis=.88,jumpPlanned=false;

 if(!this.proofWalk&&x>720&&x<930&&grounded){axis=.42;if(this.pulseAttack(t,'campaign_proof_attack_walk',95))this.proofWalk=true;}
 if(!this.proofRun&&x>1370&&x<1600&&grounded){axis=.96;if(this.pulseAttack(t,'campaign_proof_attack_run',95))this.proofRun=true;}

 // Pits: keep normal game physics and InputRouter only. At low health, start a little earlier and preserve air speed.
 s.pitRanges.forEach(([a,b],idx)=>{const st=this.pitState[idx];if(st.cleared)return;if(x>b+60){st.cleared=true;this.log('pit_cleared',{idx});return;}
   const dist=a-playerRight;const hi=cautious?112:96,lo=cautious?58:45;
   if(!st.primary&&grounded&&dist<=hi&&dist>=lo&&!jumpPlanned){if(this.pulseJump(t,'pit_'+idx+'_primary',cautious?300:270)){st.primary=true;jumpPlanned=true;}}
   if(st.primary&&!st.double&&!grounded&&p.airJumpsRemaining>0&&x>=a-2&&x<=b-2&&vy>-20&&!jumpPlanned){if(this.pulseJump(t,'pit_'+idx+'_double',cautious?260:235)){st.double=true;jumpPlanned=true;}}
   if(st.primary&&x<=b+50)axis=Math.max(axis,.92);
 });

 // Hazard v007: evidence-driven fix for the fatal second Sunken Clearing hazard near x=16180.
 // Earlier takeoff + lower approach pressure + earlier double-jump when health is critical.
 let activeHazard=null;
 for(let idx=0;idx<s.hazards.length;idx++){
   const h=s.hazards[idx];if(this.hazardState[idx])continue;if(x>h.right+62){this.hazardState[idx]=true;continue;}
   const d=h.left-playerRight;if(d>-55&&d<(cautious?210:190)){activeHazard={h,idx,d};break;}
 }
 if(activeHazard){const {h,idx,d}=activeHazard;const earlyCritical=cautious&&idx>=2;
   const takeoffMax=earlyCritical?142:(cautious?126:92);const takeoffMin=earlyCritical?92:(cautious?72:52);
   if(grounded&&d<=takeoffMax&&d>=takeoffMin&&!jumpPlanned){if(this.pulseJump(t,'hazard_'+idx+'_v007_takeoff',earlyCritical?350:325)){jumpPlanned=true;axis=earlyCritical?.62:.78;}}
   if(grounded&&d<takeoffMin&&d>-10&&!jumpPlanned){if(this.pulseJump(t,'hazard_'+idx+'_v007_emergency',350)){jumpPlanned=true;axis=.58;}}
   const crossing=x>=h.left-26&&x<=h.right+28;
   if(!grounded&&p.airJumpsRemaining>0&&crossing&&vy>(earlyCritical?-90:-20)&&!jumpPlanned){if(this.pulseJump(t,'hazard_'+idx+'_v007_extend',300)){jumpPlanned=true;}}
   if(crossing)axis=Math.min(axis,earlyCritical?.58:.68);else if(d<160)axis=Math.min(axis,earlyCritical?.66:.80);
 }

 // Seal 1 route: the v006 trace crossed this zone without collecting SEAL_DAWN.
 // Use only ordinary jump/double-jump inputs and slower forward pressure to intersect the authored platform seal.
 if((s.sealsCollectedRC37||0)<1&&x>=12840&&x<=13440){
   axis=Math.min(axis,.48);
   if(grounded&&x>=12920&&x<=13140&&!jumpPlanned){if(this.pulseJump(t,'seal_dawn_v007_primary',320))jumpPlanned=true;}
   if(!grounded&&p.airJumpsRemaining>0&&x>=13100&&x<=13340&&vy>-95&&!jumpPlanned){if(this.pulseJump(t,'seal_dawn_v007_double',285))jumpPlanned=true;}
 }

 const cues=[[1020,1140,'single'],[5030,5150,'single'],[5480,5600,'single'],[12680,12810,'single'],[13010,13140,'single'],[13350,13490,'double'],[13720,13860,'single'],[20180,20320,'single'],[22030,22170,'double'],[23920,24060,'single'],[24300,24440,'single'],[24720,24860,'double'],[27520,27650,'single'],[27780,27910,'single'],[28010,28140,'single'],[28240,28370,'single'],[28470,28600,'single'],[31760,31900,'single'],[33440,33580,'double']];
 for(let i=0;i<cues.length;i++){const [a,b,kind]=cues[i];if(x<a||x>b||jumpPlanned)continue;
   if(grounded){if(this.pulseJump(t,'cue_'+i,255))jumpPlanned=true;}else if(kind==='double'&&p.airJumpsRemaining>0&&vy>-80){if(this.pulseJump(t,'cue_'+i+'_double',225))jumpPlanned=true;}
 }

 // Combat v007: low-health mode begins pressure earlier but still uses only normal attack/jump inputs.
 let nearest=null,best=1e9;
 s.enemies.forEach((e,idx)=>{if(!e.alive||!e.sprite?.active)return;const d=e.sprite.x-x;if(d<-42||d>(cautious?230:190))return;const score=Math.abs(d)+(e.flying?18:0);if(score<best){best=score;nearest={e,idx,d};}});
 if(nearest){const {e,idx,d}=nearest,ad=Math.abs(d);
   if(e.flying){if(d>0&&d<(cautious?205:155)){axis=Math.min(axis,cautious?.28:.45);this.pulseAttack(t,'flying_v007_'+idx,110);if(grounded&&!jumpPlanned&&d<165){if(this.pulseJump(t,'flying_jump_v007_'+idx,285))jumpPlanned=true;}}}
   else if(d>=0){const engage=cautious?195:150;if(d<engage){axis=d>(cautious?145:105)?(cautious?.22:.36):d>82?.08:0;this.pulseAttack(t,'ground_hold_v007_'+idx,115);}
     if(d<(cautious?92:62)&&!jumpPlanned&&grounded){if(this.pulseJump(t,'ground_vault_v007_'+idx,300))jumpPlanned=true;}
   }else if(ad<42){axis=0;this.pulseAttack(t,'ground_overlap_v007_'+idx,115);}
 }

 const gate=this.closedGateNear(x);if(gate){const alive=this.aliveForGate(gate);if(alive.length){axis=Math.min(axis,.16);}else axis=.22;}
 if(t-this.lastProgressAt>2300&&!jumpPlanned){if(this.pulseJump(t,'stuck_recovery_v007',265)){this.recoveries++;this.lastProgressAt=t;}}
 this.r.setVirtualAxis(axis,0);this.r.setVirtual('jump',t<this.jumpUntil);this.r.setVirtual('attack',t<this.attackUntil);this.publish();
};
proto.snapshot=function(){const s=oldSnapshot.call(this);s.version='RC39_V007_INPUT_ONLY';return s;};
P.CampaignAutoplayRC39V007=C;
window.__KELVOR_RC39_V007_AUTOPLAY_PATCH_READY__=true;
})(PlatformerSNESV04);
