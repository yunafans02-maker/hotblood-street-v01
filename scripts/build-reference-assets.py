"""Normalize this round's approved reference-derived edits to binary-alpha pixels,
then partition the static poses into six semantic TYPE1 layers. No old art read.
Image edits/novel views are made with imagegen; this file only performs the
requested deterministic nearest-neighbour sizing, alpha cleanup and packing.
"""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import numpy as np,json,math,hashlib
R=Path(__file__).resolve().parents[1];ref=R/'references/zhaoyun';pub=R/'public';pub.mkdir(exist_ok=True)
D=json.loads((R/'src/tactics-sprite/tactics-sprite-data.json').read_text())

def crop_alpha(im):
 a=np.array(im.convert('RGBA'));a[:,:,3]=np.where(a[:,:,3]>=200,255,0).astype('uint8');a[a[:,:,3]==0]=0
 im=Image.fromarray(a);b=im.getbbox();assert b;return im.crop(b)
def components(im):
 a=np.array(im)[:,:,3];active=(a>=200).sum(axis=0)>20;ranges=[];start=None
 for x,val in enumerate(active):
  if val and start is None:start=x
  if start is not None and (not val or x==len(active)-1):
   if x-start>50:ranges.append((start,x))
   start=None
 return [crop_alpha(im.crop((x,0,z,im.height))) for x,z in ranges]
