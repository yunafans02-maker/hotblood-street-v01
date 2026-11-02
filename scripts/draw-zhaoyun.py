"""Original, integer-grid pixel drawing. Never reads a1.png or previous artwork.
The TYPE1 layout and assembly data are the official MIT kit; all visible pixels
are newly authored below. Pillow is an optional art-authoring tool, not a web dependency.
"""
from PIL import Image,ImageDraw
from pathlib import Path
import json,math,hashlib
ROOT=Path(__file__).resolve().parents[1]
DATA=json.loads((ROOT/'src/tactics-sprite/tactics-sprite-data.json').read_text())
C={'o':'#263044','n':'#1c344e','b':'#2c5272','l':'#4e7795','d':'#586f86','m':'#91a7b9','s':'#cbd9df','w':'#f2f1e6','g':'#d3b66f','a':'#967b48','f':'#e0b08b','t':'#b77d64','h':'#30323f','p':'#aabcc4'}
SHEET=Image.new('RGBA',(256,488));grips={};landmarks={}

def poly(im,pts,c):ImageDraw.Draw(im).polygon(pts,fill=C[c])
def rect(im,xy,c):ImageDraw.Draw(im).rectangle(xy,fill=C[c])
def line(im,pts,c,width=1):ImageDraw.Draw(im).line(pts,fill=C[c],width=width)
def head(im,x,y,back=False,profile=0):
 # 16px high, three-quarter silver Han-era helmet with cheek guards and white plume.
 poly(im,[(x+10,y),(x+15,y),(x+17,y+2),(x+15,y+3),(x+11,y+3),(x+8,y+5),(x+7,y+3)],'o')
 poly(im,[(x+10,y),(x+14,y),(x+15,y+1),(x+11,y+2),(x+8,y+4)],'w')
 poly(im,[(x+4,y+3),(x+10,y+2),(x+14,y+5),(x+15,y+10),(x+12,y+15),(x+3,y+15),(x,y+11),(x,y+7)],'o')
 poly(im,[(x+4,y+4),(x+9,y+3),(x+13,y+5),(x+14,y+9),(x+3,y+9),(x+1,y+7)],'m')
 poly(im,[(x+4,y+4),(x+8,y+3),(x+10,y+5),(x+9,y+7),(x+2,y+7)],'s')
 line(im,[(x+4,y+4),(x+8,y+3),(x+10,y+4)],'w')
 poly(im,[(x+10,y+5),(x+13,y+6),(x+14,y+10),(x+12,y+14),(x+10,y+13)],'d')
 line(im,[(x+2,y+8),(x+9,y+8),(x+12,y+9)],'g')
 if back:
  poly(im,[(x+2,y+10),(x+12,y+10),(x+11,y+14),(x+5,y+15),(x+2,y+13)],'d')
  poly(im,[(x+4,y+10),(x+9,y+10),(x+9,y+13),(x+5,y+14)],'m')
  line(im,[(x+4,y+11),(x+10,y+12)],'s')
  rect(im,(x+10,y+12,x+12,y+15),'h')
 else:
  poly(im,[(x+1,y+9),(x+9,y+9),(x+10,y+11),(x+8,y+14),(x+4,y+15),(x+1,y+13)],'t')
  poly(im,[(x+1,y+9),(x+7,y+9),(x+8,y+12),(x+5,y+14),(x+2,y+13)],'f')
  line(im,[(x+1,y+10),(x+4,y+10)],'o')
  rect(im,(x+2,y+11,x+2,y+11),'o')
  rect(im,(x,y+12,x+1,y+12),'f')
  line(im,[(x+3,y+14),(x+5,y+14)],'o')
  poly(im,[(x+9,y+10),(x+12,y+10),(x+11,y+14),(x+9,y+15),(x+8,y+13)],'s')
  line(im,[(x+10,y+11),(x+10,y+13)],'w')
  rect(im,(x+12,y+10,x+13,y+15),'h')

