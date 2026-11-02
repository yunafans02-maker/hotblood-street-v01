"""Pack newly drawn unarmed source parts into the unchanged official TYPE1 cells.
Image generation made the pose/part drawings. This deterministic preparation uses
binary alpha, uniform nearest resizing, shared palette and cell-local crops only.
No demo character pixels, frame edits or synthetic playback are used.
"""
from pathlib import Path
from PIL import Image,ImageOps,ImageDraw
import numpy as np,json,hashlib
from scipy.ndimage import label
R=Path(__file__).resolve().parents[1];S=R/'references/zhaoyun/unarmed';P=R/'public'
D=json.loads((R/'src/tactics-sprite/tactics-sprite-data.json').read_text());required=json.loads((S/'required.json').read_text());anchors=json.loads((S/'layout-anchors.json').read_text());cells={c['id']:c for c in D['cells']}
src=Image.open(S/'parts-source.png').convert('RGBA');body=Image.open(S/'body-source.png').convert('RGBA');reactions=Image.open(S/'reaction-source.png').convert('RGBA');rear=Image.open(S/'back-attack-source.png').convert('RGBA')

def trim(im):
 b=im.getbbox();assert b;return im.crop(b)
def cut(im,box):
 t=im.crop(box);a=np.array(t);lab,n=label(a[:,:,3]>0)
 if n:
  counts=np.bincount(lab.ravel());counts[0]=0;a[lab!=counts.argmax()]=0
 return trim(Image.fromarray(a))
def size(im,h=None,w=None):
 ratio=h/im.height if h else w/im.width
 return im.resize((max(1,round(im.width*ratio)),max(1,round(im.height*ratio))),Image.Resampling.NEAREST)
