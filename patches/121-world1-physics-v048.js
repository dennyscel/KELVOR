(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root){root.PlatformerSNESV04=root.PlatformerSNESV04||{};root.PlatformerSNESV04.World1PhysicsV048=api;}})(typeof window!=='undefined'?window:null,function(){
  'use strict';
  const T={width:34,height:64,gravity:1750,run:235,jump:-585,doubleJump:-535,acceleration:1750,airAcceleration:950,brake:2200,coyote:.115,buffer:.135,maxFall:720,dashSpeed:550,dashDuration:.18,dashCooldown:.8};
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const approach=(v,target,amount)=>v<target?Math.min(target,v+amount):Math.max(target,v-amount);
  const neutral=()=>({x:0,y:0,held:{},pressed:{}});
  const overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
  function rect(p){return{x:p.x-T.width/2,y:p.y-T.height,w:T.width,h:T.height};}
  class World {
    constructor(def){
      this.def=JSON.parse(JSON.stringify(def));this.time=0;this.status='playing';this.events=[];this.collected=new Set();this.keys=new Set();this.bells=new Set();this.secretExit=false;this.bonusDone=false;this.bonusIds=new Set();this.deaths=0;this.distance=0;
      this.entities=this.def.entities.map(e=>({...e,homeX:e.x,homeY:e.y,alive:true,hp:e.type==='enemy'?e.kind==='mushroom'?3:2:1,dir:-1,timer:1.5,open:0}));
      this.surfaces=this.def.surfaces.map(s=>({...s,baseX:s.x,baseY:s.y,dx:0,dy:0}));this.projectiles=[];this.effects=[];this.checkpoint={...this.def.spawn};
      const hearts=this.def.id==='W01_BOSS'?12:3;this.player={...this.checkpoint,vx:0,vy:0,hearts,maxHearts:hearts,coins:0,grounded:true,facing:1,coyote:T.coyote,buffer:0,jumps:1,invulnerable:0,attack:0,attackCooldown:0,dash:0,dashCooldown:0,trip:0,climbing:null,surface:null,guard:false};
      if(this.def.id==='W01_BOSS')this.boss={x:this.def.width-650,y:900,hp:12,maxHp:12,state:'idle',timer:2.6,cycle:0,move:'stomp',phase:1,hitCooldown:0,dir:-1,markers:[],defeated:false};
    }
    emit(type,data={}){this.events.push({type,...data});if(this.events.length>100)this.events.shift();}
    drainEvents(){return this.events.splice(0);}
    supportAt(x,y,tolerance=4){return this.surfaces.find(s=>x>=s.x&&x<=s.x+s.w&&Math.abs(s.y-y)<=tolerance);}
    dynamicSolids(){return this.entities.filter(e=>e.alive&&((e.type==='door'&&e.open<.8)||e.type==='crate')).map(e=>({id:e.id,x:e.x-(e.type==='door'?22:24),y:e.y-(e.type==='door'?130:48),w:e.type==='door'?44:48,h:e.type==='door'?130:48,oneWay:false}));}
    hurt(source,amount=1){const p=this.player;if(this.status!=='playing'||p.invulnerable>0||p.dash>0)return false;if(p.guard&&source!=='pit'){p.invulnerable=.25;this.emit('guard',{x:p.x,y:p.y-32});return false;}p.hearts=Math.max(0,p.hearts-amount);p.invulnerable=1.4;p.vy=-240;p.vx=-p.facing*150;this.emit('hurt',{source,x:p.x,y:p.y-32});if(p.hearts===0)this.respawn(source);return true;}
    respawn(reason='pit'){this.deaths++;const p=this.player;Object.assign(p,{x:this.checkpoint.x,y:this.checkpoint.y,vx:0,vy:0,hearts:p.maxHearts,grounded:true,coyote:T.coyote,buffer:0,jumps:1,invulnerable:2,attack:0,dash:0,climbing:null,surface:null});this.projectiles=[];if(this.boss&&!this.boss.defeated){Object.assign(this.boss,{hp:12,state:'idle',timer:2.6,cycle:0,x:this.def.width-650,phase:1,markers:[]});}this.emit('respawn',{reason,x:p.x,y:p.y});}
    step(seconds,input=neutral()){
      if(this.status!=='playing')return;let remaining=clamp(Number(seconds)||0,0,.1),first=true;
      while(remaining>1e-7){const dt=Math.min(remaining,1/120);this.tick(dt,first?input:{...input,pressed:{}});remaining-=dt;first=false;if(this.status!=='playing')break;}
    }
    tick(dt,input){
      this.time+=dt;const p=this.player,held=input.held||{},pressed=input.pressed||{};const oldY=p.y;
      for(const key of ['invulnerable','attack','attackCooldown','dash','dashCooldown','trip','buffer'])p[key]=Math.max(0,p[key]-dt);
      for(const s of this.surfaces){const ox=s.x,oy=s.y;if(s.move){const shift=Math.sin(this.time*s.move.speed+(s.move.phase||0))*s.move.range;s[s.move.axis]=s[s.move.axis==='x'?'baseX':'baseY']+shift;}s.dx=s.x-ox;s.dy=s.y-oy;if(p.grounded&&p.surface===s.id){p.x+=s.dx;p.y+=s.dy;}}
      p.coyote=p.grounded?T.coyote:Math.max(0,p.coyote-dt);if(p.grounded)p.jumps=1;
      if(pressed.jump)p.buffer=T.buffer;
      const vine=this.def.vines.find(v=>Math.abs(p.x-v.x)<27&&p.y>=v.top-12&&p.y-T.height<=v.bottom);
      if(Math.abs(input.y||0)>.2&&vine&&p.dash===0)p.climbing=vine.id;
      if(p.climbing&&(!vine||Math.abs(input.x||0)>.65&&Math.abs(input.y||0)<.2))p.climbing=null;
      if(p.buffer>0&&(p.coyote>0||p.climbing)){p.vy=T.jump;p.grounded=false;p.coyote=0;p.buffer=0;p.climbing=null;this.emit('jump',{x:p.x,y:p.y});}
      else if(pressed.jump&&!p.grounded&&p.jumps>0){p.vy=T.doubleJump;p.jumps--;p.buffer=0;this.emit('doubleJump',{x:p.x,y:p.y});}
      if(!held.jump&&p.vy<-120&&!p.climbing)p.vy=approach(p.vy,-120,1800*dt);
      if(pressed.dash&&p.dashCooldown===0){p.dash=T.dashDuration;p.dashCooldown=T.dashCooldown;p.climbing=null;this.emit('dash',{x:p.x,y:p.y});}
      if(pressed.attack&&p.attackCooldown===0){p.attack=.27;p.attackCooldown=.36;this.emit('attack',{x:p.x,y:p.y-32});}
      p.guard=!!held.interact&&Math.abs(input.x||0)<.12&&!p.climbing&&p.attack===0;
      const move=clamp(input.x||0,-1,1);if(Math.abs(move)>.08)p.facing=Math.sign(move);
      const speed=move*T.run*(p.trip>0?.2:p.guard?.35:1);
      if(p.dash>0){p.vx=p.facing*T.dashSpeed;p.vy=0;}else p.vx=approach(p.vx,speed,(Math.abs(move)>.01?(p.grounded?T.acceleration:T.airAcceleration):T.brake)*dt);
      if(p.climbing&&vine){p.vx=move*85;p.vy=(input.y||0)*150;p.y=clamp(p.y,vine.top,vine.bottom);}
      else if(p.dash===0)p.vy=Math.min(T.maxFall,p.vy+T.gravity*dt);
      const solids=this.surfaces.concat(this.dynamicSolids());
      p.x=clamp(p.x+p.vx*dt,T.width/2,this.def.width-T.width/2);
      for(const s of solids){if(s.oneWay)continue;if(overlap(rect(p),s)){const head=p.y-T.height;if(p.y>s.y+1&&head<s.y+s.h-1){if(p.vx>0)p.x=s.x-T.width/2;else if(p.vx<0)p.x=s.x+s.w+T.width/2;p.vx=0;}}}
      const beforeY=p.y;p.y+=p.vy*dt;p.grounded=false;p.surface=null;
      let landing=null;
      for(const s of solids){if(p.x+T.width/2<=s.x||p.x-T.width/2>=s.x+s.w)continue;
        if(p.vy>=0&&beforeY<=s.y+1&&p.y>=s.y&&(!landing||s.y<landing.y))landing=s;
        else if(!s.oneWay&&p.vy<0&&beforeY-T.height>=s.y+s.h-.5&&p.y-T.height<s.y+s.h){p.y=s.y+s.h+T.height;p.vy=0;}}
      if(landing){p.y=landing.y;p.vy=0;p.grounded=true;p.surface=landing.id;if(oldY<landing.y-1)this.emit('land',{x:p.x,y:p.y});}
      if(p.climbing&&vine){p.y=clamp(p.y,vine.top,vine.bottom);if(p.y===vine.top&&input.y<0)p.vy=0;}
      this.distance=Math.max(this.distance,p.x);this.updateEntities(dt,pressed,oldY);this.updateBoss(dt);this.updateProjectiles(dt);
      if(p.y>this.def.height+80){this.respawn('pit');return;}
      if(this.bonus){this.bonus.time-=dt;for(const c of this.bonus.targets){if(!c.got&&Math.hypot(p.x-c.x,p.y-34-c.y)<43){c.got=true;this.bonus.count++;this.emit('coin',{x:c.x,y:c.y});}}if(this.bonus.count>=this.bonus.targets.length){this.bonusDone=true;this.bonusIds.add(this.bonus.id);const bonusId=this.bonus.id;this.bonus=null;this.emit('bonusComplete',{bonusId});}else if(this.bonus.time<=0){this.bonus=null;this.emit('message',{text:'As luzes se apagaram. Você pode tentar de novo.'});}}
      if(Math.abs(p.x-this.def.goal.x)<65&&Math.abs(p.y-this.def.goal.y)<95){const need=this.def.requiredBells||0;if(this.bells.size>=need){this.status='celebrating';p.vx=p.vy=0;this.emit('complete',{coins:p.coins,hearts:p.hearts,deaths:this.deaths,secretExit:this.secretExit,bonusDone:this.bonusDone});}else if(!this.goalHint||this.time-this.goalHint>4){this.goalHint=this.time;this.emit('message',{text:this.boss&&!this.boss.defeated?'O guardião protege este portal.':`Desperte os sinos do bosque: ${this.bells.size}/${need}.`});}}
    }
    updateEntities(dt,pressed,oldY){const p=this.player;
      for(const e of this.entities){if(!e.alive)continue;if(e.open>0)e.open=Math.min(1,e.open+dt);e.hit=Math.max(0,(e.hit||0)-dt);const near=Math.abs(p.x-e.x)<64&&Math.abs(p.y-e.y)<140;
        if(['coin','heart','key'].includes(e.type)&&Math.hypot(p.x-e.x,p.y-32-e.y)<42){if(e.type==='heart'&&p.hearts===p.maxHearts)continue;e.alive=false;this.collected.add(e.id);if(e.type==='coin')p.coins++;if(e.type==='heart')p.hearts=Math.min(p.maxHearts,p.hearts+1);if(e.type==='key')this.keys.add(e.keyId||'forest');this.emit(e.type,{x:e.x,y:e.y});}
        if(e.type==='checkpoint'&&near&&!e.active){e.active=true;this.checkpoint={x:e.x,y:e.y};p.hearts=p.maxHearts;this.emit('checkpoint',{x:e.x,y:e.y});}
        if(e.type==='branch'&&near&&Math.abs(p.x-e.x)<22&&p.grounded&&Math.abs(p.vx)>75&&(!e.lastTrip||this.time-e.lastTrip>2)){e.lastTrip=this.time;p.trip=.3;p.vx*=.15;this.emit('trip',{x:e.x,y:e.y});}
        if(e.type==='spring'&&Math.abs(p.x-e.x)<28&&p.grounded&&Math.abs(p.y-e.y)<8){p.vy=-800;p.grounded=false;p.jumps=1;this.emit('spring',{x:e.x,y:e.y});}
        if(e.type==='crate'&&p.attack>0&&e.hit===0&&Math.abs(p.x+p.facing*40-e.x)<55&&Math.abs(p.y-e.y)<80){e.alive=false;p.coins+=3;this.emit('break',{x:e.x,y:e.y-25});}
        if(pressed.interact&&near){
          if(e.type==='door'&&e.open===0){if(this.keys.has(e.keyId||'forest')){e.open=.01;this.emit('door',{x:e.x,y:e.y});}else this.emit('message',{text:'A chave está neste caminho. Procure o brilho dourado.'});}
          if(e.type==='bell'&&!this.bells.has(e.index)){this.bells.add(e.index);e.active=true;this.emit('bell',{x:e.x,y:e.y,index:e.index});}
          if(e.type==='sign')this.emit('message',{text:e.text});
          if(e.type==='secret'&&!this.secretExit){this.secretExit=true;e.active=true;this.emit('secret',{x:e.x,y:e.y});}
          if(e.type==='challenge'&&this.boss&&this.boss.state==='idle'){this.boss.state='intro';this.boss.timer=2.6;this.emit('message',{text:'Desafio opcional iniciado. Você ainda pode seguir ao portal.'});}
          if(e.type==='bonus'&&!this.bonus&&!this.bonusIds.has(e.bonusId||'B01')){this.bonus={id:e.bonusId||'B01',time:e.duration||45,count:0,targets:Array.from({length:e.target||12},(_,i)=>({x:e.x+90+i*56,y:e.y-45,got:false}))};this.emit('message',{text:'Jardim das luzes: recolha as doze estrelas em 45 segundos!'});}
        }
        if(e.type==='enemy'){
          if(Math.abs(e.x-p.x)>1400)continue;e.timer-=dt;
          const flying=e.kind==='bee';e.x+=e.dir*(e.kind==='beetle'?48:28)*dt;if(Math.abs(e.x-e.homeX)>(e.patrol||100)){e.dir*=-1;e.x=clamp(e.x,e.homeX-(e.patrol||100),e.homeX+(e.patrol||100));}
          if(flying)e.y=e.homeY+Math.sin(this.time*2.2+e.homeX)*22;
          else if(!this.supportAt(e.x+e.dir*22,e.y,6)){e.dir*=-1;e.x+=e.dir*3;}
          if(e.timer<=0&&Math.abs(p.x-e.x)<420){if(e.kind!=='beetle'){const dx=p.x-e.x,dy=p.y-35-(e.y-22),len=Math.hypot(dx,dy)||1;this.projectiles.push({x:e.x,y:e.y-22,vx:dx/len*155,vy:dy/len*155,r:7,life:4,kind:'spore'});this.emit('spore',{x:e.x,y:e.y-22});}e.timer=e.kind==='bee'?3.2:4;}
          if(p.attack>.06&&e.hit===0&&Math.abs(p.x+p.facing*40-e.x)<57&&Math.abs(p.y-e.y)<90){e.hp--;e.hit=.38;this.emit('enemyHit',{x:e.x,y:e.y-20});}
          const er={x:e.x-22,y:e.y-(flying?38:34),w:44,h:34};
          if(overlap(rect(p),er)&&e.hp>0){if(p.vy>80&&oldY<=er.y+10){e.hp--;e.hit=.35;p.y=er.y;p.vy=-370;p.grounded=false;this.emit('stomp',{x:e.x,y:er.y});}else if(e.hit===0)this.hurt('enemy');}
          if(e.hp<=0){e.alive=false;p.coins+=2;this.emit('enemyDefeat',{x:e.x,y:e.y-20});}
        }
      }
    }
    updateBoss(dt){const b=this.boss,p=this.player;if(!b||b.defeated||b.state==='idle')return;b.timer-=dt;b.hitCooldown=Math.max(0,b.hitCooldown-dt);b.phase=b.hp<=6?2:1;
      if(b.state==='intro'&&b.timer<=0){b.state='warn';b.timer=1.15;b.move='stomp';this.emit('bossWarn',{move:b.move});}
      if(b.state==='recover'&&p.attack>.05&&b.hitCooldown===0&&Math.abs(p.x+p.facing*45-b.x)<108&&Math.abs(p.y-b.y)<150){b.hp--;b.hitCooldown=.43;this.emit('enemyHit',{x:b.x,y:b.y-85});if(b.hp<=0){b.defeated=true;b.state='defeated';this.emit('bossDefeat',{x:b.x,y:b.y});return;}}
      if(b.state==='warn'&&b.timer<=0){b.state='attack';b.timer=b.move==='charge'?1.1:.7;b.dir=p.x<b.x?-1:1;
        if(b.move==='stomp'){for(const dir of [-1,1])this.projectiles.push({x:b.x,y:886,vx:dir*(b.phase===2?265:220),vy:0,r:15,life:5,kind:'wave'});}
        if(b.move==='seeds'){for(let i=0;i<5+b.phase;i++){const a=Math.PI+(i-(2+b.phase/2))*.18;this.projectiles.push({x:b.x,y:b.y-95,vx:Math.cos(a)*210,vy:Math.sin(a)*210,r:10,life:5,kind:'seed'});}}
        if(b.move==='roots'){for(const x of b.markers)this.projectiles.push({x,y:863,vx:0,vy:0,r:28,life:.7,kind:'root'});}
        this.emit('bossAttack',{move:b.move,x:b.x,y:b.y});
      }
      if(b.state==='attack'&&b.move==='charge'){b.x=clamp(b.x+b.dir*(b.phase===2?430:350)*dt,300,this.def.width-260);if(Math.abs(p.x-b.x)<75&&Math.abs(p.y-b.y)<135)this.hurt('boss');}
      if(b.state==='attack'&&b.timer<=0){b.state='recover';b.timer=b.phase===2?1.8:2.3;this.emit('bossOpen');}
      if(b.state==='recover'&&b.timer<=0){b.state='warn';b.timer=b.phase===2?.85:1.15;b.cycle++;b.move=['stomp','seeds','roots','charge'][b.cycle%4];b.markers=[clamp(p.x,150,this.def.width-100),clamp(p.x-130,150,this.def.width-100),clamp(p.x+130,150,this.def.width-100)];this.emit('bossWarn',{move:b.move});}
    }
    updateProjectiles(dt){const p=this.player;for(const q of this.projectiles){q.x+=q.vx*dt;q.y+=q.vy*dt;q.life-=dt;if(['spore','seed'].includes(q.kind)&&this.surfaces.concat(this.dynamicSolids()).some(s=>overlap({x:q.x-q.r,y:q.y-q.r,w:q.r*2,h:q.r*2},s)))q.life=0;if(q.life>0&&overlap(rect(p),{x:q.x-q.r,y:q.y-q.r,w:q.r*2,h:q.r*2})){this.hurt(q.kind);if(q.kind!=='root')q.life=0;}}this.projectiles=this.projectiles.filter(q=>q.life>0&&q.x>-100&&q.x<this.def.width+100);}
    nearby(){const p=this.player;return this.entities.find(e=>e.alive&&['door','bell','secret','bonus','sign','challenge'].includes(e.type)&&Math.abs(e.x-p.x)<68&&Math.abs(e.y-p.y)<145&&(e.type!=='door'||e.open===0)&&(e.type!=='bell'||!e.active));}
    snapshot(){const p=this.player;return{level:this.def.id,status:this.status,time:this.time,player:{...p},checkpoint:{...this.checkpoint},keys:[...this.keys],bells:[...this.bells],secretExit:this.secretExit,bonusDone:this.bonusDone,bonusIds:[...this.bonusIds],deaths:this.deaths,boss:this.boss?{...this.boss}:null};}
  }
  return{World,T,rect,overlap,neutral};
});
