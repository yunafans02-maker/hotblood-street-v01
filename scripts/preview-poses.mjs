import fs from 'node:fs';
import {createAtlas,findAnimation,poseAt} from '../src/tactics-sprite/tactics-sprite.mjs';
import {unarmedData,ACTIONS} from '../src/character/unarmed.mjs';
const official=JSON.parse(fs.readFileSync('src/tactics-sprite/tactics-sprite-data.json'));const atlas=createAtlas(unarmedData(official));const out=[];
for(const [name,label]of ACTIONS){const a=findAnimation(atlas,name);const total=a.idle?60:atlas.sequences[a.front].totalTicks;let frames=[];
 for(let tick=0;tick<Math.max(total,60*(total===0));tick+=2)frames.push({pose:poseAt(atlas,a,1,tick),ms:1000/30});
 if(!a.loop&&!a.idle&&total>0)for(let i=0;i<20;i++)frames.push({pose:poseAt(atlas,findAnimation(atlas,'Idle'),1,0),ms:1000/30});
 out.push({name,label,slug:name.toLowerCase().replaceAll(' ','-'),frames});
}
fs.writeFileSync('artifacts/preview-poses.json',JSON.stringify(out));
