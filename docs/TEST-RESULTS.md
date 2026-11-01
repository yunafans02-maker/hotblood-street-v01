# Prototype v0.1 驗收紀錄

日期：2026-10-30。環境：Linux、Node.js 24.19.0、Phaser 3.90.0、Chromium 156（Playwright）。

## 執行驗證

- 已安裝 npm 依賴並產生 lockfile；Vite 開發伺服器啟動成功。
- `npm run build`：TypeScript 與 Vite 正式建置成功。Phaser 主包約 1.50 MB，gzip 約 347 KB；Vite 提示 chunk 超過 500 KB，屬已知體積警告，並非建置失敗。
- `npm run preview -- --port 4173`：正式產物可開啟，單一 Canvas；鍵盤移動／攻擊冒煙測試無 pageerror；一般網址不掛載測試入口。
- `npm test`：六項 Chromium 端到端測試通過。
- `node scripts/capture-art.mjs`：主角／敵人共 62 格，全部為 64×56，透明外邊界未裁切，每格不超過 24 色，每種動畫至少兩個不同影格。另已查看角色接觸表與遊戲內畫面。

## 九項需求對照

| 項目 | 結果與證據 |
|---|---|
| 安裝、啟動、建置 | npm 依賴可安裝，開發與 preview 伺服器可啟動，TypeScript／Vite 通過 |
| 實際角色動畫 | 兩角色各七種動畫；逐格圖像 QA、接觸表與遊戲畫面檢視通過；並非只平移待機圖片 |
| 八方向移動 | 實際鍵盤測試八個向量、正規化速度、街道上邊界、Y 深度排序與鏡頭水平捲動 |
| 三段連擊 | 實際鍵盤觸發 0／1／2 三階段與敵人扣血；動畫伸展格對齊有效判定時間 |
| 敵人自主行為 | 觀察追蹤接近、主動攻擊及主角扣血；受擊、倒地、起身狀態測試通過 |
| 碰撞／攻擊 | 腳底身體分離與街道邊界；反方向、不同縱深不命中；每段攻擊以命中集合避免同敵重複扣血 |
| 單關完成／重開 | 自動玩家僅以實際鍵盤移動／出拳、保持原始 HP 與敵人數，擊敗 2／2／1 共五人，顯示勝利並重開 |
| 手機橫向版面 | Chromium 觸控裝置模擬，DPR=3，844×390、667×375、932×430；等待 Phaser 縮放更新後 Canvas 完整可見、維持 16:9；直向提示及模擬暫停通過 |
| 重開一致性 | 勝利後重開還原 120 HP、兩名敵人；連續三次失敗重開，場景物件數相同、指標數固定；無監聽器／UI 累積症狀 |

手機測試另透過 Chromium CDP 派送兩個實際 touch points，同時移動與攻擊，再派送 touchCancel，確認搖桿及攻擊狀態清空。

測試中有隔離敵人、指定站位及注入受傷的案例，用於驗證單一機制；完整通關案例沒有修改 HP、傷害、敵人數或敵人 AI。原型測試不等於全面平衡驗證。

## 未驗證與已知限制

- **iPhone Safari 實機未驗證**：安全區 env、Safari 動態工具列、背景返回、多指滑出螢幕、實機持續幀率及觸控延遲，仍需真機驗收。
- WebKit 已下載，但啟動缺少 libgtk-4、libgraphene、libharfbuzz-icu、libmanette、libhyphen、libGLESv2。系統套件安裝需要無法取得的管理權限，因此未執行 WebKit 測試。Chromium 模擬不能代替 Safari。
- 固定 960×540 像素畫布可於高 DPI 裝置顯示；非整數 CSS 縮放可能造成像素寬度不均。瀏覽器 resize 後，Phaser 需要一次縮放更新；切換方向時清空輸入。
- 美術採原創低解像度原型品質；部分循環姿勢重複，尚無商業級逐像素精修。沒有音效、音樂、複雜尋路或敵人種類變化。
- 遊戲平衡只經自動試玩與有限視覺觀察，尚未進行真人盲測與長時間壓力測試。

## 留存檔案

- `artifacts/gameplay.png`：遊戲內場景。
- `artifacts/phone-landscape.png`：DPR 3 手機橫向模擬。
- `artifacts/victory.png`：實際鍵盤通關後的勝利畫面。
- `artifacts/hero-sheet.png`、`artifacts/enemy-sheet.png`：七列分別為待機、步行、出拳、受擊、倒地、起身、勝利。透明背景，空槽非缺圖。
- `artifacts/asset-qa.json`：每種動畫的影格／獨立影格數及透明邊界 QA。