def fit(im,w,h):return size(im,h=h) if w/im.width>=h/im.height else size(im,w=w)
def blank(w,h):return Image.new('RGBA',(w,h))
def put(dst,im,x,y):dst.alpha_composite(im,(round(x),round(y)))
def centered(dst,im,y):put(dst,im,(dst.width-im.width)//2,y)
parts={};notes={}
def add(id,im,at=None):
 c=cells[id];out=blank(c['w'],c['h'])
 if at is None:
  b=anchors[id];im=fit(im,b[2]-b[0],b[3]-b[1]);at=((b[0]+b[2]-im.width)//2,(b[1]+b[3]-im.height)//2)
 put(out,im,*at);assert out.getbbox();parts[id]=out

# Entirely newly drawn idle views. P4 is oriented to the SAME left-facing pattern
# as official P4; the runtime alone performs A/D mirroring around the stance.
idleboxes=[(54,13,176,209),(199,12,325,209),(356,13,467,209),(516,12,635,209),(677,12,788,209)]
idles=[size(cut(src,b),h=38) for b in idleboxes];idles[3]=ImageOps.mirror(idles[3])
for i,im in enumerate(idles):add('P'+str(i+1),im,((32-im.width)//2,1))
# Two head directions use reference-preserving new drawings, never an arm/torso
# rotation. Head and white tuft stay one source pixel scale across attack cells.
heads=[size(cut(src,(199,12,325,119)),h=20),size(ImageOps.mirror(cut(src,(516,12,635,118))),h=20)]
heads=[fit(h,24,21) for h in heads]
for id,bk,dy in [('TF1',0,0),('TF2',0,2),('TB1',1,0),('TB2',1,2)]:
 add(id,heads[bk],((24-heads[bk].width)//2,dy))
# The body plate contains five separate, DRAWN leg poses per front/back. Arms
# are absent. Shared heads are placed at the neck; no whole-sprite transforms.
bodytiles=[]
for row in range(3):
 for col in range(5 if row<2 else 4):
  bodytiles.append(cut(body,(col*body.width//5,row*body.height//3,(col+1)*body.width//5,(row+1)*body.height//3)))
for bk in range(2):
 for k in range(5):
  im=blank(32,40);torso=size(bodytiles[10] if not bk and k==2 else bodytiles[bk*5+k],h=20-[2,1,0,1,2][k]);head=heads[bk]
  if bk:
   # The long cape stops above the ankles, as in the authoritative back view.
   # Composite two drawn boot/greave crops behind it; no missing rear leg.
   neutral=size(idles[4],h=38)
   legs=neutral.crop((0,26,neutral.width,38))
   left=legs.crop((0,0,legs.width//2,12));right=legs.crop((legs.width//2,0,legs.width,12))
   dx=[-3,-1,0,1,3][k];dy=[-2,-1,0,1,2][k]
   put(im,left,16-left.width-1+dx,27+max(0,dy));put(im,right,16-dx,27+max(0,-dy))
   a=np.array(torso);blue=(a[:,:,2]>a[:,:,0].astype(int)*1.4)&(a[:,:,2]>65);yy=np.indices(a.shape[:2])[0];a[blue&(yy>14)]=0;torso=Image.fromarray(a)
  centered(im,torso,19);centered(im,head,1)
  add(('BB' if bk else 'BF')+str(k+1),im,(0,0))
# Headless attack torsos. Their different painted leg stance and chest angle
# are drawn sources, while the official SHP centers provide the weight shift.
rearparts=[cut(rear,(i*rear.width//4,0,(i+1)*rear.width//4,rear.height)) for i in range(4)]
rearScale=20/rearparts[0].height
for bk in range(2):
 for k in range(4):
  source=bodytiles[10+k] if not bk else rearparts[k]
  t=size(source,h=round(source.height*rearScale)) if bk else size(source,h=20);x=(32-t.width)//2
  # Rear neck shifts left through the lunge, matching TB1/TB2 and official SHP.
  if bk:x-=k
  add(('AB' if bk else 'AF')+str(k+1),t,(x,12 if not bk else (31 if k==0 else 32)-t.height))
# Every forearm below is a separately painted bent/extended part. The mapping
# records the selected source and orientation; no runtime joint rotation exists.
armboxes=[(108,525,149,581),(189,526,234,582),(291,532,323,584),(405,526,440,584),(479,529,530,584),(590,528,640,584),(669,540,714,593),(759,528,810,587),(835,528,878,590),(116,621,174,675),(209,616,245,687),(287,625,323,670),(401,616,439,686),(488,615,518,670),(583,617,637,686),(672,624,718,675),(754,619,808,684),(843,627,884,675),(101,723,161,777),(198,723,251,777),(106,822,170,870),(229,814,288,873),(64,1247,143,1291),(182,1247,241,1308),(477,1260,543,1315),(24,1342,99,1392),(138,1330,216,1400),(227,1347,293,1414),(311,1362,392,1409),(420,1370,499,1414),(211,1495,266,1541),(446,1470,499,1523),(23,1558,93,1605),(117,1561,192,1602),(226,1570,290,1624),(324,1558,386,1625),(408,1570,480,1612),(499,1570,573,1625),(101,1655,153,1716)]
arms=[cut(src,b) for b in armboxes]
# Pixel placement bounds are measured from TYPE1 attachment geometry, not copied art.
armmap={**{f'LF{i+1}':v for i,v in enumerate([1,2,3,5,9])},**{f'RF{i+1}':v for i,v in enumerate([5,4,2,1,0])},**{f'LB{i+1}':v for i,v in enumerate([10,12,14,16,18])},**{f'RB{i+1}':v for i,v in enumerate([17,15,13,11,10])},'LG2':22,'LG3':23,'LG6':24,'LG9':25,'LG10':28,'LG11':27,'LG12':28,'LG13':29,'LG14':30,'LG16':13,'LG27':31,'LG30':31,'LG35':32,'LG38':33,'LG42':34,'LG43':36,'LG44':32,'LG45':25,'LG46':36,'LG47':37,'LG56':38}
for id,index in armmap.items():
 a=arms[index]
 b=anchors[id];h=b[3]-b[1];w=b[2]-b[0];t=fit(a,w,h)
 if id in ['LG10','LG46']:t=fit(a,15,9)
 dy=5 if id.startswith(('LF','RF','LB','RB')) else (3 if id not in ['LG16','LG56'] else 2)
 x=(b[0]+b[2]-t.width)//2;y=min(24-t.height,(b[1]+b[3]-t.height)//2+dy)
 if id in ['LG10','LG46']:x=1
 if id=='LG46':y=13
 if id=='LG45':x=0;y=6
 if id=='LG47':x=1;y=13
 add(id,t,(x,y));notes[id]={'sourceArm':index,'sourceBounds':armboxes[index]}
# Defend is an official held pose (not an invented movement). Two bent gauntlet
# drawings overlap at the chest. Both fists are empty.
for id,flip in [('EF6',False),('EF7',True)]:
 im=blank(32,32);arm=fit(arms[20 if not flip else 21],13,11);put(im,arm,8,17);put(im,ImageOps.mirror(arm),15,17);add(id,im,(0,0))
# Reactions: all are newly drawn full poses, then split at the exact SHP bounds.
react=[]
for row in range(2):
 for col in range(4):react.append(cut(reactions,(col*384,row*512,(col+1)*384,(row+1)*512)))
# The lying character crosses a column boundary in the SOURCE plate; use exact boxes.
react[2]=cut(reactions,(752,300,1198,515));react[6]=cut(reactions,(752,770,1203,970))
for bk in range(2):
 im=fit(react[bk*4+1],30,30);add('KO'+str(3+bk),im,((32-im.width)//2,32-im.height))
 im=fit(react[bk*4+2],38,24);add('KO'+str(1+bk),im,((40-im.width)//2,27-im.height))
 # Damage full silhouette is 37px high from world y=-16 through sole y=20.
 im=fit(react[bk*4],32,37);full=blank(32,40);centered(full,im,40-im.height)
 # full array origin is (16,20), while SHP DF1 starts at y=-16 and DF2 at y=5.
 add('DB1' if bk else 'DF1',full.crop((0,4,32,28)),(0,0));add('DB2' if bk else 'DF2',full.crop((0,25,32,41)),(0,0))
 # Recovery has a separate squatting chest/head and keeps the damage legs at
 # the documented offsets; crop on global rows so the overlap is intentional.
 im=fit(react[bk*4+3],30,34);full=blank(32,40);centered(full,im,40-im.height)
 add('HR2' if bk else 'HR1',full.crop((0,17,32,33)),(0,0))
 add('SP2' if bk else 'SP3',full.crop((4,5,28,21)),(0,0))
# F72 overlays the near fist, a new arm drawing. F73 is the back kneel directly.
add('OV2',fit(arms[29],7,7),(1,1))
assert set(parts)==set(required['cells']),set(required['cells'])-set(parts)
# One shared 32-color reference palette, no dither or partial-alpha pixels.
pool=blank(256,488)
for id,t in parts.items():c=cells[id];put(pool,t,c['x'],c['y'])
pal=pool.convert('RGB').quantize(colors=32,method=Image.Quantize.MEDIANCUT,dither=Image.Dither.NONE)
sheet=blank(256,488)
for id,t in parts.items():
 a=np.array(t);rgb=t.convert('RGB').quantize(palette=pal,dither=Image.Dither.NONE).convert('RGB');a[:,:,:3]=np.array(rgb);a[:,:,3]=np.where(a[:,:,3]>=128,255,0);a[a[:,:,3]==0]=0;t=Image.fromarray(a);parts[id]=t;c=cells[id];put(sheet,t,c['x'],c['y'])
sheet.save(P/'zhaoyun-sheet.png',optimize=True)
# Art-only composites for inspecting the SOURCE frame assemblies before WebGL.
def frame(n):
 out=blank(80,72)
 for item in D['frames'][n]:
  id,x,y,*rest=item;t=parts[id]
  if rest:t=ImageOps.mirror(t)
  put(out,t,40+x-t.width//2,34+y-t.height//2)
 return out
selected=[1,2,3,8,7,11,10,9,12,13,16,15,14,17,18,92,93,97,98,99,141,142,146,147,148,25,26,68,69,21,22,23,24,72,19,20]
contact=Image.new('RGB',(6*240,((len(selected)+5)//6)*230),'white');dr=ImageDraw.Draw(contact)
for i,n in enumerate(selected):
 t=frame(n).resize((240,216),Image.Resampling.NEAREST);contact.paste(t,(i%6*240,i//6*230),t);dr.text((i%6*240+5,i//6*230+5),'SHP '+str(n),fill='black')
(R/'artifacts').mkdir(exist_ok=True);contact.save(R/'artifacts/unarmed-assemblies.png')
t=frame(2)
preview=trim(t);preview.resize((preview.width*8,preview.height*8),Image.Resampling.NEAREST).save(P/'zhaoyun-preview.png');t.save(P/'zhaoyun-preview-native.png')
meta={'source':'new reference-based unarmed pose drawings','animations':required['names'],'requiredFrames':required['frames'],'usedCells':required['cells'],'armSources':notes,'paletteLimit':32,'sheetSha256':hashlib.sha256((P/'zhaoyun-sheet.png').read_bytes()).hexdigest(),'officialFramesUnchanged':True,'officialSequencesUnchanged':True}
(R/'src/character/unarmed-art.json').write_text(json.dumps(meta,indent=2)+'\n');print('Packed',len(parts),'new cells; all official SHP/SEQ entries preserved.')
