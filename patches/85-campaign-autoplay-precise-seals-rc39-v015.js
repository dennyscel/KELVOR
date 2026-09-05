(function(P){
'use strict';
const C=P.CampaignAutoplayRC39V013;if(typeof C!=='function')return;
const proto=C.prototype,oldUpdate=proto.update,oldSnapshot=proto.snapshot;
function enemyAt(s,idx){const e=s.enemies?.[idx];return e&&e.alive&&e.sprite?.active?e:null;}
function gate(s,id){return s.lockGatesRC37?.find(g=>g.id===id)||null;}
function hazard(s,x){for(const h of s.hazards||[]){if(x>=h.left-120&&x<=h.right+90)return true;}return false;}
function suppress(self,fn){const j=self.pulseJump,a=self.pulseAttack;self.pulseJump=()=>false;self.pulseAttack=()=>false;try{return fn();}finally{self.pulseJump=j;self.pulseAttack=a;}}
function drive(self,axis,attack=true){const t=self.s.time.now;self.r.setVirtualAxis(axis,0);self.r.setVirtual('jump',t<self.jumpUntil);self.r.setVirtual('attack',attack&&t<self.attackUntil);self.publish();}

proto.update=function(t){
 const s=this.s,p=s?.player;if(!p)return oldUpdate.call(this,t);
 // Authored checkpoint restart only. No lives/state are added.
 if(s.lifeCycle==='gameover'&&s.checkpointProgressRC37){
   window.__KELVOR_RC39_V015_RETRIES__=(window.__KELVOR_RC39_V015_RETRIES__||0)+1;
   if(window.__KELVOR_RC39_V015_RETRIES__<=3){this.r.resetVirtual();s.restartRun();return;}
 }
 if(this.status!=='RUNNING')return oldUpdate.call(this,t);
 const x=p.x,y=p.y,grounded=p.grounded,vy=p.velocityY,seals=s.sealsCollectedRC37||0;

 // Gate A may open after two kills; the third bee is no longer mandatory. Stay low and pass it.
 const ga=gate(s,'GATE_A'),bee5=enemyAt(s,5);
 if(ga?.open&&bee5&&x>=9180&&x<=9920&&!hazard(s,x)){
   suppress(this,()=>oldUpdate.call(this,t));if(this.status!=='RUNNING'||s.lifeCycle!=='active')return;
   this.jumpUntil=0;this.attackUntil=0;this.r.setVirtualAxis(.98,0);this.r.setVirtual('jump',false);this.r.setVirtual('attack',false);this.publish();return;
 }

 // SEAL_DAWN exact route: do NOT spend the air jump early. Climb toward x13040, then double-jump at height.
 if(seals<1&&x>=12480&&x<=13430){
   suppress(this,()=>oldUpdate.call(this,t));if(this.status!=='RUNNING'||s.lifeCycle!=='active')return;
   const bee7=enemyAt(s,7);
   if(bee7&&Math.abs(bee7.sprite.x-x)<175)this.pulseAttack(t,'seal1_cover_v015',110);
   let axis=.58;
   // Primary launch windows across the authored ascending ledges.
   if(grounded&&x>=12480&&x<12720)this.pulseJump(t,'seal1_primary_a_v015',345);
   else if(grounded&&x>=12720&&x<12960)this.pulseJump(t,'seal1_primary_b_v015',350);
   else if(grounded&&x>=12960&&x<=13095)this.pulseJump(t,'seal1_primary_high_v015',365);
   // Critical change: reserve air jump until high and horizontally close to x13040.
   if(!grounded&&p.airJumpsRemaining>0&&x>=12990&&x<=13135&&y<=128&&vy>-260){
     this.pulseJump(t,'seal1_precise_double_v015',370);axis=.72;
   }
   // Fly through the actual seal x=13280; brake only after its collision column.
   if(x>=13135&&x<13255)axis=.72;
   else if(x>=13255&&x<=13320)axis=.20;
   else if(x>13320)axis=.45;
   drive(this,axis,true);return;
 }

 // SEAL_SPIRIT: double-jump centered on x22080 and brake through the pickup column.
 if(seals<2&&x>=21680&&x<=22310){
   suppress(this,()=>oldUpdate.call(this,t));if(this.status!=='RUNNING'||s.lifeCycle!=='active')return;
   let axis=.55;
   if(grounded&&x>=21720&&x<=21970)this.pulseJump(t,'seal2_primary_v015',355);
   if(!grounded&&p.airJumpsRemaining>0&&x>=21920&&x<=22070&&y<=165&&vy>-180){this.pulseJump(t,'seal2_double_v015',335);axis=.65;}
   if(x>=22030&&x<=22130)axis=.18;
   drive(this,axis,true);return;
 }

 // Optional bee after B: stay low on continuous ground.
 const bee13=enemyAt(s,13);
 if(bee13&&x>=24000&&x<=24660&&!hazard(s,x)){
   suppress(this,()=>oldUpdate.call(this,t));if(this.status!=='RUNNING'||s.lifeCycle!=='active')return;
   this.jumpUntil=0;this.attackUntil=0;this.r.setVirtualAxis(.98,0);this.r.setVirtual('jump',false);this.r.setVirtual('attack',false);this.publish();return;
 }

 // SEAL_GUARDIAN: same exact pickup-column strategy before Gate C.
 if(seals<3&&x>=32940&&x<=33660){
   suppress(this,()=>oldUpdate.call(this,t));if(this.status!=='RUNNING'||s.lifeCycle!=='active')return;
   const bee19=enemyAt(s,19);if(bee19&&Math.abs(bee19.sprite.x-x)<180)this.pulseAttack(t,'seal3_cover_v015',110);
   let axis=.52;
   if(grounded&&x>=33000&&x<=33250)this.pulseJump(t,'seal3_primary_v015',350);
   if(!grounded&&p.airJumpsRemaining>0&&x>=33210&&x<=33430&&y<=175&&vy>-180){this.pulseJump(t,'seal3_double_v015',330);axis=.60;}
   if(x>=33470&&x<=33570)axis=.18;
   drive(this,axis,true);return;
 }

 return oldUpdate.call(this,t);
};
proto.snapshot=function(){const o=oldSnapshot.call(this);o.version='RC39_V015_INPUT_ONLY_PRECISE_SEALS';o.checkpointRetries=window.__KELVOR_RC39_V015_RETRIES__||0;return o;};
P.CampaignAutoplayRC39V015=C;window.__KELVOR_RC39_V015_AUTOPLAY_PATCH_READY__=true;
})(PlatformerSNESV04);
