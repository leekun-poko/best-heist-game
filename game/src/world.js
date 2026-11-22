// Moonlit Museum — world simulation. Pure logic, no drawing here.
// The thief crosses one museum hall. Guards patrol between waypoints and
// cameras sweep from the walls. Solid display cases block both movement
// and sight, so a case is cover, not decoration.
import { ROOM, THIEF, GUARD, CAMERA, ALARM } from './config.js';

export const OBSTACLES = [
  { x: 150, y: 170, w: 150, h: 54, label: 'Coins' },
  { x: 150, y: 330, w: 150, h: 54, label: 'Masks' },
  { x: 150, y: 490, w: 150, h: 54, label: 'Vases' },
  { x: 520, y: 150, w: 64, h: 150, label: '' },
  { x: 696, y: 150, w: 64, h: 150, label: '' },
  { x: 520, y: 430, w: 64, h: 150, label: '' },
  { x: 696, y: 430, w: 64, h: 150, label: '' },
  { x: 940, y: 170, w: 150, h: 54, label: 'Crowns' },
  { x: 940, y: 330, w: 150, h: 54, label: 'Scrolls' },
  { x: 940, y: 490, w: 150, h: 54, label: 'Jewels' },
  { x: 565, y: 330, w: 150, h: 62, label: 'SAPPHIRE' },
];

export const LOOTS = [
  { id: 'sapphire', name: 'Star Sapphire', x: 640, y: 361, r: 17, value: 1000, main: true, taken: false },
  { id: 'coins', name: 'Gold coins', x: 225, y: 197, r: 12, value: 150, taken: false },
  { id: 'mask', name: 'Jade mask', x: 225, y: 357, r: 12, value: 200, taken: false },
  { id: 'crown', name: 'Old crown', x: 1015, y: 197, r: 12, value: 250, taken: false },
  { id: 'jewel', name: 'Ruby string', x: 1015, y: 517, r: 12, value: 200, taken: false },
];

const GUARD_PATHS = [
  [{ x: 360, y: 130 }, { x: 920, y: 130 }, { x: 920, y: 250 }, { x: 360, y: 250 }],
  [{ x: 880, y: 620 }, { x: 380, y: 620 }, { x: 380, y: 470 }, { x: 880, y: 470 }],
  [{ x: 420, y: 360 }, { x: 420, y: 180 }, { x: 860, y: 560 }, { x: 860, y: 360 }],
];

const CAMERAS = [
  { x: ROOM.x + 22, y: ROOM.y + 22, base: 0.55, phase: 0 },
  { x: ROOM.x + ROOM.w - 22, y: ROOM.y + 22, base: 2.15, phase: 1.7 },
  { x: ROOM.x + ROOM.w / 2 - 90, y: ROOM.y + ROOM.h - 22, base: -Math.PI / 2, phase: 3.4 },
];

export function segBlocked(x1, y1, x2, y2) {
  // Segment vs each obstacle rect (slab test). Sight stops at cases/pillars.
  for (const o of OBSTACLES) {
    const dx = x2 - x1, dy = y2 - y1;
    let t0 = 0, t1 = 1, ok = true;
    for (const [p, d, lo, hi] of [[x1, dx, o.x, o.x + o.w], [y1, dy, o.y, o.y + o.h]]) {
      if (Math.abs(d) < 1e-9) { if (p < lo || p > hi) { ok = false; break; } }
      else {
        let a = (lo - p) / d, b = (hi - p) / d;
        if (a > b) [a, b] = [b, a];
        t0 = Math.max(t0, a); t1 = Math.min(t1, b);
        if (t0 > t1) { ok = false; break; }
      }
    }
    if (ok && t1 > 0.02 && t0 < 0.98) return true;
  }
  return false;
}

export function inCone(sx, sy, angle, len, half, px, py) {
  const dx = px - sx, dy = py - sy;
  const dist = Math.hypot(dx, dy);
  if (dist > len || dist < 4) return false;
  let diff = Math.atan2(dy, dx) - angle;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  if (Math.abs(diff) > half) return false;
  return !segBlocked(sx, sy, px, py);
}

