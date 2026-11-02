# 動畫驗收表

PASS 代表官方影格／SEQ 位移與順序一致、必要格位非空、瀏覽器可渲染。它不等於使用者已接受人物美術。

7 項 Playwright 測試通過；14×8 方向共 600 個影格樣本。手機觸控尺寸 390×844、375×667、844×390、667×375（Chromium 模擬，DPR 3）。真實 iPhone Safari 未驗證。

| 動作 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
|---|---|---|---|---|---|---|---|---|
| Idle | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| Walk | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| Walk Slow | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| Walk Fast | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| Rotate | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| Unarmed High | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| Unarmed Mid | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| Unarmed Low | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| Defend | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| Dodge Defend | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| Taking Damage | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| Critical | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| Dead | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| Revived | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |

Idle、Defend、Critical、Dead 是官方靜止／持續姿勢；Walk 等循環。三種徒手攻擊、Dodge Defend、Taking Damage、Revived 完成後返回 Idle。

圖集檢查通過：256×488、RGBA、非交錯、二值透明，83 個必要格位完整。警告：32 色（瀏覽器容許）、98 個未使用空格。

美術限制：40px Cell 內細節較上一版簡化；背面攻擊部分拳臂依官方疊放順序被頭／披風遮擋。請配合每動作的八方向逐格圖審閱。
