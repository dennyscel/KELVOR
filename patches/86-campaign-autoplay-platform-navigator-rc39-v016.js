(function(P){
'use strict';
const C=P.CampaignAutoplayRC39V013;if(typeof C!=='function')return;
const proto=C.prototype,oldUpdate=proto.update,oldSnapshot=proto.snapshot;
const CLAMP=(v,a,b)=>Math.max(a,Math.min(b,v));
function enemyAt(s,idx){const e=s.enemies?.[idx];return e&&e.alive&&e.sprite?.active?e:null;}
function gate(s,id){return s.lockGatesRC37?.find(g=>g.id===id)||null;}
function hazard(s,x){for(const h of s.hazards||[]){if(x>=h.left-120&&x<=h.right+90)return true;}return false;}
function suppress(self,fn){const j=self.pulseJump,a=self.pulseAttack;self.pulseJump=()=>false;self.pulseAttack=()=>false;try{return fn();}finally{self.pulseJump=j;self.pulseAttack=a;}}
function setInput(self,axis,allowAttack=true){const t=self.s.time.now;self.r.setVirtualAxis(CLAMP(axis,-1,1),0);self.r.setVirtual('jump',t<self.jumpUntil);self.r.setVirtual('attack',allowAttack&&t<self.attackUntil);self.publish();}
function pdAxis(p,target,max=.98){const dx=target-p.x;const v=p.velocityX||0;return CLAMP(dx/105-(v/235)*.42,-max,max);}
function targetY(s,x){const top=s.platformTopByX?.get(x);return Number.isFinite(top)?top-P.TUNING.bodyHeight/2:null;}
function onPlatform(s,p,x){const ty=targetY(s,x);return ty!==null&&p.grounded&&Math.abs(p.x-x)<58&&Math.abs(p.y-ty)<10;}

proto.update=function(t){
 const s=this.s,p=s?.player;if(!p)return oldUpdate.call(this,t);
 if(s.lifeCycle==='gameover'&&s.checkpointProgressRC37){window.__KELVOR_RC39_V016_RETRIES__=(window.__KELVOR_RC39_V016_RETRIES__||0)+1;if(window.__KELVOR_RC39_V016_RETRIES__<=3){this.r.resetVirtual();s.restartRun();return;}}
 if(this.status!=='RUNNING')return oldUpdate.call(this,t);
 const x=p.x,y=p.y,vy=p.velocityY,seals=s.sealsCollectedRC37||0;

 // Do not pay a life for the optional third Gate-A bee after the gate is already open.
 const ga=gate(s,'GATE_A'),bee5=enemyAt(s,5);
 if(ga?.open&&bee5&&x>=9180&&x<=9920&&!hazard(s,x)){
   suppress(this,()=>oldUpdate.call(this,t));if(this.status!=='RUNNING'||s.lifeCycle!=='active')return;
   this.jumpUntil=0;this.attackUntil=0;this.r.setVirtualAxis(.98,0);this.r.setVirtual('jump',false);this.r.setVirtual('attack',false);this.publish();return;
 }

 // Exact platform navigator for SEAL_DAWN. All motion is normal InputRouter movement/jumps.
 if(seals<1&&x>=12050&&x<=13520){
   suppress(this,()=>oldUpdate.call(this,t));if(this.status!=='RUNNING'||s.lifeCycle!=='active')return;
   if(!this.__seal1Nav)this.__seal1Nav={stage:0,attempts:0};
   const nav=this.__seal1Nav,targets=[12300,12690,13040];
   if(nav.stage<targets.length){
     const tx=targets[nav.stage],ty=targetY(s,tx);
     if(onPlatform(s,p,tx)){nav.stage++;this.log('seal1_platform_landed_v016',{stage:nav.stage,x:Math.round(p.x),y:Math.round(p.y)});this.jumpUntil=0;setInput(this,0,false);return;}
     let axis=pdAxis(p,tx,.98);
     // When on ground/previous ledge, launch. Reserve double jump until near apex to gain maximum height.
     if(p.grounded&&Math.abs(tx-p.x)<430)this.pulseJump(t,'seal1_platform_'+nav.stage+'_primary_v016',370);
     if(!p.grounded&&p.airJumpsRemaining>0&&vy>-90&&y<215)this.pulseJump(t,'seal1_platform_'+nav.stage+'_double_v016',360);
     const bee7=enemyAt(s,7);if(bee7&&Math.abs(bee7.sprite.x-p.x)<150)this.pulseAttack(t,'seal1_platform_cover_v016',105);
     setInput(this,axis,true);return;
   }
   // From the x13040 high ledge, fly through the actual seal at x13280,y≈29.
   let axis=pdAxis(p,13280,.88);
   if(p.grounded&&p.x>=12970&&p.x<=13110)this.pulseJump(t,'seal1_pickup_primary_v016',380);
   if(!p.grounded&&p.airJumpsRemaining>0&&p.x>=13100&&p.x<=13220&&vy>-120)this.pulseJump(t,'seal1_pickup_double_v016',350);
   if(p.x>=13245&&p.x<=13310)axis=.05;
   const bee7=enemyAt(s,7);if(bee7&&Math.abs(bee7.sprite.x-p.x)<160)this.pulseAttack(t,'seal1_pickup_cover_v016',105);
   setInput(this,axis,true);return;
 }

 // Seal 2: target its supporting ledge x22140, then brake into pickup x22080.
 if(seals<2&&x>=21620&&x<=22340){
   suppress(this,()=>oldUpdate.call(this,t));if(this.status!=='RUNNING'||s.lifeCycle!=='active')return;
   const tx=22140;let axis=pdAxis(p,tx,.86);
   if(p.grounded&&Math.abs(tx-p.x)<430)this.pulseJump(t,'seal2_platform_primary_v016',370);
   if(!p.grounded&&p.airJumpsRemaining>0&&vy>-90&&y<215)this.pulseJump(t,'seal2_platform_double_v016',350);
   if(p.x>=22045&&p.x<=22115)axis=-.04;
   setInput(this,axis,true);return;
 }

 // Avoid optional bee13 on continuous ground after Gate B.
 const bee13=enemyAt(s,13);if(bee13&&x>=24000&&x<=24660&&!hazard(s,x)){
   suppress(this,()=>oldUpdate.call(this,t));if(this.status!=='RUNNING'||s.lifeCycle!=='active')return;
   this.jumpUntil=0;this.attackUntil=0;this.r.setVirtualAxis(.98,0);this.r.setVirtual('jump',false);this.r.setVirtual('attack',false);this.publish();return;
 }

 // Seal 3: target the authored x33470 ledge and intersect pickup x33520.
 if(seals<3&&x>=32900&&x<=33700){
   suppress(this,()=>oldUpdate.call(this,t));if(this.status!=='RUNNING'||s.lifeCycle!=='active')return;
   const tx=33470;let axis=pdAxis(p,tx,.86);
   if(p.grounded&&Math.abs(tx-p.x)<430)this.pulseJump(t,'seal3_platform_primary_v016',370);
   if(!p.grounded&&p.airJumpsRemaining>0&&vy>-90&&y<215)this.pulseJump(t,'seal3_platform_double_v016',350);
   if(p.x>=33485&&p.x<=33555)axis=.03;
   const bee19=enemyAt(s,19);if(bee19&&Math.abs(bee19.sprite.x-p.x)<150)this.pulseAttack(t,'seal3_cover_v016',105);
   setInput(this,axis,true);return;
 }
 return oldUpdate.call(this,t);
};
proto.snapshot=function(){const o=oldSnapshot.call(this);o.version='RC39_V016_INPUT_ONLY_PLATFORM_NAV';o.checkpointRetries=window.__KELVOR_RC39_V016_RETRIES__||0;o.seal1Nav=this.__seal1Nav||null;return o;};
P.CampaignAutoplayRC39V016=C;window.__KELVOR_RC39_V016_AUTOPLAY_PATCH_READY__=true;
})(PlatformerSNESV04);
