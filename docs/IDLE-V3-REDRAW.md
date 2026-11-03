# 趙雲站立重繪 v3

使用者要求上一輪站立候選「重做」。本輪仍處於第一階段美術驗收，沒有開始Walk改動。重做前的遠端備份為`backup-before-idle-v3-redraw-20261103`，指向`43f619fc46d360e2d698dd9943ffd8d0b3838e69`。

## 本輪範圍

- 重新比對原始四視圖。v2的肩甲過薄、胸甲像矩形框、腰甲層次不足、後斜角露出正面五官是本輪修正重點。
- 新的原生像素母版為`references/zhaoyun/idle-v3/pixel-cells.json`。五格各32×40，角色可見高度仍為38像素。
- 頭臉、髮塊、額飾、肩胸甲、手臂、分開的裙甲、腰扣、靴子與披風重新安排；P4後斜角不畫正面雙眼，P5為背面。
- `public/candidates/zhaoyun-sheet-v3.png`仍為256×488 TYPE1，只有P1–P5被替換；其他像素與現用原圖逐一核對相同。現用`public/zhaoyun-sheet.png`未變，v2資源也保留。
- `/?candidate=idle-v3`沿用官方Runtime及資料，提供Idle／Rotate八方向審閱；一般網址仍載入原圖及14組原有動作。
- `/candidates/idle-v3/index.html`提供原版／v3、v2／v3切換、1×／4×、四部位比較及權威參考原圖。手機先顯示角色，技術說明收在展開項目。

## 素材來源與原生製作

先用圖像工具依實際載入的四視圖製作新的五方向無武器草稿。草稿未直接當作TYPE1素材，也沒有用普通Upscale。白髮、頭臉、身體、手腳及披風全部以明確原生色票座標重畫。最終JSON完整記錄五格的每一個像素；其provenance記錄草稿SHA、大小及來源範圍。

建置只讀原生token，直接寫RGBA，不執行縮放、抗鋸齒或模糊。預覽另以Nearest整數倍放大，不增加原生密度。

```sh
node scripts/build-idle-candidate-v3.mjs
node scripts/export-idle-candidate-previews-v3.mjs
node src/tactics-sprite/check-sheet.mjs public/candidates/zhaoyun-sheet-v3.png
npm run build
```

## 驗證

- 官方checker通過：256×488、非交錯RGBA、alpha只有0／255、透明RGB清零、所有像素位於官方Cells內。
- 完整候選55色：新站立23色與其他動作舊32色合計；瀏覽器允許，checker提出warning。原有98格未使用空格仍存在，必需83格均非空。沒有把checker視作美術驗收。
- 正式Build通過，既有大於500KB的JS分包提示仍存在。
- 15項自動化測試通過，包括現有動畫及像素顯示回歸、v2/v3修改範圍、八方向Idle／Rotate、手機直橫向及比較切換。頁面改排後重跑相關6項亦通過。
- Chromium手機模擬390×844、375×667、844×390可操作，無橫向溢出；真實iPhone Safari未驗證。

## 修改檔案

- `src/main.js`：加入v3候選載入路徑，保留v2及一般頁。
- `tests/idle-candidate.spec.js`：覆蓋兩候選及新增比較切換。
- `references/zhaoyun/idle-v3/pixel-cells.json`：新的原生母版。
- `scripts/build-idle-candidate-v3.mjs`、`scripts/export-idle-candidate-previews-v3.mjs`：固定格位打包及預覽。
- `public/candidates/zhaoyun-sheet-v3.png`、`public/candidates/idle-v3/`：候選圖集、檢查結果、逐格與部位PNG、原始參考複本、審閱頁。
- 本文件。

官方SHP／SEQ、相機與DPI設定、依賴、Vite／Vercel設定、授權文件及其他動畫均未改。

## 尚未完成

這是現有解析度內的另一版站立設計，不是增加像素密度的HD圖集；38像素高不能保留參考大圖全部細節，美術是否達標仍需使用者確認。Walk、Walk Slow、Walk Fast及其他動作尚未採用本版。此次不擴充圖集格式、不宣稱八方向Walk已修復。
