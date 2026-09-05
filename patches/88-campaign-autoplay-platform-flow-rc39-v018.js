(function(P){
'use strict';
const C=P.CampaignAutoplayRC39V013;if(typeof C!=='function')return;
const proto=C.prototype,oldUpdate=proto.update,oldSnapshot=proto.snapshot;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function eAt(s,i){const e=s.enemies?.[i];return e&&e.alive&&e.sprite?.active?e:null;}
function gAt(s,id){return s.lockGatesRC37?.find(g=>g.id===id)||null;}
function hz(s,x){for(const h of s.hazards||[]){if(x>=h.left-120&&x<=h.right+90)return true;}return false;}
function suppress(self,fn){const j=self.pulseJump,a=self.pulseAttack;self.pulseJump=()=>false;self.pulseAttack=()=>false;try{return fn();}finally{self.pulseJump=j;self.pulseAttack=a;}}
function set(self,axis,atk=true){const t=self.s.time.now;self.r.setVirtualAxis(clamp(axis,-1,1),0);self.r.setVirtual('jump',t<self.jumpUntil);self.r.setVirtual('attack',atk&&t<self.attackUntil);self.publish();}
function topY(s,x){return s.platformTopByX?.get(x);}
function centerY(s,x){const y=topY(s,x);return Number.isFinite(y)?y-P.TUNING.bodyHeight/2:null;}
function landed(s,p,x){const y=centerY(s,x);return y!==null&&p.grounded&&Math.abs(p.x-x)<58&&Math.abs(p.y-y)<10;}
function ballisticAxis(p,tx){const dx=tx-p.x;if(dx>110)return .98;if(dx>55)return .70;if(dx>18)return .32;if(dx>-18)return -.22;return -.55;}
function runPlatformNav(self,t,stateKey,targets){
 const s=self.s,p=s.player;if(!self[stateKey])self[stateKey]={stage:0};const n=self[stateKey];
 if(n.stage>=targets.length)return false;
 const tx=targets[n.stage];
 if(landed(s,p,tx)){
   n.stage++;self.log(stateKey+'_landed',{stage:n.stage,x:Math.round(p.x),y:Math.round(p.y)});self.jumpUntil=0;
   // Critical: keep right held so approved runDelay is not reset between ledges.
   self.r.setVirtualAxis(.98,0);self.r.setVirtual('jump',false);self.r.setVirtual('attack',false);self.publish();return true;
 }
 let axis=ballisticAxis(p,tx);
 if(p.grounded&&tx-p.x<470&&tx-p.x>-40)self.pulseJump(t,stateKey+'_primary_'+n.stage,375);
 // Late double near apex maximizes both height and horizontal range.
 if(!p.grounded&&p.airJumpsRemaining>0&&p.velocityY>-65&&p.y<205&&tx-p.x>35)self.pulseJump(t,stateKey+'_double_'+n.stage,365);
 set(self,axis,false);return true;
}
proto.update=function(t){
 const s=this.s,p=s?.player;if(!p)return oldUpdate.call(this,t);
 if(s.lifeCycle==='gameover'&&s.checkpointProgressRC37){window.__KELVOR_RC39_V018_RETRIES__=(window.__KELVOR_RC39_V018_RETRIES__||0)+1;if(window.__KELVOR_RC39_V018_RETRIES__<=3){this.r.resetVirtual();s.restartRun();return;}}
 if(this.status!=='RUNNING')return oldUpdate.call(this,t);
 const x=p.x,seals=s.sealsCollectedRC37||0;
 // Skip optional third Gate-A bee after gate opens.
 const ga=gAt(s,'GATE_A'),bee5=eAt(s,5);if(ga?.open&&bee5&&x>=9180&&x<=9920&&!hz(s,x)){suppress(this,()=>oldUpdate.call(this,t));if(s.lifeCycle!=='active')return;this.jumpUntil=0;this.attackUntil=0;this.r.setVirtualAxis(.98,0);this.r.setVirtual('jump',false);this.r.setVirtual('attack',false);this.publish();return;}
 // Pre-clear canopy bee6 from safe ground before platform work.
 const bee6=eAt(s,6);if(bee6&&x>=11680&&x<12240){suppress(this,()=>oldUpdate.call(this,t));if(s.lifeCycle!=='active')return;const d=bee6.sprite.x-p.x;let axis=x<12020?.38:clamp(d/500,-.16,.16);if(Math.abs(d)<190){if(p.grounded)this.pulseJump(t,'preclear_bee6_v018',335);else if(p.airJumpsRemaining>0&&p.velocityY>20)this.pulseJump(t,'preclear_bee6_double_v018',290);this.pulseAttack(t,'preclear_bee6_attack_v018',120);}set(this,axis,true);return;}
 // First seal: land 12300 -> 12690 -> 13040, then double-jump through pickup x13280.
 if(seals<1&&x>=12050&&x<=13520){suppress(this,()=>oldUpdate.call(this,t));if(s.lifeCycle!=='active')return;
   if(runPlatformNav(this,t,'__seal1Flow',[12300,12690,13040]))return;
   let axis=ballisticAxis(p,13280);if(p.grounded&&Math.abs(p.x-13040)<65)this.pulseJump(t,'seal1_pickup_primary_v018',380);if(!p.grounded&&p.airJumpsRemaining>0&&p.velocityY>-80&&p.x>=13090&&p.x<=13180)this.pulseJump(t,'seal1_pickup_double_v018',370);if(p.x>=13250&&p.x<=13315)axis=.05;set(this,axis,true);return;}
 // Seal 2: use two authored ledges, then hop left into x22080.
 if(seals<2&&x>=21580&&x<=22420){suppress(this,()=>oldUpdate.call(this,t));if(s.lifeCycle!=='active')return;
   if(runPlatformNav(this,t,'__seal2Flow',[21880,22140]))return;
   let axis=-.48;if(p.grounded&&Math.abs(p.x-22140)<60)this.pulseJump(t,'seal2_pickup_primary_v018',330);if(p.x<=22105&&p.x>=22045)axis=-.08;set(this,axis,true);return;}
 // Ignore optional bee13 after B on continuous ground.
 const bee13=eAt(s,13);if(bee13&&x>=24000&&x<=24660&&!hz(s,x)){suppress(this,()=>oldUpdate.call(this,t));if(s.lifeCycle!=='active')return;this.jumpUntil=0;this.attackUntil=0;this.r.setVirtualAxis(.98,0);this.r.setVirtual('jump',false);this.r.setVirtual('attack',false);this.publish();return;}
 // Seal 3: ledges 33020 -> 33470, then short right hop into x33520.
 if(seals<3&&x>=32880&&x<=33700){suppress(this,()=>oldUpdate.call(this,t));if(s.lifeCycle!=='active')return;
   if(runPlatformNav(this,t,'__seal3Flow',[33020,33470]))return;
   let axis=.35;if(p.grounded&&Math.abs(p.x-33470)<60)this.pulseJump(t,'seal3_pickup_primary_v018',325);if(p.x>=33495&&p.x<=33560)axis=.05;const bee19=eAt(s,19);if(bee19&&Math.abs(bee19.sprite.x-p.x)<145)this.pulseAttack(t,'seal3_cover_v018',105);set(this,axis,true);return;}
 return oldUpdate.call(this,t);
};
proto.snapshot=function(){const o=oldSnapshot.call(this);o.version='RC39_V018_INPUT_ONLY_PLATFORM_FLOW';o.checkpointRetries=window.__KELVOR_RC39_V018_RETRIES__||0;o.seal1Flow=this.__seal1Flow||null;o.seal2Flow=this.__seal2Flow||null;o.seal3Flow=this.__seal3Flow||null;return o;};
P.CampaignAutoplayRC39V018=C;window.__KELVOR_RC39_V018_AUTOPLAY_PATCH_READY__=true;
})(PlatformerSNESV04);
