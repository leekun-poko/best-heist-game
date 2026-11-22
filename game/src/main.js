// Moonlit Museum — browser entry: input, loop, tiny WebAudio blips, shot staging.
import { VIEW } from './config.js';
import { createWorld, stepWorld, stageWorld } from './world.js';
import { draw } from './render.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = VIEW.width; canvas.height = VIEW.height;
const status = document.getElementById('status');
const params = new URLSearchParams(location.search);
const shot = params.get('shot');

const keys = new Set();
let audio = null;
function blip(freq, dur = 0.07, type = 'square', gain = 0.04) {
  try {
    audio = audio || new (window.AudioContext || window.webkitAudioContext)();
    const o = audio.createOscillator(), g = audio.createGain();
    o.type = type; o.frequency.value = freq; g.gain.value = gain;
    o.connect(g); g.connect(audio.destination); o.start(); o.stop(audio.currentTime + dur);
  } catch { /* sound is optional */ }
}

const world = createWorld();
if (shot) stageWorld(world, shot);
else world.state = 'title';

function input() {
  return {
    left: keys.has('arrowleft') || keys.has('a'),
    right: keys.has('arrowright') || keys.has('d'),
    up: keys.has('arrowup') || keys.has('w'),
    down: keys.has('arrowdown') || keys.has('s'),
    sneak: keys.has('shift'),
    run: keys.has('control') || keys.has(' '),
    interact: keys.has('e') || keys.has('enter'),
  };
}
function startIfNeeded() {
  if (world.state === 'title') { world.state = 'play'; blip(660); }
  else if (world.state === 'caught' || world.state === 'escaped') {
    Object.assign(world, createWorld()); world.state = 'play'; blip(520);
  }
}
addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
  if (k === 'r' && (world.state === 'caught' || world.state === 'escaped')) { startIfNeeded(); return; }
  if ((k === 'enter' || k === ' ') && world.state !== 'play') { startIfNeeded(); return; }
  keys.add(k);
  if (k === 'e' && world.state === 'play') blip(880, 0.05);
});
addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));
canvas.addEventListener('pointerdown', () => { if (world.state !== 'play') startIfNeeded(); });
// Mouse: hold to steer the thief toward the pointer (handy on trackpads).
let pointer = null;
canvas.addEventListener('pointermove', (e) => {
  const r = canvas.getBoundingClientRect();
  pointer = { x: (e.clientX - r.left) / r.width * VIEW.width, y: (e.clientY - r.top) / r.height * VIEW.height, down: !!e.buttons };
});
canvas.addEventListener('pointerup', () => { if (pointer) pointer.down = false; });

let last = performance.now(), lastScore = 0, lastState = world.state;
function frame(now) {
  let dt = Math.min(0.033, (now - last) / 1000); last = now;
  if (!shot) {
    const inp = input();
    if (pointer && pointer.down && world.state === 'play') {
      const dx = pointer.x - world.thief.x, dy = pointer.y - world.thief.y;
      if (Math.hypot(dx, dy) > 18) {
        inp.left = dx < -8; inp.right = dx > 8; inp.up = dy < -8; inp.down = dy > 8;
        inp.interact = Math.hypot(dx, dy) < 40;
      }
    }
    const before = world.score;
    stepWorld(world, dt, inp);
    if (world.score > before) blip(1180, 0.09, 'sine', 0.06);
    if (world.seenBy && Math.random() < dt * 3) blip(220, 0.05, 'sawtooth', 0.03);
    if (world.state !== lastState) {
      if (world.state === 'caught') blip(140, 0.4, 'sawtooth', 0.08);
      if (world.state === 'escaped') { blip(784, 0.12, 'sine', 0.07); setTimeout(() => blip(1046, 0.18, 'sine', 0.07), 120); }
      lastState = world.state;
    }
    lastScore = world.score;
  }
  draw(ctx, world);
  if (status) status.textContent = world.state + ' alarm ' + Math.round(world.alarm) + '% loot $' + world.score;
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
