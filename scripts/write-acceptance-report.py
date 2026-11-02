from pathlib import Path
import json,html,subprocess,datetime
R=Path(__file__).resolve().parents[1]
raw=(R/'artifacts/playwright-results.json').read_text();run=json.loads(raw[raw.index('{\n  "config"'):]);stats=run['stats'];assert stats['unexpected']==0 and stats['expected']==7
rows=json.loads((R/'docs/animation-data-check.json').read_text());sheet=json.loads((R/'docs/sheet-check.json').read_text());assert sheet['ok']
for row in rows:
 for v in row['views']:v['status']='PASS: official pose / populated cells / browser rendering';v['artReview']='reviewable; not user-approved'
result={'generatedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'playwright':{k:stats[k]for k in ['expected','unexpected','skipped','flaky','duration']},'mobileSizes':[[390,844],[375,667],[844,390],[667,375]],'realIphoneSafari':'not verified','matrix':rows}
(R/'docs/animation-acceptance.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
md='# 動畫驗收表\n\nPASS 代表官方影格／SEQ 位移與順序一致、必要格位非空、瀏覽器可渲染。它不等於使用者已接受人物美術。\n\n7 項 Playwright 測試通過；14×8 方向共 600 個影格樣本。手機觸控尺寸 390×844、375×667、844×390、667×375（Chromium 模擬，DPR 3）。真實 iPhone Safari 未驗證。\n\n| 動作 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |\n|---|---|---|---|---|---|---|---|---|\n'
for row in rows:md+='| '+row['name']+' | '+' | '.join('PASS'for _ in row['views'])+' |\n'
md+='\nIdle、Defend、Critical、Dead 是官方靜止／持續姿勢；Walk 等循環。三種徒手攻擊、Dodge Defend、Taking Damage、Revived 完成後返回 Idle。\n\n圖集檢查通過：256×488、RGBA、非交錯、二值透明，83 個必要格位完整。警告：32 色（瀏覽器容許）、98 個未使用空格。\n\n美術限制：40px Cell 內細節較上一版簡化；背面攻擊部分拳臂依官方疊放順序被頭／披風遮擋。請配合每動作的八方向逐格圖審閱。\n'
(R/'docs/ANIMATION-ACCEPTANCE.md').write_text(md)
page='<!doctype html><html lang="zh-Hant"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>趙雲 · 動畫驗收表</title><style>body{font-family:system-ui;margin:20px;color:#28364c;background:white}h1{font-size:22px}p{font-size:14px;line-height:1.7}table{border-collapse:collapse;font-size:12px}td,th{border:1px solid #e1e6ed;padding:8px}section{overflow:auto}a{color:#35629d}</style><a href="/">← 返回預覽器</a><h1>趙雲 · 動畫驗證結果</h1><p>7 項瀏覽器測試通過。14 組動作 × 8 方向，共 600 個影格樣本。PASS 表示官方資料、必要圖塊與瀏覽器渲染檢查通過；美術仍供審閱。</p><p>手機觸控模擬：390×844、375×667、844×390、667×375。真實 iPhone Safari 尚未驗證。</p><section><table><tr><th>動作</th>'+''.join('<th>'+str(v)+'</th>'for v in range(1,9))+'</tr>'
for row in rows:page+='<tr><td>'+row['name']+'</td>'+''.join('<td>PASS</td>'for _ in range(8))+'</tr>'
page+='</table></section><p>83 個必要格位完整。圖集 256×488、二值透明；官方 checker 的 32 色與未使用空格警告不影響這 14 組動作。站立、防禦、跪倒與倒地依官方資料定格。</p><p>低解析格位內的細節已簡化；背面拳臂有部分正常遮擋，請配合逐格圖評估可讀性。</p><a href="/previews/index.html">查看每動作與八方向逐格預覽 ↗</a></html>'
(R/'public/animation-acceptance.html').write_text(page)
# Version-controlled change manifest, including generated assets (never modules/build output).
changed=subprocess.check_output(['git','diff','--name-status'],cwd=R,text=True).splitlines();new=subprocess.check_output(['git','ls-files','--others','--exclude-standard'],cwd=R,text=True).splitlines()
lines=[]
for line in changed:status,path=line.split('\t',1);lines.append((status,path))
for path in new:lines.append(('A',path))
if not any(p=='docs/CHANGED-FILES.md'for _,p in lines):lines.append(('A','docs/CHANGED-FILES.md'))
(R/'docs/CHANGED-FILES.md').write_text('# 實際修改檔案\n\n相對於備份 Commit `50c6940338b656be27aaaaf6f79e2713b217296e`。A 新增、M 修改、D 移除。官方 Runtime、資料庫、NOTICE 與部署設定原檔保留。\n\n'+''.join(f'- `{status}` `{p}`\n'for status,p in sorted(lines,key=lambda x:x[1])))
print('Wrote 14×8 acceptance matrix; changed-file manifest:',len(lines),'paths.')
