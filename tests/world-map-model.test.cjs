'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const M = require('../patches/116-world-map-model-v046.js');
const open = {L01:'COMPLETED', L02:'COMPLETED', L03:'AVAILABLE', SECRET:'AVAILABLE', BOSS:'BOSS_AVAILABLE'};
const edges = M.WORLD_EDGES;
const route = (from, to, states = open, secretExit = false) => M.findRoute(edges,states,from,to,{secretExit});
const approx = (actual, expected, epsilon = 1e-8) => assert.ok(Math.abs(actual-expected) <= epsilon, `${actual} ~= ${expected}`);
function memoryStorage(raw) {
  const values = new Map(raw === undefined ? [] : [[M.STORAGE_KEY,raw]]);
  const writes = [];
  return {values,writes,getItem:key => values.get(key) ?? null,setItem(key,value) { writes.push({key,value}); values.set(key,value); }};
}
function save(worlds = {}) { return {currentWorld:'W01', selected:'W01_L01', worlds:{W01:{unlocked:true,nodes:{...open},secretExit:false},...worlds}}; }

test('route walks each real edge and reverses without jumping across nodes', () => {
  assert.deepEqual(route('L01','BOSS'), ['L01','L02','L03','BOSS']);
  assert.deepEqual(route('BOSS','L01'), ['BOSS','L03','L02','L01']);
  assert.deepEqual(route('L01','L01'), ['L01']);
});

test('locked intermediate cannot be bypassed even when destination is open', () => {
  assert.equal(route('L01','BOSS',{...open,L02:'LOCKED'}), null);
  assert.equal(route('L01','BOSS',{...open,L03:'BOSS_LOCKED'}), null);
  assert.equal(route('L01','L02',{...open,L02:'LOCKED'}), null);
  assert.equal(route('L01','L02',{...open,L01:'LOCKED'}), null);
});

test('missing, unknown, false and inherited states fail closed', () => {
  for (const state of [undefined, null, false, true, '', 'UNLOCKED', 'BOGUS']) {
    assert.equal(route('L01','L02',{...open,L02:state}), null);
  }
  assert.equal(route('L01','L02',Object.create(open)), null);
  assert.equal(M.findRoute(edges,null,'L01','L02'), null);
  assert.equal(M.findRoute(edges,{...open,GHOST:'AVAILABLE'},'GHOST','GHOST'),null);
});

test('secret node and secret edges require an explicit true secret exit', () => {
  assert.equal(route('L01','SECRET'), null);
  assert.deepEqual(route('L01','SECRET',open,true), ['L01','L02','SECRET']);
  assert.equal(route('L01','SECRET',open,'true'), null);
  assert.equal(route('SECRET','SECRET'), null);
  assert.equal(M.findRoute([{from:'L01',to:'L02',secret:true}],open,'L01','L02'),null);
  assert.equal(route('L01','SECRET',{...open,SECRET:'LOCKED'},true),null);
});

test('RC35 SECRET state restores its revealed branch without opening normal nodes', () => {
  const legacyStates = {...open,SECRET:'SECRET'};
  assert.deepEqual(route('L01','SECRET',legacyStates,true),['L01','L02','SECRET']);
  assert.deepEqual(route('SECRET','L01',legacyStates,true),['SECRET','L02','L01']);
  for (const exit of [false,undefined,'true',1]) assert.equal(route('L01','SECRET',legacyStates,exit),null);
  assert.equal(route('L01','SECRET',{...legacyStates,L02:'SECRET'},true),null);
  assert.equal(route('L01','BOSS',{...open,BOSS:'SECRET'},true),null);
  const storage = memoryStorage(JSON.stringify({version:1,positions:{W01:'SECRET'}}));
  const campaign = save({W01:{unlocked:true,nodes:legacyStates,secretExit:true}});
  const before = JSON.stringify(campaign);
  assert.deepEqual(M.readVisited(storage,campaign),{W01:'SECRET'});
  assert.equal(JSON.stringify(campaign),before);
  assert.equal(storage.writes.length,0);
  campaign.worlds.W01.secretExit = false;
  assert.deepEqual(M.readVisited(storage,campaign),{});
});

test('legacy edge tuples work; malformed edges cannot grant access', () => {
  assert.deepEqual(M.findRoute([['L01','L02','normal']],open,'L02','L01'),['L02','L01']);
  assert.equal(M.findRoute([['L02','SECRET','secret']],open,'L02','SECRET'),null);
  for (const bad of [null, 1, {}, ['L01','L02','teleport'], {from:'L01',to:'L02',secret:'true'}]) {
    assert.equal(M.findRoute([bad],open,'L01','L02'),null);
  }
  for (const bad of [['L01',null], {from:'L01'}, ['L01','L01']]) {
    assert.equal(M.findRoute([bad],open,'L01','L01'),null);
  }
});