function collide(x, y, r) {
  x = Math.max(ROOM.x + r, Math.min(ROOM.x + ROOM.w - r, x));
  y = Math.max(ROOM.y + r, Math.min(ROOM.y + ROOM.h - r, y));
  for (const o of OBSTACLES) {
    const nx = Math.max(o.x, Math.min(o.x + o.w, x));
    const ny = Math.max(o.y, Math.min(o.y + o.h, y));
    const d = Math.hypot(x - nx, y - ny);
    if (d < r && d > 0.001) { x = nx + (x - nx) / d * r; y = ny + (y - ny) / d * r; }
    else if (d <= 0.001) { y = o.y - r; }
  }
  return { x, y };
}

export function createWorld() {
  const guards = GUARD_PATHS.map((path, i) => ({
    x: path[0].x, y: path[0].y, path, wp: 1, angle: 0,
    speed: GUARD.patrol, sees: false, id: i,
  }));
  const cams = CAMERAS.map((c, i) => ({ ...c, angle: c.base, sees: false, id: i }));
  return {
    t: 0, state: 'title', // title | play | caught | escaped
    thief: { x: 86, y: 620, angle: -Math.PI / 2, moving: false, sneaking: false },
    guards, cams,
    loots: LOOTS.map((l) => ({ ...l, taken: false })),
    alarm: 0, score: 0, hasMain: false, seenBy: '',
    message: '', messageT: 0, shake: 0, grabT: 0,
    exitOpen: false,
  };
}

export function stepWorld(w, dt, input) {
  if (w.state !== 'play') return w;
  w.t += dt;
  if (w.messageT > 0) w.messageT -= dt;
  if (w.shake > 0) w.shake -= dt * 6;
  // --- thief ---
  const th = w.thief;
  let mx = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  let my = (input.down ? 1 : 0) - (input.up ? 1 : 0);
  const mag = Math.hypot(mx, my) || 1;
  th.sneaking = !!input.sneak;
  const speed = input.run ? THIEF.run : input.sneak ? THIEF.sneak : THIEF.walk;
  th.moving = !!(mx || my);
  if (th.moving) {
    th.angle = Math.atan2(my, mx);
    const p = collide(th.x + mx / mag * speed * dt, th.y + my / mag * speed * dt, THIEF.radius);
    th.x = p.x; th.y = p.y;
  }
  // --- grab loot with interact, or by touching while pressing interact ---
  w.grabT = Math.max(0, w.grabT - dt);
  for (const loot of w.loots) {
    if (!loot.taken && Math.hypot(th.x - loot.x, th.y - loot.y) < loot.r + THIEF.radius + 6) {
      if (input.interact || loot.main === false && w.grabT === 0 && input.interact) {
        loot.taken = true; w.score += loot.value; w.grabT = 0.25;
        if (loot.main) { w.hasMain = true; w.exitOpen = true; w.message = 'Sapphire lifted! Get to the south door!'; }
        else w.message = loot.name + ' pocketed  +' + loot.value;
        w.messageT = 2.4;
      }
    }
  }
  // --- guards patrol / chase ---
  let seen = '';
  for (const g of w.guards) {
    g.sees = inCone(g.x, g.y, g.angle, GUARD.coneLen, GUARD.coneHalf, th.x, th.y);
    if (g.sees) seen = 'guard';
    const target = g.sees ? th : g.path[g.wp];
    const dx = target.x - g.x, dy = target.y - g.y;
    const dist = Math.hypot(dx, dy);
    const sp = g.sees ? GUARD.chase : GUARD.patrol;
    if (dist > (g.sees ? 20 : 8)) {
      g.angle = Math.atan2(dy, dx);
      g.x += Math.cos(g.angle) * sp * dt; g.y += Math.sin(g.angle) * sp * dt;
      const p = collide(g.x, g.y, GUARD.radius); g.x = p.x; g.y = p.y;
    } else if (!g.sees) g.wp = (g.wp + 1) % g.path.length;
    if (Math.hypot(g.x - th.x, g.y - th.y) < GUARD.radius + THIEF.radius - 2) {
      w.state = 'caught'; w.message = 'Caught by a guard!';
    }
  }
  // --- cameras sweep ---
  for (const c of w.cams) {
    c.angle = c.base + Math.sin(w.t * CAMERA.sweep + c.phase) * 0.85;
    c.sees = inCone(c.x, c.y, c.angle, CAMERA.coneLen, CAMERA.coneHalf, th.x, th.y);
    if (c.sees && !seen) seen = 'camera';
  }
  // --- alarm meter ---
  w.seenBy = seen;
  if (seen === 'guard') w.alarm += ALARM.riseGuard * dt * (th.sneaking ? 0.55 : 1);
  else if (seen === 'camera') w.alarm += ALARM.riseCamera * dt * (th.sneaking ? 0.55 : 1);
  else w.alarm -= ALARM.decay * dt;
  // Running in view is louder; sneaking in the open still slowly reads.
  if (seen && input.run) w.alarm += 12 * dt;
  w.alarm = Math.max(0, Math.min(100, w.alarm));
  if (w.alarm >= 100) { w.state = 'caught'; w.message = 'ALARM! The museum locks down.'; w.shake = 1; }
  // --- exit: south door, centre bottom ---
  if (w.exitOpen && th.x > 590 && th.x < 690 && th.y > ROOM.y + ROOM.h - 34) {
    w.state = 'escaped'; w.score += Math.max(0, 500 - Math.floor(w.t) * 2);
    w.message = 'Clean getaway!';
  }
  return w;
}

