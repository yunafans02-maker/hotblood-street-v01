// 遊戲主程式：開始畫面、主迴圈、對話、換地圖、存檔。
import { TARGET_VIEW_H, WALK_SPEED, RUN_SPEED } from './config.js';
import { loadArt } from './assets.js';
import { world, Actor, loadMap, setPlayer, moveActor, updateNPCs, findInteract, exitAt, dirFrom, tileCenter } from './world.js';
import { MAPS } from './data/maps.js';
import { DIALOGS } from './data/dialogs.js';
import { render } from './render.js';
import { input, initInput, goFullscreen } from './input.js';
import { ui } from './ui.js';
import { saveGame, loadGame, clearSave } from './save.js';

const $ = (id) => document.getElementById(id);
const canvas = $('game');
const ctx = canvas.getContext('2d', { alpha: false });
const view = { w: 0, h: 0 };
const OPPOSITE = { up: 'down', down: 'up', left: 'right', right: 'left' };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

let state = null, running = false, busy = false, menuOpen = false, resetting = false;
let time = 0, last = 0, autosave = 0;

// 以整數倍放大，像素保持銳利
function resize() {
  const dpr = window.devicePixelRatio || 1;
  const pw = Math.round(innerWidth * dpr), ph = Math.round(innerHeight * dpr);
  const scale = Math.max(1, Math.round(ph / TARGET_VIEW_H));
  canvas.width = Math.ceil(pw / scale);
  canvas.height = Math.ceil(ph / scale);
  canvas.style.width = (canvas.width * scale / dpr) + 'px';
  canvas.style.height = (canvas.height * scale / dpr) + 'px';
  ctx.imageSmoothingEnabled = false;
  view.w = canvas.width; view.h = canvas.height;
}

const newState = () => ({ v: 1, map: 'town', x: null, y: null, dir: 'up', money: 0, quest: null, flags: {} });

function enterMap(id, spawnName, pos) {
  loadMap(id);
  const m = MAPS[id];
  let x, y, dir;
  if (pos) ({ x, y, dir } = pos);
  else {
    const s = m.spawns[spawnName] || m.spawns.start;
    ({ x, y } = tileCenter(s.at[0], s.at[1]));
    dir = s.dir || 'down';
  }
  setPlayer(new Actor({ id: 'player', name: '你', sprite: 'hero', x, y, dir }));
  state.map = id;
  ui.banner(m.name);
}

function persist() {
  if (!state || !world.player || resetting) return;
  const p = world.player;
  state.x = Math.round(p.x); state.y = Math.round(p.y); state.dir = p.dir;
  saveGame(state);
}

async function openDialog(lines) {
  input.dialogMode = true;
  document.body.classList.add('dialog');
  await ui.dialog(lines);
  input.dialogMode = false;
  document.body.classList.remove('dialog');
  input.consumeA();
}

async function talkTo(target) {
  busy = true;
  const p = world.player;
  p.moving = false;
  if (target.kind === 'actor') { target.busy = true; target.moving = false; target.dir = OPPOSITE[p.dir]; }
  const fn = DIALOGS[target.talk];
  await openDialog(fn ? fn(state, target) : [{ n: null, t: '……' }]);
  if (target.kind === 'actor') target.busy = false;
  busy = false;
  persist();
}

async function goTo(exit) {
  busy = true;
  world.player.moving = false;
  await ui.fade(1);
  enterMap(exit.to, exit.spawn);
  persist();
  await ui.fade(0);
  busy = false;
}

function update(dt) {
  ui.update(dt);
  if (!running || menuOpen) return;
  time += dt;
  if (ui.dialogOpen && input.consumeA()) ui.advance();
  updateNPCs(dt);

  const p = world.player;
  if (!busy && !ui.dialogOpen) {
    const v = input.vector();
    const mag = Math.hypot(v.x, v.y);
    if (mag > 0.01) {
      const sp = (input.run ? RUN_SPEED : WALK_SPEED) * Math.min(1, mag * 1.35);
      const nx = v.x / mag, ny = v.y / mag;
      moveActor(p, nx * sp * dt, ny * sp * dt);
      p.dir = dirFrom(nx, ny, p.dir);
      p.moving = true;
      p.anim += dt * sp / WALK_SPEED;
    } else p.moving = false;

    world.focus = findInteract();
    if (input.consumeA() && world.focus) talkTo(world.focus);
    const ex = exitAt(p.x, p.y);
    if (ex && !busy) goTo(ex);
  } else {
    world.focus = null;
  }
  $('btn-a').classList.toggle('ready', !!world.focus || ui.dialogOpen);

  autosave += dt;
  if (autosave > 8) { autosave = 0; persist(); }
  ui.setHUD(state);
}

function loop(ts) {
  const dt = Math.min(0.05, (ts - (last || ts)) / 1000);
  last = ts;
  update(dt);
  if (running && !menuOpen) render(ctx, view, time, dt);
  requestAnimationFrame(loop);
}

async function start(saved) {
  goFullscreen();
  document.body.classList.add('playing');
  $('start').classList.add('hide');
  state = saved ? { ...newState(), ...saved, flags: { ...(saved.flags || {}) } } : newState();
  if (saved && MAPS[saved.map] && saved.x != null) enterMap(saved.map, null, { x: saved.x, y: saved.y, dir: saved.dir || 'down' });
  else enterMap('town', 'start');
  running = true;
  persist();
  if (!saved) {
    busy = true;
    await wait(1500);
    busy = false;
    await openDialog(DIALOGS.intro(state));
  }
}

function setupMenu() {
  const menu = $('menu');
  $('btn-menu').addEventListener('click', () => { menuOpen = true; menu.hidden = false; persist(); });
  $('m-resume').addEventListener('click', () => { menuOpen = false; menu.hidden = true; });
  $('m-full').addEventListener('click', () => {
    if (document.fullscreenElement) document.exitFullscreen?.(); else goFullscreen();
    menuOpen = false; menu.hidden = true;
  });
  $('m-reset').addEventListener('click', () => {
    if (!confirm('確定刪除存檔，重新開始？')) return;
    resetting = true; clearSave(); location.reload();
  });
}

async function boot() {
  resize();
  window.addEventListener('resize', resize);
  initInput();
  setupMenu();
  document.addEventListener('visibilitychange', () => { if (document.hidden) persist(); });
  window.addEventListener('pagehide', persist);
  try {
    await loadArt();
  } catch (err) {
    $('loading').textContent = '載入失敗：' + err.message;
    throw err;
  }
  const saved = loadGame();
  $('loading').hidden = true;
  $('btn-continue').hidden = !saved;
  $('start-btns').hidden = false;
  $('btn-new').addEventListener('click', () => { if (saved && !confirm('開始新的旅程會覆蓋舊存檔，確定？')) return; start(null); });
  $('btn-continue').addEventListener('click', () => start(saved));
  requestAnimationFrame(loop);
}

boot();
// 方便除錯：在瀏覽器主控台輸入 __game 查看狀態
window.__game = { world, get state() { return state; } };
