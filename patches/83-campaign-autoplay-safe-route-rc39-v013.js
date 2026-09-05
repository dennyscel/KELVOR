(function(P){
'use strict';
const C=P.CampaignAutoplayRC39V011;if(typeof C!=='function')return;
const proto=C.prototype;
const oldUpdate=proto.update;
const oldSnapshot=proto.snapshot;

function enemyAt(s,idx){const e=s.enemies?.[idx];return e&&e.alive&&e.sprite?.active?e:null;}
function hazardEnvelope(s,x){for(const h of s.hazards||[]){if(x>=h.left-120&&x<=h.right+90)return true;}return false;}
function withSuppressedPulses(self,fn){const pj=self.pulseJump,pa=self.pulseAttack;self.pulseJump=()=>false;self.pulseAttack=()=>false;try{return fn();}finally{self.pulseJump=pj;self.pulseAttack=pa;}}

proto.update=function(t){
 const s=this.s,p=s?.player;
 if(this.status!=='RUNNING'||!p)return oldUpdate.call(this,t);
 const x=p.x,grounded=p.grounded,vy=p.velocityY;

 // 1) Pre-clear the authored beetle before the x=6840 hazard. Fighting it after the hazard cost a heart in every failed trace.
 const beetle=enemyAt(s,1);
 if(beetle&&x>=6300&&x<=6610){
   withSuppressedPulses(this,()=>oldUpdate.call(this,t));
   if(this.status!=='RUNNING'||s.lifeCycle!=='active')return;
   const d=beetle.sprite.x-p.x;
   let axis=d>132?.34:d>82?.10:d>48?0:-.20;
   if(Math.abs(d)<145)this.pulseAttack(t,'preclear_beetle_v013',120);
   this.jumpUntil=0;
   this.r.setVirtualAxis(axis,0);this.r.setVirtual('jump',false);this.r.setVirtual('attack',t<this.attackUntil);this.publish();return;
 }

 // 2) The non-arena bee at x≈7210 is high enough to pass underneath. Previous jump-engage logic caused the second early heart loss.
 const beeEarly=enemyAt(s,2);
 if(beeEarly&&x>=6970&&x<=7460&&!hazardEnvelope(s,x)){
   withSuppressedPulses(this,()=>oldUpdate.call(this,t));
   if(this.status!=='RUNNING'||s.lifeCycle!=='active')return;
   this.jumpUntil=0;this.attackUntil=0;
   this.r.setVirtualAxis(.98,0);this.r.setVirtual('jump',false);this.r.setVirtual('attack',false);this.publish();return;
 }

 // 3) Before the canopy objective, neutralize the first non-arena bee from safe ground using ordinary jump+attack inputs.
 const beeCanopy=enemyAt(s,6);
 if(beeCanopy&&x>=11740&&x<=12170){
   withSuppressedPulses(this,()=>oldUpdate.call(this,t));
   if(this.status!=='RUNNING'||s.lifeCycle!=='active')return;
   const d=beeCanopy.sprite.x-p.x;let axis=d>155?.22:d>55?0:-.16;
   if(Math.abs(d)<165){
     if(grounded)this.pulseJump(t,'preclear_bee6_v013',315);
     else if(p.airJumpsRemaining>0&&vy>25)this.pulseJump(t,'preclear_bee6_double_v013',275);
     this.pulseAttack(t,'preclear_bee6_attack_v013',115);
   }
   this.r.setVirtualAxis(axis,0);this.r.setVirtual('jump',t<this.jumpUntil);this.r.setVirtual('attack',t<this.attackUntil);this.publish();return;
 }

 // Let v011 remain authoritative for normal pits, hazards and arena combat.
 oldUpdate.call(this,t);
 if(this.status!=='RUNNING'||s.lifeCycle!=='active'||hazardEnvelope(s,p.x))return;

 // 4) First mandatory seal: take the authored branch stair. Keep attacking the second canopy bee without stopping the climb.
 const seals=s.sealsCollectedRC37||0;
 if(seals<1&&p.x>=12620&&p.x<=13480){
   const bee7=enemyAt(s,7);let axis=.88;
   if(bee7&&Math.abs(bee7.sprite.x-p.x)<180)this.pulseAttack(t,'seal_dawn_bee_cover_v013',110);
   if(grounded&&p.x>=12640&&p.x<=12820)this.pulseJump(t,'seal_dawn_step1_v013',320);
   else if(grounded&&p.x>=12900&&p.x<=13150)this.pulseJump(t,'seal_dawn_step2_v013',330);
   else if(!grounded&&p.airJumpsRemaining>0&&p.x>=13020&&p.x<=13320&&vy>-120)this.pulseJump(t,'seal_dawn_double_v013',300);
   this.r.setVirtualAxis(axis,0);this.r.setVirtual('jump',t<this.jumpUntil);this.r.setVirtual('attack',t<this.attackUntil);this.publish();
 }
};

proto.snapshot=function(){const s=oldSnapshot.call(this);s.version='RC39_V013_INPUT_ONLY_SAFE_ROUTE';return s;};
P.CampaignAutoplayRC39V013=C;
window.__KELVOR_RC39_V013_AUTOPLAY_PATCH_READY__=true;
})(PlatformerSNESV04);
