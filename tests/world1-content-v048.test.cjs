'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const C=require('../patches/120-world1-content-v048.js');
const L=Object.values(C.levels);
const contains=(s,x,margin=0)=>x>=s.x+margin && x<=s.x+s.w-margin;
const grounded=(l,p)=>l.surfaces.some(s=>contains(s,p.x,17)&&Math.abs(s.y-p.y)<.01&&!s.move);
const pickups=new Set(['coin','heart','key','bell']);
const footEntities=new Set(['checkpoint','door','branch','crate','secret','bonus','sign','spring','lantern','challenge']);

test('all existing W01 map nodes have independently cloned content and no level was shortened',()=>{
  assert.deepEqual(Object.keys(C.levels),['W01_L01','W01_L02','W01_L03','W01_SECRET','W01_BOSS']);
  for(const l of L){assert.ok(l.width>=C.BASELINES[l.id],l.id);assert.equal(l.height,1500);const c=C.getLevel(l.id);c.spawn.x=-1;c.entities[0].x=-1;assert.notEqual(C.levels[l.id].spawn.x,-1);assert.notEqual(C.levels[l.id].entities[0].x,-1);}
  assert.equal(C.getLevel('W02_L01'),null);
});

test('browser UMD installs exactly the data API without an engine or document',()=>{
  const context={window:{PlatformerSNESV04:{existing:true}}};vm.runInNewContext(fs.readFileSync(require.resolve('../patches/120-world1-content-v048.js'),'utf8'),context);
  assert.equal(context.window.PlatformerSNESV04.existing,true);assert.equal(context.window.PlatformerSNESV04.World1ContentV048.getLevel('W01_L01').width,42000);
});

test('every level starts and ends on drawn, stationary ground with no direct next-scene contract',()=>{
  for(const l of L){assert.ok(grounded(l,l.spawn),'spawn '+l.id);assert.ok(grounded(l,l.goal),'goal '+l.id);assert.equal(l.spawn.y,900);assert.equal(l.goal.y,900);assert.ok(l.goal.x>l.spawn.x);assert.equal(l.nextScene,undefined);}
});

test('sectors partition each full level and include breathing space and a distinct finale',()=>{
  for(const l of L){assert.equal(l.sectors[0].x,0);assert.equal(l.sectors.at(-1).end,l.width);assert.equal(l.sectors.at(-1).type,'finale');assert.ok(l.sectors.some(s=>s.type==='rest'));for(let i=0;i<l.sectors.length;i++){assert.ok(l.sectors[i].end>l.sectors[i].x);if(i)assert.equal(l.sectors[i-1].end,l.sectors[i].x);}}
  assert.equal(C.levels.W01_L01.sectors.length,10);
});

test('surface coordinates, motion envelopes and identifiers stay inside their level',()=>{
  for(const l of L){const ids=new Set();for(const o of [...l.surfaces,...l.entities,...l.vines]){assert.ok(!ids.has(o.id),'duplicate '+o.id);ids.add(o.id);}
    for(const s of l.surfaces){assert.ok(s.x>=0&&s.y>=200&&s.w>0&&s.h>0,s.id);assert.ok(s.x+s.w<=l.width,s.id);assert.ok(s.y+s.h<=l.height,s.id);assert.ok(['ground','log','stone','branch','bridge'].includes(s.kind));if(s.move){assert.ok(['x','y'].includes(s.move.axis));assert.ok(s.move.range>0&&s.move.speed>0);if(s.move.axis==='x')assert.ok(s.x-s.move.range>=0&&s.x+s.w+s.move.range<=l.width);else assert.ok(s.y-s.move.range>=200&&s.y+s.h+s.move.range<=l.height);}}
  }
});

test('main route has visible ground only and its genuine gaps never exceed 140px',()=>{
  for(const l of L){const ground=l.surfaces.filter(s=>s.kind==='ground').sort((a,b)=>a.x-b.x);assert.equal(ground[0].x,0);assert.equal(ground.at(-1).x+ground.at(-1).w,l.width);for(let i=0;i<ground.length;i++){assert.equal(ground[i].y,900);assert.equal(ground[i].oneWay,false);if(i){const gap=ground[i].x-ground[i-1].x-ground[i-1].w;assert.ok(gap>0&&gap<=140,l.id+' gap '+gap);}}}
});

test('all optional platforms are reachable by <=80px upward steps, <=140px gaps or anchored vines',()=>{
  for(const l of L){const reached=new Set(l.surfaces.filter(s=>s.kind==='ground').map(s=>s.id));let changed=true;
    while(changed){changed=false;for(const target of l.surfaces){if(reached.has(target.id))continue;
      const reachable=l.surfaces.some(from=>{if(!reached.has(from.id))return false;const gap=Math.max(0,target.x-from.x-from.w,from.x-target.x-target.w);const extra=(from.move?.axis==='y'?from.move.range:0)+(target.move?.axis==='y'?target.move.range:0);const up=from.y-target.y+extra;return up<=80&&up>=-130&&gap<=140;});
      const vine=l.vines.some(v=>v.anchorSurfaceId===target.id&&l.surfaces.some(s=>reached.has(s.id)&&contains(s,v.x)&&Math.abs(s.y-v.bottom)<1));
      if(reachable||vine){reached.add(target.id);changed=true;}
    }}
    const missing=l.surfaces.filter(s=>!reached.has(s.id));assert.deepEqual(missing.map(s=>s.id),[],l.id);
  }
});

