// apps/web/src/game/hud.ts
// HTML overlay for in-game HUD information.
// Pure DOM — no PlayCanvas dependencies. All styles are inline.

export class HudOverlay {
  #container: HTMLDivElement;

  // Health
  #hpLabel: HTMLDivElement;
  #hpFill: HTMLDivElement;

  // Ammo
  #ammoEl: HTMLDivElement;

  // Score
  #scoreEl: HTMLDivElement;

  // Timer
  #timerEl: HTMLDivElement;

  // Hit marker
  #hitMarker: HTMLDivElement;
  #hitMarkerTimeout: ReturnType<typeof setTimeout> | null = null;

  // Kill banner
  #killBanner: HTMLDivElement;
  #killBannerTimeout: ReturnType<typeof setTimeout> | null = null;

  // Countdown
  #countdown: HTMLDivElement;
  #countdownTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(parentEl: HTMLElement) {
    const BASE_FONT = "'JetBrains Mono', monospace";
    const BASE_COLOR = '#f5f7ef';

    // Outer container
    const container = document.createElement('div');
    container.style.cssText =
      'position:absolute;inset:0;z-index:20;pointer-events:none;overflow:hidden;';

    // ── 1. Health bar (bottom-left) ────────────────────────────────────────────
    const hpWrapper = document.createElement('div');
    hpWrapper.style.cssText =
      `position:absolute;bottom:40px;left:40px;font-family:${BASE_FONT};color:${BASE_COLOR};`;

    const hpLabel = document.createElement('div');
    hpLabel.textContent = '100 HP';
    hpLabel.style.cssText =
      'font-size:12px;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:4px;';
    hpWrapper.appendChild(hpLabel);

    const hpOuter = document.createElement('div');
    hpOuter.style.cssText =
      'width:200px;height:8px;border:1px solid rgba(0,240,255,0.3);background:rgba(0,0,0,0.4);';

    const hpFill = document.createElement('div');
    hpFill.style.cssText =
      'width:100%;height:100%;background:#00f0ff;' +
      'transition:width 0.15s ease-out, background 0.15s ease-out;';
    hpOuter.appendChild(hpFill);
    hpWrapper.appendChild(hpOuter);
    container.appendChild(hpWrapper);

    // ── 2. Ammo (bottom-right) ─────────────────────────────────────────────────
    const ammoEl = document.createElement('div');
    ammoEl.style.cssText =
      `position:absolute;bottom:40px;right:40px;font-family:${BASE_FONT};` +
      `color:${BASE_COLOR};font-size:28px;text-align:right;`;
    ammoEl.textContent = '5';
    container.appendChild(ammoEl);

    // ── 3. Round score (top-center) ─────────────────────────────────────────────
    const scoreEl = document.createElement('div');
    scoreEl.style.cssText =
      `position:absolute;top:30px;left:50%;transform:translateX(-50%);` +
      `font-family:${BASE_FONT};color:${BASE_COLOR};font-size:22px;letter-spacing:6px;` +
      'white-space:nowrap;text-align:center;' +
      'text-shadow:0 0 8px rgba(0,0,0,0.8);';
    scoreEl.textContent = '0 — 0';
    container.appendChild(scoreEl);

    // ── 4. Timer (below round score) ────────────────────────────────────────────
    const timerEl = document.createElement('div');
    timerEl.style.cssText =
      `position:absolute;top:60px;left:50%;transform:translateX(-50%);` +
      `font-family:${BASE_FONT};color:${BASE_COLOR};font-size:14px;opacity:0.6;` +
      'white-space:nowrap;text-align:center;';
    timerEl.textContent = '0';
    container.appendChild(timerEl);

    // ── 5. Hit marker (center) ─────────────────────────────────────────────────
    const hitMarker = document.createElement('div');
    hitMarker.style.cssText =
      'position:absolute;top:50%;left:50%;width:24px;height:24px;' +
      'transform:translate(-50%,-50%);border:2px solid gold;opacity:0;' +
      'transition:opacity 0.05s ease-in;';
    container.appendChild(hitMarker);

    // ── 6. Kill banner (center, 40% from top) ──────────────────────────────────
    const killBanner = document.createElement('div');
    killBanner.style.cssText =
      `position:absolute;top:40%;left:50%;transform:translate(-50%,-50%);` +
      `font-family:${BASE_FONT};color:#ff3333;font-size:18px;font-weight:700;` +
      'text-transform:uppercase;letter-spacing:0.15em;opacity:0;' +
      'text-shadow:0 0 12px rgba(255,51,51,0.6);transition:opacity 0.1s ease-in;';
    killBanner.textContent = '';
    container.appendChild(killBanner);

