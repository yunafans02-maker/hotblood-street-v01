# 趙雲 · 徒手動作預覽

以使用者指定的趙雲造型製作的無武器 TYPE1 像素角色。Vite + Three.js + Create Tactics ThreeJS Sprite 官方 Runtime；只顯示一名角色，沒有遊戲、敵人或地圖。

## 執行與檢查

Node.js 22.12 以上。

```sh
npm ci
npm run dev
```

```sh
npm run check:sheet
npm run validate
npm test
npm run build
npm run preview
```

`npm test` 先產生驗證樣本，再執行 Playwright。第一次在開發電腦執行測試可能需要 `npx playwright install chromium`。玩家直接使用瀏覽器網址，不需要任何安裝檔。

## Vercel

- Root Directory：`.`（Repository 根目錄）
- Install Command：`npm ci`
- Build Command：`npm run build`
- Output Directory：`dist`
- Framework：Vite
- 不需要環境變數、GLB、API 金鑰或 Python。

GitHub 分支 `fix/zhaoyun-unarmed-animations` 提供本輪 Preview。main 保持原有版本；不要以舊 Production 網址判斷本輪結果。Vercel 的 Preview 保護可能要求登入專案擁有者帳戶。

## 操作與交付

動作選擇、播放／暫停、八方向、0.25×–2× 速度、重播、縮放、PNG 匯出。iPhone 直向與橫向皆有介面。背景純白、沒有地面陰影。

14 組動作：Idle、Walk、Walk Slow、Walk Fast、Rotate、Unarmed High、Unarmed Mid、Unarmed Low、Defend、Dodge Defend、Taking Damage、Critical、Dead、Revived。攻擊、受傷、閃避及起身後返回 Idle；Defend／Critical／Dead 依官方資料保持姿勢。

- `public/zhaoyun-sheet.png`：更新圖集。
- `public/zhaoyun-preview.png`：透明站立預覽。
- `public/zhaoyun-four-view-comparison.png`：參考與當前圖集對照。
- `public/previews/index.html`：每個動作 GIF 和八方向逐格圖。
- `public/animation-acceptance.html`：14×8 動畫驗證表。
- `docs/sheet-check.json`、`docs/animation-data-check.json`：圖集與逐方向資料驗證。
- `docs/CHANGED-FILES.md`：實際修改檔案。
- [修正內容、來源與限制](docs/UNARMED-ANIMATION-REVIEW.md)。

官方 Runtime 和全部 SHP/SEQ 原檔保留。自訂應用僅清空不適用的 hands/holds、替換 sheet 檔名。83 個必要圖塊全部有內容；其餘未製作的動畫不開放。真實 iPhone Safari 尚未驗證，美術仍需使用者檢視。

本輪備份：`backup-before-zhaoyun-unarmed-animation-20261102` → `50c6940338b656be27aaaaf6f79e2713b217296e`。

## 授權

保留官方 `src/tactics-sprite/NOTICE.md` 和 `licenses/` 的 MIT 授權。沒有把官方示範角色放進網頁。

## 像素清晰度修復

`fix/zhaoyun-pixel-clarity` 改用完整 devicePixelRatio 解析度、整數 texel 對齊；不修改角色 PNG 或動畫。瀏覽器 `/clarity/` 提供同一姿勢與100%設定的 Before/After 截圖。[診斷與測試](docs/PIXEL-CLARITY.md)。本輪共9項瀏覽器測試。
