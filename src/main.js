import * as THREE from 'three';
import './style.css';
import official from './tactics-sprite/tactics-sprite-data.json';
import { createAtlas, drawPose, poseAt, findAnimation } from './tactics-sprite/tactics-sprite.mjs';
import { createTacticsSprite, prepareSheet } from './tactics-sprite/tactics-sprite-three.mjs';
import { unarmedData, ACTIONS, playbackOptions } from './character/unarmed.mjs';

start().catch(error => {
  console.error(error);
  document.querySelector('#loading').textContent = '角色載入失敗，請重新整理頁面。';
});
async function start() {
  const $ = selector => document.querySelector(selector);
  const canvas = $('#stage'), viewport = $('#viewport');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false });
  renderer.setClearColor(0xffffff,1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = false;
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-40,40,40,-40,1,2000);
  const atlas = createAtlas(unarmedData(official));
  const sheet = prepareSheet(await new THREE.TextureLoader().loadAsync('/zhaoyun-sheet.png'));
  // Source art uses square pixels. One UNIFORM scale for every action and part.
  const unit = createTacticsSprite(atlas,sheet,{ facing:'SE',animation:'Idle',scaleX:1,scaleY:1 });
  unit.group.position.set(0,unit.standHeight,0);
  scene.add(unit.group);
  let view=1, zoom=1, speed=1, playing=true, elapsed=0, lastMs=null, selected='Idle';
  let testClock=false;
  const labels=['前側 A','左前 B','左側 B','左後 C','背側 C','右後 D','右側 D','右前 A'];
  const focus=new THREE.Vector3(0,20,0);
  function render() {
    const pose=unit.update(elapsed,camera);
    renderer.render(scene,camera);
    $('#now').textContent = `${ACTIONS.find(a=>a[0]===unit.player.animation.name)?.[1] || unit.player.animation.name} · ${unit.player.animation.name}`;
    return pose;
  }
  function select(name) {
    if (!ACTIONS.some(a=>a[0]===name)) throw new Error('Unsupported action');
    selected=name; $('#animation').value=name;
    unit.play(name,elapsed,playbackOptions(name));
    $('#preview-link').href=`/previews/${name.toLowerCase().replaceAll(' ','-')}.gif`;
    render();
  }
  function setView(value) {
    view=(value+8)%8;
    const step=(view-1+8)%8, elevation=Math.atan2(.3,Math.SQRT1_2);
    const azimuth=Math.atan2(.5,-.5)+step*Math.PI/4, flat=Math.cos(elevation)*400;
    camera.position.set(Math.sin(azimuth)*flat,focus.y+Math.sin(elevation)*400,Math.cos(azimuth)*flat);
    camera.lookAt(focus); camera.updateMatrixWorld();
    document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.view===view)));
    $('#view-name').textContent=`視角 ${view+1} · ${labels[view]}`;
    render();
  }
  function resize() {
    const w=Math.max(1,viewport.clientWidth), h=Math.max(1,viewport.clientHeight);
    // Integer framebuffer scaling makes each sprite texel a square, crisp block.
    // Bound the camera using the largest punch/dead silhouette, not the idle box.
    const pixelScale=Math.max(1,Math.min(Math.floor(Math.min(w/72,h/64)),Math.max(2,Math.floor(Math.min(w/84,h/74)*zoom))));
    const rw=Math.ceil(w/pixelScale), rh=Math.ceil(h/pixelScale);
    renderer.setPixelRatio(1); renderer.setSize(rw,rh,false);
    camera.left=-rw/2;camera.right=rw/2;camera.top=rh/2;camera.bottom=-rh/2;
    camera.updateProjectionMatrix(); setView(view);
  }
  function setZoom(value) { zoom=Math.min(1.5,Math.max(.75,value));$('#zoom-value').textContent=`${Math.round(zoom*100)}%`;resize(); }
  function setPlaying(value) { playing=value;lastMs=null;$('#play').textContent=playing?'暫停':'播放';$('#play').setAttribute('aria-pressed',String(playing)); }
  function setSpeed(value) { speed=Number(value);$('#speed-value').textContent=`${speed.toFixed(2).replace(/0$/,'')}×`; }
  for (const [name,label] of ACTIONS) { const option=document.createElement('option');option.value=name;option.textContent=`${label} · ${name}`;$('#animation').append(option); }
  for(let v=0;v<8;v++){const b=document.createElement('button');b.dataset.view=v;b.textContent=v+1;b.setAttribute('aria-label',`視角 ${v+1}`);b.onclick=()=>setView(v);$('#views').append(b);}
  $('#animation').onchange=e=>select(e.target.value);
  $('#play').onclick=()=>setPlaying(!playing);
  $('#replay').onclick=()=>{select(selected);setPlaying(true);};
  $('#speed').oninput=e=>setSpeed(e.target.value);
  $('#smaller').onclick=()=>setZoom(zoom-.25);$('#larger').onclick=()=>setZoom(zoom+.25);
  $('#previous').onclick=()=>setView(view-1);$('#next').onclick=()=>setView(view+1);
  function exportPng() {const out=document.createElement('canvas');out.width=240;out.height=216;const ctx=out.getContext('2d');ctx.imageSmoothingEnabled=false;drawPose(ctx,sheet.image,unit.player.pose,120,102,3);return out;}
  $('#export').onclick=()=>{const a=document.createElement('a');a.href=exportPng().toDataURL('image/png');a.download=`zhaoyun-${unit.player.animation.name.toLowerCase().replaceAll(' ','-')}.png`;a.click();};
  document.addEventListener('visibilitychange',()=>{lastMs=null;});
  new ResizeObserver(resize).observe(viewport);
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();renderer.setAnimationLoop(null);$('#context-error').hidden=false;});
  $('#reload').onclick=()=>location.reload();
  resize();select('Idle');$('#loading').remove();
  renderer.setAnimationLoop(ms=>{
    if(lastMs!==null && playing && !document.hidden && !testClock) elapsed+=Math.min((ms-lastMs)/1000,.1)*speed;
    lastMs=ms;render();
  });
  if(new URLSearchParams(location.search).has('test')) window.__review={
    atlas,unit,sheet,scene,camera,renderer,select,setView,setZoom,setPlaying,setSpeed,exportPng,
    at(name,v,ticks,{chain=false}={}) {testClock=true;elapsed=0;setView(v);unit.play(name,0,chain?playbackOptions(name):{});elapsed=ticks/60;return JSON.parse(JSON.stringify(render()));},
    resume(){testClock=false;lastMs=null;},
    state:()=>({view,zoom,speed,playing,elapsed,selected,animation:unit.player.animation.name,frame:unit.player.pose.shp,origin:unit.group.position.toArray(),meshes:unit.group.children.length,sceneChildren:scene.children.length,shadow:renderer.shadowMap.enabled}),
    expected:(name,v,t)=>poseAt(atlas,findAnimation(atlas,name),v,t),
  };
}
