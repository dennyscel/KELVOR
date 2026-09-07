(function(P){
'use strict';
// RC39 v037 — art-direction pass over the technically successful v036 W01-L01 rebuild.
// Goal: remove empty/repetitive prototype feel and turn pits/doors/sections into coherent places.
// Presentation only on top of v036: no physics, HP, enemy HP, pit coordinates, gates, seals or saves changed.

const S=P.World01Level01AAAReferenceSceneRC37;if(typeof S!=='function')return;const proto=S.prototype,F=P.FLOOR_TOP;
const T=P.PHASE01_TEXTURE;
const SECTIONS=[
 {id:'01',a:0,b:3600,name:'TRILHA DO DESPERTAR',tone:0xffe28c,bg:['001','003','006'],fg:['016','017','022']},
 {id:'02',a:3600,b:7600,name:'RAVINA DAS RAÍZES',tone:0xb9d67c,bg:['007','009','011'],fg:['013','014','023']},
 {id:'03',a:7600,b:10800,name:'GUARDA DO BOSQUE',tone:0x8ecf88,bg:['007','010','009'],fg:['028','045','046']},
 {id:'04',a:10800,b:15000,name:'ASCENSÃO DAS COPAS',tone:0xa7e39b,bg:['010','011','006'],fg:['022','023','016']},
 {id:'05',a:15000,b:18800,name:'CLAREIRA SUBMERSA',tone:0x7dc7a0,bg:['008','009','001'],fg:['013','028','023']},
 {id:'06',a:18800,b:22600,name:'BOSQUE ESPIRITUAL',tone:0x8ef7ca,bg:['003','004','005'],fg:['018','020','021']},
 {id:'07',a:22600,b:26600,name:'CAMINHOS GÊMEOS',tone:0xa8d69a,bg:['001','006','009'],fg:['029','045','046']},
 {id:'08',a:26600,b:30600,name:'PASSAGEM ANCESTRAL',tone:0xc8b27d,bg:['009','010','007'],fg:['014','042','043']},
 {id:'09',a:30600,b:34800,name:'SANTUÁRIO DO GUARDIÃO',tone:0x8db685,bg:['010','011','009'],fg:['042','043','046']},
 {id:'10',a:34800,b:38200,name:'CAMINHO SERENO',tone:0xf0da87,bg:['001','003','006'],fg:['016','018','021']}
];
function prop(s,x,num,scale,depth=7,alpha=.72,flip=false){return s.add.image(x,F+4,T,'phase_01_grassland/props/'+num).setOrigin(.5,1).setScale(scale).setDepth(depth).setAlpha(alpha).setFlipX(flip);}
function littleMote(s,x,y,color,delay=0){const d=s.add.circle(x,y,1.5,color,.35).setDepth(16);if(P.GameSettingsV10?.get?.('menuMotion')!==false)s.tweens.add({targets:d,y:y-22,x:x+((delay%3)-1)*8,alpha:0,duration:1600+(delay%5)*180,delay:(delay%7)*110,repeat:-1,onRepeat:()=>{d.setPosition(x,y).setAlpha(.35);},ease:'Sine.Out'});return d;}
function sectionDressing(s){
  s.__sectionArtV037=[];
  SECTIONS.forEach((q,si)=>{
    const span=q.b-q.a;
    // Background silhouettes: obviously behind the playable plane, so they never imply collision.
    [0.09,0.27,0.48,0.68,0.88].forEach((p,i)=>{
      const num=q.bg[(i+si)%q.bg.length],im=prop(s,q.a+span*p,num,.48+((i+si)%3)*.09,6,.48+((i+1)%3)*.09,i%2===1);im.setTint(si===7?0xcbbf9f:0xffffff);s.__sectionArtV037.push(im);
    });
    // Foreground small/medium dressing, spaced away from section center and major gates.
    [0.16,0.36,0.59,0.79].forEach((p,i)=>{
      const num=q.fg[(i+si)%q.fg.length],im=prop(s,q.a+span*p,num,.30+((i+si)%2)*.07,14,.92,i%3===1);s.__sectionArtV037.push(im);
    });
    // A small anchored title marker makes each act feel authored, not one 38k-pixel strip.
    const sx=q.a+170;
    const sign=prop(s,sx,'029',.31,13,.90,si%2===1);
    const tag=s.add.text(sx+(si%2?48:-48),F-34,q.name,{fontFamily:'monospace',fontSize:'6px',fontStyle:'bold',color:'#fff2bd',backgroundColor:'#071827c8',padding:{x:4,y:2}}).setOrigin(si%2?0:1,.5).setDepth(15).setAlpha(.72);
    s.__sectionArtV037.push(sign,tag);
    if(si===5||si===9){for(let k=0;k<14;k++)s.__sectionArtV037.push(littleMote(s,q.a+240+((k*227)%Math.max(500,span-480)),150+((k*37)%100),q.tone,k));}
  });
}
function enrichRavines(s){
  s.__ravineArtV037=[];
  (s.__ravinesV036||[]).forEach((r,i)=>{
    const w=r.b-r.a,wide=w>500;
    // Earth walls continue below the grass lip, eliminating the flat cut-out look.
    const wallL=s.add.rectangle(r.a+9,F+4,18,126,0x51331f,.98).setOrigin(.5,0).setDepth(7);
    const wallR=s.add.rectangle(r.b-9,F+4,18,126,0x51331f,.98).setOrigin(.5,0).setDepth(7);
    const lipL=s.add.rectangle(r.a+14,F+4,29,8,0x2d4828,.92).setOrigin(.5,0).setDepth(12);
    const lipR=s.add.rectangle(r.b-14,F+4,29,8,0x2d4828,.92).setOrigin(.5,0).setDepth(12);
    s.__ravineArtV037.push(wallL,wallR,lipL,lipR);
    // Layered rock shelves and roots create depth without inventing collision surfaces.
    const shelves=Math.max(2,Math.min(7,Math.floor(w/150)));
    for(let k=0;k<shelves;k++){
      const x=r.a+34+((k+1)*(w-68)/(shelves+1)),y=F+44+(k%3)*29;
      const rock=prop(s,x,['042','043','044'][k%3],.18+(k%2)*.035,7,.42,k%2===1);rock.setY(y+rock.displayHeight*.45);s.__ravineArtV037.push(rock);
      const root=s.add.rectangle(r.a+18+(k%2)*(w-36),F+8,3,52+(k%3)*17,0x3d5b32,.75).setOrigin(.5,0).setAngle(k%2?-10:10).setDepth(7);s.__ravineArtV037.push(root);
    }
    // Fog bands have soft visual spacing rather than one opaque slab.
    [46,76,106].forEach((dy,j)=>{const fog=s.add.rectangle((r.a+r.b)/2,F+dy,Math.max(20,w-30-j*12),3,0xb0cbb9,.055-j*.012).setDepth(7);s.__ravineArtV037.push(fog);});
    if(wide){
      // Major Ancient Crossing: substantial cliff faces, old supports and deep stone footings.
      const cliffL=s.add.rectangle(r.a+42,F+20,66,150,0x3c2c20,.86).setOrigin(.5,0).setDepth(6);
      const cliffR=s.add.rectangle(r.b-42,F+20,66,150,0x3c2c20,.86).setOrigin(.5,0).setDepth(6);s.__ravineArtV037.push(cliffL,cliffR);
      for(let k=0;k<6;k++){
        const x=r.a+110+k*(w-220)/5;
        const footing=prop(s,x,k%2?'043':'044',.22,7,.50,k%2===1);footing.setY(F+118);s.__ravineArtV037.push(footing);
      }
      const plaque=s.add.text((r.a+r.b)/2,F+102,'PASSAGEM ANCESTRAL',{fontFamily:'monospace',fontSize:'7px',fontStyle:'bold',color:'#bcae88'}).setOrigin(.5).setDepth(7).setAlpha(.26);s.__ravineArtV037.push(plaque);
    }
  });
}
function ancientSupports(s){
  s.__ancientSupportsV037=[];
  (s.ancientBridgeSegmentsRC37||[]).forEach((seg,i)=>{
    const post=s.add.rectangle(seg.x,F+12,6,118,0x4b321f,.58).setOrigin(.5,0).setDepth(8);
    const braceL=s.add.rectangle(seg.x-16,F+24,3,92,0x3b291d,.46).setOrigin(.5,0).setAngle(-8).setDepth(8);
    const braceR=s.add.rectangle(seg.x+16,F+24,3,92,0x3b291d,.46).setOrigin(.5,0).setAngle(8).setDepth(8);
    const base=prop(s,seg.x,i%2?'043':'044',.16,8,.48,i%2===1);base.setY(F+126);s.__ancientSupportsV037.push({seg,post,braceL,braceR,base});
  });
}
function gateArchitecture(s){
  s.__gateArchitectureV037=[];
  for(const g of s.lockGatesRC37||[]){
    const tint=g.keyTint||0xffdd77;
    const halo=s.add.circle(g.x,F-48,44,tint,.025).setDepth(38);
    const left=prop(s,g.x-43,'043',.25,39,.96,false),right=prop(s,g.x+43,'044',.25,39,.96,true);
    const plantL=prop(s,g.x-66,g.id==='GATE_B'?'003':'023',.27,38,.88,false),plantR=prop(s,g.x+66,g.id==='GATE_C'?'004':'022',.27,38,.88,true);
    const base=s.add.rectangle(g.x,F-2,102,5,0x4a5d34,.82).setDepth(39);
    const rune=s.add.circle(g.x,F-49,5,tint,.55).setDepth(43).setStrokeStyle(1,0xffffff,.28);
    if(P.GameSettingsV10?.get?.('menuMotion')!==false)s.tweens.add({targets:[halo,rune],alpha:{from:.018,to:.09},scale:{from:.92,to:1.14},duration:1500+(g.id==='GATE_B'?190:0),yoyo:true,repeat:-1,ease:'Sine.inOut'});
    g.__archV037={halo,left,right,plantL,plantR,base,rune};s.__gateArchitectureV037.push(g.__archV037);
  }
}
function updateAncientSupports(s){
  for(const a of s.__ancientSupportsV037||[]){
    const alpha=Math.max(.05,Math.min(.72,(a.seg?.image?.alpha||0)*.72));
    a.post.setAlpha(alpha);a.braceL.setAlpha(alpha*.78);a.braceR.setAlpha(alpha*.78);a.base.setAlpha(alpha*.82);
  }
}
const oldCreate=proto.create;
proto.create=function(...args){
  const r=oldCreate.apply(this,args);sectionDressing(this);enrichRavines(this);ancientSupports(this);gateArchitecture(this);
  this.__v037={ready:true,sectionIdentities:10,ravinesEnriched:(this.__ravinesV036||[]).length,ancientSupports:(this.__ancientSupportsV037||[]).length,gateArchitecture:(this.__gateArchitectureV037||[]).length};
  window.__KELVOR_W01_L01_V037__=this;return r;
};
const oldUpdate=proto.update;
proto.update=function(time,delta){const r=oldUpdate.call(this,time,delta);updateAncientSupports(this);return r;};
const oldSnap=proto.rc37Snapshot;
proto.rc37Snapshot=function(){const z=oldSnap.call(this);z.ownerV037=this.__v037||null;return z;};
window.__KELVOR_RC39_W01L01_V037_READY__=true;
})(PlatformerSNESV04);
