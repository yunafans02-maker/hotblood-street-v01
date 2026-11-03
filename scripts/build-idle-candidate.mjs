import fs from 'node:fs';
import zlib from 'node:zlib';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {decodePng,checkSheet} from '../src/tactics-sprite/check-sheet.mjs';
const spec=JSON.parse(fs.readFileSync('references/zhaoyun/idle-v2/pixel-cells.json'));
const data=JSON.parse(fs.readFileSync('src/tactics-sprite/tactics-sprite-data.json'));
const baseline=fs.readFileSync('public/zhaoyun-sheet.png'),old=decodePng(baseline);
assert.equal(crypto.createHash('sha256').update(baseline).digest('hex'),'27b5b8456c2b2702d43214a0636051f6ae74901be9764f0f7552525a57309871');
const palette=Object.fromEntries(Object.entries(Object.assign({},...Object.values(spec.materials))).map(([k,v])=>[k,[...v.match(/[a-f\d]{2}/gi).map(n=>parseInt(n,16)),255]]));palette['.']=[0,0,0,0];
const crcTable=Array.from({length:256},(_,n)=>{for(let i=0;i<8;i++)n=n&1?0xedb88320^(n>>>1):n>>>1;return n>>>0;});
function chunk(type,b){const name=Buffer.from(type),out=Buffer.alloc(12+b.length);out.writeUInt32BE(b.length);name.copy(out,4);b.copy(out,8);let crc=0xffffffff;for(const byte of Buffer.concat([name,b]))crc=crcTable[(crc^byte)&255]^(crc>>>8);out.writeUInt32BE((crc^0xffffffff)>>>0,8+b.length);return out;}
export function png(w,h,pixels){const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(w);ihdr.writeUInt32BE(h,4);ihdr[8]=8;ihdr[9]=6;const scan=Buffer.alloc((w*4+1)*h);for(let y=0;y<h;y++)Buffer.from(pixels.subarray(y*w*4,(y+1)*w*4)).copy(scan,y*(w*4+1)+1);return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ihdr),chunk('IDAT',zlib.deflateSync(scan)),chunk('IEND',Buffer.alloc(0))]);}
const pixels=new Uint8Array(256*488*4);for(let y=0;y<488;y++)for(let x=0;x<256;x++)pixels.set(old.at(x,y),(y*256+x)*4);
const touched=new Set(),counts=[];
const nativeUsed=new Set();
fs.mkdirSync('public/candidates/idle-v2',{recursive:true});
for(const cell of spec.cells){const c=data.cells.find(c=>c.id===cell.id);assert(c&&c.w===32&&c.h===40);assert(cell.rows.length===40);let changed=0;const native=new Uint8Array(32*40*4),before=new Uint8Array(32*40*4);
 for(let y=0;y<40;y++){assert(cell.rows[y].length===32);for(let x=0;x<32;x++){const token=cell.rows[y][x];if(token!=='.')nativeUsed.add(token);const color=palette[token];assert(color);const orig=old.at(c.x+x,c.y+y);native.set(color,(y*32+x)*4);before.set(orig,(y*32+x)*4);if(color.some((v,k)=>v!==orig[k]))changed++;const offset=((c.y+y)*256+c.x+x)*4;pixels.set(color,offset);touched.add(offset/4);}}
 fs.writeFileSync(`public/candidates/idle-v2/${cell.id}-after.png`,png(32,40,native));fs.writeFileSync(`public/candidates/idle-v2/${cell.id}-before.png`,png(32,40,before));counts.push({id:cell.id,changedPixels:changed});
}
for(let y=0;y<488;y++)for(let x=0;x<256;x++)if(!touched.has(y*256+x))assert.deepEqual([...pixels.slice((y*256+x)*4,(y*256+x)*4+4)],old.at(x,y));
const encoded=png(256,488,pixels),report=checkSheet(encoded,data.cells);assert(report.ok);fs.writeFileSync('public/candidates/zhaoyun-sheet-v2.png',encoded);
const result={phase:'standing-art-candidate-only',approvedArt:false,requiredReview:'User art approval before Walk changes',changedCells:counts,nonStandingCellsUnchanged:true,originalSheetSha256:crypto.createHash('sha256').update(baseline).digest('hex'),candidateSheetSha256:crypto.createHash('sha256').update(encoded).digest('hex'),candidatePalette:spec.materials,nativeColorsUsed:nativeUsed.size,standingHeight:38,official:report};fs.writeFileSync('public/candidates/idle-v2/check.json',JSON.stringify(result,null,2)+'\n');console.log('Candidate: only P1–P5 edited. Checker passes. Other pixels byte-identical.');
