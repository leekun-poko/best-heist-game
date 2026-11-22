// Moonlit Museum — canvas rendering. Flat, high-contrast, screenshot-friendly.
import { VIEW, HUD_H, ROOM, GUARD, CAMERA } from './config.js';
import { OBSTACLES } from './world.js';

function cone(ctx, x, y, angle, len, half, fill, edge) {
  ctx.beginPath(); ctx.moveTo(x, y);
  ctx.arc(x, y, len, angle - half, angle + half); ctx.closePath();
  ctx.fillStyle = fill; ctx.fill();
  ctx.strokeStyle = edge; ctx.lineWidth = 1.5; ctx.stroke();
}
function text(ctx, s, x, y, size, color, align = 'left', bold = true) {
  ctx.font = (bold ? '700 ' : '400 ') + size + 'px system-ui, sans-serif';
  ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.fillText(s, x, y);
}

export function draw(ctx, w) {
  ctx.save();
  if (w.shake > 0) ctx.translate((Math.random() - 0.5) * 8 * w.shake, (Math.random() - 0.5) * 8 * w.shake);
  // Floor: deep blue tiles with a red carpet cross.
  ctx.fillStyle = '#10182e'; ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.fillStyle = '#182544'; ctx.fillRect(ROOM.x, ROOM.y, ROOM.w, ROOM.h);
  ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 1;
  for (let x = ROOM.x; x < ROOM.x + ROOM.w; x += 56) { ctx.beginPath(); ctx.moveTo(x, ROOM.y); ctx.lineTo(x, ROOM.y + ROOM.h); ctx.stroke(); }
  for (let y = ROOM.y; y < ROOM.y + ROOM.h; y += 56) { ctx.beginPath(); ctx.moveTo(ROOM.x, y); ctx.lineTo(ROOM.x + ROOM.w, y); ctx.stroke(); }
  ctx.fillStyle = 'rgba(150,28,48,0.5)'; ctx.fillRect(ROOM.x, 330, ROOM.w, 62); ctx.fillRect(604, ROOM.y, 72, ROOM.h);
  // Exit door (south, centre)
  ctx.fillStyle = w.exitOpen ? '#2ee6a8' : '#3a4666'; ctx.fillRect(590, ROOM.y + ROOM.h - 10, 100, 10);
  text(ctx, w.exitOpen ? 'EXIT OPEN' : 'EXIT (locked)', 640, ROOM.y + ROOM.h - 24, 13, w.exitOpen ? '#2ee6a8' : '#8fa0c4', 'center');
  // Obstacles / display cases
  for (const o of OBSTACLES) {
    const main = o.label === 'SAPPHIRE';
    ctx.fillStyle = main ? '#2a1e5e' : '#26355e'; ctx.fillRect(o.x, o.y, o.w, o.h);
    ctx.strokeStyle = main ? '#a78bfa' : '#5f7ec2'; ctx.lineWidth = main ? 3 : 2; ctx.strokeRect(o.x, o.y, o.w, o.h);
    ctx.fillStyle = 'rgba(160,210,255,0.16)'; ctx.fillRect(o.x + 6, o.y + 6, o.w - 12, o.h - 12);
    if (o.label && !main) text(ctx, o.label, o.x + o.w / 2, o.y + o.h / 2, 13, '#c9d8ff', 'center');
    if (main) text(ctx, 'STAR SAPPHIRE', o.x + o.w / 2, o.y + 14, 11, '#d6bcfa', 'center');
  }
  // Loot sparkles
  for (const l of w.loots) {
    if (l.taken) continue;
    ctx.beginPath(); ctx.arc(l.x, l.y, l.r + 6 + Math.sin(w.t * 4 + l.x) * 2, 0, Math.PI * 2);
    ctx.fillStyle = l.main ? 'rgba(167,139,250,0.28)' : 'rgba(255,215,90,0.20)'; ctx.fill();
    // Diamond / sparkle drawn as vectors so it renders identically everywhere.
    ctx.save(); ctx.translate(l.x, l.y);
    ctx.fillStyle = l.main ? '#7dd3fc' : '#fde047';
    ctx.strokeStyle = l.main ? '#e0f2fe' : '#fef9c3'; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(0, -11); ctx.lineTo(9, 0); ctx.lineTo(0, 13); ctx.lineTo(-9, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-9, 0); ctx.lineTo(9, 0); ctx.moveTo(0, -11); ctx.lineTo(-3.5, 0); ctx.lineTo(0, 13); ctx.moveTo(0, -11); ctx.lineTo(3.5, 0); ctx.lineTo(0, 13); ctx.stroke();
    ctx.restore();
    if (l.main) text(ctx, '$1000', l.x, l.y + 30, 12, '#e9d8fd', 'center');
  }
  // Camera cones first (under guards)
  for (const c of w.cams) {
    cone(ctx, c.x, c.y, c.angle, CAMERA.coneLen, CAMERA.coneHalf,
      c.sees ? 'rgba(255,60,90,0.34)' : 'rgba(96,165,250,0.22)', c.sees ? '#ff5b74' : '#60a5fa');
    ctx.fillStyle = '#0b1020'; ctx.beginPath(); ctx.arc(c.x, c.y, 11, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#93c5fd'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#93c5fd'; ctx.beginPath(); ctx.arc(c.x, c.y, 4.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = c.sees ? '#ff5b74' : '#22c55e'; ctx.beginPath(); ctx.arc(c.x + 7, c.y - 7, 2.6, 0, Math.PI * 2); ctx.fill();
    text(ctx, 'CAM', c.x, c.y - 20, 10, '#93c5fd', 'center');
  }
  // Guard cones
  for (const g of w.guards) {
    cone(ctx, g.x, g.y, g.angle, GUARD.coneLen, GUARD.coneHalf,
      g.sees ? 'rgba(255,45,70,0.40)' : 'rgba(255,205,55,0.26)', g.sees ? '#ff3355' : '#ffd43b');
  }
  // Guards
  for (const g of w.guards) {
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(g.x, g.y + 13, 15, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = g.sees ? '#e11d48' : '#24408a'; ctx.beginPath(); ctx.arc(g.x, g.y, 16, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#facc15'; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.fillStyle = '#fde68a'; ctx.beginPath(); ctx.arc(g.x + Math.cos(g.angle) * 6, g.y + Math.sin(g.angle) * 6, 6, 0, Math.PI * 2); ctx.fill();
    text(ctx, g.sees ? '!' : 'G', g.x, g.y - 27, 15, g.sees ? '#ff5b74' : '#dbeafe', 'center');
  }
  // Thief: black suit, cat-ear hood silhouette, loot bag once rich.
  const th = w.thief;
  ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.ellipse(th.x, th.y + 13, 14, 6, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#111827'; ctx.beginPath(); ctx.arc(th.x, th.y, 15, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#2ee6a8'; ctx.lineWidth = 2.5; ctx.stroke();
  ctx.fillStyle = '#111827';
  ctx.beginPath(); ctx.moveTo(th.x - 10, th.y - 10); ctx.lineTo(th.x - 4, th.y - 21); ctx.lineTo(th.x - 1, th.y - 9); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(th.x + 10, th.y - 10); ctx.lineTo(th.x + 4, th.y - 21); ctx.lineTo(th.x + 1, th.y - 9); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#f9fafb'; ctx.beginPath(); ctx.arc(th.x + Math.cos(th.angle) * 5, th.y + Math.sin(th.angle) * 5, 5.5, 0, Math.PI * 2); ctx.fill();
  if (w.score > 0) text(ctx, '💰', th.x + 15, th.y + 12, 14, '#fff', 'center', false);
  text(ctx, 'THIEF', th.x, th.y - 31, 11, '#2ee6a8', 'center');
  // Room frame
  ctx.strokeStyle = '#8fa0c4'; ctx.lineWidth = 4; ctx.strokeRect(ROOM.x, ROOM.y, ROOM.w, ROOM.h);
  drawHud(ctx, w);
  if (w.messageT > 0 && w.state === 'play') {
    ctx.fillStyle = 'rgba(5,8,18,0.82)'; ctx.fillRect(290, 600, 700, 38);
    ctx.strokeStyle = w.seenBy ? '#ff5b74' : '#2ee6a8'; ctx.strokeRect(290, 600, 700, 38);
    text(ctx, w.message, 640, 619, 16, '#fff', 'center');
  }
  if (w.state === 'title') overlay(ctx, '🌙 MOONLIT MUSEUM', 'Lift the Star Sapphire. Slip past guards & cameras. Reach the south door.',
    'Move WASD / Arrows · Sneak Shift · Lift loot E · Click or press Enter to start');
  if (w.state === 'caught') overlay(ctx, '🚨 CAUGHT!', w.message + '  Score ' + w.score, 'Press R or click to try the night again');
  if (w.state === 'escaped') overlay(ctx, '💎 CLEAN GETAWAY!', 'You escaped with $' + w.score + ' in loot in ' + Math.floor(w.t) + 's.', 'Press R or click for another night');
  ctx.restore();
}

function overlay(ctx, title, line1, line2) {
  ctx.fillStyle = 'rgba(4,6,14,0.62)'; ctx.fillRect(240, 238, 800, 190);
  ctx.strokeStyle = '#a78bfa'; ctx.lineWidth = 2; ctx.strokeRect(240, 238, 800, 190);
  text(ctx, title, 640, 288, 40, '#fff', 'center');
  text(ctx, line1, 640, 338, 17, '#d6bcfa', 'center', false);
  text(ctx, line2, 640, 380, 15, '#a5f3d0', 'center', false);
}

function drawHud(ctx, w) {
  ctx.fillStyle = '#070b16'; ctx.fillRect(0, 0, VIEW.width, HUD_H);
  ctx.strokeStyle = '#334155'; ctx.beginPath(); ctx.moveTo(0, HUD_H); ctx.lineTo(VIEW.width, HUD_H); ctx.stroke();
  text(ctx, '🌙 MOONLIT MUSEUM — THE STAR SAPPHIRE HEIST', 18, 29, 17, '#fff');
  // Alarm meter: always visible, labelled, colour-coded.
  text(ctx, 'ALARM', 612, 20, 12, '#fca5a5', 'center');
  ctx.fillStyle = '#1f2937'; ctx.fillRect(500, 30, 224, 16);
  const a = w.alarm / 100;
  ctx.fillStyle = a > 0.7 ? '#ef4444' : a > 0.35 ? '#f59e0b' : '#22c55e';
  ctx.fillRect(502, 32, 220 * a, 12);
  ctx.strokeStyle = '#64748b'; ctx.strokeRect(500, 30, 224, 16);
  text(ctx, Math.round(w.alarm) + '%', 740, 38, 13, '#fff');
  if (w.seenBy) text(ctx, w.seenBy === 'guard' ? '👁 SPOTTED BY GUARD!' : '👁 ON CAMERA!', 862, 29, 14, '#ff5b74', 'center');
  else text(ctx, 'hidden', 862, 29, 13, '#6ee7b7', 'center');
  text(ctx, 'LOOT $' + w.score, 1010, 29, 16, '#fde68a');
  text(ctx, '⏱ ' + Math.floor(w.t) + 's', 1140, 29, 15, '#cbd5e1');
  text(ctx, w.hasMain ? '→ EXIT' : '', 1205, 29, 13, '#2ee6a8');
}
