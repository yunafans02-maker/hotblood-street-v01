import fs from 'node:fs';
import assert from 'node:assert/strict';
import {checkSheet,decodePng} from '../src/tactics-sprite/check-sheet.mjs';
const read=p=>JSON.parse(fs.readFileSync(p));
const data=read('src/tactics-sprite/tactics-sprite-data.json'),art=read('src/character/art.json');
const bytes=fs.readFileSync('public/zhaoyun.png'),report=checkSheet(bytes,data.cells),image=decodePng(bytes);
assert(report.ok,'Official sheet validation failed');
const required=new Set();for(const f of data.idleFrames)for(const t of data.frames[f])required.add(t[0]);
for(const name of ['Walk','Poke Mid']){const a=data.animations.find(a=>a.name===name);for(const side of ['front','back'])for(const f of data.sequences[a[side]].frames)for(const t of data.frames[f])required.add(t[0]);}
for(const id of required)assert(!report.emptyCells.includes(id),`Missing required cell ${id}`);
for(const [id,grip] of Object.entries(art.grips)){const c=data.cells.find(c=>c.id===id);assert(image.at(c.x+grip[0],c.y+grip[1])[3]===255,`Grip is on empty pixel ${id}`);}
const unused=report.emptyCells.filter(id=>!required.has(id));
const checks={ok:true,official:report,requiredCells:required.size,missingRequiredCells:[],newGripLandmarks:Object.keys(art.grips).length,gripsOnOpaquePixels:true,unusedEmptyCells:unused.length,palette:report.colors};
fs.writeFileSync('docs/asset-check.json',JSON.stringify(checks,null,2)+'\n');
console.log(`PASS: ${required.size} required TYPE1 cells, ${checks.newGripLandmarks} original grips, ${report.colors} colors. ${unused.length} unused empty cells are intentional.`);
