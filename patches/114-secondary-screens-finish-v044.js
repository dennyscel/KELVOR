(function(P){
'use strict';
// RC39 v044 — final portrait finish for Options / Music / Credits.
// Presentation only. No gameplay, progression, save, combat or physics changes.
const GOLD=0xf6d77a, GOLD2=0xffefad, MINT=0xa8dda6, NAVY=0x071827, PANEL=0x0b2236;
const portrait=s=>s.scale.height>s.scale.width*1.05;
const label=(s,x,y,t,style={},d=20)=>s.add.text(x,y,t,{fontFamily:'monospace',fontSize:'8px',color:'#ffffff',...style}).setOrigin(.5).setDepth(d);

function addSectionHeader(scene,title,sub){
  const w=scene.scale.width,h=scene.scale.height;
  const lineL=scene.add.rectangle(w*.24,58,w*.16,1,GOLD,.17).setDepth(10);
  const lineR=scene.add.rectangle(w*.76,58,w*.16,1,GOLD,.17).setDepth(10);
  const t=label(scene,w/2,57,title,{fontSize:'8px',fontStyle:'bold',color:'#bde0bd'},11);
  const s=label(scene,w/2,76,sub,{fontSize:'7px',color:'#7898a9'},11);
  return {lineL,lineR,t,s};
}
function addLowerMedallion(scene,icon,title,sub,y=.745){
  const w=scene.scale.width,h=scene.scale.height;
  const ring=scene.add.circle(w/2,h*y,55,0x0a2638,.22).setStrokeStyle(1,GOLD,.19).setDepth(2);
  const ring2=scene.add.circle(w/2,h*y,39,0x061522,.45).setStrokeStyle(1,MINT,.12).setDepth(2.1);
  const ico=scene.add.text(w/2,h*y-2,icon,{fontFamily:'Arial, sans-serif',fontSize:'34px',color:'#ffe89a'}).setOrigin(.5).setDepth(3);
  const tt=label(scene,w/2,h*(y+.075),title,{fontSize:'8px',fontStyle:'bold',color:'#f2df9b'},4);
  const ss=label(scene,w/2,h*(y+.102),sub,{fontSize:'7px',color:'#8ea6b3'},4);
  if(P.GameSettingsV10?.get?.('menuMotion')!==false){scene.tweens.add({targets:ring,alpha:{from:.12,to:.30},scale:{from:.96,to:1.04},duration:1800,yoyo:true,repeat:-1,ease:'Sine.inOut'});}
  return {ring,ring2,ico,tt,ss};
}

const Opt=P.OptionsSceneV10?.prototype;
if(Opt){
  const old=Opt.create;
  Opt.create=function(...a){
    const r=old.apply(this,a);if(!portrait(this))return r;
    const w=this.scale.width,h=this.scale.height;
    const hdr=addSectionHeader(this,'PERSONALIZE SUA AVENTURA','Ajustes salvos automaticamente');
    // Lower the primary options panel slightly and give the empty lower third a purposeful finish.
    const art=addLowerMedallion(this,'⚙','TUDO DO SEU JEITO','Som, toque e visual em um só lugar',.765);
    const chips=[];['ÁUDIO','JOGABILIDADE','CONTROLES','TELA'].forEach((t,i)=>{
      const x=w*(.20+i*.20),y=h*.875;
      const box=this.add.rectangle(x,y,92,25,0x0b2438,.78).setStrokeStyle(1,i===0?GOLD:0x607f91,i===0?.35:.18).setDepth(3);
      const tx=label(this,x,y,t,{fontSize:'6px',color:i===0?'#ffeaa0':'#829eac'},4);chips.push({box,tx});
    });
    if(this.note?.active)this.note.setPosition(w/2,h*.665).setColor('#9bb5c1');
    this.__v044={optionsFinish:true};this.__optionsFinishV044={hdr,art,chips};window.__KELVOR_OPTIONS_V044__=this;return r;
  };
}

const Music=P.MusicPlayerSceneV10?.prototype;
if(Music){
  const old=Music.create;
  Music.create=function(...a){
    const r=old.apply(this,a);if(!portrait(this))return r;
    const w=this.scale.width,h=this.scale.height;
    const hdr=addSectionHeader(this,'ESCUTE O MUNDO DE KELVOR','Cada região tem seu próprio clima');
    const art=this.__musicArtV043;
    if(art){
      art.disc.setPosition(w/2,h*.445).setRadius?.(116);
      art.disc2.setPosition(w/2,h*.445);
      art.note.setPosition(w/2,h*.44).setFontSize(82);
      art.cap.setPosition(w/2,h*.565);
    }
    // Equalizer bars animate subtly around the music medallion.
    const bars=[];for(let i=0;i<13;i++){
      const x=w/2-102+i*17,base=h*.625,hh=10+(i%5)*5;
      const b=this.add.rectangle(x,base,5,hh,i%2?0x9ed7b3:0xf5d87c,.32).setOrigin(.5,1).setDepth(3);bars.push(b);
      if(P.GameSettingsV10?.get?.('menuMotion')!==false)this.tweens.add({targets:b,scaleY:{from:.5,to:1.55},alpha:{from:.20,to:.45},duration:550+(i%4)*170,delay:i*45,yoyo:true,repeat:-1,ease:'Sine.inOut'});
    }
    const card=this.add.rectangle(w/2,h*.705,w*.70,84,PANEL,.58).setStrokeStyle(1,0x8db7a0,.20).setDepth(3);
    const c1=label(this,w/2,h*.685,'TOQUE • ESCUTE • EXPLORE',{fontSize:'8px',fontStyle:'bold',color:'#f0e2a3'},4);
    const c2=label(this,w/2,h*.715,'Use ANTERIOR e PRÓXIMA para conhecer as faixas',{fontSize:'7px',color:'#92aab7'},4);
    const c3=label(this,w/2,h*.742,'A música continua acompanhando sua aventura',{fontSize:'7px',color:'#7895a5'},4);
    this.__v044={musicFinish:true};this.__musicFinishV044={hdr,bars,card,c1,c2,c3};window.__KELVOR_MUSIC_V044__=this;return r;
  };
}

const Credits=P.CreditsSceneV10?.prototype;
if(Credits){
  const old=Credits.create;
  Credits.create=function(...a){
    const r=old.apply(this,a);if(!portrait(this))return r;
    const w=this.scale.width,h=this.scale.height;
    const hdr=addSectionHeader(this,'UMA AVENTURA FEITA COM CARINHO','Obrigado por fazer parte desta jornada');
    const a43=this.__creditsArtV043;
    if(a43){
      a43.glow.setPosition(w/2,h*.445);a43.plat.setPosition(w/2,h*.47);a43.hero.setPosition(w/2,h*.47);a43.thanks.setPosition(w/2,h*.555);a43.sub.setPosition(w/2,h*.585);
    }
    const infoY=h*.675;
    const card=this.add.rectangle(w/2,infoY,w*.74,108,PANEL,.54).setStrokeStyle(1,GOLD,.18).setDepth(3);
    const cap=label(this,w/2,infoY-31,'KELVOR',{fontSize:'11px',fontStyle:'bold',color:'#ffe89c'},4);
    const a1=label(this,w/2,infoY-6,'DIREÇÃO  •  DESIGN  •  CRIAÇÃO',{fontSize:'7px',color:'#a7c8d3'},4);
    const a2=label(this,w/2,infoY+18,'DENNYS PAVANELLI',{fontSize:'8px',fontStyle:'bold',color:'#ffffff'},4);
    const a3=label(this,w/2,infoY+39,'POWERED BY PHASER 4.2.1',{fontSize:'6px',color:'#7793a3'},4);
    const stars=[];for(let i=0;i<7;i++){const x=w*.22+i*w*.093,y=h*.79+(i%2)*8;const s=this.add.star(x,y,4,1.5,3.4,i%2?0xffe69a:0xa0dcb2,.23).setDepth(3);stars.push(s);}
    this.__v044={creditsFinish:true};this.__creditsFinishV044={hdr,card,cap,a1,a2,a3,stars};window.__KELVOR_CREDITS_V044__=this;return r;
  };
}
window.__KELVOR_RC39_MENU_MAP_V044_READY__=true;
})(PlatformerSNESV04);
