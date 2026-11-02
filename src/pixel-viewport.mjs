/** Full device-resolution drawing; no low-resolution buffer stretched by CSS. */
export function resizePixelViewport(renderer, camera, canvas, viewport, zoom, exactCssScale = null) {
  const rect = viewport.getBoundingClientRect();
  const w = Math.max(1, rect.width), h = Math.max(1, rect.height);
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  const fit = Math.max(1, Math.floor(Math.min(w / 72, h / 64)));
  const cssScale = exactCssScale ?? Math.min(fit, Math.max(2, Math.floor(Math.min(w / 84, h / 74) * zoom)));
  const texelPixels = Math.max(1, Math.round(cssScale * dpr));
  renderer.setPixelRatio(dpr);
  renderer.setSize(w, h, false);
  const bw = canvas.width, bh = canvas.height;
  // Three rounds viewports but floors buffers: reconcile fractional DPR explicitly.
  renderer.setViewport(0, 0, bw / dpr, bh / dpr);
  // CSS extent and origin correspond exactly to the physical framebuffer grid.
  canvas.style.width = `${bw / dpr}px`;
  canvas.style.height = `${bh / dpr}px`;
  canvas.style.left = `${Math.round(rect.left * dpr) / dpr - rect.left}px`;
  canvas.style.top = `${Math.round(rect.top * dpr) / dpr - rect.top}px`;
  // Put the stance on an integer pixel boundary, including odd buffer dimensions.
  camera.left = -Math.floor(bw / 2) / texelPixels;
  camera.right = (bw - Math.floor(bw / 2)) / texelPixels;
  camera.top = Math.floor(bh / 2) / texelPixels;
  camera.bottom = -(bh - Math.floor(bh / 2)) / texelPixels;
  camera.updateProjectionMatrix();
  return { dpr, texelPixels, cssScale: texelPixels / dpr, buffer: [bw, bh] };
}
