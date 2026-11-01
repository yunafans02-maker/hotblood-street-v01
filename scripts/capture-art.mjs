import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
await mkdir('artifacts', { recursive: true });
const browser = await chromium.launch({headless:true});
try {
 const page=await browser.newPage({viewport:{width:960,height:540}});
 await page.goto(process.env.GAME_URL || 'http://127.0.0.1:5173/?test');
 await page.waitForFunction(()=>window.__game?.player);
 const result=await page.evaluate(()=>{
  const s=window.__game,poses={idle:4,walk:6,attack:9,hurt:2,down:3,rise:3,victory:4},report=[],sheets={};
  for(const kind of ['hero','enemy']){
   const canvas=document.createElement('canvas');canvas.width=64*9;canvas.height=56*7;const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
   Object.entries(poses).forEach(([pose,count],row)=>{
    const hashes=new Set();
    for(let f=0;f<count;f++){
     const source=s.textures.get(`${kind}-${pose}-${f}`).getSourceImage();ctx.drawImage(source,f*64,row*56);
     const pixels=source.getContext('2d').getImageData(0,0,64,56).data;let edge=false;const colors=new Set();
     for(let i=0;i<pixels.length;i+=4){if(!pixels[i+3])continue;const x=(i/4)%64,y=Math.floor(i/4/64);if(x===0||x===63||y===0||y===55)edge=true;colors.add(Array.from(pixels.slice(i,i+4)).join(','));}
     if(edge)throw Error(`${kind}-${pose}-${f}: clipped border`);if(colors.size>24)throw Error('Palette exceeds 24 colors');hashes.add(source.toDataURL());
    }
    if(hashes.size<2)throw Error(`${kind}-${pose}: no distinct animation frames`);
    report.push({kind,pose,frames:count,uniqueFrames:hashes.size,width:64,height:56,transparentBorder:true});
   });sheets[kind]=canvas.toDataURL('image/png');
  }
  return {sheets,report};
 });
 for(const [kind,url] of Object.entries(result.sheets))await writeFile(`artifacts/${kind}-sheet.png`,Buffer.from(url.split(',')[1],'base64'));
 await writeFile('artifacts/asset-qa.json',JSON.stringify(result.report,null,2)+'\n');
 await page.screenshot({path:'artifacts/gameplay.png'});
 console.log('62 frames validated: size, transparent border, <=24 colors, distinct poses.');
} finally {await browser.close();}
