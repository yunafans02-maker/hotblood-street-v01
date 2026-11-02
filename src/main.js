import * as THREE from "three";
import "./style.css";
import official from "./tactics-sprite/tactics-sprite-data.json";
import {
  createAtlas,
  poseAt,
  findAnimation,
  cameraStep,
} from "./tactics-sprite/tactics-sprite.mjs";
import {
  createTacticsSprite,
  prepareSheet,
  flattenOntoSprite,
} from "./tactics-sprite/tactics-sprite-three.mjs";
import { characterData, spearPose, renderPosePng } from "./character/pose.mjs";

const loading = document.querySelector("#loading");
const fail = (error) => {
  loading.hidden = false;
  loading.style.display = "grid";
  loading.textContent = "角色載入失敗，請重新整理頁面。";
  console.error(error);
};
start().catch(fail);
async function start() {
  const canvas = document.querySelector("#stage"),
    stage = canvas.parentElement;
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: false,
    alpha: true,
  });
  renderer.setClearColor(0, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene(),
    camera = new THREE.OrthographicCamera(-45, 45, 45, -45, 1, 2000),
    focus = new THREE.Vector3(0, 20, 0);
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(22, 64),
    new THREE.MeshBasicMaterial({
      color: 0xe3e5d9,
      transparent: true,
      opacity: 0.46,
      depthWrite: false,
    }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.1;
  scene.add(floor);
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(21.9, 22.15, 64),
    new THREE.MeshBasicMaterial({
      color: 0xc7cfbf,
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
    }),
  );
  ring.rotation.x = -Math.PI / 2;
  scene.add(ring);
  const atlas = createAtlas(characterData(official));
  const loader = new THREE.TextureLoader();
  const [sheet, spearTexture] = await Promise.all([
    loader.loadAsync("/zhaoyun.png"),
    loader.loadAsync("/spear.png"),
  ]);
  prepareSheet(sheet);
  prepareSheet(spearTexture);
  const unit = createTacticsSprite(atlas, sheet, {
    facing: "SE",
    animation: "Idle",
  });
  unit.group.position.y = unit.standHeight;
  unit.itemLayer = { front: 1, back: 6 };
  scene.add(unit.group);
  const spear = new THREE.Mesh(
    new THREE.PlaneGeometry(64 * 0.75, 7 * 0.9).translate(
      (32 - 18.5) * 0.75,
      0,
      0,
    ),
    new THREE.MeshBasicMaterial({
      map: spearTexture,
      transparent: true,
      alphaTest: 0.5,
      depthWrite: false,
      side: THREE.DoubleSide,
      toneMapped: false,
    }),
  );
  spear.userData.sprite = unit;
  spear.material.onBeforeRender = flattenOntoSprite;
  unit.group.add(spear);
  let step = 0,
    zoom = 3,
    lastName = "Idle",
    pausedAt = null,
    clockOffset = 0,
    freezeTime = null;
  const now = () =>
    freezeTime ?? (pausedAt ?? performance.now() / 1000) - clockOffset;
  function resize() {
    const w = stage.clientWidth,
      h = stage.clientHeight;
    renderer.setPixelRatio(1);
    renderer.setSize(
      Math.max(1, Math.floor(w / 2)),
      Math.max(1, Math.floor(h / 2)),
      false,
    );
    const aspect = w / h,
      half = Math.max((42 * 3) / zoom, 46 / aspect);
    camera.left = -half * aspect;
    camera.right = half * aspect;
    camera.top = half;
    camera.bottom = -half;
    camera.updateProjectionMatrix();
  }
  function aim() {
    const elevation = Math.atan2(0.3, Math.SQRT1_2),
      azimuth = Math.atan2(0.5, -0.5) + (step * Math.PI) / 4,
      flat = Math.cos(elevation) * 400;
    camera.position.set(
      Math.sin(azimuth) * flat,
      focus.y + Math.sin(elevation) * 400,
      Math.cos(azimuth) * flat,
    );
    camera.lookAt(focus);
    camera.updateMatrixWorld();
    const view = (1 + step) % 8;
    document.querySelector("#view-label").textContent = `視角 ${view + 1} / 8`;
    document
      .querySelectorAll("[data-view]")
      .forEach((b) =>
        b.setAttribute("aria-pressed", String(Number(b.dataset.view) === view)),
      );
  }
  function play(name) {
    unit.play(name, now(), name === "Poke Mid" ? { then: "Idle" } : {});
    paintState(name);
  }
  function paintState(name) {
    if (
      name === lastName &&
      document.querySelector("#motion-status").textContent ===
        { Idle: "站立", Walk: "行走", "Poke Mid": "刺槍" }[name]
    )
      return;
    lastName = name;
    document
      .querySelectorAll("[data-animation]")
      .forEach((b) =>
        b.setAttribute("aria-pressed", String(b.dataset.animation === name)),
      );
    document.querySelector("#motion-status").textContent = {
      Idle: "站立",
      Walk: "行走",
      "Poke Mid": "刺槍",
    }[name];
  }
  for (let view = 0; view < 8; view++) {
    const b = document.createElement("button");
    b.dataset.view = view;
    b.textContent = String(view + 1).padStart(2, "0");
    b.setAttribute("aria-label", `觀察視角 ${view + 1}`);
    b.onclick = () => {
      step = (view - 1 + 8) % 8;
      aim();
    };
    document.querySelector("#views").append(b);
  }
  document
    .querySelectorAll("[data-animation]")
    .forEach((b) => (b.onclick = () => play(b.dataset.animation)));
  document.querySelector("#turn-left").onclick = () => {
    step = (step + 7) % 8;
    aim();
  };
  document.querySelector("#turn-right").onclick = () => {
    step = (step + 1) % 8;
    aim();
  };
  function setZoom(z) {
    zoom = Math.max(2, Math.min(5, z));
    document.querySelector("#zoom-label").textContent = `${zoom}×`;
    resize();
  }
  document.querySelector("#zoom-in").onclick = () => setZoom(zoom + 1);
  document.querySelector("#zoom-out").onclick = () => setZoom(zoom - 1);
  function exportIdle(view = (1 + step) % 8) {
    return renderPosePng(
      atlas,
      poseAt(atlas, findAnimation(atlas, "Idle"), view, 0),
      view,
      sheet.image,
      spearTexture.image,
    );
  }
  document.querySelector("#export").onclick = () => {
    const png = exportIdle(),
      a = document.createElement("a");
    a.href = png.toDataURL("image/png");
    a.download = `zhaoyun-idle-view-${((1 + step) % 8) + 1}.png`;
    a.click();
  };
  new ResizeObserver(resize).observe(stage);
  window.addEventListener("resize", resize);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) pausedAt = performance.now() / 1000;
    else if (pausedAt !== null) {
      clockOffset += performance.now() / 1000 - pausedAt;
      pausedAt = null;
    }
  });
  canvas.addEventListener("webglcontextlost", (e) => {
    e.preventDefault();
    fail(new Error("WebGL context lost"));
  });
  canvas.addEventListener("webglcontextrestored", () => location.reload());
  aim();
  resize();
  const point = new THREE.Vector3();
  function render() {
    const at = now(),
      pose = unit.update(at, camera),
      view =
        (1 +
          cameraStep(
            camera.matrixWorld.elements[8],
            camera.matrixWorld.elements[10],
          )) %
        8,
      spec = spearPose(atlas, pose, view);
    const h = unit.hand("last", 0, point);
    spear.visible = !!h;
    if (h) {
      spear.position.copy(unit.group.worldToLocal(h));
      spear.rotation.set(0, 0, -spec.angle);
      spear.renderOrder = pose.back ? -10 : 0.5;
    }
    paintState(unit.player.animation.name);
    renderer.render(scene, camera);
  }
  renderer.setAnimationLoop(render);
  render();
  loading.remove();
  const params = new URLSearchParams(location.search);
  if (params.has("test"))
    window.__sprite = {
      unit,
      atlas,
      renderer,
      camera,
      scene,
      spear,
      play,
      setView(view) {
        step = (view - 1 + 8) % 8;
        aim();
        render();
      },
      setZoom,
      render,
      exportIdle,
      setTime(t) {
        freezeTime = t;
        render();
      },
      getState() {
        const p = unit.player.pose;
        return {
          animation: unit.player.animation.name,
          view: (1 + step) % 8,
          zoom,
          frame: p.frame,
          tiles: p.tiles.slice(0, p.count).map((t) => t.id),
          hand: spearPose(atlas, p, (1 + step) % 8).hand,
          spearVisible: spear.visible,
          orthographic: camera.isOrthographicCamera,
        };
      },
      capture(name, view, tick) {
        const pose = poseAt(atlas, findAnimation(atlas, name), view, tick);
        return renderPosePng(
          atlas,
          pose,
          view,
          sheet.image,
          spearTexture.image,
        ).toDataURL();
      },
    };
}
