// apps/web/src/game/scene.ts
// PlayCanvas Application bootstrap for the Deadshot sniper duel game.
// Provides createScene / destroyScene — no React dependency.

import * as pc from 'playcanvas';

export interface SceneContext {
  app: pc.Application;
  camera: pc.Entity;
  light: pc.Entity;
  ground: pc.Entity;
}

/**
 * Bootstrap a PlayCanvas Application on the given canvas element.
 *
 * Scene composition:
 *  - Near-black clear colour (#010102)
 *  - Cool-toned directional light with PCF3 shadows
 *  - Camera at standing eye height (1.65 m), 60° vertical FOV
 *  - Dark ground plane (100 × 100 units)
 *  - 5-piece cover geometry (low-profile boxes arranged around the arena centre)
 */
export function createScene(canvas: HTMLCanvasElement): SceneContext {
  // ── Application ──────────────────────────────────────────────────────────
  const mouse = new pc.Mouse(canvas);
  const keyboard = new pc.Keyboard(window);

  const app = new pc.Application(canvas, { mouse, keyboard });

  app.setCanvasFillMode(pc.FILLMODE_FILL_WINDOW);
  app.setCanvasResolution(pc.RESOLUTION_AUTO);

  // Resize when the browser window changes size.
  window.addEventListener('resize', () => {
    app.resizeCanvas();
  });

  // ── Scene clear colour ────────────────────────────────────────────────────
  // #010102 — near-black with a very faint cool tint.
  app.scene.ambientLight = new pc.Color(0.05, 0.05, 0.08);

  // ── Directional light ─────────────────────────────────────────────────────
  const light = new pc.Entity('DirectionalLight');
  light.addComponent('light', {
    type: 'directional',
    // Cool-toned white (slight blue shift)
    color: new pc.Color(0.85, 0.90, 1.0),
    intensity: 1.2,
    castShadows: true,
    shadowType: pc.SHADOW_PCF3,
    shadowDistance: 80,
    shadowResolution: 1024,
    normalOffsetBias: 0.05,
  });
  // Angle the light from slightly above and to the right.
  light.setLocalEulerAngles(45, -30, 0);
  app.root.addChild(light);

  // ── Camera ────────────────────────────────────────────────────────────────
  const camera = new pc.Entity('Camera');
  camera.addComponent('camera', {
    fov: 60,
    nearClip: 0.1,
    farClip: 1000,
    clearColor: new pc.Color(
      // #010102 expressed as linear floats
      1 / 255,
      1 / 255,
      2 / 255,
    ),
  });
  // Standing eye height: 1.65 m above ground.
  camera.setPosition(0, 1.65, 5);
  camera.setLocalEulerAngles(0, 180, 0); // face inward toward the arena centre
  app.root.addChild(camera);

  // ── Ground plane ──────────────────────────────────────────────────────────
  const groundMaterial = new pc.StandardMaterial();
  // Very dark grey — just enough to distinguish from absolute black sky.
  groundMaterial.diffuse = new pc.Color(0.04, 0.04, 0.05);
  groundMaterial.update();

  const ground = new pc.Entity('Ground');
  ground.addComponent('render', {
    type: 'plane',
    material: groundMaterial,
  });
  ground.setLocalScale(100, 1, 100);
  ground.setPosition(0, 0, 0);
  app.root.addChild(ground);

  // ── Cover geometry ────────────────────────────────────────────────────────
  // Five low-profile boxes arranged to create cover opportunities.
  // All use a slightly lighter material so they read against the ground.
  const coverMaterial = new pc.StandardMaterial();
  coverMaterial.diffuse = new pc.Color(0.08, 0.08, 0.10);
  coverMaterial.update();

  const coverDefs: Array<{
    name: string;
    pos: [number, number, number];
    scale: [number, number, number];
  }> = [
    // Left flank wall
    { name: 'Cover_LeftWall', pos: [-8, 0.5, 0], scale: [1, 1, 6] },
    // Right flank wall
    { name: 'Cover_RightWall', pos: [8, 0.5, 0], scale: [1, 1, 6] },
    // Centre low barricade
    { name: 'Cover_CentreBarricade', pos: [0, 0.4, -4], scale: [4, 0.8, 0.5] },
    // Left near crate
    { name: 'Cover_LeftCrate', pos: [-3, 0.5, 2], scale: [1.2, 1, 1.2] },
    // Right near crate
    { name: 'Cover_RightCrate', pos: [3, 0.5, 2], scale: [1.2, 1, 1.2] },
  ];

  for (const def of coverDefs) {
    const cover = new pc.Entity(def.name);
    cover.addComponent('render', {
      type: 'box',
      material: coverMaterial,
      castShadows: true,
      receiveShadows: true,
    });
    cover.setPosition(def.pos[0], def.pos[1], def.pos[2]);
    cover.setLocalScale(def.scale[0], def.scale[1], def.scale[2]);
    app.root.addChild(cover);
  }

  app.start();

  // Ensure the canvas fills its container without gaps or scrollbars.
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.display = 'block';

  return { app, camera, light, ground };
}

/**
 * Cleanly tear down a PlayCanvas Application and release GPU resources.
 */
export function destroyScene(ctx: SceneContext): void {
  ctx.app.destroy();
}