def torso(im,x,y,back=False):
 # Layered cuirass, a broad breastplate, blue undercoat and restrained brass trim.
 poly(im,[(x+3,y),(x+12,y),(x+16,y+4),(x+14,y+12),(x+2,y+13),(x,y+4)],'o')
 poly(im,[(x+3,y+1),(x+11,y+1),(x+13,y+4),(x+12,y+10),(x+3,y+10),(x+1,y+4)],'d')
 poly(im,[(x+3,y+2),(x+9,y+2),(x+11,y+4),(x+10,y+8),(x+3,y+7),(x+1,y+4)],'s')
 poly(im,[(x+3,y+2),(x+7,y+2),(x+8,y+3),(x+3,y+4),(x+2,y+3)],'w')
 poly(im,[(x+11,y+3),(x+13,y+4),(x+12,y+9),(x+10,y+8)],'m')
 if back:
  line(im,[(x+4,y+2),(x+10,y+8)],'n',2)
  rect(im,(x+7,y+5,x+8,y+6),'g')
 else:
  poly(im,[(x+3,y+7),(x+6,y+8),(x+7,y+7),(x+9,y+8),(x+10,y+10),(x+3,y+9)],'m')
  rect(im,(x+6,y+4,x+7,y+5),'g')
 rect(im,(x+2,y+10,x+13,y+11),'n')
 rect(im,(x+7,y+10,x+9,y+11),'g')

def legs(im,x,y,stride=0,back=False):
 # Wide navy skirt panels. Knees and separate silver greaves stay readable at 1x.
 poly(im,[(x+2,y),(x+13,y),(x+16,y+8),(x+10,y+11),(x+1,y+9),(x-1,y+7)],'o')
 poly(im,[(x+3,y+1),(x+7,y+2),(x+6,y+9),(x,y+7)],'b')
 poly(im,[(x+8,y+2),(x+12,y+1),(x+14,y+7),(x+10,y+9)],'n')
 line(im,[(x+2,y+3),(x+1,y+6)],'l')
 line(im,[(x+2,y+8),(x+5,y+9)],'g')
 line(im,[(x+10,y+9),(x+13,y+7)],'a')
 for xx,sy,lit in [(x+2-stride,y+7,True),(x+11+stride,y+8,False)]:
  poly(im,[(xx,sy),(xx+4,sy),(xx+5,sy+6),(xx+2,sy+8),(xx-3,sy+8),(xx-3,sy+6),(xx,sy+5)],'o')
  poly(im,[(xx+1,sy),(xx+3,sy+1),(xx+3,sy+5),(xx,sy+5)],'s' if lit else 'm')
  rect(im,(xx+1,sy+1,xx+1,sy+4),'w' if lit else 's')
  line(im,[(xx-2,sy+6),(xx+2,sy+6)],'d')

def hand(im,hx,hy):
 poly(im,[(hx-2,hy-2),(hx+1,hy-2),(hx+2,hy),(hx+1,hy+2),(hx-2,hy+2),(hx-3,hy)],'o')
 rect(im,(hx-2,hy-1,hx+1,hy+1),'s')
 rect(im,(hx-1,hy,hx+1,hy+1),'f')
 return [hx,hy]
def arm(im,shoulder,elbow,grip):
 sx,sy=shoulder;ex,ey=elbow;gx,gy=grip
 line(im,[shoulder,elbow,grip],'o',6)
 line(im,[shoulder,elbow],'n',4)
 line(im,[(sx-1,sy),(ex-1,ey)],'b',2)
 poly(im,[(sx-3,sy-2),(sx+2,sy-3),(sx+4,sy),(sx+2,sy+3),(sx-2,sy+2)],'o')
 poly(im,[(sx-2,sy-2),(sx+1,sy-2),(sx+2,sy),(sx,sy+2),(sx-2,sy+1)],'s')
 rect(im,(sx-1,sy-2,sx,sy-1),'w')
 line(im,[elbow,(gx,gy)],'m',3)
 return hand(im,gx,gy)

def put(id,im,grip=None,elbow=None):
 cell=next(c for c in DATA['cells'] if c['id']==id)
 assert im.size==(cell['w'],cell['h'])
 SHEET.paste(im,(cell['x'],cell['y']))
 if grip:
  grips[id]=[grip[0],grip[1],0]
  landmarks[id]={'grip':grip,'elbow':elbow or [grip[0]+3,grip[1]+3]}

