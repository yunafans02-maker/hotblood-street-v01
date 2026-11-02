# 趙雲徒手動畫修正

本輪以 `50c6940338b656be27aaaaf6f79e2713b217296e` 的多視圖審閱版為基礎。備份分支 `backup-before-zhaoyun-unarmed-animation-20261102` 已推送；工作分支為 `fix/zhaoyun-unarmed-animations`。沒有重建遊戲、增加角色或合併 main。

## 原因與修正

上一版有官方 Three.js Runtime，但把靜止像素分配到 41 個任意可用 Cell，追加八個自訂靜態 SHP；原本 364 個 SHP 及 218 個 SEQ 並未對應新素材。單純呼叫 Walk 會抽取錯誤部位。

本輪移除自訂靜態 SHP，重新按原本 Cell 語意製作 83 個必要圖塊：P 站立、BF/BB 步行身體、LF/RF/LB/RB 手臂、AF/AB 徒手軀幹、TF/TB 頭部、LG 拳臂，以及防禦、受傷、跪倒、倒地和起身圖塊。新畫的身體姿勢、手臂與腿部不是原四視圖的整張平移。背景、陰影及武器不進入圖集。

保留官方 `tactics-sprite.mjs`、`tactics-sprite-three.mjs` 和資料庫原檔。應用只在 `unarmedData()` 替換圖片檔名並把 `hands` / `holds` 設為 null，所有原始 frames / sequences / idleFrames / fb / du / layer order 保留。`unit.play()` 與 `unit.update()` 負責播放；前後序列及 A/B/C/D 鏡像完全由官方 runtime 決定，未建立逐方向動畫引擎。

原有手持長槍、場景 Mesh、材質、裝備狀態、長槍 UI、獨立槍圖與槍參考均已移除。官方函式庫內保留未使用的 `carry()` API 與原始動作資料，以免破壞官方庫；本應用沒有呼叫它、載入 GLB 或載入示範人物。

## 動作

14 組：Idle、Walk、Walk Slow、Walk Fast、Rotate、Unarmed High/Mid/Low、Defend、Dodge Defend、Taking Damage、Critical、Dead、Revived。

- Walk / Slow / Fast 使用同一官方姿勢組與各自 64 / 96 / 32 ticks。
- Rotate 使用官方 32 ticks 的八個站立 SHP，沒有 CSS 旋轉。
- 三種徒手攻擊的事件均在 tick 18；完成後 `then: 'Idle'`。
- Taking Damage 使用原本 1px 受傷震動，0.8 秒後回 Idle；這是官方反應，不用它代替其他動畫。
- Dodge Defend、Revived 完成後回 Idle。
- Defend、Critical、Dead 在官方資料中是 `ticks: [0]` 的持續姿勢，保留定格供檢視。Idle 為官方靜態站立，不另外加入呼吸漂浮。

## 素材與來源

權威參考仍為 `references/zhaoyun/zhaoyun_four_views_reference.jpg`。`references/zhaoyun/unarmed/` 保存本輪新畫的無武器姿勢／部件來源；官方 a1 只用於研究 Cell 和接合位置，沒有官方人物像素打包到產品中。`layout-anchors.json` 是格位接合測量，不是角色圖片。

`build-unarmed-assets.py` 負責二值透明、共用色盤、nearest-neighbor 取樣、逐 Cell 校準與打包。`preview-poses.mjs` 直接用官方 `poseAt` 匯出姿勢，`export-previews.py` 僅把它們畫成 GIF/PNG，不是另一套動畫播放器。

最終 sheet 256×488、RGBA、非交錯、alpha 0/255。32 個不透明顏色。官方 checker 對超過原遊戲 15 色提出 warning，但瀏覽器支援。98 個未使用格位為空；83 個本輪需要的格位全部有內容。這不是全 112 組動作皆完成的圖集，介面只允許已補圖的 14 組。

## 測試範圍與已知限制

- 驗證 14 組 × 8 方向，600 個 SEQ 影格／視角樣本。比較實際使用的 tiles（不比較官方物件池中 count 以外的舊值）、SHP、順序、鏡像、fb/du 與官方 `poseAt`。
- 攻擊、受傷、閃避與起身回 Idle；官方持續姿勢保持。
- 所有樣本 PNG 非空、沒有裁切、沒有部分透明；場景只有一個單位及官方六塊 Mesh，純白背景、沒有地面或陰影。
- Chromium 觸控模擬：390×844、375×667、844×390、667×375，DPR 3；操作、暫停、速度、重播、縮放及方向切換。
- 真實 iPhone Safari 尚未測試。瀏覽器／資料測試不代表美術已獲使用者驗收。
- 官方動作只有四組 Pattern，因此相鄰兩個角度可能共用相同動畫圖像；沒有虛構八套獨立動作。
- 素材受 40px 站立 Cell 限制，比上一版 56px 自訂靜止組合更低解析；細小金邊、眼睛及白髮陰影經過 32 色簡化。鏡像會反轉像素光照。背面出拳仍有部分拳臂受頭部／披風遮擋，請用八方向逐格預覽判斷可讀性。
- GIF 為 30fps 抽樣及 GIF 毫秒取整；正式網頁播放使用原始 60 ticks 時序。靜態姿勢 GIF 自然不會移動。
- Vercel Preview 沿用帳戶保護設定，可能先要求登入擁有者的 Vercel 帳戶；不在本輪關閉保護或改 GitHub 可見性。

## 再製素材（非部署必要步驟）

已提交所有輸出素材，Vercel 不需要 Python。重新打包才需要 Python 3、Pillow、NumPy、SciPy：

```sh
python scripts/build-unarmed-assets.py
npm run validate
npm run previews
```

MIT / NOTICE 保存在 `src/tactics-sprite/NOTICE.md`、`licenses/tactics-LICENSE.md` 及 `licenses/three-LICENSE.txt`。
