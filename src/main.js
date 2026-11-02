import * as THREE from "three";
import "./style.css";
import official from "./tactics-sprite/tactics-sprite-data.json";
import {
  createAtlas,
  poseAt,
  findAnimation,
  handPoint,
} from "./tactics-sprite/tactics-sprite.mjs";
import {
  createTacticsSprite,
  prepareSheet,
  flattenOntoSprite,
} from "./tactics-sprite/tactics-sprite-three.mjs";
import { staticData, art } from "./character/static.mjs";

start().catch((e) => {
  console.error(e);
  const box = document.querySelector("#loading");
  box.textContent = "角色載入失敗，請重新整理後再試。";
});
async function start() {
  const canvas = document.querySelector("#stage"),
    viewport = canvas.parentElement;
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: false,
    alpha: false,
  });
  renderer.setClearColor(0xffffff, 1);
  renderer.shadowMap.enabled = false;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene(),
    camera = new THREE.OrthographicCamera(-80, 80, 80, -80, 1, 2000),
    atlas = createAtlas(staticData(official));
  const loader = new THREE.TextureLoader(),
    [sheet, pole] = await Promise.all([
      loader.loadAsync("/zhaoyun-sheet.png"),
      loader.loadAsync("/zhaoyun-spear.png"),
    ]);
  prepareSheet(sheet);
  prepareSheet(pole);
  // The authoritative reference uses square pixels. Use one uniform scale on every tile and view.
  const unit = createTacticsSprite(atlas, sheet, {
    animation: "Idle",
    facing: "SE",
    scaleX: 1,
    scaleY: 1,
  });
  unit.group.position.y = unit.standHeight;
  unit.itemLayer = { front: 1, back: 6 };
  scene.add(unit.group);
  const [w, h] = art.spear.size,
    [gx, gy] = art.spear.grip;
  const weapon = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h).translate(
      w / 2 - gx - 0.5,
      gy + 0.5 - h / 2,
      0,
    ),
    new THREE.MeshBasicMaterial({
      map: pole,
      transparent: true,
      alphaTest: 0.5,
      depthWrite: false,
      side: THREE.DoubleSide,
      toneMapped: false,
    }),
  );
  weapon.userData.sprite = unit;
  weapon.material.onBeforeRender = flattenOntoSprite;
  unit.group.add(weapon);
  let view = 1,
    zoom = 1,
    showWeapon = true;
  const point = new THREE.Vector3(),
    focus = new THREE.Vector3(0, 42, 0);
  function resize() {
    const cw = viewport.clientWidth,
      ch = viewport.clientHeight;
    renderer.setPixelRatio(1);
    renderer.setSize(
      Math.max(1, Math.floor(cw / 2)),
      Math.max(1, Math.floor(ch / 2)),
      false,
    );
    const aspect = cw / ch,
      half = Math.max(
        (showWeapon ? 88 : 42) / zoom,
        (showWeapon ? 53 : 24) / aspect,
      );
    camera.left = -half * aspect;
    camera.right = half * aspect;
    camera.top = half;
    camera.bottom = -half;
    camera.updateProjectionMatrix();
    focus.y = showWeapon ? 42 : 28;
    setView(view);
  }
  function setView(v) {
    view = (v + 8) % 8;
    const step = (view - 1 + 8) % 8,
      e = Math.atan2(0.3, Math.SQRT1_2),
      az = Math.atan2(0.5, -0.5) + (step * Math.PI) / 4,
      flat = Math.cos(e) * 400;
    camera.position.set(
      Math.sin(az) * flat,
      focus.y + Math.sin(e) * 400,
      Math.cos(az) * flat,
    );
    camera.lookAt(focus);
    camera.updateMatrixWorld();
    document.querySelector("#view-name").textContent = art.views[view].label;
    document
      .querySelectorAll("[data-view]")
      .forEach((b) =>
        b.setAttribute("aria-pressed", String(Number(b.dataset.view) === view)),
      );
    render();
  }
  function render() {
    const pose = unit.update(0, camera),
      p = unit.hand("last", 0, point);
    weapon.visible = showWeapon && !!p;
    if (p) {
      weapon.position.copy(unit.group.worldToLocal(p));
      weapon.rotation.set(0, 0, -art.spear.angleByView[view]);
      weapon.renderOrder = pose.back ? -10 : pose.count - 1.5;
    }
    renderer.render(scene, camera);
  }
  function toggleWeapon() {
    showWeapon = !showWeapon;
    document.querySelector("#weapon").textContent =
      `長槍：${showWeapon ? "顯示" : "隱藏"}`;
    document
      .querySelector("#weapon")
      .setAttribute("aria-pressed", String(showWeapon));
    resize();
  }
  for (let v = 0; v < 8; v++) {
    const b = document.createElement("button");
    b.dataset.view = v;
    b.textContent = String(v + 1).padStart(2, "0");
    b.setAttribute("aria-label", art.views[v].label);
    b.onclick = () => setView(v);
    document.querySelector("#views").append(b);
  }
  document.querySelector("#previous").onclick = () => setView(view - 1);
  document.querySelector("#next").onclick = () => setView(view + 1);
  document.querySelector("#weapon").onclick = toggleWeapon;
  function setZoom(value) {
    zoom = Math.min(1.5, Math.max(0.65, value));
    document.querySelector("#zoom-value").textContent =
      `${Math.round(zoom * 100)}%`;
    resize();
  }
  document.querySelector("#smaller").onclick = () => setZoom(zoom - 0.15);
  document.querySelector("#larger").onclick = () => setZoom(zoom + 0.15);
  function exportPng(v = view, withWeapon = showWeapon) {
    const c = document.createElement("canvas");
    c.width = 160;
    c.height = 192;
    const ctx = c.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    const ox = 80,
      oy = 126,
      pose = poseAt(atlas, findAnimation(atlas, "Idle"), v, 0),
      hand = handPoint(atlas, pose, "last"),
      insert = v >= 3 && v <= 6 ? 0 : pose.count - 1;
    const drawWeapon = () => {
      if (!withWeapon) return;
      const tmp = document.createElement("canvas");
      tmp.width = w;
      tmp.height = h;
      const tc = tmp.getContext("2d");
      tc.drawImage(pole.image, 0, 0);
      const src = tc.getImageData(0, 0, w, h).data,
        dst = ctx.getImageData(0, 0, c.width, c.height),
        a = art.spear.angleByView[v],
        co = Math.cos(a),
        si = Math.sin(a),
        hx = ox + hand[0],
        hy = oy + hand[1];
      for (let y = 0; y < c.height; y++)
        for (let x = 0; x < c.width; x++) {
          const dx = x + 0.5 - hx,
            dy = y + 0.5 - hy,
            u = Math.floor(dx * co + dy * si + gx + 0.5),
            z = Math.floor(-dx * si + dy * co + gy + 0.5);
          if (u < 0 || u >= w || z < 0 || z >= h) continue;
          const p = (z * w + u) * 4;
          if (!src[p + 3]) continue;
          const q = (y * c.width + x) * 4;
          for (let k = 0; k < 4; k++) dst.data[q + k] = src[p + k];
        }
      ctx.putImageData(dst, 0, 0);
    };
    for (let i = 0; i <= pose.count; i++) {
      if (i === insert) drawWeapon();
      if (i === pose.count) break;
      const t = pose.tiles[i];
      ctx.save();
      ctx.translate(ox + t.x + (t.flipX ? t.w : 0), oy + t.y);
      ctx.scale(t.flipX ? -1 : 1, 1);
      ctx.drawImage(sheet.image, t.sx, t.sy, t.w, t.h, 0, 0, t.w, t.h);
      ctx.restore();
    }
    return c;
  }
  document.querySelector("#export").onclick = () => {
    const a = document.createElement("a");
    a.href = exportPng().toDataURL("image/png");
    a.download = `zhaoyun-static-${view + 1}${showWeapon ? "-spear" : ""}.png`;
    a.click();
  };
  new ResizeObserver(resize).observe(viewport);
  setView(1);
  resize();
  document.querySelector("#loading").remove();
  canvas.addEventListener("webglcontextlost", (e) => {
    e.preventDefault();
    alert("畫面暫停，請重新整理頁面。");
  });
  if (new URLSearchParams(location.search).has("test"))
    window.__review = {
      unit,
      weapon,
      renderer,
      scene,
      camera,
      atlas,
      art,
      setView,
      setZoom,
      toggleWeapon,
      exportPng,
      render,
      state: () => ({
        view,
        zoom,
        showWeapon,
        animation: unit.player.animation.name,
        phase: art.phase,
        frame: unit.player.pose.shp,
        parts: unit.player.pose.count,
        head: art.views[view].parts.find((p) => p.role === "head").cell,
        shadowMap: renderer.shadowMap.enabled,
        sceneChildren: scene.children.length,
      }),
    };
}
