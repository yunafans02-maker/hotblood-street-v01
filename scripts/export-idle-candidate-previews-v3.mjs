// Display-only nearest-neighbor expansion of the final native grid; no art resize
// or palette quantization is performed when building the candidate sheet.
import fs from 'node:fs';
import {decodePng} from '../src/tactics-sprite/check-sheet.mjs';
import {png} from './build-idle-candidate-v3.mjs';
const out='public/candidates/idle-v3/';
function image(file){const im=decodePng(fs.readFileSync(out+file));return im;}
function scaled(im,scale=4,box=[0,0,im.width,im.height]){const [l,t,r,b]=box,w=(r-l)*scale,h=(b-t)*scale,px=new Uint8Array(w*h*4);for(let y=0;y<h;y++)for(let x=0;x<w;x++)px.set(im.at(l+Math.floor(x/scale),t+Math.floor(y/scale)),(y*w+x)*4);return {w,h,px};}
for(const id of ['P1','P2','P3','P4','P5'])for(const version of ['before','after']){
 const im=image(`${id}-${version}.png`),s=scaled(im);fs.writeFileSync(out+`${id}-${version}-4x.png`,png(s.w,s.h,s.px));
}
const regions=[['face',[7,15,20,22]],['hair',[4,1,28,16]],['chest',[7,21,25,28]],['waist-boots',[6,27,27,39]]];
for(const [name,box]of regions)for(const version of ['before','after']){
 const s=scaled(image(`P2-${version}.png`),12,box);fs.writeFileSync(out+`${name}-${version}.png`,png(s.w,s.h,s.px));
}
// A single lossless side-by-side sheet for iPhone review without Vercel login.
const w=5*256,h=2*320+40,px=new Uint8Array(w*h*4);for(let i=0;i<px.length;i+=4)px.set([255,255,255,255],i);
for(let col=0;col<5;col++)for(let row=0;row<2;row++){
 const im=image(`P${col+1}-${row?'after':'before'}.png`),s=scaled(im,8);for(let y=0;y<s.h;y++)for(let x=0;x<s.w;x++){const q=(y*s.w+x)*4;if(s.px[q+3])px.set(s.px.slice(q,q+4),(((row*340+y)*w)+col*256+x)*4);}
}
fs.writeFileSync(out+'five-views-before-after.png',png(w,h,px));
// Four equal-size before/after region comparisons in one image, fixed 12x pixels.
const rw=640,rh=4*200,rp=new Uint8Array(rw*rh*4);for(let i=0;i<rp.length;i+=4)rp.set([255,255,255,255],i);
for(let row=0;row<regions.length;row++)for(let col=0;col<2;col++){const im=image(`P2-${col?'after':'before'}.png`),s=scaled(im,12,regions[row][1]);for(let y=0;y<s.h;y++)for(let x=0;x<s.w;x++){const q=(y*s.w+x)*4;if(s.px[q+3])rp.set(s.px.slice(q,q+4),(((row*200+y)*rw)+col*320+x)*4);}}
fs.writeFileSync(out+'four-regions-before-after.png',png(rw,rh,rp));
// Portrait iPhone-friendly contact sheet: left original, right candidate; 4x.
const mw=256,mh=5*176,mp=new Uint8Array(mw*mh*4);for(let i=0;i<mp.length;i+=4)mp.set([255,255,255,255],i);
for(let row=0;row<5;row++)for(let col=0;col<2;col++){
 const s=scaled(image(`P${row+1}-${col?'after':'before'}.png`),4);for(let y=0;y<s.h;y++)for(let x=0;x<s.w;x++){const q=(y*s.w+x)*4;if(s.px[q+3])mp.set(s.px.slice(q,q+4),(((row*176+y)*mw)+col*128+x)*4);}
}
fs.writeFileSync(out+'five-views-mobile.png',png(mw,mh,mp));
// User-requested redo: fixed-scale previous candidate versus the new native art.
const vp=new Uint8Array(mw*mh*4);for(let i=0;i<vp.length;i+=4)vp.set([255,255,255,255],i);
for(let row=0;row<5;row++)for(let col=0;col<2;col++){
 const im=col?image(`P${row+1}-after.png`):decodePng(fs.readFileSync(`public/candidates/idle-v2/P${row+1}-after.png`));const s=scaled(im,4);for(let y=0;y<s.h;y++)for(let x=0;x<s.w;x++){const q=(y*s.w+x)*4;if(s.px[q+3])vp.set(s.px.slice(q,q+4),(((row*176+y)*mw)+col*128+x)*4);}
}
fs.writeFileSync(out+'v2-v3-mobile.png',png(mw,mh,vp));
