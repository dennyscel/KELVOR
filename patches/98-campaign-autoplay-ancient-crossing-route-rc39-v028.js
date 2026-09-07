(function(P){
'use strict';
// INPUT-ONLY RC39 route patch for the authored ANCIENT_CROSSING set piece.
// The set piece itself remains fully owned by the game: crossing x=27100 enables the five
// authored bridge solids. This patch only presses normal movement/jump/attack inputs early
// enough to enter the first segment before ground ends at x=27460, then traverses the
// authored 27620 -> 27850 -> 28080 -> 28310 -> 28540 sequence.
// No physics, collision, hitbox, HP, damage, platform activation, geometry, save, gate,
// collectible, timer, acceptance threshold or PASS-rule changes.
const C=P.CampaignAutoplayRC39V027;if(typeof C!=='function')return;
const proto=C.prototype,oldUpdate=proto.update,oldSnapshot=proto.snapshot;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function suppress(self,fn){const j=self.pulseJump,a=self.pulseAttack;self.pulseJump=()=>false;self.pulseAttack=()=>false;try{return fn();}finally{self.pulseJump=j;self.pulseAttack=a;}}
function bridgeReady(s){const a=s.ancientBridgeSegmentsRC37||[];return a.length>=5&&a.every(seg=>seg?.solid?.body?.enable===true&&seg?.solid?.active!==false);}
function centerY(s,x){const top=s.platformTopByX?.get(x);return Number.isFinite(top)?top-P.TUNING.bodyHeight/2:null;}
function landed(s,p,x){const y=centerY(s,x);return y!==null&&p.grounded&&Math.abs(p.x-x)<68&&Math.abs(p.y-y)<13;}
function axisTo(p,tx){const d=tx-p.x;if(d>150)return .98;if(d>90)return .78;if(d>42)return .50;if(d>15)return .24;if(d>-18)return -.12;return -.42;}
function drive(self,axis,attack=false){const t=self.s.time.now;self.r.setVirtualAxis(clamp(axis,-1,1),0);self.r.setVirtual('jump',t<self.jumpUntil);self.r.setVirtual('attack',attack&&t<self.attackUntil);self.publish();}
function bridgeEnemy(s,p){let best=null,score=1e9;for(const e of s.enemies||[]){if(!e?.alive||!e.sprite?.active)continue;const ex=e.sprite.x;if(ex<27720||ex>28620)continue;const d=ex-p.x,ad=Math.abs(d);if(ad<score){score=ad;best={e,d,ad};}}return best;}

proto.update=function(t){
  const s=this.s,p=s?.player;
  if(!p||this.status!=='RUNNING')return oldUpdate.call(this,t);
  const seals=s.sealsCollectedRC37||0,x=p.x;
  if(seals>=2&&x>=27320&&x<28880){
    suppress(this,()=>oldUpdate.call(this,t));
    if(this.status!=='RUNNING'||s.lifeCycle!=='active')return;
    if(!this.__ancientV028)this.__ancientV028={stage:0,bridgeReady:false,attacks:0,startedAtX:Math.round(x)};
    const n=this.__ancientV028;
    if(!bridgeReady(s)){
      // Hold on authored ground while the normal x=27100 set-piece callback exposes the route.
      // We never enable a bridge body here.
      const axis=x<27388?.28:0;
      this.jumpUntil=0;this.attackUntil=0;drive(this,axis,false);return;
    }
    if(!n.bridgeReady){n.bridgeReady=true;this.log('ancient_v028_bridge_ready',{x:Math.round(x)});}

    const targets=[27620,27850,28080,28310,28540];
    if(n.stage<targets.length){
      const tx=targets[n.stage];
      if(landed(s,p,tx)){
        n.stage++;this.log('ancient_v028_landed',{stage:n.stage,target:tx,x:Math.round(p.x),y:Math.round(p.y)});
        this.jumpUntil=0;this.attackUntil=0;
        drive(this,.98,false);return;
      }
      const d=tx-p.x;
      // Stage 0 is the historical failure: take off BEFORE the ground edge at 27460.
      if(p.grounded&&d<=285&&d>=35&&t>=this.nextJumpAt){
        if(this.pulseJump(t,'ancient_v028_primary_'+n.stage,380))this.log('ancient_v028_takeoff',{stage:n.stage,target:tx,x:Math.round(p.x)});
      }
      if(!p.grounded&&p.airJumpsRemaining>0&&p.velocityY>-70&&d>38&&d<245){
        this.pulseJump(t,'ancient_v028_double_'+n.stage,360);
      }
      const foe=bridgeEnemy(s,p);let attacking=false;
      if(foe&&foe.ad<150){if(this.pulseAttack(t,'ancient_v028_bridge_cover',120)){n.attacks++;attacking=true;}}
      drive(this,axisTo(p,tx),attacking||!!foe);return;
    }

    // Leave the final authored segment onto the normal ground that resumes at x=28680.
    if(p.x<28755){
      if(p.grounded&&p.x>=28490&&p.x<=28610)this.pulseJump(t,'ancient_v028_exit_primary',330);
      if(!p.grounded&&p.airJumpsRemaining>0&&p.velocityY>30&&p.x<28695)this.pulseJump(t,'ancient_v028_exit_double',300);
      const foe=bridgeEnemy(s,p);let attacking=false;if(foe&&foe.ad<145){if(this.pulseAttack(t,'ancient_v028_exit_cover',115)){n.attacks++;attacking=true;}}
      drive(this,.98,attacking||!!foe);return;
    }
    if(!n.done){n.done=true;n.clearedAtX=Math.round(p.x);this.log('ancient_v028_cleared',{x:n.clearedAtX,attacks:n.attacks});}
  }
  return oldUpdate.call(this,t);
};
proto.snapshot=function(){const o=oldSnapshot.call(this);o.version='RC39_V028_INPUT_ONLY_ANCIENT_CROSSING_ROUTE';o.ancientV028=this.__ancientV028||null;return o;};
P.CampaignAutoplayRC39V028=C;window.__KELVOR_RC39_V028_AUTOPLAY_PATCH_READY__=true;
})(PlatformerSNESV04);