test('BFS handles cycles and duplicate edges while taking the fewest legal edges', () => {
  const graph = [...edges, {from:'L01',to:'L03'}, {from:'L01',to:'L03'}];
  assert.deepEqual(M.findRoute(graph,open,'L01','BOSS'), ['L01','L03','BOSS']);
});

test('directional input chooses a connected neighbor, never a geometrically close disconnected marker', () => {
  const nodes = {L01:[0,0],L02:[100,0],L03:[200,0],SECRET:[100,100],BOSS:[100,1]};
  assert.equal(M.chooseDirectionalNeighbor(nodes,edges,open,'L02',1,0,false),'L03');
  assert.equal(M.chooseDirectionalNeighbor(nodes,edges,open,'L02',-1,0,false),'L01');
  assert.equal(M.chooseDirectionalNeighbor(nodes,edges,open,'L02',0,1,false),null);
  assert.equal(M.chooseDirectionalNeighbor(nodes,edges,open,'L02',0,1,true),'SECRET');
  assert.equal(M.chooseDirectionalNeighbor(nodes,edges,open,'L02',0,0,true),null);
  assert.equal(M.chooseDirectionalNeighbor(nodes,edges,{...open,L03:'LOCKED'},'L02',1,0,true),null);
});

test('path sampling follows bends using distance, preserving exact endpoints and facing', () => {
  const path = [[0,0],[3,0],[3,4]];
  assert.deepEqual(M.samplePath(path,2), {x:2,y:0,angle:0,done:false,total:7});
  const corner = M.samplePath(path,3);
  approx(corner.x,3); approx(corner.y,0); approx(corner.angle,Math.PI/2);
  assert.deepEqual(M.samplePath(path,999), {x:3,y:4,angle:Math.PI/2,done:true,total:7});
  const reverse = M.samplePath([...path].reverse(),2);
  approx(reverse.x,3); approx(reverse.y,2); approx(reverse.angle,-Math.PI/2);
});

test('time steps at fixed speed advance monotonically without teleporting at a corner', () => {
  const path = [[0,0],[30,0],[30,40],[100,40]];
  const speed = 50, steps = [0.016,0.027,0.2,0.007,0.35,0.5,0.7,1.5];
  let distance = 0, previous = M.samplePath(path,0);
  for (const dt of steps) {
    distance += speed * dt;
    const next = M.samplePath(path,distance);
    assert.ok(Math.hypot(next.x-previous.x,next.y-previous.y) <= speed*dt + 1e-8);
    assert.ok(next.x >= previous.x && next.y >= previous.y);
    assert.equal(next.done, distance >= next.total);
    previous = next;
  }
  assert.ok(previous.done);
  assert.deepEqual([previous.x,previous.y],[100,40]);
});

test('invalid points do not create bridges; duplicate and singleton points remain stable', () => {
  assert.equal(M.samplePath([],0),null);
  assert.equal(M.samplePath([[0,0],null,[10,10]],2),null);
  assert.equal(M.samplePath([[0,0],[Infinity,2]],2),null);
  assert.deepEqual(M.samplePath([[2,3],[2,3]],8),{x:2,y:3,angle:0,done:true,total:0});
  assert.deepEqual(M.samplePath([{x:2,y:3}],0),{x:2,y:3,angle:0,done:true,total:0});
  for (const distance of [-100,NaN,Infinity]) assert.equal(M.samplePath([[0,0],[10,0]],distance).x,0);
});

test('focus camera stays inside world edges in landscape, portrait and tiny worlds', () => {
  for (const [width,height,worldWidth,worldHeight] of [[1280,720,2048,1365],[360,780,2048,1365],[320,240,160,120],[1920,1080,2048,1365]]) {
    for (const target of [{x:-999,y:-999},{x:worldWidth+999,y:worldHeight+999},{x:1000,y:500}]) {
      const f = M.cameraFrame({width,height,worldWidth,worldHeight,mode:'focus',target});
      assert.ok(f.zoom > 0 && Number.isFinite(f.zoom));
      assert.ok(f.scrollX >= -1e-8 && f.scrollY >= -1e-8);
      assert.ok(f.scrollX + width/f.zoom <= worldWidth+1e-8);
      assert.ok(f.scrollY + height/f.zoom <= worldHeight+1e-8);
    }
  }
});

test('focus camera follows the player in both axes and is closer than overview', () => {
  const options = {width:360,height:780,worldWidth:2048,worldHeight:1365};
  const start = M.cameraFrame({...options,mode:'focus',target:{x:600,y:500}});
  const next = M.cameraFrame({...options,mode:'focus',target:{x:800,y:800}});
  assert.ok(next.scrollX > start.scrollX && next.scrollY > start.scrollY);
  assert.ok(next.zoom > M.cameraFrame({...options,mode:'overview'}).zoom);
});

