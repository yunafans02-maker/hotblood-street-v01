import art from './unarmed-art.json' with { type: 'json' };

// Keep every official SHP, SEQ, idle frame, timing, motion and draw-order entry.
// Grips/holds belonged to a1.png and do not apply to this unarmed sheet.
export function unarmedData(official) {
  return { ...official, sheet: { ...official.sheet, file: 'zhaoyun-sheet.png' }, hands: null, holds: null };
}
export const ACTIONS = [
  ['Idle','站立'], ['Walk','行走'], ['Walk Slow','慢速行走'], ['Walk Fast','快速行走'],
  ['Rotate','八方向轉身'], ['Unarmed High','向上出拳'], ['Unarmed Mid','向前出拳'],
  ['Unarmed Low','向下攻擊'], ['Defend','防禦'], ['Dodge Defend','閃避防禦'],
  ['Taking Damage','受傷'], ['Critical','重傷跪倒'], ['Dead','倒地'], ['Revived','恢復站立'],
];
export function playbackOptions(name) {
  if (name.startsWith('Unarmed ') || name === 'Dodge Defend' || name === 'Revived') return { then: 'Idle' };
  if (name === 'Taking Damage') return { then: 'Idle', duration: 0.8 };
  // Official held poses stay held for inspection; Replay/selection leaves them.
  return {};
}
export { art };
