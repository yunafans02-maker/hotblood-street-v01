# 趙雲 · 戰棋像素角色預覽器

本專案由熱血街頭原型完全重製為單一趙雲角色的網頁預覽器。使用 **Vite + JavaScript + Three.js r187 + Create Tactics ThreeJS Sprite 官方 Runtime**，沒有戰鬥、敵人、地圖、探索或 RPG 系統。

## iPhone 直接測試

在 Vercel 網頁匯入本 Repository，開啟部署成功後的 HTTPS 網址即可，不需要電腦、APK、EXE 或下載 ZIP。支援橫向與直向；控制列與角色畫布分開。

| Vercel 設定 | 值 |
|---|---|
| Framework | Vite |
| Root Directory | `./` |
| Install Command | `npm ci` |
| Build Command | `npm run build` |
| Output Directory | `dist` |

Repository：https://github.com/yunafans02-maker/hotblood-street-v01

## 已完成功能

- 原創約 2.5 頭身趙雲：銀白盔甲、深藍內襯、少量金飾、白色盔纓、深髮、銀色長槍。13 色原生像素，無抗鋸齒。
- 官方 TYPE1 256×488 圖集；繪製 Idle／Walk／Poke Mid 所需的 52 個 cells。
- 站立、循環行走、刺槍後回站立；八個官方視角（四種 patterns 與鏡像組合），預設左前視角。
- 每種動作都持槍，24 個新繪握點與新武器定位；沒有借用示範角色的握點或武器表。
- Orthographic Camera、Nearest、sRGB、縮放；小畫面會限制最大放大以保持角色及長槍完整。
- 可匯出目前方向的透明站立 PNG。Safari 如以圖片預覽方式開啟，可長按儲存。
- 原生獨立 PNG：[public/zhaoyun-idle.png](public/zhaoyun-idle.png)；六倍最近鄰放大預覽：[public/zhaoyun-preview.png](public/zhaoyun-preview.png)。

## 維護者執行與驗證

Node.js >=22.12（本環境 24.19.0）。以下指令是開發者用途，不是玩家啟動步驟。

```sh
npm ci
npm run dev
npm run check:sheet
node scripts/validate-assets.mjs
npm run build
npx playwright install chromium
npm test
```

正式產物驗證：

```sh
npm run preview -- --port 4173
TEST_BASE_URL=http://127.0.0.1:4173 npm test
```

`/?test` 才會公開 `window.__sprite` 測試介面；一般網址不提供。

## 素材與 Runtime 來源

- `scripts/draw-zhaoyun.py`：新繪角色的原始像素繪製程式，不讀取任何舊角色、先前趙雲圖片或 `a1.png`。可選用 Python + Pillow 重新產圖，瀏覽器與 Vercel 建置不需要 Python。
- `public/zhaoyun.png`：原創 TYPE1 圖集；`public/spear.png`：原創長槍。
- `src/character/art.json`：本角色的調色盤、關節與握點。
- `src/character/pose.mjs`：新握點資料、持槍投影及原生 PNG 組裝。
- `src/tactics-sprite/`：官方 Kit，Runtime、序列、模板與 checker 保持原檔。原始 `hands`／`holds` 在載入時替換為新角色資料，不改動官方 frame／sequence。
- `scripts/capture-previews.mjs`：擷取原生姿勢供 QA，須先啟動伺服器；預覽輸出不納入版控。

來源版本、SHA-256、驗收與限制見 [docs/ART-AND-TESTS.md](docs/ART-AND-TESTS.md)。授權保留於 `src/tactics-sprite/NOTICE.md`、`licenses/tactics-LICENSE.md`、`licenses/three-LICENSE.txt`。未引入上游 `vendor/` 原遊戲二進位、示範角色 PNG、模型或字型。

## 已完成與未完成

本階段的 Idle／Walk／Spear Attack、八視角、縮放與 PNG 匯出已完成。其餘官方動畫未繪製、不在 UI 提供。原創美術仍可依審閱調整。

**iPhone Safari 真機尚未驗證**；Chromium 觸控模擬與 WebGL 軟體渲染測試不等於真機結果。Vercel 部署的實際網址與線上驗收以部署成功結果為準。

## 備份

重製前版本位於 `backup-before-zhaoyun-rebuild`，Commit `176f8e872b55c4fd637c2d4864e4259faf03794c`。保留 Git 歷史，不修改其他 Repository。
