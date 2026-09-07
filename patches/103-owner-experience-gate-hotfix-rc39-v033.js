(function(P){
'use strict';
// RC39 v033 — narrow repair for the v032 lexical Map collision.
// Restores the authored RC37 combat-lock logic, keeps v031 feedback and v032 clean dissolve.
// No requirements, HP, physics, damage, collisions, seals, timing or PASS gates are changed.
const S=P.World01Level01AAAReferenceSceneRC37;if(typeof S!=='function')return;
const proto=S.prototype;

function dissolveGate(scene,g){
  const v=g?.visual;if(!v?.active||g.__ownerV033Dissolved)return;
  g.__ownerV033Dissolved=true;scene.tweens.killTweensOf(v);v.setAlpha(1);
  const x=g.x,y=(v.y||P.FLOOR_TOP)-42;
  const text=scene.add.text(x,y-58,'CAMINHO LIBERADO',{fontFamily:'monospace',fontSize:'9px',fontStyle:'bold',color:'#fff2a8',backgroundColor:'#071827dd',padding:{x:6,y:3}}).setOrigin(.5).setDepth(72);
  for(let i=0;i<16;i++){
    const a=Math.PI*2*i/16,p=scene.add.rectangle(x,y,3,3,i%2?0xffe886:0x9ff7b0,.92).setDepth(71);
    scene.tweens.add({targets:p,x:x+Math.cos(a)*(30+(i%4)*7),y:y+Math.sin(a)*(26+(i%5)*5),alpha:0,duration:420+i*16,onComplete:()=>p.destroy()});
  }
  scene.tweens.add({targets:v,alpha:0,scaleX:v.scaleX*1.18,scaleY:v.scaleY*.88,duration:360,ease:'Quad.Out',onComplete:()=>v?.active&&v.destroy()});
  scene.tweens.add({targets:text,alpha:0,y:text.y-12,delay:620,duration:340,onComplete:()=>text.destroy()});
}

proto.updateArenaGatesRC37=function(){
  const px=this.player?.x??-99999,seals=this.sealsCollectedRC37||0;
  for(const g of this.lockGatesRC37||[]){
    if(!g.open){
      const enough=(g.defeated||0)>=(g.required||0);
      const finalOk=g.id!=='GATE_C'||seals>=3;
      if(enough&&finalOk){
        g.open=true;
        if(g.solid?.body)g.solid.body.enable=false;
        g.solid?.setActive(false);
        if(g.visual?.active)g.visual.setTexture('w01l01_rc37_gate_open');
        this.logDesign?.('gate_open',{id:g.id,arenaId:g.arenaId,defeated:g.defeated,seals});
        dissolveGate(this,g);
      }
    }
    const label=g.__ownerLabelV031;
    if(!label?.active)continue;
    if(g.open){label.setAlpha(0);continue;}
    const close=Math.abs(px-g.x)<=420;
    if(!close){label.setAlpha(0);continue;}
    const combat=`GUARDIÕES ${Math.min(g.defeated||0,g.required||0)}/${g.required||0}`;
    const text=g.id==='GATE_C'&&seals<3?`PORTÃO SELADO • ${combat} • SELOS ${seals}/3`:`PORTÃO SELADO • ${combat}`;
    label.setText(text).setAlpha(1);
  }
};

window.__KELVOR_RC39_OWNER_EXPERIENCE_V033_READY__=true;
})(PlatformerSNESV04);
