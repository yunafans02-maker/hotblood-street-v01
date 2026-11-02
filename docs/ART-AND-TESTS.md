# 原創趙雲：素材規範與驗證

## 美術與圖集

角色由整數像素繪圖程式全新繪製，沒有讀取官方 a1.png、舊街頭角色、先前生成的趙雲圖片或第三方角色圖。原生人物約 40 px 高，頭盔與頭部約 16 px，約 2.5 頭身；銀白大塊盔甲、深藍衣、金色少量飾邊、白纓與銀槍，採 13 色、無細密盔甲紋理。

TYPE1 PNG 為 256×488、8-bit RGBA、非交錯；只使用官方 cells，透明像素 RGB=0，alpha 僅為 0／255。公式組裝使用官方 stance point、前後／鏡像及 SEQ 位移，不以逐格排列圖替代。官方 Runtime 採 0.75×0.9 世界縮放比例，全程一致。

只製作 Idle、Walk、Poke Mid 的 52 個不同 cells。官方 checker 的 `127 empty cells` 是未使用動畫區域的預期警告；驗證另確認本階段會用的 52 cells 全部有內容。部分 cells 在整張圖集上互相重疊／別名，因此 checker 的非空 cell 數並不等於繪製的 52 個來源 cells。正式報告：`docs/asset-check.json`。

Idle 依官方資料為每視角一個站姿；Walk 使用官方八步節奏，不移動角色在地面的位置；Poke Mid 使用官方刺擊時序與位移，完成回 Idle。八視角沿用官方四種 patterns 與鏡像，不宣稱八套完全獨立的原畫。

## 長槍與握點

長槍為新繪 64×7 透明 PNG，單一銀色槍尖，沒有刀刃、戟枝或現代槍械。24 個手部握點及關節由新繪圖程式記錄，全部位於不透明手部像素。載入時移除官方 a1.png 的 `hands`／`holds`，只套用本角色資料。

Idle／Walk／Poke Mid 統一在官方 `unit.update()` 後讀取 `unit.hand('last')`，用官方 `flattenOntoSprite` 及圖塊遮擋間距處理前後關係。握點無額外平移補償，槍尖傾角依新繪腕部姿勢定義，沒有沿用上游武器 slide／offset。背面武器置於身體之後，正面手掌繪於武器之上。

## 上游與授權

- https://github.com/internet-development/skill-create-tactics-threejs-sprite
- 官方展示：https://3d.internet.dev/
- 查核版本：`1622f2703f1a3f477f64721127d12a57916e715e`
- Kit：0.1.0，資料格式 2。
- Kit archive SHA-256：`d93ff4b6ea7e4e85cc47b3f46b6048325749cdad87f58a32e81580b4f25eeeff`
- 六個官方檔案（兩個 runtime、data、checker、template、NOTICE）已逐位元組比對一致。
- 保留 MIT License／NOTICE；不使用 vendor/、原作圖像、官方示範角色、網站模型與網站字型。

## 驗證範圍

- 官方 check-sheet 通過：256×488、13 色、無錯誤；127 個空 cells 是上述未使用區域。
- 自訂素材 QA 通過：52 個必要 cells 全部有像素，24 個新握點全部落在不透明像素。
- Playwright：三種動作的八視角、多個關鍵時點，握點與長槍世界座標誤差 <0.0001；未出現缺手部資料。
- Walk 身體與手臂圖塊會更換；刺槍按鈕播放 Poke Mid 後返回 Idle。
- 原生姿勢 PNG 測試：alpha 僅 0／255、透明 RGB=0、圖像外緣無截斷像素；站立 PNG 匯出可用。
- 手機觸控模擬：390×844、375×667、844×390、667×375，DPR 3；按鈕可點、無水平溢出、控制列與角色畫布不重疊。
- 一般網址無測試介面；HTML 與圖片直接載入，不觸發安裝／遊戲檔下載。
- Console/pageerror 檢查無應用程式錯誤。

## 已知限制與未驗證

- 僅上述三種動作，未完成其餘官方動畫，其按鈕不提供；不含任何戰鬥／敵人／地圖系統。
- 固定低解析度像素密度，斜向長槍有自然的像素階梯；近距離高倍率下可見像素，這是此美術方向。
- 動作資料是官方人形動作，盔甲與盔纓沒有另外加布料或物理動畫。
- iPhone Safari 真機、WebKit 執行及長時間實機 WebGL context 行為尚未驗證。手機控制與 PNG 儲存仍需真機確認。
- 圖集檢查通過只代表結構合格；畫風與歷史造型仍應由使用者審閱獨立 PNG。
