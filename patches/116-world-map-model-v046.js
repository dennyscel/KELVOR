/* KELVOR v046: pure world-map navigation and view state; no campaign writes. */
(function(root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) {
    root.PlatformerSNESV04 = root.PlatformerSNESV04 || {};
    root.PlatformerSNESV04.LivingWorldMapModel = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  'use strict';

  const STORAGE_KEY = 'kelvor_world_map_v046_view';
  const WORLD_IDS = Object.freeze(['W01', 'W02', 'W03', 'W04', 'W05']);
  const NODE_IDS = Object.freeze(['L01', 'L02', 'L03', 'SECRET', 'BOSS']);
  const WORLD_EDGES = Object.freeze([
    Object.freeze({from:'L01', to:'L02'}),
    Object.freeze({from:'L02', to:'L03'}),
    Object.freeze({from:'L02', to:'SECRET', secret:true}),
    Object.freeze({from:'L03', to:'BOSS'})
  ]);
  const OPEN_STATES = new Set([
    'AVAILABLE', 'CURRENT', 'COMPLETED', 'MASTERED', 'BOSS_AVAILABLE', 'BOSS_DEFEATED'
  ]);
  const own = (object, key) => object != null && Object.prototype.hasOwnProperty.call(object, key);
  const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
  const finite = value => typeof value === 'number' && Number.isFinite(value);
  const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
  const positive = (value, fallback) => finite(value) && value > 0 ? value : fallback;
  const isUnlocked = state => OPEN_STATES.has(state);

  function canStand(states, id, secretExit) {
    if (typeof id !== 'string' || !own(states, id)) return false;
    // RC35 preserves the historical SECRET state; it authorizes only its own revealed branch.
    if (states[id] === 'SECRET') return id === 'SECRET' && secretExit === true;
    return isUnlocked(states[id]) && (id !== 'SECRET' || secretExit === true);
  }

  function edgeParts(edge) {
    let parsed;
    if (Array.isArray(edge)) {
      if (edge.length < 2 || (edge[2] !== undefined && edge[2] !== 'normal' && edge[2] !== 'secret')) return null;
      parsed = {from:edge[0], to:edge[1], secret:edge[2] === 'secret'};
    } else {
      if (!record(edge) || (edge.secret !== undefined && typeof edge.secret !== 'boolean')) return null;
      if (edge.type !== undefined && edge.type !== 'normal' && edge.type !== 'secret') return null;
      parsed = {from:edge.from, to:edge.to, secret:edge.secret === true || edge.type === 'secret'};
    }
    if (typeof parsed.from !== 'string' || !parsed.from || typeof parsed.to !== 'string' || !parsed.to || parsed.from === parsed.to) return null;
    return parsed;
  }

  function adjacency(edges, states, secretExit) {
    const graph = new Map();
    if (!Array.isArray(edges) || !record(states)) return graph;
    for (const edge of edges) {
      const e = edgeParts(edge);
      if (!e || e.from === e.to || (e.secret && secretExit !== true) ||
          !canStand(states, e.from, secretExit) || !canStand(states, e.to, secretExit)) continue;
      for (const [a, b] of [[e.from,e.to], [e.to,e.from]]) {
        if (!graph.has(a)) graph.set(a, new Set());
        graph.get(a).add(b);
      }
    }
    return graph;
  }

  /** Shortest bidirectional route as IDs (including endpoints), or null. Missing/unknown states lock nodes. */
  function findRoute(edges, states, from, to, options) {
    const secretExit = options != null && options.secretExit === true;
    if (!canStand(states, from, secretExit) || !canStand(states, to, secretExit)) return null;
    // Even from === to must refer to a node present in the supplied real graph.
    if (!Array.isArray(edges) || !edges.some(edge => {
      const e = edgeParts(edge);
      return e && (e.from === from || e.to === from);
    })) return null;
    if (from === to) return [from];
    const graph = adjacency(edges, states, secretExit);
    const previous = new Map([[from, null]]);
    const queue = [from];
    for (let cursor = 0; cursor < queue.length; cursor++) {
      const current = queue[cursor];
      for (const next of graph.get(current) || []) {
        if (previous.has(next)) continue;
        previous.set(next, current);
        if (next === to) {
          const route = [to];
          while (route[route.length - 1] !== from) route.push(previous.get(route[route.length - 1]));
          return route.reverse();
        }
        queue.push(next);
      }
    }
    return null;
  }

  function point(value) {
    const x = Array.isArray(value) ? value[0] : value && value.x;
    const y = Array.isArray(value) ? value[1] : value && value.y;
    return finite(x) && finite(y) ? {x,y} : null;
  }

  /** Sample a polyline by world-unit distance, never by node count. Angle is radians; invalid paths return null. */
  function samplePath(points, distance) {
    if (!Array.isArray(points) || points.length === 0) return null;
    const path = points.map(point);
    if (path.some(p => p === null)) return null;
    const segments = [];
    let total = 0;
    for (let i = 1; i < path.length; i++) {
      const a = path[i - 1], b = path[i];
      const length = Math.hypot(b.x - a.x, b.y - a.y);
      if (!Number.isFinite(length)) return null;
      if (length > 0) segments.push({a, b, length, angle:Math.atan2(b.y - a.y, b.x - a.x)});
      total += length;
    }
    if (!Number.isFinite(total)) return null;
    if (total === 0) return {x:path[0].x, y:path[0].y, angle:0, done:true, total:0};
    const travelled = clamp(finite(distance) ? distance : 0, 0, total);
    let remaining = travelled;
    for (let i = 0; i < segments.length; i++) {
      const s = segments[i];
      if (remaining < s.length || i === segments.length - 1) {
        const t = clamp(remaining / s.length, 0, 1);
        return {x:s.a.x + (s.b.x - s.a.x) * t, y:s.a.y + (s.b.y - s.a.y) * t,
          angle:s.angle, done:travelled >= total, total};
      }
      remaining -= s.length;
    }
    return null;
  }

  /** Conventional top-left world scroll. Focus shows at most 1100 x 700 units and fills the viewport.
   * Overview contains the full world, with negative scroll only to center a letterboxed axis.
   * Phaser zooms around the viewport center: convert conventional scroll by + size/(2*zoom) - size/2.
   */
  function cameraFrame(options) {
    const o = options || {};
    const width = positive(o.width, 640), height = positive(o.height, 360);
    const worldWidth = positive(o.worldWidth, 2048), worldHeight = positive(o.worldHeight, 1365);
    const overview = o.mode === 'overview';
    const zoom = overview ? Math.min(width / worldWidth, height / worldHeight) :
      Math.max(width / worldWidth, height / worldHeight, width / 1100, height / 700);
    const visibleWidth = width / zoom, visibleHeight = height / zoom;
    // Finite inputs can still overflow/underflow their ratios; keep a corrupt size out of camera transforms.
    if (!finite(zoom) || zoom <= 0 || !finite(visibleWidth) || !finite(visibleHeight)) return cameraFrame({mode:o.mode});
    const target = point(o.target) || {x:worldWidth / 2, y:worldHeight / 2};
    const axis = (extent, visible, focus) => {
      if (visible >= extent) return (extent - visible) / 2;
      return clamp(focus - visible / 2, 0, extent - visible);
    };
    return {zoom,
      scrollX:axis(worldWidth, visibleWidth, overview ? worldWidth / 2 : target.x),
      scrollY:axis(worldHeight, visibleHeight, overview ? worldHeight / 2 : target.y)};
  }

  /** Return a directly connected open neighbor ID in the requested half-plane, or null.
   * nodes is {ID:{x,y}} (coordinate pairs also accepted); angle wins, then shorter distance.
   */
  function chooseDirectionalNeighbor(nodes, edges, states, current, dx, dy, secretExit) {
    if (!record(nodes) || !own(nodes, current) || !finite(dx) || !finite(dy) || !canStand(states,current,secretExit)) return null;
    const origin = point(nodes[current]), magnitude = Math.hypot(dx,dy);
    if (!origin || magnitude === 0 || !Number.isFinite(magnitude)) return null;
    const graph = adjacency(edges, states, secretExit === true);
    let best = null, bestAlignment = 0, bestDistance = Infinity;
    for (const id of graph.get(current) || []) {
      if (!own(nodes, id)) continue;
      const candidate = point(nodes[id]);
      if (!candidate) continue;
      const vx = candidate.x - origin.x, vy = candidate.y - origin.y;
      const distance = Math.hypot(vx,vy);
      if (!Number.isFinite(distance) || distance === 0) continue;
      const alignment = (vx / distance) * (dx / magnitude) + (vy / distance) * (dy / magnitude);
      if (alignment <= 1e-7) continue;
      if (alignment > bestAlignment + 1e-7 || (Math.abs(alignment - bestAlignment) <= 1e-7 && distance < bestDistance)) {
        best = id; bestAlignment = alignment; bestDistance = distance;
      }
    }
    return best;
  }

  function storedPositions(storage) {
    try {
      if (!storage || typeof storage.getItem !== 'function') return {};
      const raw = storage.getItem(STORAGE_KEY);
      if (typeof raw !== 'string' || raw.length > 4096) return {};
      const parsed = JSON.parse(raw);
      if (!record(parsed) || parsed.version !== 1 || !record(parsed.positions)) return {};
      const result = {};
      for (const world of WORLD_IDS) {
        if (own(parsed.positions,world) && NODE_IDS.includes(parsed.positions[world])) result[world] = parsed.positions[world];
      }
      return result;
    } catch (_) { return {}; }
  }

  /** Read {W01:'L02',...}; restore only real nodes reachable from L01 in the CURRENT save. No save/storage writes. */
  function readVisited(storage, save) {
    const positions = storedPositions(storage), result = {};
    if (!record(save) || !record(save.worlds)) return result;
    for (const world of WORLD_IDS) {
      if (!own(positions,world) || !own(save.worlds,world)) continue;
      const data = save.worlds[world];
      if (!record(data) || data.unlocked !== true || !record(data.nodes)) continue;
      if (findRoute(WORLD_EDGES, data.nodes, 'L01', positions[world], {secretExit:data.secretExit})) result[world] = positions[world];
    }
    return result;
  }

  /** Persist one ARRIVED node after successful travel. Callers gate reachability with findRoute.
   * Stores only world/node view position under STORAGE_KEY, never touches campaign/RC35 data.
   */
  function writeVisited(storage, world, node) {
    if (!WORLD_IDS.includes(world) || !NODE_IDS.includes(node)) return false;
    try {
      if (!storage || typeof storage.setItem !== 'function') return false;
      const positions = storedPositions(storage);
      positions[world] = node;
      storage.setItem(STORAGE_KEY, JSON.stringify({version:1, positions}));
      return true;
    } catch (_) { return false; }
  }

  return Object.freeze({STORAGE_KEY, WORLD_IDS, NODE_IDS, WORLD_EDGES, isUnlocked,
    findRoute, samplePath, cameraFrame, chooseDirectionalNeighbor, readVisited, writeVisited});
});
