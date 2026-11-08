// 角色配色（只用於佔位圖）。換成 assets/chars/<名稱>.png 後，這裡的顏色就不再使用。
const base = {
  skin: '#d8a77f', skinS: '#b58260', hair: '#1d1917',
  pants: '#2b2622', shoe: '#171412', belt: '#2a2220', trim: '#d8cfb2',
  hat: 'none', hatC: '#2a2622', hatS: '#1a1716', hatH: '#3a3530',
};
const tan = { skin: '#c48f66', skinS: '#9f6f4d' };

export const CHARS = {
  hero:        { ...base, robe: '#46596b', robeS: '#34434f', robeH: '#566b7e', trim: '#c9bfa8', belt: '#1f1b19',
                 hat: 'douli', hatC: '#b49359', hatS: '#7d6439', hatH: '#ccad6e' },
  innkeeper:   { ...base, robe: '#6b4a32', robeS: '#523726', robeH: '#7c5a40', hat: 'cap' },
  storyteller: { ...base, robe: '#5b5a52', robeS: '#46453f', robeH: '#6b6a61', hat: 'scholar', hatC: '#2b2b30', hatS: '#1b1b1f', hatH: '#3b3b42' },
  herbalist:   { ...base, robe: '#3f5a45', robeS: '#2f4535', robeH: '#4d6b54', hat: 'bun' },
  smith:       { ...base, ...tan, robe: '#3a3633', robeS: '#2a2725', robeH: '#4a4541', hat: 'band', hatC: '#8c2f25' },
  child:       { ...base, robe: '#8c3a2e', robeS: '#6b2b22', robeH: '#a3493b', trim: '#e0c27a', hat: 'bun' },
  guard:       { ...base, robe: '#5e2a26', robeS: '#45201c', robeH: '#733631', hat: 'cap', hatC: '#1d1b1a' },
  granny:      { ...base, robe: '#5a4a5e', robeS: '#463a4a', robeH: '#6b5a70', hair: '#9a958c', hat: 'bun' },
  boatman:     { ...base, ...tan, robe: '#4a5a52', robeS: '#38453f', robeH: '#5a6b62',
                 hat: 'douli', hatC: '#8f7a4f', hatS: '#62532f', hatH: '#a89064' },
  fisher:      { ...base, ...tan, robe: '#6a6352', robeS: '#524c3e', robeH: '#7a7362',
                 hat: 'douli', hatC: '#9a8456', hatS: '#6b5a36', hatH: '#b09a6a' },
  goose:       { kind: 'goose' },
};
