"""Rasterize official poseAt descriptors; no animation rules are reimplemented."""
from PIL import Image,ImageOps,ImageDraw
from pathlib import Path
import json,html
R=Path(__file__).resolve().parents[1];S=Image.open(R/'public/zhaoyun-sheet.png');out=R/'public/previews';out.mkdir(exist_ok=True)
poses=json.loads((R/'artifacts/preview-poses.json').read_text());samples=json.loads((R/'artifacts/animation-samples.json').read_text())
def draw(pose):
 im=Image.new('RGBA',(80,72))
 for t in pose['tiles'][:pose['count']]:
  tile=S.crop((t['sx'],t['sy'],t['sx']+t['w'],t['sy']+t['h']))
  if t['flipX']:tile=ImageOps.mirror(tile)
  im.alpha_composite(tile,(int(40+t['x']+pose['moveX']),int(34+t['y']+pose['moveY'])))
 return im
for a in poses:
 frames=[]
 for f in a['frames']:
  rgba=draw(f['pose']).resize((320,288),Image.Resampling.NEAREST);im=Image.new('RGB',rgba.size,'white');im.paste(rgba,(0,0),rgba);frames.append(im)
 frames[0].save(out/(a['slug']+'.gif'),save_all=True,append_images=frames[1:],duration=[round(f['ms'])for f in a['frames']],loop=0,optimize=False,disposal=2)
 # Every visible SHP pose in each of the eight official patterns.
 group=[s for s in samples if s['name']==a['name']];maxf=max(sum(s['view']==v for s in group)for v in range(8))
 contact=Image.new('RGB',(maxf*160,8*156),'white');dr=ImageDraw.Draw(contact)
 for v in range(8):
  for i,s in enumerate(s for s in group if s['view']==v):
   rgba=draw(s['pose']).resize((160,144),Image.Resampling.NEAREST);contact.paste(rgba,(i*160,v*156+12),rgba);dr.text((i*160+3,v*156+2),f"V{v+1} / SHP{s['pose']['shp']} / {s['tick']:g}t",fill='#60718a')
 contact.save(out/(a['slug']+'-8-views.png'),optimize=True)
# Current idle views replace obsolete static-assembly review images.
for s in samples:
 if s['name']=='Idle':draw(s['pose']).save(R/'public/review'/f"view-{s['view']}.png")
css='body{font-family:system-ui;margin:20px;color:#28364c;background:white}h1{font-size:22px}section{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:20px}article{border:1px solid #e4e8ef;padding:12px}img{image-rendering:pixelated;max-width:100%}a{color:#35629d}p{font-size:13px;line-height:1.6}'
page='<!doctype html><html lang="zh-Hant"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>趙雲 · 全部徒手動作</title><style>'+css+'</style><a href="/">← 返回動畫預覽器</a><h1>趙雲 · 14 組徒手動作</h1><p>以下預覽按官方 SEQ 影格組合輸出。展開八方向逐格圖可檢視所有姿勢；正式播放器使用 Three.js Runtime。倒地、跪倒及防禦依官方資料保留定格。</p><section>'
for a in poses:page+=f'<article><h2>{html.escape(a["label"])} · {a["name"]}</h2><img src="{a["slug"]}.gif" alt="{a["label"]}動作預覽"><p><a href="{a["slug"]}-8-views.png">八方向逐格圖 ↗</a></p></article>'
(out/'index.html').write_text(page+'</section></html>')
# Same source/reference comparison, refreshed with official P1/P2/P3/P5.
orig=Image.open(R/'references/zhaoyun/zhaoyun_four_views_reference.jpg');c=Image.new('RGB',(640,500),'white');d=ImageDraw.Draw(c)
for col,(box,v,label) in enumerate([((25,158,320,765),2,'FRONT'),((340,158,620,765),0,'LEFT'),((640,158,914,765),6,'BACK'),((940,158,1248,765),1,'FRONT 3/4')]):
 crop=orig.crop(box);crop.thumbnail((148,240),Image.Resampling.NEAREST);c.paste(crop,(col*160+(160-crop.width)//2,20));d.text((col*160+10,266),label,fill='black');p=Image.open(R/'public/review'/f'view-{v}.png').resize((240,216),Image.Resampling.NEAREST);c.paste(p,(col*160-40,280),p)
d.text((8,4),'AUTHORITATIVE REFERENCE',fill='black');d.text((8,480),'UNARMED TYPE1 - NEW MOTION ART',fill='black');c.save(R/'public/zhaoyun-four-view-comparison.png')
print('Exported 14 GIFs and 14 full eight-view pose contact sheets.')