test('vines reach a real branch above and a real floor below',()=>{
  for(const l of L)for(const v of l.vines){const top=l.surfaces.find(s=>s.id===v.anchorSurfaceId);assert.ok(top&&contains(top,v.x),v.id);assert.equal(v.top,top.y);assert.ok(v.top<v.bottom);assert.ok(l.surfaces.some(s=>s.kind==='ground'&&contains(s,v.x,17)&&s.y===v.bottom),v.id);}
  for(const id of ['W01_L01','W01_L02','W01_L03','W01_SECRET'])assert.ok(C.levels[id].surfaces.some(s=>s.y===200),id+' has a meaningful canopy ascent');
});

test('entities and patrols are supported, pickups are exposed, and no ground actor stands in a ravine',()=>{
  for(const l of L)for(const e of l.entities){assert.ok(Number.isFinite(e.x)&&Number.isFinite(e.y)&&e.x>=0&&e.x<=l.width&&e.y>=0&&e.y<=l.height,e.id);
    if(footEntities.has(e.type)||e.type==='enemy'&&e.kind!=='bee')assert.ok(grounded(l,e),e.id+' support');
    if(e.type==='enemy'&&e.kind!=='bee'){const floor=l.surfaces.find(s=>s.kind==='ground'&&contains(s,e.x));assert.ok(e.patrol>=0&&contains(floor,e.x-e.patrol,17)&&contains(floor,e.x+e.patrol,17),e.id+' patrol');}
    if(pickups.has(e.type)){const support=e.surfaceId?l.surfaces.find(s=>s.id===e.surfaceId):l.surfaces.filter(s=>contains(s,e.x)&&s.y>=e.y).sort((a,b)=>a.y-b.y)[0];assert.ok(support&&support.y-e.y>=20&&support.y-e.y<=100,e.id+' collectible support');}
    for(const s of l.surfaces.filter(s=>!s.oneWay&&s.kind!=='ground'))assert.ok(!(contains(s,e.x)&&e.y>s.y&&e.y<s.y+s.h),e.id+' embedded in '+s.id);
  }
});

test('each local door has its unique visible key before it, <=600px away; none remotely locks the exit',()=>{
  for(const l of L){const doors=l.entities.filter(e=>e.type==='door');assert.deepEqual(l.requiredDoorIds,[]);for(const door of doors){const keys=l.entities.filter(e=>e.type==='key'&&e.keyId===door.keyId);assert.equal(keys.length,1,door.id);const key=keys[0];assert.ok(key.x<door.x&&door.x-key.x<=600,door.id);const ground=l.surfaces.find(s=>s.kind==='ground'&&contains(s,door.x));assert.ok(contains(ground,key.x),door.id+' key on same side route');assert.ok(key.y<=door.y-20);}}
});

test('rituals, secret exit and independent bonus flags preserve existing campaign branches',()=>{
  for(const id of ['W01_L01','W01_L03']){const l=C.levels[id];assert.equal(l.requiredBells,0);assert.deepEqual(l.entities.filter(e=>e.type==='bell').map(e=>e.index),[1,2,3]);assert.equal(l.medals.find(m=>m.type==='bells').target,3);}
  const secret=C.levels.W01_L02.entities.find(e=>e.type==='secret');assert.equal(secret.destination,'W01_SECRET');assert.equal(secret.requiresAction,'Y');
  const bonuses=L.flatMap(l=>l.entities.filter(e=>e.type==='bonus').map(e=>({l,e})));assert.equal(bonuses.length,3);assert.equal(new Set(bonuses.map(b=>b.e.bonusId)).size,3);assert.equal(C.levels.W01_SECRET.entities.find(e=>e.type==='bonus').bonusId,'B01');
  for(const {l,e} of bonuses){assert.equal(e.target,12);assert.equal(e.durationMs,45000);assert.ok(l.surfaces.some(s=>s.kind==='ground'&&contains(s,e.x)&&s.x+s.w>=e.x+800),e.id+' needs a safe 800px bonus runway');}
  assert.ok(C.levels.W01_SECRET.bonus.minimumTravelWidth>=C.BASELINES.W01_BONUS_B01);
});

test('Guardian retains 12 HP and 12 initial hearts with a larger arena and a separate finale',()=>{
  const l=C.levels.W01_BOSS;assert.equal(l.boss.hp,12);assert.equal(l.boss.hearts,12);assert.ok(grounded(l,l.boss));assert.ok(l.boss.arena.right-l.boss.arena.left>=1400);assert.ok(l.goal.x>l.boss.arena.right);assert.equal(l.boss.optional,true);assert.equal(l.boss.startDormant,true);assert.ok(l.entities.some(e=>e.type==='challenge'&&e.optional));assert.equal(l.platinum.optional,true);
});
