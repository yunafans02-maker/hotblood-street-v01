# 趙雲：指定四視圖還原 · 第一階段審稿版

Vite + Three.js r187 + Create Tactics ThreeJS Sprite 官方 Runtime。角色以本輪使用者提供的四視圖 A 為權威依據，武器以圖 B 為依據。本分支只製作**靜止角色還原**，美術尚待使用者確認；**沒有製作或啟用 Walk／Poke Mid**。

## 手機審閱

本分支 `rebuild/zhaoyun-reference-static` 使用 Vercel Preview，與 `main` 的舊展示頁分開。開啟 Preview 的 HTTPS 網址即可操作，不需安裝 APK、EXE、電腦程式或下載 ZIP。若 Vercel Preview 啟用帳戶保護，請用已獲授權的 Vercel 帳戶登入。

頁面只有一名靜止趙雲、八視角、縮放、長槍顯示開關與 PNG 匯出。背景純白；沒有地面、圓盤、漸層或投影陰影。動畫功能不提供，待美術審核後才進入後續開發。

## 第一階段交付

- [TYPE1 圖集：zhaoyun-sheet.png](public/zhaoyun-sheet.png)：256×488、非交錯 RGBA、Alpha 0／255，官方指定 cells 內繪製。
- [獨立長槍：zhaoyun-spear.png](public/zhaoyun-spear.png)：銀槍頭、金件、棕桿、藍纓、金尾，真正透明背景。
- [透明角色預覽：zhaoyun-preview.png](public/zhaoyun-preview.png)：無陰影、無武器，最近鄰整數放大。
- [四視圖對照](public/zhaoyun-four-view-comparison.png)：上方為收到的圖 A，下方為本輪原生像素還原。正面、左側、背面、左前斜角來自 A；其他四個方向為依 A 補充的視圖，亦待審核。
- [圖集及武器檢查報告](docs/sheet-check.json)。

畫風與還原程度需由使用者看對照圖確認。結構檢查通過不代表美術已驗收。

## 來源與處理

本輪附件實際以 JPEG 收到：A 1280×960 RGB，B 1280×426 RGB，兩者均沒有 Alpha。原圖像素未重壓縮，歸檔時移除 EXIF／IPTC 附加資料；參考圖保留在 `references/zhaoyun/`；B 使用 `.received.jpg` 副檔名，沒有把 JPEG 改名假稱原始 PNG。

以影像編輯工具去除白底與灰色地面陰影，保留白甲、白髮束及槍刃亮部；缺少的方向由同一角色參考補充。`scripts/build-reference-assets.py` 只做可重現的最近鄰規格化、Alpha 二值化、共享色盤與 TYPE1 分塊，不讀取上一版趙雲素材或 a1.png。

原生角色畫布 32×64、可見角色約 56 像素高，保留大型髮束而不將它壓進單一 32×40 cell。頭髮／頭部、身體、手臂、腿與披風分層，共使用 41 個不重疊官方 cells，每個靜態影格不超過 6 層。8 個靜態組裝新增在官方資料的副本上，原始 Runtime、動畫序列及模板檔案保持不變。

本輪採一致的方形像素縮放以維持參考圖寬高比例，所有視角和部位相同，沒有按部位拉伸。握點由本輪手掌像素測量，未沿用 a1.png 或上一版趙雲的資料。長槍在手上獨立定位並按前後視角分層。

## 開發者建置與測試

Node.js >=22.12。本機執行命令不是玩家操作步驟：

```sh
npm ci
npm run check:sheet
node scripts/validate-assets.mjs
npm run build
npm run dev
npx playwright install chromium
npm test
```

正式產物驗證可使用 `npm run preview -- --port 4173`，再執行 `TEST_BASE_URL=http://127.0.0.1:4173 npm test`。

可選用 Python、Pillow、NumPy 執行 `python scripts/build-reference-assets.py` 重建靜態素材；Vercel 建置與玩家不需要 Python。

| Vercel 設定 | 值 |
|---|---|
| Framework | Vite |
| Root Directory | `./` |
| Install Command | `npm ci` |
| Build Command | `npm run build` |
| Output Directory | `dist` |

## 授權與限制

官方 Runtime、資料、template、checker 與 NOTICE 保留於 `src/tactics-sprite/`。MIT 文本保留於 `licenses/`，未引入原遊戲 vendor 二進位、示範人物 PNG、模型或網站字型。

官方 checker 對 158 個未使用的空 cells 與超過原遊戲 15 色的 63 色調色盤提出 warnings。本階段實際使用的 41 cells 全部非空；保留參考圖色階優先於套用上一版簡化配色。瀏覽器允許這個色數，不宣稱可回寫原遊戲。

**未驗證：iPhone Safari 真機。** Chromium 手機模擬已測試，不等於實機驗收。補充方向、髮束、金邊與披風細節仍需使用者美術審核。其餘動畫均未製作、不標成已完成。

本輪備份分支：`backup-before-zhaoyun-reference-rebuild-20261102`，Commit `6040630a577b2cc78de1e02bae6f8958da5a116c`。
