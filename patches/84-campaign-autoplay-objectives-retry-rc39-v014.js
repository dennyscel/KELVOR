(function(P){
'use strict';
const C=P.CampaignAutoplayRC39V013;if(typeof C!=='function')return;
const proto=C.prototype,oldUpdate=proto.update,oldSnapshot=proto.snapshot;
function enemyAt(s,idx){const e=s.enemies?.[idx];return e&&e.alive&&e.sprite?.active?e:null;}
function gateBy(s,id){return s.lockGatesRC37?.find(g=>g.id===id)||null;}
function hz(s,x){for(const h of s.hazards||[]){if(x>=h.left-120&&x<=h.right+90)return true;}return false;}
function suppress(self,fn){const pj=self.pulseJump,pa=self.pulseAttack;self.pulseJump=()=>false;self.pulseAttack=()=>false;try{return fn();}finally{self.pulseJump=pj;self.pulseAttack=pa;}}
function apply(self,axis){self.r.setVirtualAxis(axis,0);self.r.setVirtual('jump',self.s.time.now<self.jumpUntil);self.r.setVirtual('attack',self.s.time.now<self.attackUntil);self.publish();}
function routeSeal(self,t,cfg){
 const s=self.s,p=s.player,x=p.x,grounded=p.grounded,vy=p.velocityY;
 suppress(self,()=>oldUpdate.call(self,t));
 if(self.status!=='RUNNING'||s.lifeCycle!=='active')return true;
 let axis=.48;
 for(const [a,b,hold,name] of cfg.steps){if(grounded&&x>=a&&x<=b)self.pulseJump(t,name,hold);}
 if(!grounded&&p.airJumpsRemaining>0&&x>=cfg.double[0]&&x<=cfg.double[1]&&vy>-95)self.pulseJump(t,cfg.double[2],315);
 if(cfg.coverEnemy!==undefined){const e=enemyAt(s,cfg.coverEnemy);if(e&&Math.abs(e.sprite.x-x)<185)self.pulseAttack(t,cfg.attackName,110);}
 apply(self,axis);return true;
}

proto.update=function(t){
 const s=this.s,p=s?.player;
 if(!p)return oldUpdate.call(this,t);

 // Normal checkpoint retry. No state is invented: the scene's own restartRun restores only authored checkpoint progress.
 if(s.lifeCycle==='gameover'&&s.checkpointProgressRC37){
   window.__KELVOR_RC39_V014_RETRIES__=(window.__KELVOR_RC39_V014_RETRIES__||0)+1;
   if(window.__KELVOR_RC39_V014_RETRIES__<=3){this.r.resetVirtual();s.restartRun();return;}
 }
 if(this.status!=='RUNNING')return oldUpdate.call(this,t);
 const x=p.x,seals=s.sealsCollectedRC37||0;

 // Once GATE_A is already open, its remaining bee is optional. Pass below it instead of trading a heart.
 const ga=gateBy(s,'GATE_A'),beeA=enemyAt(s,5);
 if(ga?.open&&beeA&&x>=9200&&x<=9890&&!hz(s,x)){
   suppress(this,()=>oldUpdate.call(this,t));if(this.status!=='RUNNING'||s.lifeCycle!=='active')return;
   this.jumpUntil=0;this.attackUntil=0;this.r.setVirtualAxis(.98,0);this.r.setVirtual('jump',false);this.r.setVirtual('attack',false);this.publish();return;
 }

 // SEAL_DAWN: controlled stair ascent. If missed, walk back on normal ground and retry.
 if(seals<1){
   if(this.__seal1Backtrack){suppress(this,()=>oldUpdate.call(this,t));if(x<=12580)this.__seal1Backtrack=false;this.jumpUntil=0;this.attackUntil=0;this.r.setVirtualAxis(-.68,0);this.r.setVirtual('jump',false);this.r.setVirtual('attack',false);this.publish();return;}
   if(x>13470&&x<14150){this.__seal1Backtrack=true;return this.update(t);}
   if(x>=12180&&x<=13470)return routeSeal(this,t,{steps:[[12200,12450,325,'seal1_step0_v014'],[12510,12770,335,'seal1_step1_v014'],[12820,13090,345,'seal1_step2_v014'],[13120,13350,360,'seal1_step3_v014']],double:[12920,13380,'seal1_double_v014'],coverEnemy:7,attackName:'seal1_bee_cover_v014'});
 }

 // SEAL_SPIRIT at x≈22080. Ground beneath is continuous, so a missed climb can safely backtrack.
 if(seals<2){
   if(this.__seal2Backtrack){suppress(this,()=>oldUpdate.call(this,t));if(x<=21640)this.__seal2Backtrack=false;this.jumpUntil=0;this.attackUntil=0;this.r.setVirtualAxis(-.66,0);this.r.setVirtual('jump',false);this.r.setVirtual('attack',false);this.publish();return;}
   if(x>22310&&x<22650){this.__seal2Backtrack=true;return this.update(t);}
   if(x>=21650&&x<=22310)return routeSeal(this,t,{steps:[[21700,21900,335,'seal2_step0_v014'],[21920,22110,350,'seal2_step1_v014']],double:[21860,22190,'seal2_double_v014'],coverEnemy:undefined,attackName:'seal2_cover_v014'});
 }

 // Non-arena bee after the x=23860 hazard: continuous ground, so stay low and run under it.
 const bee13=enemyAt(s,13);
 if(bee13&&x>=24020&&x<=24640&&!hz(s,x)){
   suppress(this,()=>oldUpdate.call(this,t));if(this.status!=='RUNNING'||s.lifeCycle!=='active')return;
   this.jumpUntil=0;this.attackUntil=0;this.r.setVirtualAxis(.98,0);this.r.setVirtual('jump',false);this.r.setVirtual('attack',false);this.publish();return;
 }

 // SEAL_GUARDIAN before GATE_C. Retry on the authored ground if the platform pickup is missed.
 if(seals<3){
   if(this.__seal3Backtrack){suppress(this,()=>oldUpdate.call(this,t));if(x<=32960)this.__seal3Backtrack=false;this.jumpUntil=0;this.attackUntil=0;this.r.setVirtualAxis(-.66,0);this.r.setVirtual('jump',false);this.r.setVirtual('attack',false);this.publish();return;}
   if(x>33630&&x<34020){this.__seal3Backtrack=true;return this.update(t);}
   if(x>=32980&&x<=33630)return routeSeal(this,t,{steps:[[33020,33220,335,'seal3_step0_v014'],[33240,33420,350,'seal3_step1_v014']],double:[33220,33570,'seal3_double_v014'],coverEnemy:19,attackName:'seal3_bee_cover_v014'});
 }

 return oldUpdate.call(this,t);
};
proto.snapshot=function(){const o=oldSnapshot.call(this);o.version='RC39_V014_INPUT_ONLY_OBJECTIVES_RETRY';o.checkpointRetries=window.__KELVOR_RC39_V014_RETRIES__||0;return o;};
P.CampaignAutoplayRC39V014=C;window.__KELVOR_RC39_V014_AUTOPLAY_PATCH_READY__=true;
})(PlatformerSNESV04);
