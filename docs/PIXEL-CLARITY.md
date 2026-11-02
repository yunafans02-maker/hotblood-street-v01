# 趙雲像素清晰度修復

範圍只限畫面清晰度。基準 Commit：62d06dbef17f81f1492e2e0834e86037015c02b0。所有現有角色 PNG、動作來源、SHP／SEQ 和官方 Runtime 原檔完全保留。

## 診斷

- 當前 sheet 256×488、32 個不透明色，alpha 只有 0/255，透明像素 RGB 全 0。PNG 無損，生成程式只用 `Image.Resampling.NEAREST`，沒有 bilinear、bicubic 或 blur。
- 原始高解析草圖有繪製色階、取樣與色盤簡化，細節已存在於素材。本輪不修改素材；顯示修復不會增加原本不存在的眼睛或盔甲細節。
- 官方 `prepareSheet` 已正確設定實際載入 Texture 的 min/mag 為 Nearest、generateMipmaps=false、needsUpdate=true。此專案的 Atlas 是 cell/SEQ 資料，不是第二張動態 Texture；六個可見 Mesh 使用同一張已 prepare 的 sheet。
- Renderer 已 antialias=false，沒有 FXAA/SMAA/TAA、後處理、CSS blur 或 transform。2D 匯出亦關閉 imageSmoothingEnabled。
- 主要問題：先將 Canvas 內部尺寸縮小到每素材像素約 1 framebuffer pixel，再以 CSS 撐滿容器。例如手機 CSS 366×362.90625、DPR3，舊 framebuffer 92×91，實際拉伸比例不是整數。Nearest 避免混色，卻仍會產生寬窄不一的像素階梯。

## 修復

`src/pixel-viewport.mjs` 使用實際 devicePixelRatio 分配完整解析度 Canvas；正交 frustum 讓每個素材像素對應整數實體像素。CSS 尺寸對應 buffer/DPR，並對齊 Canvas 起點。奇數 buffer 寬高亦將角色站立原點放在整數邊界。非整數 DPR 下，Three 的 viewport 四捨五入與 buffer 向下取整原先可能相差 1 pixel，現在顯式對齊實際 framebuffer。

沒有改 Renderer 類型、加入 render target、旋轉或縮放角色部位，也沒有新增逐幀 pixel snapping。官方位移和動畫照常播放，避免改變步行節奏。一般縮放按鈕仍保留原有操作。

## 相同比較

`public/clarity/` 保存 Before / After 與量測 JSON。皆為 390×844、DPR3、Idle、視角2、100% 設定；標稱每來源像素 4 CSS px。截圖以相同座標裁切，不重取樣、不銳化。原版本實際 CSS 倍率略低於4，是本次修正的成因。

| 項目 | Before | After |
|---|---|---|
| framebuffer | 92×91 | 1098×1088 |
| 角色區域可見顏色 | 30 | 30 |
| 水平色塊非12整數倍 | 563 / 5475 | 0 / 5505 |
| 圖集 SHA256 | 27b5b8456c2b2702d43214a0636051f6ae74901be9764f0f7552525a57309871 | 相同 |

PNG 白髮／銀甲的不透明亮色是原圖內容；沒有移除或改色。透明邊界沒有白色底或半透明白邊。瀏覽器實際 framebuffer 的色彩檢查沒有發現原色盤以外的混色。

## 驗證

9 項 Playwright 測試：原有7項動畫／手機操作回歸，加上素材雜湊檢查及 1×–4× 清晰度檢查（DPR1/2/3/2.625；Idle、Walk、Rotate）。Full-DPI 後，邊界檢查只讀 framebuffer 四邊，避免不必要地反覆讀取整張高解析畫布；沒有減少原本600個動畫樣本。

真實 iPhone Safari 未驗證。Vercel Preview 仍沿用擁有者登入保護。
