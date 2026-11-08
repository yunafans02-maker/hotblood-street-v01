// 輸入：左半邊螢幕是浮動搖桿；右下「談」「疾」兩個按鈕；電腦可用鍵盤測試。
// 鍵盤：方向鍵 / WASD 移動，空白鍵 / Enter / J 互動，Shift / K 快走。
const $ = (id) => document.getElementById(id);
const keys = new Set();
let joyX = 0, joyY = 0, runHeld = false, aEdge = false;

export const input = {
  dialogMode: false,
  vector() {
    let kx = 0, ky = 0;
    if (keys.has('ArrowLeft') || keys.has('KeyA')) kx -= 1;
    if (keys.has('ArrowRight') || keys.has('KeyD')) kx += 1;
    if (keys.has('ArrowUp') || keys.has('KeyW')) ky -= 1;
    if (keys.has('ArrowDown') || keys.has('KeyS')) ky += 1;
    if (kx || ky) return { x: kx, y: ky };
    return { x: joyX, y: joyY };
  },
  get run() { return runHeld || keys.has('ShiftLeft') || keys.has('ShiftRight') || keys.has('KeyK'); },
  consumeA() { const v = aEdge; aEdge = false; return v; },
};

export function initInput() {
  const joy = $('joy'), knob = $('joy-knob'), btnA = $('btn-a'), btnB = $('btn-b');
  const RAD = 46;
  let jid = null, ox = 0, oy = 0;

  const setVec = (x, y) => {
    const m = Math.hypot(x, y);
    if (m < 0.18) { joyX = 0; joyY = 0; } else { joyX = x; joyY = y; }
  };
  const rest = () => {
    joy.classList.remove('active');
    joy.style.left = ''; joy.style.top = '';
    knob.style.transform = '';
  };

  window.addEventListener('pointerdown', (e) => {
    const el = e.target instanceof Element ? e.target : document.body;
    if (el.closest('#menu, #btn-menu, #start')) return;
    if (input.dialogMode) { if (!el.closest('#btn-b')) aEdge = true; return; }
    if (el.closest('.act')) return;
    if (jid === null && e.clientX < innerWidth * 0.55) {
      jid = e.pointerId; ox = e.clientX; oy = e.clientY;
      joy.classList.add('active');
      joy.style.left = ox + 'px'; joy.style.top = oy + 'px';
      setVec(0, 0);
    }
  });
  window.addEventListener('pointermove', (e) => {
    if (e.pointerId !== jid) return;
    let dx = e.clientX - ox, dy = e.clientY - oy;
    const d = Math.hypot(dx, dy);
    if (d > RAD) { dx *= RAD / d; dy *= RAD / d; }
    knob.style.transform = `translate(${dx}px, ${dy}px)`;
    setVec(dx / RAD, dy / RAD);
  });
  const end = (e) => { if (e.pointerId !== jid) return; jid = null; setVec(0, 0); rest(); };
  window.addEventListener('pointerup', end);
  window.addEventListener('pointercancel', end);

  btnA.addEventListener('pointerdown', (e) => { e.preventDefault(); aEdge = true; btnA.classList.add('down'); });
  const aUp = () => btnA.classList.remove('down');
  btnA.addEventListener('pointerup', aUp); btnA.addEventListener('pointerleave', aUp); btnA.addEventListener('pointercancel', aUp);

  btnB.addEventListener('pointerdown', (e) => { e.preventDefault(); runHeld = true; btnB.classList.add('down'); btnB.setPointerCapture?.(e.pointerId); });
  const bUp = () => { runHeld = false; btnB.classList.remove('down'); };
  btnB.addEventListener('pointerup', bUp); btnB.addEventListener('pointercancel', bUp);

  window.addEventListener('keydown', (e) => {
    if (['Space', 'Enter', 'KeyJ'].includes(e.code)) { if (!e.repeat) aEdge = true; e.preventDefault(); return; }
    if (e.code.startsWith('Arrow')) e.preventDefault();
    keys.add(e.code);
  });
  window.addEventListener('keyup', (e) => keys.delete(e.code));
  window.addEventListener('blur', () => { keys.clear(); runHeld = false; jid = null; setVec(0, 0); rest(); });
  window.addEventListener('contextmenu', (e) => e.preventDefault());
}

export async function goFullscreen() {
  try {
    if (!document.fullscreenElement) await document.documentElement.requestFullscreen({ navigationUI: 'hide' });
    await screen.orientation?.lock?.('landscape');
  } catch { /* 有些瀏覽器不支援，忽略 */ }
}
