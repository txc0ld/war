// apps/web/src/game/scope.ts
// HTML/CSS scope overlay rendered on top of the PlayCanvas canvas.
// Pure DOM — no PlayCanvas dependencies.

export class ScopeOverlay {
  #container: HTMLDivElement;
  #reticleImg: HTMLImageElement;

  constructor(parentEl: HTMLElement) {
    // Outer container
    const container = document.createElement('div');
    container.style.cssText =
      'position:absolute;inset:0;z-index:10;pointer-events:none;display:none;overflow:hidden;';

    // 1. Vignette
    const vignette = document.createElement('div');
    vignette.style.cssText =
      'position:absolute;inset:0;' +
      'background:radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.7) 60%, rgba(0,0,0,0.95) 80%);';
    container.appendChild(vignette);

    // 2. Horizontal crosshair
    const hLine = document.createElement('div');
    hLine.style.cssText =
      'position:absolute;top:50%;left:0;right:0;height:1px;' +
      'background:rgba(0,240,255,0.4);transform:translateY(-50%);';
    container.appendChild(hLine);

    // 3. Vertical crosshair
    const vLine = document.createElement('div');
    vLine.style.cssText =
      'position:absolute;left:50%;top:0;bottom:0;width:1px;' +
      'background:rgba(0,240,255,0.4);transform:translateX(-50%);';
    container.appendChild(vLine);

    // 4. Reticle image
    const img = document.createElement('img');
    img.width = 256;
    img.height = 256;
    img.style.cssText =
      'position:absolute;top:50%;left:50%;width:256px;height:256px;' +
      'transform:translate(-50%,-50%);opacity:0.8;';
    container.appendChild(img);

    this.#container = container;
    this.#reticleImg = img;
    parentEl.appendChild(container);
  }

  setReticleImage(url: string): void {
    this.#reticleImg.src = url;
  }

  show(): void {
    this.#container.style.display = 'block';
  }

  hide(): void {
    this.#container.style.display = 'none';
  }

  isVisible(): boolean {
    return this.#container.style.display !== 'none';
  }

  destroy(): void {
    this.#container.parentElement?.removeChild(this.#container);
  }
}
