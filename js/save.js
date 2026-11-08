// 存檔：存在瀏覽器的 localStorage。清除瀏覽器資料或換手機就會消失。
import { SAVE_KEY } from './config.js';

export function saveGame(state) {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch { /* 無痕模式等情況可能失敗 */ }
}
export function loadGame() {
  try { return JSON.parse(localStorage.getItem(SAVE_KEY)); } catch { return null; }
}
export function clearSave() {
  try { localStorage.removeItem(SAVE_KEY); } catch { /* 忽略 */ }
}
