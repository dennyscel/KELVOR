(function(P){
'use strict';
// INPUT-ONLY RC39 diagnostic patch for SEAL_SPIRIT stage 0.
// Runtime geometry proves the 21880 ledge center is y=133.60 while ground center
// is y=254. A single -585 jump cannot cover that 120.4px rise; a normal air jump
// is required. This patch only walks back for a safe run-up and presses jump twice.
// No physics, collision, hitbox, HP, enemy HP, save state, collectibles or PASS rules change.
const C=P.CampaignAutoplayRC39V024;if(typeof C!=='function')return;
const proto=C.prototype,oldUpdate=proto.update,oldSnapshot=proto.snapshot;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function enemyAt(s,i){const e=s.enemies?.[i];return e&&e.alive&&e.sprite?.active?e:null;}
function gateAt(s,id){return s.lockGatesRC37?.find(g=>g.id===id)||null;}
function centerY(s,x){const top=s.platformTopByX?.get(x);return Number.isFinite(top)?top-P.TUNING.bodyHeight/2:null;}
function landed(s,p,x,tolX=58,tolY=11){const y=centerY(s,x);return y!==null&&p.grounded&&Math.abs(p.x-x)<tolX&&Math.abs(p.y-y)<tolY;}
function drive(self,axis,attack=false){const t=self.s.time.now;self.r.setVirtualAxis(clamp(axis,-1,1),0);self.r.setVirtual('jump',t<self.jumpUntil);self.r.setVirtual('attack',attack&&t<self.attackUntil);self.publish();}

proto.update=function(t){
  const s=this.s,p=s?.player;
  if(!p||this.status!=='RUNNING')return oldUpdate.call(this,t);
  const seals=s.sealsCollectedRC37||0,gateB=gateAt(s,'GATE_B'),slime=enemyAt(s,12),flow=this.__seal2Flow;
  if(seals!==1||!gateB?.open||slime||!flow||flow.stage!==0||s.lifeCycle!=='active'||p.x<21380||p.x>22120)return oldUpdate.call(this,t);

  if(!this.__seal2V025)this.__seal2V025={phase:'reposition',primary:false,double:false,primaryAt:0,attempts:0,retries:0,launchX:21655,doubleX:21765};
  const n=this.__seal2V025,x=p.x,vy=p.velocityY;

  if(landed(s,p,21880)){
    flow.stage=1;n.phase='done';this.jumpUntil=0;
    this.log('seal2_v025_landed_21880',{x:Math.round(x),y:Math.round(p.y),attempts:n.attempts,retries:n.retries});
    return oldUpdate.call(this,t);
  }

  if(n.phase==='reposition'){
    this.jumpUntil=0;this.attackUntil=0;
    if(!p.grounded){drive(this,-.32,false);return;}
    if(x>21615){drive(this,-.82,false);return;}
    n.phase='runup';n.primary=false;n.double=false;n.primaryAt=0;
    this.nextJumpAt=Math.min(this.nextJumpAt||0,t);
    this.log('seal2_v025_runup_ready',{x:Math.round(x)});drive(this,.98,false);return;
  }

  if(n.phase==='runup'){
    if(p.grounded&&!n.primary&&x>=n.launchX&&t>=this.nextJumpAt){
      if(this.pulseJump(t,'seal2_v025_primary_to_21880',375)){n.primary=true;n.primaryAt=t;n.attempts++;}
    }
    if(n.primary&&!n.double&&!p.grounded&&p.airJumpsRemaining>0&&x>=n.doubleX&&vy>40&&t>=this.nextJumpAt){
      if(this.pulseJump(t,'seal2_v025_double_to_21880',300))n.double=true;
    }
    let axis=.98;
    if(x>=21872&&vy>0)axis=.15;
    if(x>=21912&&vy>0)axis=-.35;
    const cy=centerY(s,21880);
    // A jump press is issued while the body still reports grounded in that same
    // frame. Only call it a failed landing after at least 220ms of real flight time.
    if(n.primary&&n.primaryAt>0&&t>=n.primaryAt+220&&p.grounded&&cy!==null&&p.y>cy+55){
      n.phase='reposition';n.primary=false;n.double=false;n.primaryAt=0;n.retries++;this.jumpUntil=0;
      this.log('seal2_v025_ground_retry',{x:Math.round(x),retries:n.retries});drive(this,-.82,false);return;
    }
    drive(this,axis,false);return;
  }

  return oldUpdate.call(this,t);
};
proto.snapshot=function(){const o=oldSnapshot.call(this);o.version='RC39_V025_INPUT_ONLY_SEAL2_MEASURED_ENTRY';o.seal2V025=this.__seal2V025||null;return o;};
P.CampaignAutoplayRC39V025=C;window.__KELVOR_RC39_V025_AUTOPLAY_PATCH_READY__=true;
})(PlatformerSNESV04);
