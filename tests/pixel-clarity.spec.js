import {test,expect} from '@playwright/test';
import fs from 'node:fs';
import crypto from 'node:crypto';

test('original artwork and animation inputs remain byte-identical',()=>{
 expect(crypto.createHash('sha256').update(fs.readFileSync('public/zhaoyun-sheet.png')).digest('hex')).toBe('27b5b8456c2b2702d43214a0636051f6ae74901be9764f0f7552525a57309871');
});
test('1x–4x use full-DPI buffers, integer texel grids and only source-palette colors',async({browser})=>{
 for(const dpr of [1,2,3,2.625]){
 const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:dpr});const page=await context.newPage();await page.goto('/?test');await page.waitForFunction(()=>window.__review);
 const result=await page.evaluate(()=>{
  const r=window.__review,c=r.renderer.domElement,gl=r.renderer.getContext(),issues=[];
  const source=document.createElement('canvas');source.width=256;source.height=488;const ctx=source.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.drawImage(r.sheet.image,0,0);const src=ctx.getImageData(0,0,256,488).data,palette=new Set(['255,255,255']);for(let i=0;i<src.length;i+=4)if(src[i+3])palette.add(`${src[i]},${src[i+1]},${src[i+2]}`);
  r.setPlaying(false);
  for(const scale of [1,2,3,4])for(const [name,tick] of [['Idle',0],['Walk',16],['Rotate',12]]){
   r.setPixelScale(scale);r.at(name,1,tick);const info=r.pixelViewport(),rect=c.getBoundingClientRect();
   if(Math.abs(rect.width*devicePixelRatio-c.width)>.1||Math.abs(rect.height*devicePixelRatio-c.height)>.1)issues.push('CSS resampling');
   if(c.width<Math.floor(document.querySelector('#viewport').clientWidth*devicePixelRatio)-1)issues.push('low buffer');
   const px=new Uint8Array(c.width*c.height*4);gl.readPixels(0,0,c.width,c.height,gl.RGBA,gl.UNSIGNED_BYTE,px);
   let colors=0,badRuns=0,seen=0;
   for(let y=0;y<c.height;y++){
    let start=0,last='';
    for(let x=0;x<=c.width;x++){
     const i=(y*c.width+x)*4,key=x===c.width?'END':`${px[i]},${px[i+1]},${px[i+2]}`;
     if(x<c.width&&!palette.has(key))colors++;
     if(key!==last){if(last&&last!=='255,255,255'&&(x-start)%info.texelPixels)badRuns++;start=x;last=key;}
     if(x<c.width&&key!=='255,255,255')seen++;
    }
   }
   if(colors||badRuns||!seen)issues.push({dpr:devicePixelRatio,scale,name,colors,badRuns,seen});
  }
  return {issues,nearest:r.sheet.magFilter===1003&&r.sheet.minFilter===1003,mips:r.sheet.generateMipmaps,aa:gl.getContextAttributes().antialias,filter:getComputedStyle(c).filter};
 });
 expect(result).toEqual({issues:[],nearest:true,mips:false,aa:false,filter:'none'});await context.close();
 }
});
