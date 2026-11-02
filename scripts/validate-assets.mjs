import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {checkSheet} from '../src/tactics-sprite/check-sheet.mjs';
import {createAtlas,findAnimation,poseAt,createPlayer} from '../src/tactics-sprite/tactics-sprite.mjs';
import {unarmedData,ACTIONS,playbackOptions,art} from '../src/character/unarmed.mjs';
fs.mkdirSync('artifacts',{recursive:true});
const official=JSON.parse(fs.readFileSync('src/tactics-sprite/tactics-sprite-data.json'));
const data=unarmedData(official),atlas=createAtlas(data);
assert.deepEqual(data.frames,official.frames);assert.deepEqual(data.sequences,official.sequences);assert.deepEqual(data.idleFrames,official.idleFrames);
assert.equal(data.hands,null);assert.equal(data.holds,null);
const report=checkSheet(fs.readFileSync('public/zhaoyun-sheet.png'),data.cells);assert(report.ok);
const needed=new Set();const matrix=[];const samples=[];
for(const [name] of ACTIONS){
 const animation=findAnimation(atlas,name),row={name,views:[]};
 for(let view=0;view<8;view++){
  const seq=animation.idle?null:atlas.sequences[view>=3&&view<=6?animation.back:animation.front];
  let ticks=[0];if(seq){let t=0;ticks=seq.ticks.map(delay=>{const start=t;t+=delay;return start+.1;});}
  const frames=[];
  for(const tick of ticks){const pose=poseAt(atlas,animation,view,tick);assert(pose.count>0&&pose.count<=6);
   for(const tile of pose.tiles.slice(0,pose.count)){assert(!report.emptyCells.includes(tile.id),`${name}/${view}/${tile.id}`);needed.add(tile.id);}
   frames.push(pose.shp);samples.push({name,view,tick,pose});
  }
  const player=createPlayer(atlas);player.play(name,0,playbackOptions(name));player.update(2,(view-1+8)%8);
  const returnExpected=!!playbackOptions(name).then;
  if(returnExpected)assert.equal(player.animation.name,'Idle');
  row.views.push({view:view+1,status:'data-pass',frames:[...new Set(frames)],samples:ticks.length,returnsIdle:returnExpected?true:'official loop/held pose'});
 }
 matrix.push(row);
}
assert.deepEqual([...needed].sort(),[...art.usedCells].sort());
const result={ok:true,official:report,requiredCells:[...needed].sort(),requiredCellCount:needed.size,requiredCellsComplete:true,framesAndSequencesUnchanged:true,hands:null,holds:null,sheetSha256:crypto.createHash('sha256').update(fs.readFileSync('public/zhaoyun-sheet.png')).digest('hex'),browser:'see animation-acceptance.json',realIphoneSafari:'not verified',artApproval:'not implied by structural tests'};
fs.writeFileSync('docs/sheet-check.json',JSON.stringify(result,null,2)+'\n');
fs.writeFileSync('docs/animation-data-check.json',JSON.stringify(matrix,null,2)+'\n');
fs.writeFileSync('artifacts/animation-samples.json',JSON.stringify(samples));
console.log(`PASS: ${needed.size} required cells; ${samples.length} official frame/view samples; 14 animations × 8 directions. SHP/SEQ unchanged.`);
