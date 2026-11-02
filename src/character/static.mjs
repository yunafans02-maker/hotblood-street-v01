import art from "./static-art.json";

/** Static phase only. The original official sequences are retained but never exposed. */
export function staticData(official) {
  const data = structuredClone(official),
    start = data.frames.length;
  data.frames.push(...structuredClone(art.frames));
  data.idleFrames = art.frames.map((_, i) => start + i);
  data.hands = structuredClone(art.hands);
  data.holds = null;
  data.sheet.file = "zhaoyun-sheet.png";
  return data;
}
export { art };