# Five original standing view cells. No source or example pixels are sampled.
for i in range(1,6):
 im=Image.new('RGBA',(32,40));back=i>=4
 legs(im,9,24,0,back)
 arm(im,(9,20),(7,25),(6,28))
 torso(im,9,17,back)
 head(im,9 if i!=3 else 8,0,back,i)
 grip=arm(im,(24,20),(21,25),(13,27))
 put('P'+str(i),im,grip,[21,25])
# Head/torso/arm animation cells are authored separately, not a strip pasted into the atlas.
for back in [False,True]:
 for i,stride in enumerate([-2,-1,0,1,2],1):
  im=Image.new('RGBA',(32,40));legs(im,9,24,stride,back);torso(im,9,17,back);head(im,9,0,back);put(('BB' if back else 'BF')+str(i),im)
 for i,shift in enumerate([-2,-1,0,1,2],1):
  near=Image.new('RGBA',(24,24));far=Image.new('RGBA',(24,24))
  if not back:
   g=arm(near,(15,7),(13+shift,12),(7+shift,18));arm(far,(7,10),(5-shift,14),(4-shift,19));el=[13+shift,12]
  else:
   g=arm(near,(19,8),(14+shift,12),(8+shift,17));arm(far,(9,9),(11-shift,13),(11-shift,18));el=[14+shift,12]
  put(('LB' if back else 'LF')+str(i),near,g,el)
  put(('RB' if back else 'RF')+str(i),far)
# Official Poke Mid body tiles: anticipation, transfer of weight, full lunge.
for back in [False,True]:
 for i in [1,2,3]:
  im=Image.new('RGBA',(32,32));legs(im,8,15,(-1 if i==1 else 1 if i==2 else 3),back)
  torso(im,10-(i-1)*2,7+(i-1)*2,back);put(('AB' if back else 'AF')+str(i),im)
 im=Image.new('RGBA',(24,24));head(im,4,0,back);put('TB1' if back else 'TF1',im)
for id,shoulder,elbow,grip in [
 ('LG15',(4,9),(5,13),(8,17)),('LG16',(16,7),(16,12),(14,17)),
 ('LG17',(17,8),(13,13),(7,17)),('LG23',(16,5),(10,9),(5,12)),('LG20',(15,3),(10,6),(4,8)),
 ('LG56',(13,8),(16,12),(17,17)),('LG48',(18,8),(15,11),(10,15)),
 ('LG43',(18,8),(12,12),(7,15)),('LG51',(17,8),(10,14),(5,16))]:
 im=Image.new('RGBA',(24,24));g=arm(im,shoulder,elbow,grip);put(id,im,g,elbow)
SHEET.save(ROOT/'public/zhaoyun.png')
# Silver spear, authored at its own small grid. Grip at (18,3), +x toward the point.
spear=Image.new('RGBA',(64,7))
line(spear,[(2,3),(55,3)],'o',3);line(spear,[(3,3),(54,3)],'m');line(spear,[(5,2),(53,2)],'s')
rect(spear,(16,2,22,4),'n');line(spear,[(16,2),(22,2)],'g')
poly(spear,[(49,3),(56,0),(63,3),(56,6)],'o');poly(spear,[(51,3),(56,1),(61,3),(56,5)],'s');line(spear,[(52,3),(60,3)],'w');line(spear,[(54,4),(56,5)],'d')
spear.save(ROOT/'public/spear.png')
meta={'authoring':'Original integer-grid pixel drawing, draw-zhaoyun.py; no prior images or a1.png read','palette':C,'grips':grips,'landmarks':landmarks,'spear':{'file':'spear.png','grip':[18,3],'width':64,'height':7},'supported':['Idle','Walk','Poke Mid'],'sheetSha256':hashlib.sha256((ROOT/'public/zhaoyun.png').read_bytes()).hexdigest()}
(ROOT/'src/character/art.json').write_text(json.dumps(meta,indent=2)+'\n')
print('Original sheet generated:',len(grips),'new grip landmarks; 52 TYPE1 cells; 14-color palette')