base=components(Image.open(ref/'four-views-cleanup.png').convert('RGBA'));extra=components(Image.open(ref/'missing-views.png').convert('RGBA'))
assert len(base)==len(extra)==4
left=crop_alpha(Image.open(ref/'left-rear.png'))
source=[base[0],base[3],base[1],left,base[2],extra[1],extra[2],extra[3]]
raw=[]
for im in source:
 scale=min(56/im.height,32/im.width);w=max(1,round(im.width*scale));h=max(1,round(im.height*scale))
 sm=im.resize((w,h),Image.Resampling.NEAREST);canvas=Image.new('RGBA',(32,64));canvas.paste(sm,((32-w)//2,60-h));raw.append(canvas)
# One shared reference-derived palette removes JPEG/noise variation without changing hues.
pool=Image.new('RGB',(256,64),(0,0,0))
for v,im in enumerate(raw):pool.paste(im.convert('RGB'),(v*32,0))
palette=pool.quantize(colors=64,method=Image.Quantize.MEDIANCUT,dither=Image.Dither.NONE)
poses=[]
for im in raw:
 a=np.array(im);rgb=im.convert('RGB').quantize(palette=palette,dither=Image.Dither.NONE).convert('RGB');out=np.dstack((np.array(rgb),a[:,:,3]));out[out[:,:,3]==0]=0;poses.append(Image.fromarray(out))
# Find actual palm pixels, not the old demonstrator's grips. Hint chooses the anatomical holding hand.
hints=[4,5,12,6,27,26,21,26]

def hands(im):
 a=np.array(im).astype(int);r,g,b,al=a[:,:,0],a[:,:,1],a[:,:,2],a[:,:,3]
 mask=(al>0)&(r>155)&(g>90)&(g<225)&(b>65)&(b<185)&(r>g*1.12)&((g-b)<86);mask[:35]=False;mask[51:]=False
 pts=[];seen=set()
 for yy,xx in zip(*np.where(mask)):
  if (xx,yy) in seen:continue
  todo=[(xx,yy)];group=[]
  while todo:
   x,y=todo.pop()
   if (x,y) in seen or not(0<=x<32 and 0<=y<64) or not mask[y,x]:continue
   seen.add((x,y));group.append((x,y));todo.extend([(x-1,y),(x+1,y),(x,y-1),(x,y+1)])
  if len(group)>=2:pts.append(group)
 assert pts,'No hand skin found'
 return pts

def center(group):
 cx=sum(p[0] for p in group)/len(group);cy=sum(p[1] for p in group)/len(group)
 return min(group,key=lambda p:(p[0]-cx)**2+(p[1]-cy)**2)
occupied=np.zeros((488,256),bool);sheet=Image.new('RGBA',(256,488));used=[];frames=[];grips={};viewmeta=[]

def allocate(w,h,preferred):
 candidates=sorted(D['cells'],key=lambda c:(0 if (c['w'],c['h'])==preferred else 1,c['w']*c['h']))
 for c in candidates:
  if c['w']<w or c['h']<h:continue
  x,y=c['x'],c['y'];area=occupied[y:y+c['h'],x:x+c['w']]
  if area.any():continue
  area[:]=True;used.append(c['id']);return c
 raise RuntimeError(f'No legal independent cell for {w}x{h}')

for v,im in enumerate(poses):
 a=np.array(im);solid=a[:,:,3]>0;yy,xx=np.indices((64,32));groups=hands(im);near=min(groups,key=lambda g:abs(center(g)[0]-hints[v]));gx,gy=center(near)
 nearMask=solid&(abs(xx-gx)<=4)&(yy>=gy-11)&(yy<=gy+2)
 # Blue cloak pixels beside the arm stay on the cloak rather than gaining an arm-shaped seam.
 blue=(a[:,:,2].astype(int)>a[:,:,0].astype(int)*1.5)&(a[:,:,2]>70)
 nearMask &= ~blue | ((abs(xx-gx)<=2)&(abs(yy-gy)<=2))
 farGroup=max(groups,key=lambda g:abs(center(g)[0]-gx)) if len(groups)>1 else None
 farMask=np.zeros_like(solid)
 if farGroup and abs(center(farGroup)[0]-gx)>7:
  fx,fy=center(farGroup);farMask=solid&(abs(xx-fx)<=4)&(yy>=fy-11)&(yy<=fy+2)&~nearMask&~blue
 head=solid&(yy<32)&~nearMask&~farMask
 legs=solid&(yy>=48)&~nearMask&~farMask
 torso=solid&(yy>=32)&(yy<48)&(xx>=4)&(xx<=27)&~nearMask&~farMask
 cape=solid&~head&~legs&~torso&~nearMask&~farMask
 layers=[('cape',cape,(32,40)),('farArm',farMask,(24,24)),('legs',legs,(32,16)),('body',torso,(24,24)),('head',head,(32,32)),('gripArm',nearMask,(24,24))]
 assembly=[];rebuilt=Image.new('RGBA',im.size);parts=[]
 for role,mask,pref in layers:
  if not mask.any():continue
  ys,xs=np.where(mask);x0,x1,y0,y1=int(xs.min()),int(xs.max())+1,int(ys.min()),int(ys.max())+1
  c=allocate(x1-x0,y1-y0,pref);tile=Image.new('RGBA',(c['w'],c['h']));px=(c['w']-(x1-x0))//2;py=(c['h']-(y1-y0))//2
  clean=a.copy();clean[~mask]=0;fragment=Image.fromarray(clean).crop((x0,y0,x1,y1));tile.paste(fragment,(px,py));sheet.paste(tile,(c['x'],c['y']))
  tx=x0-px;ty=y0-py;assembly.append([c['id'],tx+c['w']/2-16,ty+c['h']/2-40])
  rebuilt.paste(fragment,(x0,y0),fragment)
  parts.append({'role':role,'cell':c['id'],'sourceBounds':[x0,y0,x1,y1]})
  if role=='gripArm':grips[c['id']]=[gx-tx,gy-ty,0]
 assert len(assembly)<=6
 assert np.array_equal(np.array(rebuilt),a),'Tile partition changed visible pixels'
 frames.append(assembly);viewmeta.append({'view':v,'label':['正面','左前斜角','左側','左後斜角','背面','右後斜角','右側','右前斜角'][v],'source':'reference A cleanup' if v in [0,1,2,4] else 'supplemented from reference A','gripNative':[gx,gy],'parts':parts})
 im.save(pub/'review'/f'view-{v}.png')
sheet.save(pub/'zhaoyun-sheet.png')
# The supplied B has no alpha in the received JPEG. This is the reference-derived transparent edit.
spear=crop_alpha(Image.open(ref/'spear-cleanup.png')).resize((128,25),Image.Resampling.NEAREST)
a=np.array(spear);a[:,:,3]=np.where(a[:,:,3]>127,255,0);a[a[:,:,3]==0]=0;spear=Image.fromarray(a);spear.save(pub/'zhaoyun-spear.png')
assert spear.getpixel((106,6))[3]==255
poses[1].save(pub/'zhaoyun-preview-native.png')
b=poses[1].getbbox();preview=poses[1].crop((max(0,b[0]-2),max(0,b[1]-2),min(32,b[2]+2),min(64,b[3]+2)));preview.resize((preview.width*8,preview.height*8),Image.Resampling.NEAREST).save(pub/'zhaoyun-preview.png')
meta={'phase':'static-art-review','approvedArt':False,'nativeCanvas':[32,64],'origin':[16,40],'frames':frames,'hands':grips,'views':viewmeta,'usedCells':used,'spear':{'file':'zhaoyun-spear.png','size':[128,25],'grip':[106,6],'angleByView':[1.38,1.25,1.2,1.35,1.58,1.78,1.92,1.9]},'animations':{'Idle':'static-ready-for-review','Walk':'not-created','Poke Mid':'not-created'},'sheetSha256':hashlib.sha256((pub/'zhaoyun-sheet.png').read_bytes()).hexdigest()}
(R/'src/character/static-art.json').write_text(json.dumps(meta,ensure_ascii=False,indent=2,default=lambda x:int(x))+'\n')
# Reproducible side-by-side proof: received authority above, native reconstructed poses below.
comparison=Image.new('RGB',(640,580),'white');draw=ImageDraw.Draw(comparison)
orig=Image.open(ref/'zhaoyun_four_views_reference.jpg')
for col,(box,v,label) in enumerate([((25,158,320,765),0,'FRONT'),((340,158,620,765),2,'LEFT'),((640,158,914,765),4,'BACK'),((940,158,1248,765),1,'FRONT 3/4')]):
 crop=orig.crop(box);crop.thumbnail((148,240),Image.Resampling.NEAREST);comparison.paste(crop,(col*160+(160-crop.width)//2,24))
 pp=poses[v].resize((128,256),Image.Resampling.NEAREST);comparison.paste(pp,(col*160+16,300),pp);draw.text((col*160+10,278),label,fill='#263044')
draw.text((8,8),'REFERENCE A (received)',fill='#263044');draw.text((8,560),'STATIC RECONSTRUCTION - ART REVIEW PENDING',fill='#263044');comparison.save(pub/'zhaoyun-four-view-comparison.png')
print('Built',len(used),'non-overlapping TYPE1 cells across eight original static assemblies. Pixel-perfect recomposition verified.')