    // ── 7. Countdown (dead center) ─────────────────────────────────────────────
    const countdown = document.createElement('div');
    countdown.style.cssText =
      `position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);` +
      `font-family:${BASE_FONT};color:#00f0ff;font-size:72px;font-weight:700;` +
      'opacity:0;transition:opacity 0.1s ease-in;' +
      'text-shadow:0 0 20px rgba(0,240,255,0.6);';
    countdown.textContent = '';
    container.appendChild(countdown);

    // Store refs
    this.#container = container;
    this.#hpLabel = hpLabel;
    this.#hpFill = hpFill;
    this.#ammoEl = ammoEl;
    this.#scoreEl = scoreEl;
    this.#timerEl = timerEl;
    this.#hitMarker = hitMarker;
    this.#killBanner = killBanner;
    this.#countdown = countdown;

    parentEl.appendChild(container);
  }

  // ── Public API ────────────────────────────────────────────────────────────

  setHealth(hp: number): void {
    const clamped = Math.max(0, Math.min(100, hp));
    this.#hpLabel.textContent = `${clamped} HP`;
    this.#hpFill.style.width = `${clamped}%`;

    let color: string;
    if (clamped > 55) {
      color = '#00f0ff'; // cyan
    } else if (clamped > 30) {
      color = '#ffd700'; // gold
    } else {
      color = '#ff3333'; // red
    }
    this.#hpFill.style.background = color;
  }

  setAmmo(current: number, reloading: boolean): void {
    if (reloading) {
      this.#ammoEl.textContent = 'RELOAD';
      this.#ammoEl.style.color = '#f5f7ef';
    } else if (current === 0) {
      this.#ammoEl.textContent = String(current);
      this.#ammoEl.style.color = '#ff3333';
    } else {
      this.#ammoEl.textContent = String(current);
      this.#ammoEl.style.color = '#f5f7ef';
    }
  }

  setRoundScore(playerScore: number, opponentScore: number): void {
    this.#scoreEl.textContent = `${playerScore} — ${opponentScore}`;
  }

  setTimer(ms: number): void {
    const seconds = Math.ceil(ms / 1000);
    this.#timerEl.textContent = String(seconds);
    if (seconds <= 10) {
      this.#timerEl.style.color = '#ff3333';
      this.#timerEl.style.opacity = '1';
    } else {
      this.#timerEl.style.color = '#f5f7ef';
      this.#timerEl.style.opacity = '0.6';
    }
  }

  showHitMarker(headshot: boolean): void {
    if (this.#hitMarkerTimeout !== null) {
      clearTimeout(this.#hitMarkerTimeout);
      this.#hitMarkerTimeout = null;
    }

    const borderColor = headshot ? '#ff3333' : '#ffd700';
    this.#hitMarker.style.borderColor = borderColor;
    this.#hitMarker.style.opacity = '1';

    this.#hitMarkerTimeout = setTimeout(() => {
      this.#hitMarker.style.opacity = '0';
      this.#hitMarkerTimeout = null;
    }, 200);
  }

  showKillBanner(headshot: boolean): void {
    if (this.#killBannerTimeout !== null) {
      clearTimeout(this.#killBannerTimeout);
      this.#killBannerTimeout = null;
    }

    this.#killBanner.textContent = headshot ? 'HEADSHOT KILL' : 'ELIMINATED';
    this.#killBanner.style.opacity = '1';

    this.#killBannerTimeout = setTimeout(() => {
      this.#killBanner.style.opacity = '0';
      this.#killBannerTimeout = null;
    }, 1500);
  }

  showCountdown(seconds: number): void {
    if (this.#countdownTimeout !== null) {
      clearTimeout(this.#countdownTimeout);
      this.#countdownTimeout = null;
    }

    this.#countdown.textContent = seconds === 0 ? 'FIGHT' : String(seconds);
    this.#countdown.style.opacity = '1';

    this.#countdownTimeout = setTimeout(() => {
      this.#countdown.style.opacity = '0';
      this.#countdownTimeout = null;
    }, 900);
  }

  destroy(): void {
    if (this.#hitMarkerTimeout !== null) {
      clearTimeout(this.#hitMarkerTimeout);
      this.#hitMarkerTimeout = null;
    }
    if (this.#killBannerTimeout !== null) {
      clearTimeout(this.#killBannerTimeout);
      this.#killBannerTimeout = null;
    }
    if (this.#countdownTimeout !== null) {
      clearTimeout(this.#countdownTimeout);
      this.#countdownTimeout = null;
    }
    this.#container.parentElement?.removeChild(this.#container);
  }
}