export function stageWorld(w, kind) {
  // Deterministic scenes for screenshots: real rules, posed mid-action.
  w.state = 'play';
  if (kind === 'play') {
    w.thief.x = 430; w.thief.y = 392; w.thief.angle = 0.4;
    w.guards[0].x = 700; w.guards[0].y = 180; w.guards[0].angle = 2.6;
    w.guards[1].x = 500; w.guards[1].y = 560; w.guards[1].angle = -0.4;
    w.guards[2].x = 900; w.guards[2].y = 400; w.guards[2].angle = 3.1;
    w.t = 4.2; w.alarm = 24; w.score = 150;
    w.loots[0].taken = false; w.loots[1].taken = true;
    w.message = 'Stay out of the yellow cones — use the cases as cover'; w.messageT = 9;
  } else if (kind === 'alarm') {
    w.thief.x = 612; w.thief.y = 300; w.thief.angle = -1.2;
    w.guards[0].x = 700; w.guards[0].y = 210; w.guards[0].angle = 2.25;
    w.guards[1].x = 430; w.guards[1].y = 540; w.guards[1].angle = -0.9;
    w.guards[2].x = 880; w.guards[2].y = 430; w.guards[2].angle = 3.0;
    w.t = 9.5; w.alarm = 78; w.score = 350;
    w.loots[2].taken = true;
    w.message = 'SPOTTED! Break line of sight before the meter fills!'; w.messageT = 9;
  } else if (kind === 'loot') {
    w.thief.x = 606; w.thief.y = 398; w.thief.angle = -Math.PI / 2;
    w.guards[0].x = 330; w.guards[0].y = 150; w.guards[0].angle = 0.2;
    w.guards[1].x = 900; w.guards[1].y = 590; w.guards[1].angle = Math.PI;
    w.guards[2].x = 850; w.guards[2].y = 300; w.guards[2].angle = 1.4;
    w.t = 14; w.alarm = 12; w.score = 400; w.hasMain = false;
    w.message = 'The Star Sapphire — press E to lift it'; w.messageT = 9;
  } else { // start / title scene, still showing the whole room behind the panel
    w.thief.x = 120; w.thief.y = 590;
    w.guards[0].x = 640; w.guards[0].y = 150; w.guards[0].angle = 0.7;
    w.guards[1].x = 760; w.guards[1].y = 580; w.guards[1].angle = -2.2;
    w.guards[2].x = 880; w.guards[2].y = 360; w.guards[2].angle = 2.8;
    w.t = 2; w.alarm = 8;
    w.state = 'title';
  }
  // Refresh cone visibility flags for the posed frame.
  for (const g of w.guards) g.sees = inCone(g.x, g.y, g.angle, GUARD.coneLen, GUARD.coneHalf, w.thief.x, w.thief.y);
  for (const c of w.cams) { c.angle = c.base + Math.sin(w.t * CAMERA.sweep + c.phase) * 0.85; c.sees = inCone(c.x, c.y, c.angle, CAMERA.coneLen, CAMERA.coneHalf, w.thief.x, w.thief.y); }
  if (kind === 'alarm') { w.guards[0].sees = true; w.seenBy = 'guard'; }
  return w;
}
