import {test,expect} from '@playwright/test';
import fs from 'node:fs';
const boot=async page=>{await page.goto('/?test');await page.waitForFunction(()=>window.__review);};
const matrix=JSON.parse(fs.readFileSync('docs/animation-data-check.json','utf8'));
const samples=JSON.parse(fs.readFileSync('artifacts/animation-samples.json','utf8'));

test('core Idle, Walk, Rotate, Unarmed Mid use exact official assemblies in all eight views',async({page})=>{
 await boot(page);
 const bad=await page.evaluate(samples=>{const r=window.__review,bad=[];
  for(const {name,view,tick,pose} of samples){const got=r.at(name,view,tick);if(JSON.stringify({...got,tiles:got.tiles.slice(0,got.count)})!==JSON.stringify({...pose,tiles:pose.tiles.slice(0,pose.count)}))bad.push({name,view,tick,expected:pose.shp,got:got.shp});}
  return bad;
 },samples.filter(s=>['Idle','Walk','Rotate','Unarmed Mid'].includes(s.name)));
 expect(bad).toEqual([]);
});
test('every required animation and view preserves tiles, motion, draw order and stance origin',async({page})=>{
 await boot(page);
 const results=await page.evaluate(samples=>{const r=window.__review,errors=[];
  for(const s of samples){const got=r.at(s.name,s.view,s.tick);if(JSON.stringify({...got,tiles:got.tiles.slice(0,got.count)})!==JSON.stringify({...s.pose,tiles:s.pose.tiles.slice(0,s.pose.count)}))errors.push(s.name+'/'+s.view+'/'+s.tick);if(r.unit.group.position.lengthSq()!==400)errors.push('origin drift');if(r.unit.group.children.length!==6)errors.push('extra scene mesh');}
  return {errors,hands:r.atlas.data.hands,holds:r.atlas.data.holds,frames:r.atlas.data.frames.length,sequences:r.atlas.sequences.length};
 },samples);
 expect(results).toEqual({errors:[],hands:null,holds:null,frames:364,sequences:218});
});
test('all three unarmed attacks, dodge, damage and revive return to Idle; official held poses stay held',async({page})=>{
 await boot(page);
 const out=await page.evaluate(()=>{const r=window.__review,out=[];
  for(let v=0;v<8;v++)for(const name of ['Unarmed High','Unarmed Mid','Unarmed Low','Dodge Defend','Taking Damage','Revived','Defend','Critical','Dead']){r.at(name,v,120,{chain:true});out.push({name,v,now:r.state().animation});}
  return out;
 });
 for(const row of out)expect(row.now,JSON.stringify(row)).toBe(['Defend','Critical','Dead'].includes(row.name)?row.name:'Idle');
});
test('all frame exports remain nonempty, binary alpha, and uncut; no weapon resources or shadows',async({page})=>{
 const errors=[],requests=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));await boot(page);
 const bad=await page.evaluate(samples=>{const r=window.__review,bad=[];
  for(const {name,view,tick} of samples){r.at(name,view,tick);const c=r.exportPng(),d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let visible=0,partial=0,edge=0;
   for(let i=0;i<d.length;i+=4){const a=d[i+3],x=i/4%c.width,y=Math.floor(i/4/c.width);if(a)visible++;if(a!==0&&a!==255)partial++;if(a&&(x<2||y<2||x>=c.width-2||y>=c.height-2))edge++;}
   if(visible<400||partial||edge)bad.push({name,view,tick,visible,partial,edge});
  }
  r.at('Idle',1,0);const gl=r.renderer.getContext(),px=new Uint8Array(4);gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,px);
  return {bad,pixel:[...px],scene:r.scene.children.length,shadow:r.renderer.shadowMap.enabled,ortho:r.camera.isOrthographicCamera};
 },samples);
 expect(bad).toEqual({bad:[],pixel:[255,255,255,255],scene:1,shadow:false,ortho:true});
 expect(errors).toEqual([]);expect(requests.filter(u=>/spear|weapon|\.glb|a1\.png/i.test(u))).toEqual([]);
});
test('mobile touch controls, pause, speed, replay and orientations operate without overlap',async({browser})=>{
 const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:3,isMobile:true,hasTouch:true});const page=await context.newPage();await boot(page);
 for(const [width,height] of [[390,844],[375,667],[844,390],[667,375]]){
  await page.setViewportSize({width,height});await page.waitForTimeout(120);
  const geometry=await page.evaluate(()=>{const a=document.querySelector('#viewport').getBoundingClientRect(),b=document.querySelector('.controls').getBoundingClientRect();return {separate:a.bottom<=b.top+1||a.right<=b.left+1,overflow:document.documentElement.scrollWidth>innerWidth};});
  expect(geometry).toEqual({separate:true,overflow:false});
  await page.selectOption('#animation','Walk');await page.getByRole('button',{name:'視角 5',exact:true}).tap();expect(await page.evaluate(()=>window.__review.state().view)).toBe(4);
  await page.getByRole('button',{name:'暫停',exact:true}).tap();const paused=await page.evaluate(()=>window.__review.state().elapsed);await page.waitForTimeout(100);expect(await page.evaluate(()=>window.__review.state().elapsed)).toBe(paused);
  await page.locator('#speed').fill('0.5');expect(await page.evaluate(()=>window.__review.state().speed)).toBe(.5);
  await page.getByRole('button',{name:'重播',exact:true}).tap();await page.waitForTimeout(100);expect(await page.evaluate(()=>window.__review.state().elapsed)).toBeGreaterThan(paused);
  await page.getByRole('button',{name:'放大',exact:true}).tap();await page.getByRole('button',{name:'縮小',exact:true}).tap();
 }
 await page.screenshot({path:'artifacts/unarmed-phone-landscape.png'});await page.setViewportSize({width:390,height:844});await page.selectOption('#animation','Idle');await page.getByRole('button',{name:'視角 2',exact:true}).tap();await page.screenshot({path:'artifacts/unarmed-phone-portrait.png'});await context.close();
});
test('normal page is a web app with fourteen actions, no test API, and all review assets load',async({page})=>{
 const r=await page.goto('/');expect(r.status()).toBe(200);expect(r.headers()['content-type']).toContain('text/html');expect(r.headers()['content-disposition']||'').not.toContain('attachment');await expect(page.locator('#loading')).toHaveCount(0);expect(await page.evaluate(()=>window.__review)).toBeUndefined();expect(await page.locator('#animation option').count()).toBe(14);expect(await page.locator('#weapon').count()).toBe(0);
 for(const path of ['/zhaoyun-sheet.png','/zhaoyun-preview.png','/previews/idle.gif','/previews/unarmed-mid.gif']){const r=await page.request.get(path);expect(r.status(),path).toBe(200);expect(r.headers()['content-type']).toMatch(/image\/(png|gif)/);}
});
test('maximum zoom keeps actual WebGL pixels inside the viewport on phone; attacks emit official hit events',async({page})=>{
 await page.setViewportSize({width:375,height:667});await boot(page);
 const out=await page.evaluate(samples=>{const r=window.__review;r.setZoom(1.5);const bad=[];let events=0;
  const gl=r.renderer.getContext();
  for(const s of samples){r.at(s.name,s.view,s.tick);const w=gl.drawingBufferWidth,h=gl.drawingBufferHeight;let edge=0;
   for(const [x,y,rw,rh] of [[0,0,w,1],[0,h-1,w,1],[0,0,1,h],[w-1,0,1,h]]){
    const px=new Uint8Array(rw*rh*4);gl.readPixels(x,y,rw,rh,gl.RGBA,gl.UNSIGNED_BYTE,px);
    for(let i=0;i<px.length;i+=4)if(px[i]<245||px[i+1]<245||px[i+2]<245)edge++;
   }
   if(edge)bad.push({name:s.name,view:s.view,tick:s.tick,edge});
  }
  for(const name of ['Unarmed High','Unarmed Mid','Unarmed Low'])for(let v=0;v<8;v++){r.at(name,v,18);if(r.unit.player.events.includes('PostGenericAttack'))events++;}
  return {bad,events};
 },samples);
 expect(out).toEqual({bad:[],events:24});
});
