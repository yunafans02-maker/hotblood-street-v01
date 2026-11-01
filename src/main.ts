import Phaser from "phaser";
import "./style.css";
import { StreetScene } from "./scenes/StreetScene";
const game = new Phaser.Game({
  type: Phaser.CANVAS,
  parent: "game",
  width: 960,
  height: 540,
  backgroundColor: "#182a3b",
  pixelArt: true,
  roundPixels: true,
  antialias: false,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  input: { activePointers: 4, touch: { capture: true } },
  scene: [StreetScene],
  fps: { target: 60, forceSetTimeOut: false },
  disableContextMenu: true,
});

// Keep the loading page visible until the first successfully rendered game frame.
game.events.once(Phaser.Core.Events.POST_RENDER, () => {
  window.dispatchEvent(new Event("street-game-ready"));
});
