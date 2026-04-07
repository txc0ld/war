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

interface ArenaMaterialMap {
  ground: pc.StandardMaterial;
  concrete: pc.StandardMaterial;
  brick: pc.StandardMaterial;
  darkConcrete: pc.StandardMaterial;
  metal: pc.StandardMaterial;
  wood: pc.StandardMaterial;
  rust: pc.StandardMaterial;
  sandbag: pc.StandardMaterial;
}

const ASSET_BASE = '/assets/s2/arena';

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
  // Cool grey-blue ambient so the warm sun creates real contrast against
  // shadowed surfaces (the previous all-warm palette made everything blend
  // into one orange smudge).
  app.scene.ambientLight = new pc.Color(0.20, 0.22, 0.28);

  // Distance fog kept thin so the perimeter buildings stay visible.
  app.scene.fog.type = pc.FOG_EXP2;
  app.scene.fog.color.set(0.55, 0.58, 0.62);
  app.scene.fog.density = 0.0035;

  // ── Sun directional light (high noon, neutral white) ─────────────────────
  const light = new pc.Entity('SunLight');
  light.addComponent('light', {
    type: 'directional',
    color: new pc.Color(1.0, 0.96, 0.88),
    intensity: 2.4,
    castShadows: true,
    shadowType: pc.SHADOW_PCF3,
    shadowDistance: 140,
    shadowResolution: 2048,
    normalOffsetBias: 0.05,
  });
  // High sun angle for clear definition without crushing shadows
  light.setLocalEulerAngles(55, -30, 0);
  app.root.addChild(light);

  // Cool fill light from the opposite side
  const fill = new pc.Entity('FillLight');
  fill.addComponent('light', {
    type: 'directional',
    color: new pc.Color(0.55, 0.62, 0.78),
    intensity: 0.7,
    castShadows: false,
  });
  fill.setLocalEulerAngles(40, 150, 0);
  app.root.addChild(fill);

  // ── Camera ────────────────────────────────────────────────────────────────
  const camera = new pc.Entity('Camera');
  camera.addComponent('camera', {
    fov: 70,
    nearClip: 0.1,
    farClip: 500,
    // Pale grey-blue sky — matches fog so distant geometry blends naturally
    clearColor: new pc.Color(0.62, 0.66, 0.72),
    toneMapping: pc.TONEMAP_ACES,
    gammaCorrection: pc.GAMMA_SRGB,
  });
  // Start the camera near the centre of the arena (Z midpoint = 32) facing
  // toward the north flank so the urban scene is immediately in view.
  camera.setPosition(0, 1.65, 32);
  camera.setLocalEulerAngles(0, 0, 0);
  app.root.addChild(camera);

  // ── Ground (large dark asphalt plane) ─────────────────────────────────────
  const groundMaterial = makeMaterial([0.18, 0.19, 0.21], { metalness: 0, gloss: 0.12 });
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

  // ── Materials with more colour variety so adjacent surfaces don't blend ──
  // These start as solid colours; loadArenaAssets() will mutate them in place
  // with PBR textures (diffuse + normal + roughness) once the assets stream in.
  const concreteMat = makeMaterial([0.62, 0.62, 0.60], { metalness: 0, gloss: 0.10 });
  const darkConcreteMat = makeMaterial([0.38, 0.40, 0.42], { metalness: 0, gloss: 0.08 });
  const brickMat = makeMaterial([0.52, 0.30, 0.22], { metalness: 0, gloss: 0.06 });
  const sandbagMat = makeMaterial([0.65, 0.55, 0.35], { metalness: 0, gloss: 0.05 });
  const rustMat = makeMaterial([0.42, 0.18, 0.08], { metalness: 0.7, gloss: 0.30 });
  const metalMat = makeMaterial([0.22, 0.24, 0.28], { metalness: 0.85, gloss: 0.55 });
  const woodMat = makeMaterial([0.42, 0.28, 0.15], { metalness: 0, gloss: 0.18 });

  // Re-tile the ground material with bigger UVs so the asphalt texture
  // doesn't stretch across the whole 220 m plane when it loads.
  groundMaterial.diffuseMapTiling = new pc.Vec2(80, 80);
  groundMaterial.normalMapTiling = new pc.Vec2(80, 80);
  groundMaterial.glossMapTiling = new pc.Vec2(80, 80);

  const arenaMaterials: ArenaMaterialMap = {
    ground: groundMaterial,
    concrete: concreteMat,
    brick: brickMat,
    darkConcrete: darkConcreteMat,
    metal: metalMat,
    wood: woodMat,
    rust: rustMat,
    sandbag: sandbagMat,
  };

  // ── Perimeter buildings (north + south flanks) ────────────────────────────
  // Long blocked walls along the north (back) and south (front) edges
  // suggest "you're in a city street between two rows of bombed-out buildings."
  // Players can move freely within the rectangle.

  // South wall row (z ≈ MIN_Z - 4) — behind player 0's spawn
  for (let i = 0; i < 7; i++) {
    const x = -32 + i * 11;
    const h = 6 + (i % 3) * 1.8;
    // Alternate brick / concrete so adjacent buildings don't blend
    const mat = i % 2 === 0 ? concreteMat : brickMat;
    addBox(app, `SouthBuilding_${i}`, [x, h / 2, MIN_Z - 4], [9, h, 6], mat);
    // Dark window slabs set into the front face
    addBox(app, `SouthWin_A_${i}`, [x - 2.5, 3, MIN_Z - 0.95], [1.6, 1.4, 0.2], darkConcreteMat);
    addBox(app, `SouthWin_B_${i}`, [x + 2.5, 3, MIN_Z - 0.95], [1.6, 1.4, 0.2], darkConcreteMat);
    if (h > 7) {
      addBox(app, `SouthWin_C_${i}`, [x, 5.5, MIN_Z - 0.95], [2.0, 1.4, 0.2], darkConcreteMat);
    }
  }

  // North wall row (z ≈ MAX_Z + 4) — behind player 1's spawn
  for (let i = 0; i < 7; i++) {
    const x = -32 + i * 11;
    const h = 5 + ((i + 1) % 3) * 1.8;
    const mat = i % 2 === 0 ? brickMat : concreteMat;
    addBox(app, `NorthBuilding_${i}`, [x, h / 2, MAX_Z + 4], [9, h, 6], mat);
    addBox(app, `NorthWin_A_${i}`, [x - 2.5, 3, MAX_Z + 0.95], [1.6, 1.4, 0.2], darkConcreteMat);
    addBox(app, `NorthWin_B_${i}`, [x + 2.5, 3, MAX_Z + 0.95], [1.6, 1.4, 0.2], darkConcreteMat);
    if (h > 6) {
      addBox(app, `NorthWin_C_${i}`, [x, 5.5, MAX_Z + 0.95], [2.0, 1.4, 0.2], darkConcreteMat);
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

  // Kick off async asset loading. The scene renders immediately with
  // placeholder solid colours, then upgrades to PBR + HDRI when the assets
  // arrive. Failures are logged but don't crash — geometry stays visible.
  loadArenaAssets(app, arenaMaterials).catch((err: unknown) => {
    // eslint-disable-next-line no-console
    console.warn('[scene] arena asset loading failed:', err);
  });

  return { app, camera, light, ground };
}

// ── Async asset loader ──────────────────────────────────────────────────────
//
// Polyhaven CC0 PBR textures + HDRI sky. Files live in
// `apps/web/public/assets/s2/arena/`. We load via PlayCanvas's asset registry,
// then mutate the existing scene materials in place so geometry that is
// already on screen smoothly upgrades to textured surfaces.

interface PbrTextureSet {
  diff: pc.Texture;
  normal: pc.Texture;
  rough: pc.Texture;
}

function loadTexture(app: pc.Application, url: string): Promise<pc.Texture> {
  return new Promise((resolve, reject) => {
    app.assets.loadFromUrl(url, 'texture', (err, asset) => {
      if (err !== null || asset === undefined) {
        reject(new Error(`Failed to load texture ${url}: ${err ?? 'unknown'}`));
        return;
      }
      resolve(asset.resource as pc.Texture);
    });
  });
}

async function loadPbrSet(
  app: pc.Application,
  slug: string
): Promise<PbrTextureSet> {
  const [diff, normal, rough] = await Promise.all([
    loadTexture(app, `${ASSET_BASE}/${slug}_diff.jpg`),
    loadTexture(app, `${ASSET_BASE}/${slug}_nor_gl.jpg`),
    loadTexture(app, `${ASSET_BASE}/${slug}_rough.jpg`),
  ]);
  return { diff, normal, rough };
}

function applyPbrSet(
  mat: pc.StandardMaterial,
  set: PbrTextureSet,
  tilingX: number,
  tilingY: number
): void {
  const tile = new pc.Vec2(tilingX, tilingY);
  mat.diffuseMap = set.diff;
  mat.diffuseMapTiling = tile;
  mat.normalMap = set.normal;
  mat.normalMapTiling = tile;
  mat.glossMap = set.rough;
  mat.glossMapTiling = tile;
  mat.glossMapChannel = 'r';
  // Polyhaven serves roughness maps; PlayCanvas uses gloss = 1 - rough.
  // The `glossInvert` flag tells the shader to invert the sampled value.
  mat.glossInvert = true;
  mat.update();
}

async function loadArenaAssets(
  app: pc.Application,
  materials: ArenaMaterialMap
): Promise<void> {
  // ── 1. PBR textures (in parallel) ────────────────────────────────────────
  const [
    asphaltSet,
    concreteSet,
    brickSet,
    brokenBrickSet,
    metalSet,
    woodSet,
  ] = await Promise.all([
    loadPbrSet(app, 'asphalt_02'),
    loadPbrSet(app, 'concrete_floor_02'),
    loadPbrSet(app, 'red_brick_03'),
    loadPbrSet(app, 'broken_brick_wall'),
    loadPbrSet(app, 'corrugated_iron_02'),
    loadPbrSet(app, 'wood_planks_grey'),
  ]);

  // Tilings chosen so each ~3 m of geometry shows roughly one tile.
  applyPbrSet(materials.ground, asphaltSet, 80, 80);   // 220 m plane / 3 m tile
  applyPbrSet(materials.concrete, concreteSet, 3, 2);  // 9 × 6 m walls
  applyPbrSet(materials.brick, brickSet, 3, 2);        // 9 × 6 m walls
  applyPbrSet(materials.darkConcrete, brokenBrickSet, 1, 1);
  applyPbrSet(materials.metal, metalSet, 2, 2);
  applyPbrSet(materials.wood, woodSet, 1, 1);
  // sandbag and rust keep their solid colours — no good Polyhaven match
  // and the procedural variants already read clearly against the textured
  // walls.

  // ── 2. HDRI skybox + environment lighting ────────────────────────────────
  const equirect = await loadTexture(app, `${ASSET_BASE}/sky_1k.hdr`);
  // Polyhaven .hdr files are Radiance HDR — PlayCanvas reads them via the
  // texture loader. The data arrives in HDR format already; we just need to
  // make sure mip generation is off (HDR cubemaps don't auto-mip cleanly).
  equirect.mipmaps = false;

  const skyboxCube = pc.EnvLighting.generateSkyboxCubemap(equirect, 512);
  const lightingSource = pc.EnvLighting.generateLightingSource(equirect, { size: 128 });
  const envAtlas = pc.EnvLighting.generateAtlas(lightingSource);

  app.scene.skybox = skyboxCube;
  app.scene.envAtlas = envAtlas;
  app.scene.skyboxIntensity = 1.4;

  // Drop the explicit ambient now that environment lighting is doing the
  // heavy lifting — keeping the constant ambient on top would double-up.
  app.scene.ambientLight = new pc.Color(0, 0, 0);
}

/**
 * Cleanly tear down a PlayCanvas Application and release GPU resources.
 */
export function destroyScene(ctx: SceneContext): void {
  ctx.app.destroy();
}
