import {test,expect} from '@playwright/test';
import fs from 'node:fs';
import {decodePng,checkSheet} from '../src/tactics-sprite/check-sheet.mjs';
const data=JSON.parse(fs.readFileSync('src/tactics-sprite/tactics-sprite-data.json'));
test('candidate changes only P1–P5, preserves other pixels, grid and standing height',()=>{
 const bytes=fs.readFileSync('public/candidates/zhaoyun-sheet-v2.png'),candidate=decodePng(bytes),original=decodePng(fs.readFileSync('public/zhaoyun-sheet.png'));
 expect(checkSheet(bytes,data.cells).ok).toBe(true);const mask=new Set();
 for(const id of ['P1','P2','P3','P4','P5']){
  const c=data.cells.find(c=>c.id===id);let changed=0,ys=[],xs=[];
  for(let y=0;y<c.h;y++)for(let x=0;x<c.w;x++){mask.add((c.y+y)*256+c.x+x);const a=candidate.at(c.x+x,c.y+y),b=original.at(c.x+x,c.y+y);if(a.some((v,i)=>v!==b[i]))changed++;if(a[3]){ys.push(y);xs.push(x);}}
  expect(changed).toBeGreaterThan(250);expect([Math.min(...ys),Math.max(...ys)]).toEqual([1,38]);expect(Math.max(...xs)-Math.min(...xs)+1).toBeLessThanOrEqual(24);
 }
 let outsideDifferences=0;for(let y=0;y<488;y++)for(let x=0;x<256;x++)if(!mask.has(y*256+x)){const a=candidate.at(x,y),b=original.at(x,y);if(a.some((v,i)=>v!==b[i]))outsideDifferences++;}expect(outsideDifferences).toBe(0);
});
test('candidate Three.js renders all eight Idle/Rotate views with only review actions',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/?candidate=idle-v2&test');await page.waitForFunction(()=>window.__review);await expect(page.locator('#animation option')).toHaveCount(2);
 const result=await page.evaluate(()=>{const r=window.__review,issues=[];for(let view=0;view<8;view++)for(const [name,tick]of [['Idle',0],...Array.from({length:8},(_,i)=>['Rotate',i*4+.1])]){const p=r.at(name,view,tick);if(!p.count||p.count>6)issues.push('parts');const canvas=r.exportPng(),a=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;let visible=0;for(let i=3;i<a.length;i+=4)if(a[i])visible++;if(visible<1000)issues.push('empty');}return {issues,candidate:r.state().candidateReview,path:r.sheet.image.src,hands:r.atlas.data.hands,holds:r.atlas.data.holds};});
 expect(result.issues).toEqual([]);expect(result.candidate).toBe(true);expect(result.path).toContain('/candidates/zhaoyun-sheet-v2.png');expect(result.hands).toBeNull();expect(result.holds).toBeNull();expect(errors).toEqual([]);
});
test('mobile art gallery displays all native and part comparisons, 1x/4x controls, without overflow',async({browser})=>{
 const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:3,isMobile:true,hasTouch:true}),page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/candidates/idle-v2/index.html');await page.waitForFunction(()=>document.images.length===18&&[...document.images].every(i=>i.complete&&i.naturalWidth));
 for(const [width,height]of [[390,844],[375,667],[844,390]]){await page.setViewportSize({width,height});expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);await page.locator('#one').tap();expect(await page.locator('.native').first().evaluate(e=>e.getBoundingClientRect().width)).toBe(32);await page.locator('#four').tap();expect(await page.locator('.native').first().evaluate(e=>e.getBoundingClientRect().width)).toBe(128);}
 expect(errors).toEqual([]);await context.close();
});
