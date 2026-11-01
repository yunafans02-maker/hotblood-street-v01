# iPhone 網頁交付修正 — 2026-11-01

## 根因

本專案始終使用 HTML5、TypeScript、Phaser 3.90.0 與 Vite。沒有 Electron、Tauri、EXE、APK 或桌面啟動器；`npm run build` 輸出 `dist/index.html` 及 `dist/assets/*.js`、`*.css`。之前的 ZIP 是原始碼封裝，未完成網頁託管；本機 URL 也不是遠端 iPhone 可直接訪問的測試網址。這是交付與部署缺口，無需移植或重寫遊戲。

## 已完成

- 新增 `vercel.json`，明確指定 Vite／npm ci／npm run build／dist，並區分 HTML 和雜湊資源快取。
- 新增 `.vercelignore`，排除 Skills、QA 截圖、測試與依賴資料夾等部署非必要內容；`.gitignore` 排除 Vercel 本機帳戶連接資料。
- 加上 HTML 載入狀態、資源錯誤／未完成提示與重新載入。第一次成功 render 後移除覆蓋層，不擋住觸控。
- 支援針對正式產物或已部署網址測試（`TEST_BASE_URL`），新增非下載式 HTML／資源回應及資源失敗後重試測試。
- 文件將 iPhone HTTPS 網頁交付放在首位，開發機指令標為維護者專用。
- 比對 SHA-256 確認 `src/actors`、`src/art`、`src/systems`、`src/scenes` 共十份原有程式完全未變動。主角、敵人、62 格動畫、AI、碰撞、連擊、關卡與勝負流程均保留。

## 本次驗證結果

`npm run build` 成功。`TEST_BASE_URL=http://127.0.0.1:4173 npm test` 針對正式建置產物執行，八項測試全部通過（44.7 秒）：八方向及邊界、三段連擊及縱深判定、敵人 AI 及倒地起身、完整五敵通關及重開、連續三次失敗重開、手機橫向及雙指觸控、HTML／資源直接載入、bundle 載入失敗後重新載入恢復。

這只確認本機正式產物可作為網頁執行，未宣稱已部署或完成 iPhone Safari 真機驗收。

## 部署阻礙及下一步

原始碼位於獨立 Repository `yunafans02-maker/hotblood-street-v01`，專案放在根目錄，分支 `main`。使用者已明確批准此新 Repository 保持 Public，不得修改其他舊專案。

Vercel 尚未完成部署，沒有可提供的有效 HTTPS 遊戲網址。使用者可直接在 iPhone 上透過 Vercel 網頁登入 GitHub、匯入此 Repository，使用 Root Directory `./`、Framework `Vite`、Install Command `npm ci`、Build Command `npm run build`、Output Directory `dist`。這不需要玩家下載任何程式。

若改由開發環境替使用者執行部署，須先取得 Vercel 連接授權。Repository 上傳並不代表 Vercel 部署已成功，也不將 ZIP／localhost／區域網路 IP 當成最終遊戲交付。

## 線上驗收清單

部署完成後仍須以實際網址檢查，未部署前不能勾為完成：

- HTTPS 連結可由 iPhone Safari 開啟，沒有下載或安裝流程；如有 Vercel Preview 保護，使用已授權帳戶登入即可訪問，不直接取消保護。
- HTML／JS／CSS 回應 200 且 MIME 正確，沒有 attachment 標頭；頁面成功顯示角色與場景。
- 橫向顯示與安全區正常；直向顯示旋轉提示；不依賴強制方向鎖定或全螢幕。
- 雙指同時使用虛擬搖桿與攻擊，觸控取消、分頁返回後不持續移動。
- 三波五名敵人可完成勝負並重新開始。

本機 Chromium 的正式產物測試不等於 iPhone Safari 真機驗證；部署網址尚未產生，故線上驗收保持待完成。
