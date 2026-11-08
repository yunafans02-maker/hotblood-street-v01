# 江湖行（原型）

2D 像素風江湖遊戲，手機網頁版，橫屏遊玩。純 HTML5 Canvas + JavaScript，不需要安裝任何東西。

## 目前內容

- 兩張地圖：青石鎮、江畔渡口
- 浮動虛擬搖桿（左半邊螢幕）、「談」互動、「疾」快走
- 9 位 NPC 對話，1 個小任務（替錢掌櫃送酒）
- 地圖切換、淡入淡出、地名顯示
- 自動存檔（瀏覽器 localStorage）
- 美術全是程式生成的佔位圖，放入 PNG 即自動替換（見 `ASSETS.md`）

## 部署到 Vercel（第一次）

1. 到 GitHub 開一個新 repository（例如 `jianghu`），可以設成 Private。
2. 在 repository 頁面按 **Add file → Upload files**，把這個資料夾**裡面的全部內容**拖進去（`index.html` 要在最上層），按 **Commit changes**。
3. 到 [vercel.com](https://vercel.com) 用 GitHub 登入 → **Add New → Project** → 選 `jianghu` → **Deploy**。設定全部用預設，不用改。
4. 完成後會得到網址，例如 `jianghu-xxx.vercel.app`。

## 在 Android 上玩

1. 用 Chrome 開啟網址。
2. 右上角選單 → **加入主畫面**（或「安裝應用程式」）。
3. 之後從主畫面圖示開啟，會全螢幕橫屏。

## 之後更新

修改或新增檔案後，在 GitHub 上傳覆蓋即可。Vercel 會自動重新部署，約 30 秒後手機重新整理就是新版。
如果手機還是舊版，把 App 完全關掉再開。

## 檔案結構

```
index.html            頁面
style.css             介面樣式（對話框、按鈕）
manifest.webmanifest  加入主畫面用的設定
icons/                App 圖示
assets/               你的美術素材放這裡（規格見 ASSETS.md）
js/
  main.js             主程式：開始畫面、主迴圈、對話流程、換地圖
  config.js           手感參數：移動速度、畫面縮放、打字速度
  world.js            地圖、碰撞、NPC 行為、互動判定
  render.js           繪圖
  input.js            搖桿、按鈕、鍵盤
  ui.js               對話框、地名、狀態列
  save.js             存檔
  assets.js           素材載入（自動替換佔位圖）
  placeholder.js      佔位像素圖生成
  data/maps.js        地圖內容
  data/dialogs.js     對話與任務
  data/objects.js     物件碰撞範圍
  data/characters.js  佔位角色配色
```

## 在電腦上測試

ES module 不能直接雙擊開啟，要開一個本機伺服器：

```
cd 這個資料夾
python -m http.server 8000
```

然後用瀏覽器開 `http://localhost:8000`。鍵盤：方向鍵 / WASD 移動，空白鍵互動，Shift 快走。
