(function(P){
'use strict';
// INPUT-ONLY RC39 patch for the authored SEAL_GUARDIAN approach.
// The Arena-C bee at authored index 19 patrols 32980..33640 at y≈155. The previous
// seal-3 navigation suppressed attack while repeatedly attempting the 33470 ledge,
// allowing that bee to drain all hearts. This patch defeats it with ordinary player
// jump/attack inputs from safe authored ground, then traverses the existing 33020 ->
// 33470 ledges and physically collects the existing SEAL_GUARDIAN.
// No enemy/player HP, physics, collision, hitbox, geometry, gate, seal, save, timer,
// acceptance threshold, arena requirement or PASS-rule changes.
const C=P.CampaignAutoplayRC39V028;if(typeof C!=='function')return;
const proto=C.prototype,oldUpdate=proto.update,oldSnapshot=proto.snapshot;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function enemyAt(s,i){const e=s.enemies?.[i];return e&&e.alive&&e.sprite?.active?e:null;}
function suppress(self,fn){const j=self.pulseJump,a=self.pulseAttack;self.pulseJump=()=>false;self.pulseAttack=()=>false;try{return fn();}finally{self.pulseJump=j;self.pulseAttack=a;}}
function centerY(s,x){const top=s.platformTopByX?.get(x);return Number.isFinite(top)?top-P.TUNING.bodyHeight/2:null;}
function landed(s,p,x){const y=centerY(s,x);return y!==null&&p.grounded&&Math.abs(p.x-x)<66&&Math.abs(p.y-y)<13;}
function axisTo(p,tx){const d=tx-p.x;if(d>120)return .90;if(d>60)return .62;if(d>22)return .30;if(d>-18)return -.10;return -.40;}
function drive(self,axis,attack=false){const t=self.s.time.now;self.r.setVirtualAxis(clamp(axis,-1,1),0);self.r.setVirtual('jump',t<self.jumpUntil);self.r.setVirtual('attack',attack&&t<self.attackUntil);self.publish();}

proto.update=function(t){
  const s=this.s,p=s?.player;
  if(!p||this.status!=='RUNNING')return oldUpdate.call(this,t);
  const seals=s.sealsCollectedRC37||0,x=p.x;
  if(seals===2&&x>=32875&&x<=33630&&s.lifeCycle==='active'){
    suppress(this,()=>oldUpdate.call(this,t));
    if(this.status!=='RUNNING'||s.lifeCycle!=='active')return;
    if(!this.__guardianV029)this.__guardianV029={phase:'preclear',attacks:0,stage:0,startedAtX:Math.round(x)};
    const n=this.__guardianV029,bee=enemyAt(s,19);

    if(n.phase==='preclear'&&bee){
      const d=bee.sprite.x-p.x,ad=Math.abs(d);
      // Stay in the safe pre-seal lane; follow the bee only enough to bring it into the
      // normal melee/jump-attack envelope, never teleporting or altering its patrol.
      let axis;
      if(x<32970)axis=.55;
      else if(x>33210)axis=-.42;
      else if(d>185)axis=.28;
      else if(d>90)axis=.12;
      else if(d>20)axis=0;
      else if(d>-55)axis=-.16;
      else axis=.16;
      if(ad<205){
        if(p.grounded&&t>=this.nextJumpAt)this.pulseJump(t,'guardian_v029_bee19_jump',325);
        else if(!p.grounded&&p.airJumpsRemaining>0&&p.velocityY>15)this.pulseJump(t,'guardian_v029_bee19_double',285);
        if(this.pulseAttack(t,'guardian_v029_bee19_attack',120))n.attacks++;
      }
      drive(this,axis,true);return;
    }
    if(n.phase==='preclear'&&!bee){
      n.phase='route';n.beeClearedAtX=Math.round(x);n.stage=0;
      this.jumpUntil=0;this.attackUntil=0;
      // Discard any partial v018 seal3 navigation state created before this overlay took authority.
      this.__seal3Flow={stage:0};
      this.log('guardian_v029_bee19_cleared',{x:n.beeClearedAtX,attacks:n.attacks});
    }

    if(n.phase==='route'){
      const targets=[33020,33470];
      if(n.stage<targets.length){
        const tx=targets[n.stage];
        if(landed(s,p,tx)){
          n.stage++;this.log('guardian_v029_landed',{stage:n.stage,target:tx,x:Math.round(p.x),y:Math.round(p.y)});
          this.jumpUntil=0;this.attackUntil=0;drive(this,.86,false);return;
        }
        const d=tx-p.x;
        if(p.grounded&&d<390&&d>-55&&t>=this.nextJumpAt)this.pulseJump(t,'guardian_v029_primary_'+n.stage,375);
        if(!p.grounded&&p.airJumpsRemaining>0&&p.velocityY>-70&&d>28&&d<260)this.pulseJump(t,'guardian_v029_double_'+n.stage,355);
        drive(this,axisTo(p,tx),false);return;
      }
      n.phase='pickup';this.jumpUntil=0;this.attackUntil=0;
    }

    if(n.phase==='pickup'){
      // Normal short hop from the authored 33470 ledge into the authored pickup at x33520.
      let axis=.34;
      if(p.grounded&&Math.abs(p.x-33470)<75)this.pulseJump(t,'guardian_v029_pickup_primary',325);
      if(!p.grounded&&p.airJumpsRemaining>0&&p.velocityY>35&&p.x<33510)this.pulseJump(t,'guardian_v029_pickup_double',285);
      if(p.x>=33500&&p.x<=33570)axis=.04;
      drive(this,axis,false);return;
    }
  }
  if(this.__guardianV029&&seals>=3&&!this.__guardianV029.done){
    this.__guardianV029.done=true;this.__guardianV029.collectedAtX=Math.round(p.x);
    this.log('guardian_v029_seal_collected',{x:this.__guardianV029.collectedAtX,attacks:this.__guardianV029.attacks});
    this.jumpUntil=0;this.attackUntil=0;
  }
  return oldUpdate.call(this,t);
};
proto.snapshot=function(){const o=oldSnapshot.call(this);o.version='RC39_V029_INPUT_ONLY_GUARDIAN_BEE_PRECLEAR';o.guardianV029=this.__guardianV029||null;return o;};
P.CampaignAutoplayRC39V029=C;window.__KELVOR_RC39_V029_AUTOPLAY_PATCH_READY__=true;
})(PlatformerSNESV04);
