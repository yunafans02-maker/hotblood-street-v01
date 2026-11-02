# 第一階段：角色還原審核紀錄

## 已完成

- 實際載入本輪 A／B 附件，保存原始 JPEG 及影像編輯版本；未取用上一版角色或 a1.png。
- A 保留深棕髮、金額飾、高馬尾及大型白髮束、藍髮帶、白銀甲與金邊、藍圍巾披風、簡單像素眼睛及金靴邊。B 保留銀頭、金件、棕桿、藍纓及金尾。
- 四個已知視角依 A 整理，其餘四個方向另行補充；不使用全身左右鏡像替代非對稱髮束與披風。
- 256×488 TYPE1 圖集、41 個必要非空 cells、8 個分層靜態組裝；每個不超過 6 tiles。
- 官方 Runtime 讀取新增的靜態組裝，官方原始 frame／sequence 檔案未改寫。圖塊各自存放在官方 cells；非四張普通縮圖排列。
- 重新測量 8 個靜態手掌握點，長槍獨立載入，手掌／身體依原生圖塊遮擋；武器可開關。
- 純白無陰影的手機頁、八視角、縮放、透明 PNG 匯出、四視圖對照與檢查報告。

## 檢查

- 官方 check-sheet：無 errors。158 個未使用空 cells、63 色提出 warnings；本階段實際會讀取的 41 cells 全部有內容，與原遊戲色數限制分開標示。
- 角色及武器 alpha 僅 0／255，透明 RGB=0；分塊重新組裝後與本輪原生角色逐像素相同。
- 各視角長槍掛載位置與 Runtime 新握點一致，測試世界座標誤差 <0.0001。
- PNG 匯出有／無武器均無邊界裁切或半透明像素；頁面只有一個角色 group，沒有地面、shadow map 或地面陰影物件。
- 手機模擬 390×844、375×667、844×390、667×375（DPR 3）：觸控可用，按鈕不遮畫布，沒有水平溢出。
- 一般網址只提供網頁；`/?test` 才掛載測試介面。

## 尚未驗收／未製作

- 使用者尚未確認美術還原程度。對照圖供審閱，不將技術測試通過當成造型通過。
- 另外四個視角是依 A 推導的補充圖；髮束、披風及左右側細節需特別確認。
- 角色已規格化到約 56 px 原生高度；小於參考展示圖的顯示尺寸，細節經像素取捨，沒有宣稱與放大參考逐像素相等。
- B 的收到副本是 JPEG 且白底，透明 PNG 為本輪整理結果，不宣稱保留了不存在的原始 Alpha。
- Walk、Poke Mid 及其他動態影格一律未製作、UI 不提供。
- iPhone Safari 真機、實機 WebGL 與 PNG 儲存流程尚未驗證；仍需使用者在手機確認。

## 版本與安全

在 `rebuild/zhaoyun-reference-static` 分支工作；main／舊版線上頁保持不變。備份為 `backup-before-zhaoyun-reference-rebuild-20261102`，保存原 Commit `6040630a577b2cc78de1e02bae6f8958da5a116c`。不修改其他 Repository，不合併 main，待美術確認才進入後續階段。

## 本輪實際交付驗證

- Vercel Preview 已回報 Ready：https://hotblood-street-v01-git-rebuild-zhaoyun-fa89a5-yunafans02-maker.vercel.app
- 未登入的外部訪問重導至 Vercel Login，沒有把登入頁 HTTP 200 誤報為角色頁通過。線上已登入後的功能仍需使用者在 iPhone 審閱；未關閉帳戶保護。
- 本機正式產物五項 Playwright 測試全部通過，npm ci／官方 checker／素材 QA／Build 通過。
- 從 GitHub 審稿分支乾淨取回的 46 檔逐份 SHA-256 比對一致；乾淨安裝與 Build 再次成功。
- Draft PR：https://github.com/yunafans02-maker/hotblood-street-v01/pull/1 。不合併 main；使用者確認前不開始動畫。
