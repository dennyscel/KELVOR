(function(P){
'use strict';
const C=P.CampaignAutoplayRC39V011;if(typeof C!=='function')return;
const proto=C.prototype;
const oldSnapshot=proto.snapshot;
const oldUpdate=proto.update;

function hazardEnvelope(s,x){
 for(let idx=0;idx<s.hazards.length;idx++){
   const h=s.hazards[idx];
   if(x>=h.left-120&&x<=h.right+90)return true;
 }
 return false;
}

proto.update=function(t){
 const s=this.s,p=s?.player;
 oldUpdate.call(this,t);
 if(this.status!=='RUNNING'||!p||s.lifeCycle!=='active')return;
 const x=p.x,grounded=p.grounded,vy=p.velocityY;
 if(hazardEnvelope(s,x))return; // v011 remains authoritative near damage geometry.

 let axis=null;
 let objective=false;
 const seals=s.sealsCollectedRC37||0;

 // Authored seal routes. Only normal movement/jump inputs are used.
 if(seals<1&&x>=12720&&x<=13460){
   objective=true;axis=.92;
   if(grounded&&x>=12740&&x<=13130)this.pulseJump(t,'seal_dawn_v012_primary',355);
   if(!grounded&&p.airJumpsRemaining>0&&x>=12930&&x<=13240&&vy>-250)this.pulseJump(t,'seal_dawn_v012_double',330);
 }
 else if(seals<2&&x>=21660&&x<=22260){
   objective=true;axis=.90;
   if(grounded&&x>=21700&&x<=21960)this.pulseJump(t,'seal_spirit_v012_primary',345);
   if(!grounded&&p.airJumpsRemaining>0&&x>=21880&&x<=22140&&vy>-220)this.pulseJump(t,'seal_spirit_v012_double',315);
 }
 else if(seals<3&&x>=33080&&x<=33620){
   objective=true;axis=.90;
   if(grounded&&x>=33110&&x<=33350)this.pulseJump(t,'seal_guardian_v012_primary',345);
   if(!grounded&&p.airJumpsRemaining>0&&x>=33280&&x<=33560&&vy>-220)this.pulseJump(t,'seal_guardian_v012_double',315);
 }

 // Non-arena flying enemies are traversal pressure, not mandatory combat.
 // Keep momentum, jump through/under them, and strike without stopping.
 let fly=null,best=1e9;
 s.enemies.forEach((e,idx)=>{
   if(!e.alive||!e.sprite?.active||!e.flying||e.arenaId)return;
   const d=e.sprite.x-x;if(d<-28||d>230)return;
   const ad=Math.abs(d);if(ad<best){best=ad;fly={e,idx,d};}
 });
 if(fly){
   const {idx,d}=fly;axis=Math.max(axis??0,.94);
   this.pulseAttack(t,'flyby_v012_'+idx,105);
   if(grounded&&d>20&&d<185)this.pulseJump(t,'flyby_jump_v012_'+idx,305);
   else if(!grounded&&p.airJumpsRemaining>0&&d>-5&&d<125&&vy>-80)this.pulseJump(t,'flyby_double_v012_'+idx,285);
 }

 if(axis!==null){
   this.r.setVirtualAxis(axis,0);
   this.r.setVirtual('jump',t<this.jumpUntil);
   this.r.setVirtual('attack',t<this.attackUntil);
   this.publish();
 }
};

proto.snapshot=function(){const s=oldSnapshot.call(this);s.version='RC39_V012_INPUT_ONLY_OBJECTIVES';return s;};
P.CampaignAutoplayRC39V012=C;
window.__KELVOR_RC39_V012_AUTOPLAY_PATCH_READY__=true;
})(PlatformerSNESV04);
