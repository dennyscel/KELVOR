/* KELVOR W01 v048 — authored, deterministic level data; no engine or DOM access. */
(function(root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) { root.PlatformerSNESV04 = root.PlatformerSNESV04 || {}; root.PlatformerSNESV04.World1ContentV048 = api; }
})(typeof window !== 'undefined' ? window : null, function() {
  'use strict';
  const FLOOR = 900;
  const BASELINES = { W01_L01:38200, W01_L02:4800, W01_L03:5200, W01_SECRET:2450, W01_BOSS:1500, W01_BONUS_B01:760 };
  const levels = {};
  function create(id, name, subtitle, width, theme, sectors, pits) {
    const level = { id, node:id.slice(4), name, subtitle, width, height:1500, theme,
      spawn:{x:180,y:FLOOR}, goal:{x:width-240,y:FLOOR}, requiredBells:0,
      sectors:sectors.map((s,i)=>({x:s[0],end:sectors[i+1]?.[0] || width,name:s[1],type:s[2]})),
      surfaces:[], vines:[], entities:[] };
    let serial=0;
    const entity=(type,x,y,props={})=>{const e={id:id.toLowerCase()+'_'+type+'_'+(++serial),type,x,y,...props};level.entities.push(e);return e;};
    const surface=(sid,x,y,w,h,kind='branch',oneWay=true,move)=>{
      const s={id:id.toLowerCase()+'_'+sid,x,y,w,h,kind,oneWay};if(move)s.move=move;level.surfaces.push(s);return s;
    };
    let start=0;
    [...pits,[width,width]].forEach(([a,b],i)=>{surface('ground_'+i,start,FLOOR,a-start,600,'ground',false);start=b;});
    const groundAt=x=>level.surfaces.find(s=>s.kind==='ground' && x>=s.x+24 && x<=s.x+s.w-24);
    const on=(type,x,props={})=>{if(!groundAt(x))throw new Error(id+' unsupported '+type+' at '+x);return entity(type,x,FLOOR,props);};
    const pickup=(type,x,y=FLOOR-40,props={})=>entity(type,x,y,props);
    const coins=(a,b,step=155,y=FLOOR-40)=>{for(let x=a;x<=b;x+=step)if(y!==FLOOR-40 || groundAt(x))pickup('coin',x,y);};
    const checkpoint=(x,text)=>{on('checkpoint',x);on('lantern',x-60);if(text)on('sign',x+80,{text});};
    const enemy=(x,kind='mushroom',patrol=85)=>{
      if(kind==='bee')return entity('enemy',x,FLOOR-150,{kind,patrol});
      const floor=groundAt(x);if(!floor)throw new Error('Enemy needs ground: '+id+' '+x);
      return on('enemy',x,{kind,patrol:Math.min(patrol,x-floor.x-55,floor.x+floor.w-x-55)});
    };
    const log=(x,w=120)=>surface('log_'+(++serial),x,FLOOR-40,w,40,'log',false);
    const stone=(x,y=FLOOR-70,w=135)=>surface('stone_'+(++serial),x,y,w,FLOOR-y,'stone',false);
    const bridge=(x,y=FLOOR-80,w=190,move)=>surface('bridge_'+(++serial),x,y,w,24,'bridge',true,move);
    const vine=(x,top,support)=>level.vines.push({id:id.toLowerCase()+'_vine_'+(++serial),x,top,bottom:FLOOR,anchorSurfaceId:support.id});
    // Side routes ascend in 70px steps; each visibly rooted canopy has a usable descent vine.
    const canopy=(x,steps=7,{kind='branch',coinStep=2,moveAt=-1}={})=>{
      const route=[];
      for(let i=0;i<steps;i++){
        const y=FLOOR-70*(i+1),sx=x+i*150;
        const p=surface('canopy_'+(++serial),sx,y,130,22,kind,true,i===moveAt?{axis:'y',range:10,speed:.72,phase:0}:undefined);
        route.push(p);if(i%coinStep===0)pickup('coin',sx+65,y-38,{surfaceId:p.id});
      }
      const last=route[route.length-1];
      // Shift the vine within its platform if a ravine falls beneath its midpoint.
      const vx=[last.x+65,last.x+25,last.x+105].find(v=>groundAt(v));
      if(vx!==undefined)vine(vx,last.y,last);
      return route;
    };
    const gate=(keyX,doorX,keyId)=>{pickup('key',keyX,FLOOR-44,{keyId});on('door',doorX,{keyId});};
    const bell=x=>pickup('bell',x,FLOOR-65,{index:level.entities.filter(e=>e.type==='bell').length+1});
    const scatter=(xs,type)=>xs.forEach(x=>on(type,x));
    const rhythm=(sections)=>sections.forEach(([a,b,density])=>coins(a,b,density));
    levels[id]=level;
    return {level,entity,on,pickup,coins,checkpoint,enemy,log,stone,bridge,vine,canopy,gate,bell,scatter,rhythm,surface};
  }

  // 1. A long, welcoming journey that gradually combines each traversal verb.
  {
    const b=create('W01_L01','Trilha do Despertar','Cada pequeno passo acorda a floresta.',42000,'dawn',[
      [0,'O primeiro raio','rest'],[4200,'Raízes que abraçam','traversal'],[8200,'Ruínas do orvalho','combat'],
      [12400,'Escadaria das copas','vertical'],[16600,'O vale que respira','rest'],[20800,'Vozes do bosque','ritual'],
      [25000,'Dois caminhos, um céu','choice'],[29200,'A ponte dos antigos','setpiece'],[33400,'O último guardião','mastery'],
      [38200,'Onde a luz floresce','finale']
    ],[[2350,2470],[5280,5400],[6150,6270],[9530,9660],[10480,10620],[14340,14460],[15180,15310],[18420,18550],[21940,22060],[24910,25050],[27510,27630],[29350,29490],[31660,31790],[32820,32940],[35020,35150],[38220,38350]]);
    const {level,on,pickup,checkpoint,enemy,log,stone,bridge,canopy,gate,bell,scatter,rhythm}=b;
    on('sign',380,{text:'O bosque acorda com você. Mova o analógico de leve para caminhar; leve-o até a borda para correr.'});
    log(790);on('branch',1270);on('sign',1440,{text:'Pequenos galhos fazem tropeçar. Salte por cima — seus corações ficam seguros.'});
    stone(1880);bridge(2320,820,180);on('spring',3000);canopy(3120,5);
    checkpoint(4020,'Um cristal aceso guarda seu caminho. Respire e siga quando quiser.');
    log(4470,180);on('crate',4770);canopy(5550,6);enemy(5870,'mushroom',95);enemy(6920,'beetle',125);
    gate(7340,7780,'orvalho');on('sign',7290,{text:'A chave do orvalho pertence à porta coberta de musgo.'});
    checkpoint(8030);canopy(8390,4,{kind:'stone'});enemy(8980,'mushroom',90);enemy(10050,'beetle',95);
    bridge(10445,820,210);stone(11000);enemy(11480,'bee',95);bell(11900);
    on('sign',12020,{text:'Um sino respondeu. Encontre as três vozes se quiser conquistar a medalha do bosque.'});
    checkpoint(12240);canopy(12620,10);on('spring',12500);canopy(14870,7);enemy(14020,'bee',120);
    log(15900);on('crate',16100);checkpoint(16430);
    on('sign',16900,{text:'Escute a água entre as folhas. Nem toda clareira pede pressa.'});
    on('bonus',16980,{bonusId:'B02',duration:45,durationMs:45000,target:12,requiresAction:'Y'});
    log(17300,190);pickup('heart',17560,856);canopy(18930,5);scatter([17040,17920,19880,20380],'lantern');
    checkpoint(20530);enemy(21200,'beetle',115);canopy(22420,8);enemy(21800,'bee',110);
    on('crate',23460);enemy(23680,'mushroom',90);bell(24100);checkpoint(24650);
    on('sign',25320,{text:'Pelas raízes, um caminho tranquilo. Pelas copas, folhas douradas esperam.'});
    canopy(25550,10);log(26950,170);bridge(27485,830,190);enemy(28160,'bee',100);checkpoint(28870);
    on('sign',29120,{text:'A ponte adormecida ainda reconhece passos corajosos.'});
    bridge(29310,820,225);canopy(29900,6,{kind:'bridge',moveAt:3});
    bridge(31625,850,225,{axis:'y',range:22,speed:.6,phase:1});bridge(32780,820,235);enemy(32400,'bee',110);
    checkpoint(33200);enemy(33920,'beetle',130);canopy(34120,8);on('branch',34750);
    enemy(35480,'mushroom',120);on('crate',35920);bell(36500);enemy(37000,'beetle',100);
    checkpoint(37800);on('sign',38700,{text:'A flor espera por você. Os sinos guardam uma conquista para quem deseja explorar mais.'});
    canopy(39000,4);pickup('heart',39880,856);scatter([38870,39820,40600,41100],'lantern');
    on('sign',41080,{text:'Tudo o que floresce começa com um pequeno gesto.'});
    scatter([2120,4780,6870,9160,11240,15800,21350,26600,30600,33700,36800],'branch');
    scatter([3550,11080,17690,19750,23110,27880,31300,35990,39500],'crate');
    rhythm([[550,2150,175],[2680,3840,170],[4440,7650,190],[8490,11680,170],[12600,16000,195],[16950,20100,260],[21000,24300,180],[25250,28500,220],[29600,32950,190],[33700,37400,170],[38600,41200,280]]);
  }

  // 2. Waterfalls frame climbable towers and bridges; keys always precede their doors.
  {
    const b=create('W01_L02','Cascatas das Raízes','A água guarda caminhos que o olhar apressado não vê.',24000,'dawn',[
      [0,'O murmúrio da nascente','rest'],[3000,'Degraus da água','vertical'],[6000,'A comporta verde','puzzle'],
      [9000,'Jardins suspensos','choice'],[12000,'Sob o véu da cascata','secret'],[15000,'Raízes sobre o abismo','setpiece'],
      [18000,'A corrente desperta','combat'],[21000,'O arco da nascente','finale']
    ],[[2250,2370],[4150,4280],[6450,6580],[8730,8860],[10820,10960],[12410,12550],[14250,14380],[16470,16600],[18420,18550],[20710,20850],[22900,23030]]);
    const {level,on,pickup,checkpoint,enemy,log,bridge,canopy,gate,scatter,rhythm}=b;
    on('sign',420,{text:'As cascatas têm caminhos por cima e por baixo. Siga a água e observe as raízes.'});
    log(820);canopy(1250,6);bridge(2215,820,210);checkpoint(2820);
    on('spring',3130);canopy(3270,10);bridge(4120,820,210);enemy(4800,'bee',110);on('crate',5150);checkpoint(5640);
    gate(6780,7200,'nascente');on('sign',6720,{text:'A pequena chave verde desperta a comporta da nascente.'});
    enemy(7630,'beetle',110);log(8180,175);bridge(8700,820,210);checkpoint(9150);
    canopy(9370,9);enemy(10500,'bee',100);bridge(10785,820,235);pickup('heart',11200,856);checkpoint(11820);
    on('sign',12000,{text:'Há uma luz discreta por trás da cascata. A curiosidade também abre caminhos.'});
    canopy(12800,8);on('secret',13900,{destination:'W01_SECRET',requiresAction:'Y'});on('lantern',13840);
    gate(14590,15030,'cascata');checkpoint(15400);bridge(16425,850,235,{axis:'y',range:22,speed:.55,phase:.4});
    canopy(15680,7,{kind:'bridge'});enemy(17300,'bee',90);on('crate',17800);checkpoint(18000);
    enemy(18300,'mushroom',55);enemy(19200,'beetle',125);canopy(18700,6);log(20080,180);
    bridge(20670,820,250);checkpoint(21300);gate(22050,22520,'arco');
    on('sign',21960,{text:'A última chave guarda o arco. A água se acalma quando a porta se abre.'});
    bridge(22860,820,230);pickup('heart',23200,856);scatter([21670,23120,23500],'lantern');
    scatter([1680,5250,7900,11500,16200,19500,21500],'branch');
    scatter([2000,5480,8500,10200,13400,17570,19700,21800],'crate');
    rhythm([[630,2020,190],[2630,3970,190],[4470,5730,195],[6700,8500,180],[9300,10650,200],[11200,12200,220],[12800,14100,195],[14700,16200,190],[16900,18200,200],[18800,20400,170],[21350,22620,180],[23200,23550,160]]);
  }

  // 3. Quiet moonlit pauses alternate with readable encounters and three bells.
  {
    const b=create('W01_L03','Copas ao Luar','Nem toda sombra é um perigo. Aprenda a escutar.',28000,'moon',[
      [0,'Quando o dia se recolhe','rest'],[3500,'Lanternas entre as folhas','traversal'],[7000,'O primeiro eco','ritual'],
      [10500,'A torre das mariposas','vertical'],[14000,'O silêncio da lagoa','rest'],[17500,'O segundo eco','ritual'],
      [21000,'A vigília das raízes','mastery'],[24500,'O coro das estrelas','finale']
    ],[[2420,2550],[4660,4790],[6510,6640],[8950,9080],[12020,12150],[13440,13580],[16240,16380],[19220,19350],[22360,22490],[23730,23860],[25830,25960]]);
    const {level,on,pickup,checkpoint,enemy,log,bridge,canopy,bell,scatter,rhythm}=b;
    on('sign',430,{text:'A noite chegou devagar. Siga as lanternas; os três sinos são um desafio para quem deseja explorar.'});
    scatter([700,1530,2220,2820,3370],'lantern');log(1030);canopy(1630,5);bridge(2380,820,230);checkpoint(3290);
    on('branch',3860);canopy(4070,8);bridge(4625,820,220);enemy(5510,'mushroom',90);enemy(6120,'bee',100);checkpoint(6860);
    on('sign',7340,{text:'As luzes do chão apontam o caminho. As luzes das copas guardam pequenos presentes.'});
    bell(8070);canopy(7540,7);bridge(8910,820,230);enemy(9550,'beetle',110);checkpoint(10260);
    on('spring',10830);canopy(11000,10);canopy(12650,8);bridge(13390,850,250,{axis:'y',range:20,speed:.65,phase:1});
    enemy(11700,'bee',120);checkpoint(13900);on('sign',14300,{text:'Aqui, até as mariposas pousam. O silêncio também faz parte da aventura.'});
    log(14700,200);on('bonus',14600,{bonusId:'B03',duration:45,durationMs:45000,target:12,requiresAction:'Y'});pickup('heart',15180,856);scatter([14500,15600,16700,17100],'lantern');canopy(16500,5);checkpoint(17350);
    enemy(17900,'mushroom',110);canopy(18100,8);bell(18800);bridge(19180,820,240);enemy(19900,'bee',100);checkpoint(20700);
    on('sign',21100,{text:'Movimento, pausa, salto. Cada perigo revela o seu ritmo antes de chegar.'});
    enemy(21700,'beetle',120);canopy(21500,9);bridge(22320,820,240);enemy(23000,'mushroom',95);
    bridge(23690,850,240,{axis:'y',range:20,speed:.7,phase:0});checkpoint(24400);
    bell(25100);on('sign',25230,{text:'Cada sino descoberto acrescenta uma voz ao céu. A saída está logo adiante.'});
    canopy(24650,6);bridge(25790,820,240);pickup('heart',26750,856);scatter([24800,26330,27000,27430],'lantern');
    scatter([3730,5780,9290,12920,16900,20230,22000,23480],'branch');
    scatter([2000,6010,8380,13100,15750,19700,22620,26700],'crate');
    rhythm([[650,2290,230],[2780,4400,210],[5070,6370,185],[7130,8750,190],[9400,10100,200],[10900,11700,190],[12500,13250,195],[14200,15900,270],[16700,18870,220],[19700,20500,175],[21350,22200,180],[22800,23400,180],[24550,25600,190],[26400,27500,235]]);
  }

  // 4. Optional grove: vertical treasure rooms and a genuine internal timed bonus.
  {
    const b=create('W01_SECRET','Jardim dos Pirilampos','Um lugar pequeno no mapa, imenso para quem sabe olhar.',12000,'moon',[
      [0,'A porta entre as folhas','rest'],[2400,'O jardim que sobe','vertical'],[4800,'O presente dos pirilampos','bonus'],
      [7200,'A chave de cristal','puzzle'],[9600,'A flor que guarda a noite','finale']
    ],[[1800,1920],[4020,4150],[6680,6810],[8710,8840],[10620,10750]]);
    const {level,on,pickup,checkpoint,enemy,log,bridge,canopy,gate,scatter,rhythm}=b;
    on('sign',430,{text:'Você encontrou o caminho escondido. Aqui, a curiosidade recebe um presente.'});
    log(930,180);canopy(1110,5);bridge(1760,820,240);checkpoint(2180);
    on('spring',2540);canopy(2700,10);bridge(3980,820,250);enemy(3560,'bee',80);checkpoint(4580);
    on('bonus',5300,{bonusId:'B01',saveKey:'W01_BONUS_B01',duration:45,durationMs:45000,target:12,requiresAction:'Y'});
    on('sign',5100,{text:'Um presente espera aqui. Reúna doze luzes antes que a canção termine.'});
    canopy(5660,6);pickup('heart',6370,856);bridge(6640,820,250);checkpoint(7050);
    gate(7760,8220,'pirilampo');on('sign',7670,{text:'A chave de cristal brilha perto da porta. Nenhum presente precisa ficar para trás.'});
    enemy(8450,'mushroom',80);bridge(8670,820,250);canopy(9140,7);checkpoint(9540);
    bridge(10580,820,250);pickup('heart',11010,856);scatter([9780,10280,11180,11600],'lantern');
    on('sign',11460,{text:'Leve esta luz com você. Os pequenos segredos fazem o mundo crescer.'});
    scatter([770,2960,4720,6090,7350,9370],'crate');
    scatter([1370,3670,6310,7420,9870],'branch');
    rhythm([[620,1660,160],[2090,3770,170],[4380,6280,150],[7030,8460,175],[9130,10420,160],[11000,11700,150]]);
    level.bonus={id:'B01',baselineWidth:760,minimumTravelWidth:900,target:12,durationMs:45000,preserveAdventure:true};
  }

  // 5. The Guardian's arena includes a quiet approach and a spacious, honest floor.
  {
    const b=create('W01_BOSS','O Coração da Floresta','Coragem também é saber quando esperar.',2400,'moon',[
      [0,'A última lanterna','rest'],[620,'O coração desperta','boss'],[2050,'Uma nova aurora','finale']
    ],[]);
    const {level,on,pickup,log,stone}=b;
    level.spawn={x:180,y:900};level.goal={x:2230,y:900};
    level.boss={kind:'forest_guardian',hp:12,hearts:12,x:1620,y:900,optional:true,startDormant:true,arena:{left:620,right:2100,top:200,bottom:900}};
    on('sign',320,{text:'O guardião descansa. Siga até o portal ou aceite seu desafio no altar para conquistar uma medalha.'});
    on('challenge',1080,{challengeId:'forest_guardian',requiresAction:'Y',optional:true});
    on('checkpoint',480);on('lantern',100);on('lantern',510);on('lantern',2160);log(720,140);stone(1940,830,130);
    pickup('heart',790,820);pickup('heart',2000,790);
  }

  // Optional discoveries reward mastery. They never become remote locks on the exit.
  Object.values(levels).forEach(level=>{
    level.requiredDoorIds=[];
    level.medals=[{id:'journey',name:'Caminho descoberto',type:'complete',target:1,description:'Chegue à flor da fase no seu ritmo.'}];
    const count=type=>level.entities.filter(e=>e.type===type).length;
    if(count('coin'))level.medals.push({id:'golden_leaves',name:'Folhas douradas',type:'coins',target:count('coin'),description:'Encontre todas as folhas douradas nas raízes e nas copas.'});
    if(count('bell'))level.medals.push({id:'forest_choir',name:'Coro do bosque',type:'bells',target:count('bell'),description:'Descubra os três sinos. Este ritual é opcional.'});
    if(count('bonus'))level.medals.push({id:'firefly_gift',name:'Presente dos pirilampos',type:'bonuses',target:count('bonus'),bonusIds:level.entities.filter(e=>e.type==='bonus').map(e=>e.bonusId),description:'Complete o desafio das doze luzes.'});
    if(count('secret'))level.medals.push({id:'hidden_path',name:'Olhar curioso',type:'secret',target:1,description:'Descubra a passagem escondida na cascata.'});
    if(level.boss)level.medals.push({id:'gentle_courage',name:'Coragem do bosque',type:'guardian',target:1,description:'Aceite e vença o desafio opcional do guardião.'});
    level.platinum={name:'Coração da floresta',requires:level.medals.map(m=>m.id),optional:true};
    for(const e of level.entities){
      const rigid=level.surfaces.filter(s=>!s.oneWay && s.kind!=='ground' && e.x>=s.x && e.x<=s.x+s.w && e.y>=s.y && e.y<=s.y+s.h).sort((a,b)=>a.y-b.y)[0];
      if(rigid)e.y=rigid.y-(['coin','heart','key','bell'].includes(e.type)?40:0);
    }
  });
  function freeze(value) { if(value && typeof value==='object' && !Object.isFrozen(value)){Object.values(value).forEach(freeze);Object.freeze(value);}return value; }
  freeze(levels);
  return Object.freeze({version:'v048',FLOOR,BASELINES:Object.freeze(BASELINES),levels,
    getLevel(id){return levels[id]?JSON.parse(JSON.stringify(levels[id])):null;}
  });
});