test('overview contains and centers the complete map for both orientations', () => {
  for (const [width,height] of [[1280,720],[360,780]]) {
    const f = M.cameraFrame({width,height,worldWidth:2048,worldHeight:1365,mode:'overview'});
    assert.ok(f.scrollX <= 1e-8 && f.scrollY <= 1e-8);
    assert.ok(f.scrollX+width/f.zoom >= 2048-1e-8 && f.scrollY+height/f.zoom >= 1365-1e-8);
    approx(f.scrollX+width/f.zoom/2,1024);
    approx(f.scrollY+height/f.zoom/2,1365/2);
  }
});

test('malformed camera input returns finite values', () => {
  for (const options of [undefined,{}, {width:NaN,height:0,worldWidth:-1,worldHeight:Infinity,target:{x:NaN,y:Infinity}},
    {width:1e308,height:1e308,worldWidth:1e-300,worldHeight:1e-300},
    {width:Number.MIN_VALUE,height:Number.MIN_VALUE,worldWidth:1e308,worldHeight:1e308,mode:'overview'}]) {
    const frame = M.cameraFrame(options);
    for (const value of Object.values(frame)) assert.ok(Number.isFinite(value));
  }
});

test('view storage is isolated from campaign save and preserves only supported positions', () => {
  const storage = memoryStorage();
  storage.values.set('kelvor_campaign_rc1_v001','campaign bytes');
  storage.values.set('kelvor_rc35_save','RC35 bytes');
  assert.equal(M.writeVisited(storage,'W01','L02'),true);
  assert.equal(M.writeVisited(storage,'W05','BOSS'),true);
  assert.equal(M.writeVisited(storage,'W06','L01'),false);
  assert.equal(M.writeVisited(storage,'W01','GHOST'),false);
  assert.deepEqual(JSON.parse(storage.values.get(M.STORAGE_KEY)),{version:1,positions:{W01:'L02',W05:'BOSS'}});
  assert.ok(storage.writes.every(w => w.key === M.STORAGE_KEY));
  assert.equal(storage.values.get('kelvor_campaign_rc1_v001'),'campaign bytes');
  assert.equal(storage.values.get('kelvor_rc35_save'),'RC35 bytes');
});

test('view restore rejects locked worlds, locked intermediates and stale new-game positions', () => {
  const storage = memoryStorage(JSON.stringify({version:1,positions:{W01:'BOSS',W02:'L01',W03:'L02',W04:'GHOST'}}));
  const campaign = save({W02:{unlocked:false,nodes:{...open}},W03:{unlocked:true,nodes:{...open,L01:'LOCKED'}}});
  const before = JSON.stringify(campaign);
  assert.deepEqual(M.readVisited(storage,campaign),{W01:'BOSS'});
  assert.equal(JSON.stringify(campaign),before);
  assert.equal(storage.writes.length,0);
  campaign.worlds.W01.nodes.L02 = 'LOCKED';
  assert.deepEqual(M.readVisited(storage,campaign),{});
  campaign.worlds.W01.nodes = {L01:'AVAILABLE',L02:'LOCKED',L03:'LOCKED',SECRET:'LOCKED',BOSS:'LOCKED'};
  assert.deepEqual(M.readVisited(storage,campaign),{});
});

test('secret view restore needs a currently reachable secret branch', () => {
  const storage = memoryStorage(JSON.stringify({version:1,positions:{W01:'SECRET'}}));
  const campaign = save();
  assert.deepEqual(M.readVisited(storage,campaign),{});
  campaign.worlds.W01.secretExit = true;
  assert.deepEqual(M.readVisited(storage,campaign),{W01:'SECRET'});
  campaign.worlds.W01.nodes.L02 = 'LOCKED';
  assert.deepEqual(M.readVisited(storage,campaign),{});
});

test('blocked, corrupt and unexpected storage cannot throw or fabricate a visited node', () => {
  for (const raw of [undefined,'{','null','[]','42','{}','{"version":2,"positions":{"W01":"L02"}}','x'.repeat(5000)]) {
    assert.deepEqual(M.readVisited(memoryStorage(raw),save()),{});
  }
  const denied = {getItem(){throw new Error('denied');},setItem(){throw new Error('quota');}};
  assert.deepEqual(M.readVisited(denied,save()),{});
  assert.equal(M.writeVisited(denied,'W01','L02'),false);
  assert.deepEqual(M.readVisited(null,save()),{});
  assert.equal(M.writeVisited(null,'W01','L01'),false);
  assert.deepEqual(M.readVisited(memoryStorage(),null),{});
});

test('repairing malformed view storage discards unrelated data and keeps prototype keys out', () => {
  const storage = memoryStorage('{"version":1,"positions":{"W01":"L02","__proto__":"L01","W02":{"node":"L01"}},"campaign":{"cheat":true}}');
  assert.equal(M.writeVisited(storage,'W03','L01'),true);
  assert.deepEqual(JSON.parse(storage.values.get(M.STORAGE_KEY)),{version:1,positions:{W01:'L02',W03:'L01'}});
});
