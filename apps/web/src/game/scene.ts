// apps/web/src/game/scene.ts
// PlayCanvas Application bootstrap for the Deadshot sniper duel.
// Builds a procedural urban warzone arena: 70 × 85 m playable rectangle
// flanked by ruined building walls, with wrecked-vehicle and sandbag cover
// scattered through the centre. Atmospheric warm sunset lighting + fog.

import * as pc from 'playcanvas';

export interface SceneContext {
  app: pc.Application;
  camera: pc.Entity;
  light: pc.Entity;
  ground: pc.Entity;
}

// ── Material factory helpers ────────────────────────────────────────────────

function makeMaterial(
  diffuse: [number, number, number],
  options: { metalness?: number; gloss?: number; emissive?: [number, number, number] } = {}
): pc.StandardMaterial {
  const mat = new pc.StandardMaterial();
  mat.diffuse = new pc.Color(diffuse[0], diffuse[1], diffuse[2]);
  if (options.metalness !== undefined) mat.metalness = options.metalness;
  if (options.gloss !== undefined) mat.gloss = options.gloss;
  if (options.emissive !== undefined) {
    mat.emissive = new pc.Color(options.emissive[0], options.emissive[1], options.emissive[2]);
  }
  mat.useMetalness = true;
  mat.update();
  return mat;
}

function addBox(
  app: pc.Application,
  name: string,
  pos: [number, number, number],
  scale: [number, number, number],
  material: pc.StandardMaterial,
  rotationY = 0
): pc.Entity {
  const ent = new pc.Entity(name);
  ent.addComponent('render', {
    type: 'box',
    material,
    castShadows: true,
    receiveShadows: true,
  });
  ent.setPosition(pos[0], pos[1], pos[2]);
  ent.setLocalScale(scale[0], scale[1], scale[2]);
  if (rotationY !== 0) ent.setLocalEulerAngles(0, rotationY, 0);
  app.root.addChild(ent);
  return ent;
}

// ── Arena bounds (must match ARENA_HALF_WIDTH / ARENA_MIN_Z / ARENA_MAX_Z) ──
const HALF_W = 35;
const MIN_Z = -10;
const MAX_Z = 75;

/**
 * Bootstrap a PlayCanvas Application on the given canvas element and build
 * the urban warzone arena. The geometry is procedural — no glTF / asset
 * download required, so the scene mounts immediately and works offline.
 */
