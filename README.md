# 熱血街頭 — Prototype v0.1

原創 2D 像素街頭格鬥單關原型。Phaser **3.90.0** + TypeScript + Vite，Canvas 2D；固定 960×540（16:9）邏輯畫面，以 FIT 留邊適配螢幕，不裁切場景。像素圖使用最近鄰取樣及整數座標顯示。獨立專案，不含舊遊戲素材。

## iPhone 網頁測試

玩家交付方式為 **HTTPS 網頁連結**。在 iPhone Safari 開啟網址並橫放手機即可玩，不需安裝任何程式、下載 ZIP、加入主畫面或準備電腦。

**2026-11-01 狀態：網頁建置及 Vercel Preview 設定已備妥，尚待 Vercel 帳戶連接授權，未部署，暫無有效的 HTTPS 測試網址。** 本機網址不能當成 iPhone 測試交付。完成部署後應以實際成功的 Preview URL 更新此處。

## 維護者：建置與部署

以下命令僅供維護者／自動化環境執行，不是玩家操作步驟。Node.js 22.20+（本環境 24.19.0）。

```sh
npm ci
npm run build
```

原始碼 Repository：https://github.com/yunafans02-maker/hotblood-street-v01 ，使用 `main` 分支，專案位於 Repository 根目錄。此獨立 Repository 的 Public 狀態已由擁有者批准。

在 iPhone 的 Vercel 網頁選擇 **Add New → Project**，匯入上述 Repository。設定如下：

| 設定 | 值 |
|---|---|
| Branch | `main` |
| Framework Preset | `Vite` |
| Root Directory | `./` |
| Install Command | `npm ci` |
| Build Command | `npm run build` |
| Output Directory | `dist` |

`vite.config.ts` 與 `vercel.json` 已明確設定根路徑與建置輸出。上傳原始碼不代表已部署，實際遊戲網址以 Vercel 部署成功後顯示的 HTTPS URL 為準。

`dist/` 是網頁站點根目錄，須以 `text/html` 提供 `index.html`，JS／CSS 以正確 MIME 提供，不可附上 `Content-Disposition: attachment`。首頁重新驗證快取，雜湊資源長期快取。只託管建置產物，不將原始碼目錄當成可下載交付。

內部開發／檢查：

```sh
npm run dev
npm run preview -- --port 4173
TEST_BASE_URL=http://127.0.0.1:4173 npm test
```

部署後，以實際 HTTPS URL 再執行網頁測試，並確認在 iPhone Safari 可通過預覽存取驗證。見 `docs/WEB-DELIVERY.md`。

## 操作與關卡

- 手機：左下搖桿八方向移動，右下「攻擊」。可同時移動和出拳，攻擊時移動速度降低。連按攻擊接三段，長按可接完已開始的連擊。
- 鍵盤：WASD 或方向鍵移動，J／空白鍵攻擊。
- 對準敵人的街道縱深及面向才會命中。第三段重擊使敵人倒地；主角每承受三次有效攻擊也會倒地。起身有短暫保護。
- 五名普通敵人，以 2／2／1 分三波登場。擊敗全部敵人勝利；HP 歸零失敗。兩種結局均有「重新開始」。
- 直向顯示旋轉提示，暫停模擬並清空輸入；切換分頁、失焦、觸控取消及調整尺寸也會清除控制狀態。

## 程式與素材

- `src/art/`：原創像素角色與街道繪製。
- `src/actors/`：角色狀態機、玩家及敵人行為。
- `src/systems/`：動畫、輸入、碰撞及戰鬥參數。
- `src/scenes/`：單關、分波、鏡頭、HUD、勝負及重開。
- `docs/ART-DIRECTION.md`：人物、色盤、網格、動畫與來源規範。
- 開發環境另有七項已批准的 Agent Skills，並非遊戲執行依賴，不納入遊戲原始碼 Repository。

## 驗證

```sh
npx playwright install chromium
npm test
node scripts/capture-art.mjs
```

Linux 執行瀏覽器需要相應系統函式庫；測試使用 Chromium。測試用網址 `/?test` 額外提供測試用狀態入口 `window.__game`，一般網址不提供。測試包含隔離場景設定及實際鍵盤操作完整通關，並非所有測試都代表未修改初始場景的遊玩。

驗收結果與限制見 `docs/TEST-RESULTS.md`。`artifacts/` 為本機產生的畫面、角色接觸表及素材 QA 報告，不納入版控；可執行上述腳本重建。角色和場景的實際素材來源全部位於 `src/art/`，啟動時在瀏覽器內生成，不依賴這些 QA 檔案。

## 範圍與限制

僅單人、單關、兩種角色造型；沒有 3D、三國角色、裝備、背包、商店、存檔或公開部署。未加入音樂／音效。普通敵人共用造型與簡單狀態機，不提供複雜尋路。Retina 螢幕以固定像素畫布縮放；非整數 CSS 比例下，像素寬度可能略不均勻。原型美術仍有精修空間。

**iPhone Safari 真機尚未驗證**，桌面瀏覽器模擬不能保證安全區、動態工具列與實機觸控表現。
