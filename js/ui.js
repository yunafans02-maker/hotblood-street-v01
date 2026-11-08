// 介面（HTML 疊在畫布上，中文字才清楚）：對話框、地名、淡入淡出、狀態列
import { TEXT_SPEED } from './config.js';
import { QUEST_TEXT } from './data/dialogs.js';

const $ = (id) => document.getElementById(id);
const box = $('dialog'), nameEl = $('dlg-name'), textEl = $('dlg-text'), nextEl = $('dlg-next');
const bannerEl = $('banner'), fadeEl = $('fade'), moneyEl = $('money'), questEl = $('hud-quest');

let queue = [], full = '', shown = 0, typing = false, resolver = null, hudKey = '';

function nextLine() {
  while (queue.length && queue[0].t == null) { const l = queue.shift(); l.fx && l.fx(); }
  if (!queue.length) {
    ui.dialogOpen = false; box.hidden = true;
    const r = resolver; resolver = null; r && r();
    return;
  }
  const l = queue.shift();
  l.fx && l.fx();
  nameEl.textContent = l.n || ''; nameEl.hidden = !l.n;
  box.classList.toggle('sys', !l.n);
  full = l.t; shown = 0; typing = true;
  textEl.textContent = ''; nextEl.hidden = true;
}

export const ui = {
  dialogOpen: false,

  dialog(lines) {
    queue = lines.slice();
    this.dialogOpen = true; box.hidden = false;
    return new Promise((res) => { resolver = res; nextLine(); });
  },

  advance() {
    if (!this.dialogOpen) return;
    if (typing) { typing = false; textEl.textContent = full; nextEl.hidden = false; }
    else nextLine();
  },

  update(dt) {
    if (!typing) return;
    shown += dt * TEXT_SPEED;
    const n = Math.min(full.length, Math.floor(shown));
    textEl.textContent = full.slice(0, n);
    if (n >= full.length) { typing = false; nextEl.hidden = false; }
  },

  banner(text) {
    bannerEl.textContent = text;
    bannerEl.classList.remove('show');
    void bannerEl.offsetWidth;
    bannerEl.classList.add('show');
  },

  fade(v) {
    fadeEl.style.opacity = v;
    return new Promise((r) => setTimeout(r, 280));
  },

  setHUD(s) {
    const key = s.money + '|' + s.quest;
    if (key === hudKey) return;
    hudKey = key;
    moneyEl.textContent = s.money;
    const q = QUEST_TEXT[s.quest];
    questEl.textContent = q ? '◆ ' + q : '';
    questEl.hidden = !q;
  },
};