export function createScene(canvas: HTMLCanvasElement): SceneContext {
  // ── Application ──────────────────────────────────────────────────────────
  const mouse = new pc.Mouse(canvas);
  const keyboard = new pc.Keyboard(window);

  const app = new pc.Application(canvas, { mouse, keyboard });

  app.setCanvasFillMode(pc.FILLMODE_FILL_WINDOW);
  app.setCanvasResolution(pc.RESOLUTION_AUTO);

  window.addEventListener('resize', () => {
    app.resizeCanvas();
  });

  // ── Atmosphere ────────────────────────────────────────────────────────────
  // Warm dusty ambient — golden-hour light reflecting off concrete and dust.
  app.scene.ambientLight = new pc.Color(0.18, 0.14, 0.10);

  // Distance fog gives the arena depth and hides the world edges.
  // PlayCanvas v2's Scene.fog is a getter-only that returns the existing
  // FogParams instance — mutate it in place instead of replacing.
  app.scene.fog.type = pc.FOG_EXP2;
  app.scene.fog.color.set(0.18, 0.14, 0.12);
  app.scene.fog.density = 0.012;

  // ── Sun directional light (warm, low angle, sunset) ───────────────────────
  const light = new pc.Entity('SunLight');
  light.addComponent('light', {
    type: 'directional',
    color: new pc.Color(1.0, 0.78, 0.55),
    intensity: 1.6,
    castShadows: true,
    shadowType: pc.SHADOW_PCF3,
    shadowDistance: 120,
    shadowResolution: 2048,
    normalOffsetBias: 0.05,
  });
  // Low sun angle from the side — creates long shadows
  light.setLocalEulerAngles(28, -42, 0);
  app.root.addChild(light);

  // Fill light from the opposite side — soft cool to balance the warm sun
  const fill = new pc.Entity('FillLight');
  fill.addComponent('light', {
    type: 'directional',
    color: new pc.Color(0.4, 0.5, 0.65),
    intensity: 0.4,
    castShadows: false,
  });
  fill.setLocalEulerAngles(60, 140, 0);
  app.root.addChild(fill);

  // ── Camera ────────────────────────────────────────────────────────────────
  const camera = new pc.Entity('Camera');
  camera.addComponent('camera', {
    fov: 60,
    nearClip: 0.1,
    farClip: 500,
    clearColor: new pc.Color(0.18, 0.14, 0.12), // matches fog colour
    // Cinematic ACES tone mapping for the warm urban look
    toneMapping: pc.TONEMAP_ACES,
    gammaCorrection: pc.GAMMA_SRGB,
  });
  camera.setPosition(0, 1.65, 0);
  camera.setLocalEulerAngles(0, 0, 0);
  app.root.addChild(camera);

  // ── Ground (large concrete plane with subtle grit colour) ─────────────────
  const groundMaterial = makeMaterial([0.22, 0.20, 0.18], { metalness: 0, gloss: 0.15 });
  const ground = new pc.Entity('Ground');
  ground.addComponent('render', {
    type: 'plane',
    material: groundMaterial,
    castShadows: false,
    receiveShadows: true,
  });
  ground.setLocalScale(220, 1, 220);
  ground.setPosition(0, 0, 32);
  app.root.addChild(ground);

  // ── Materials for arena pieces ────────────────────────────────────────────
  const concreteMat = makeMaterial([0.42, 0.40, 0.38], { metalness: 0, gloss: 0.10 });
  const darkConcreteMat = makeMaterial([0.28, 0.26, 0.24], { metalness: 0, gloss: 0.08 });
  const sandbagMat = makeMaterial([0.55, 0.45, 0.30], { metalness: 0, gloss: 0.05 });
  const rustMat = makeMaterial([0.30, 0.18, 0.12], { metalness: 0.7, gloss: 0.30 });
  const metalMat = makeMaterial([0.20, 0.20, 0.22], { metalness: 0.8, gloss: 0.45 });
  const woodMat = makeMaterial([0.30, 0.22, 0.15], { metalness: 0, gloss: 0.20 });

  // ── Perimeter buildings (north + south flanks) ────────────────────────────
  // Long blocked walls along the north (back) and south (front) edges
  // suggest "you're in a city street between two rows of bombed-out buildings."
  // Players can move freely within the rectangle.

  // South wall row (z ≈ MIN_Z - 4) — behind player 0's spawn
  for (let i = 0; i < 7; i++) {
    const x = -32 + i * 11;
    const h = 6 + (i % 3) * 1.5;
    addBox(app, `SouthBuilding_${i}`, [x, h / 2, MIN_Z - 4], [9, h, 6], concreteMat);
    // Window cutouts: smaller dark boxes set into the wall face
    if (h > 6) {
      addBox(app, `SouthWindow_${i}`, [x, 4, MIN_Z - 1], [2.4, 1.6, 0.2], darkConcreteMat);
    }
  }

  // North wall row (z ≈ MAX_Z + 4) — behind player 1's spawn
  for (let i = 0; i < 7; i++) {
    const x = -32 + i * 11;
    const h = 5 + ((i + 1) % 3) * 1.7;
    addBox(app, `NorthBuilding_${i}`, [x, h / 2, MAX_Z + 4], [9, h, 6], concreteMat);
    if (h > 5) {
      addBox(app, `NorthWindow_${i}`, [x, 3.5, MAX_Z + 1], [2.4, 1.6, 0.2], darkConcreteMat);
    }
  }

  // East flank wall (x ≈ HALF_W + 2) — long broken wall
  for (let i = 0; i < 6; i++) {
    const z = MIN_Z + 5 + i * 14;
    const h = 4 + (i % 2) * 2;
    addBox(app, `EastWall_${i}`, [HALF_W + 2, h / 2, z], [3, h, 12], darkConcreteMat);
  }

  // West flank wall (x ≈ -HALF_W - 2)
  for (let i = 0; i < 6; i++) {
    const z = MIN_Z + 5 + i * 14;
    const h = 4 + ((i + 1) % 2) * 2;
    addBox(app, `WestWall_${i}`, [-HALF_W - 2, h / 2, z], [3, h, 12], darkConcreteMat);
  }

  // ── Cover layout in the playable area ────────────────────────────────────
  // A mix of: concrete barriers, sandbag emplacements, wrecked cars, crates,
  // and broken walls. Symmetrical-ish so neither spawn has a major advantage.

  // Centre concrete divider walls
  addBox(app, 'CentreWall_A', [0, 1.3, 32], [10, 2.6, 0.6], concreteMat);
  addBox(app, 'CentreWall_B', [-15, 1.0, 38], [4, 2.0, 0.6], concreteMat, 30);
  addBox(app, 'CentreWall_C', [15, 1.0, 26], [4, 2.0, 0.6], concreteMat, -30);

  // Sandbag emplacements (squat low cover)
  addBox(app, 'Sandbag_A', [-8, 0.5, 14], [2.8, 1.0, 1.2], sandbagMat);
  addBox(app, 'Sandbag_B', [8, 0.5, 14], [2.8, 1.0, 1.2], sandbagMat);
  addBox(app, 'Sandbag_C', [-8, 0.5, 50], [2.8, 1.0, 1.2], sandbagMat);
  addBox(app, 'Sandbag_D', [8, 0.5, 50], [2.8, 1.0, 1.2], sandbagMat);
  addBox(app, 'Sandbag_E', [0, 0.4, 8], [3.2, 0.8, 1.0], sandbagMat);
  addBox(app, 'Sandbag_F', [0, 0.4, 56], [3.2, 0.8, 1.0], sandbagMat);

  // Wrecked vehicles — chassis + cabin shapes
  // South wreck
  addBox(app, 'CarBody_S', [-22, 0.6, 18], [4.5, 1.2, 1.8], rustMat);
  addBox(app, 'CarCab_S', [-22, 1.6, 18], [2.5, 0.8, 1.8], rustMat);
  // North wreck
  addBox(app, 'CarBody_N', [22, 0.6, 46], [4.5, 1.2, 1.8], rustMat, 15);
  addBox(app, 'CarCab_N', [22, 1.6, 46], [2.5, 0.8, 1.8], rustMat, 15);
  // Centre wreck (truck — bigger)
  addBox(app, 'TruckBed_C', [-20, 0.9, 32], [6, 1.8, 2.4], rustMat);
  addBox(app, 'TruckCab_C', [-15, 1.6, 32], [3, 2.2, 2.4], rustMat);

  // Wooden crates scattered around
  const cratePositions: Array<[number, number, number]> = [
    [-4, 0.5, 22],
    [4, 0.5, 22],
    [-4, 0.5, 42],
    [4, 0.5, 42],
    [-26, 0.5, 32],
    [26, 0.5, 32],
    [12, 0.5, 8],
    [-12, 0.5, 56],
  ];
  for (let i = 0; i < cratePositions.length; i++) {
    const p = cratePositions[i]!;
    addBox(app, `Crate_${i}`, p, [1.2, 1.0, 1.2], woodMat);
  }

  // Metal containers (taller cover)
  addBox(app, 'Container_A', [-30, 1.3, 24], [2.4, 2.6, 5.5], metalMat);
  addBox(app, 'Container_B', [30, 1.3, 40], [2.4, 2.6, 5.5], metalMat);

  // Debris piles — small angular blocks at chaotic positions
  const debrisPositions: Array<[number, number, number, number]> = [
    [-5, 0.3, 12, 25],
    [5, 0.3, 12, -25],
    [-5, 0.3, 52, -25],
    [5, 0.3, 52, 25],
    [-18, 0.3, 32, 10],
    [18, 0.3, 32, -10],
  ];
  for (let i = 0; i < debrisPositions.length; i++) {
    const [x, y, z, rot] = debrisPositions[i]!;
    addBox(app, `Debris_${i}`, [x, y, z], [1.6, 0.6, 1.0], darkConcreteMat, rot);
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
