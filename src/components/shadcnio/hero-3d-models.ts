import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/**
 * The shapes for the 3D hero look: the ground, the scenery standing on it, the
 * walkers and the dog. Everything is a handful of flat-sided blocks, coloured
 * from the site's own colours (see `readPalette`), so the look follows
 * Branding → Site design and dark mode like the rest of the page.
 */

/** How far the scenery runs before it repeats (it joins up with itself). */
export const TILE = 160;
const TAU = Math.PI * 2;

export type Palette = {
  dark: boolean;
  background: THREE.Color;
  foreground: THREE.Color;
  primary: THREE.Color;
  ground: THREE.Color;
  path: THREE.Color;
  leaf: THREE.Color;
  leafDeep: THREE.Color;
  wood: THREE.Color;
  rock: THREE.Color;
  pale: THREE.Color;
  cloth: THREE.Color[];
  skin: THREE.Color;
};

/** Any CSS colour (the tokens are oklch) as a three.js colour, by painting one pixel with it. */
function cssColour(ctx: CanvasRenderingContext2D, value: string, fallback: string) {
  ctx.clearRect(0, 0, 1, 1);
  ctx.fillStyle = fallback;
  ctx.fillStyle = value || fallback;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return new THREE.Color().setRGB((r ?? 0) / 255, (g ?? 0) / 255, (b ?? 0) / 255, THREE.SRGBColorSpace);
}

export const brightness = (c: THREE.Color) => {
  const s = c.clone().convertLinearToSRGB();
  return 0.2126 * s.r + 0.7152 * s.g + 0.0722 * s.b;
};

/** Mixes two colours as they look on screen (not in linear light), so the greys step evenly. */
export function mix(a: THREE.Color, b: THREE.Color, t: number) {
  const x = a.clone().convertLinearToSRGB();
  const y = b.clone().convertLinearToSRGB();
  return new THREE.Color().setRGB(x.r + (y.r - x.r) * t, x.g + (y.g - x.g) * t, x.b + (y.b - x.b) * t, THREE.SRGBColorSpace);
}

/** The site's colours as they are right now, and the scene's colours mixed from them. */
export function readPalette(el: HTMLElement): { palette: Palette; key: string } {
  const style = getComputedStyle(el);
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const token = (name: string, fallback: string) => {
    const value = style.getPropertyValue(name).trim();
    return ctx ? cssColour(ctx, value, fallback) : new THREE.Color(fallback);
  };
  const background = token("--background", "#ffffff");
  const foreground = token("--foreground", "#111111");
  const primary = token("--primary", "#111111");
  const dark = brightness(background) < 0.5;
  const m = (t: number) => mix(background, foreground, t);
  const palette: Palette = {
    dark,
    background,
    foreground,
    primary,
    ground: m(dark ? 0.1 : 0.1),
    path: m(dark ? 0.2 : 0.24),
    leaf: m(dark ? 0.24 : 0.2),
    leafDeep: m(dark ? 0.32 : 0.32),
    wood: m(dark ? 0.42 : 0.5),
    rock: m(dark ? 0.28 : 0.16),
    pale: m(dark ? 0.82 : 0.0),
    cloth: [m(0.78), m(0.6), m(0.42), m(0.9), m(0.5), m(0.7)],
    skin: m(dark ? 0.7 : 0.14),
  };
  const key = [background, foreground, primary].map((c) => c.getHexString()).join("-");
  return { palette, key };
}

/** A repeatable stream of numbers from 0 to 1, so the scenery is the same on every visit. */
export function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const smooth = (a: number, b: number, v: number) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/**
 * How high the ground is. Flat along the path (z near 0), dropping a little
 * towards the camera (z > 0) and rising into hills behind (z < 0). It repeats
 * every TILE along x, so the tiles meet with no seam.
 */
export function height(x: number, z: number) {
  const u = (x / TILE) * TAU;
  if (z > -2.6) {
    const w = smooth(2.6, 9, z);
    return w * (-0.9 + 0.3 * Math.sin(u * 5 + z * 0.6));
  }
  const d = -z;
  const w = smooth(2.6, 15, d);
  const rise = 0.6 + d * 0.085;
  const swell = 0.55 + 0.45 * Math.sin(u * 2 + d * 0.09 + 1.3);
  const far = 1 + 1.4 * smooth(12, 60, d);
  return w * (rise * swell + far * (0.9 * Math.sin(u * 3 + d * 0.19) + 0.45 * Math.sin(u * 7 - d * 0.31 + 2)));
}

// ── Putting blocks together ─────────────────────────────────────────────────

type Parts = THREE.BufferGeometry[];

const at = (x: number, y: number, z: number, sx = 1, sy = sx, sz = sx, ry = 0, rz = 0) =>
  new THREE.Matrix4().compose(
    new THREE.Vector3(x, y, z),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, rz)),
    new THREE.Vector3(sx, sy, sz),
  );

/** Adds one block to a pile: moved into place and painted one colour. */
function add(parts: Parts, shape: THREE.BufferGeometry, colour: THREE.Color, matrix?: THREE.Matrix4) {
  const g = shape.index ? shape.toNonIndexed() : shape.clone();
  if (matrix) g.applyMatrix4(matrix);
  g.deleteAttribute("uv");
  const count = g.getAttribute("position").count;
  const colours = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) colour.toArray(colours, i * 3);
  g.setAttribute("color", new THREE.BufferAttribute(colours, 3));
  parts.push(g);
}

/** One shape from a pile of blocks (the pile is thrown away). */
function fuse(parts: Parts) {
  const merged = mergeGeometries(parts, false) ?? new THREE.BufferGeometry();
  for (const g of parts) g.dispose();
  return merged;
}

const SHAPES = {
  box: new THREE.BoxGeometry(1, 1, 1),
  ball: new THREE.IcosahedronGeometry(1, 0),
  round: new THREE.IcosahedronGeometry(1, 1),
  cone: new THREE.ConeGeometry(1, 1, 7),
  tube: new THREE.CylinderGeometry(1, 1, 1, 7),
  taper: new THREE.CylinderGeometry(0.45, 1, 1, 7),
  rock: new THREE.DodecahedronGeometry(1, 0),
};

// ── The ground ──────────────────────────────────────────────────────────────

const Z_NEAR = 24;
const ROW = 2.4;
const ROWS = 40;
const COLS = 56;

export function buildGround(p: Palette) {
  const rand = seeded(11);
  const jitter: [number, number][][] = [];
  for (let j = 0; j <= ROWS; j++) {
    const row: [number, number][] = [];
    const z = Z_NEAR - j * ROW;
    const loose = Math.abs(z) > 3 ? 0.7 : 0;
    for (let i = 0; i < COLS; i++) row.push([(rand() - 0.5) * loose * 2, (rand() - 0.5) * loose * 2]);
    jitter.push(row);
  }
  const point = (i: number, j: number) => {
    const [jx, jz] = jitter[j]?.[i % COLS] ?? [0, 0];
    const x = -TILE / 2 + (i / COLS) * TILE + jx;
    const z = Z_NEAR - j * ROW + jz;
    return new THREE.Vector3(x, height(x, z), z);
  };
  const positions: number[] = [];
  const colours: number[] = [];
  const tint = new THREE.Color();
  const face = (a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3) => {
    positions.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
    // Each face a touch lighter or darker than its neighbours, so the ground reads as facets.
    tint.copy(p.ground).multiplyScalar(1 + (rand() - 0.5) * (p.dark ? 0.16 : 0.07));
    for (let k = 0; k < 3; k++) colours.push(tint.r, tint.g, tint.b);
  };
  for (let j = 0; j < ROWS; j++) {
    for (let i = 0; i < COLS; i++) {
      const a = point(i, j);
      const b = point(i + 1, j);
      const c = point(i, j + 1);
      const d = point(i + 1, j + 1);
      // The last column meets the first of the next tile.
      if ((i + j) % 2 === 0) {
        face(a, c, b);
        face(b, c, d);
      } else {
        face(a, c, d);
        face(a, d, b);
      }
    }
  }
  const ground = new THREE.BufferGeometry();
  ground.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  ground.setAttribute("color", new THREE.Float32BufferAttribute(colours, 3));
  ground.computeVertexNormals();
  return ground;
}

// ── The scenery standing on a tile ──────────────────────────────────────────

function tree(parts: Parts, p: Palette, x: number, z: number, size: number, rand: () => number) {
  const y = height(x, z) - 0.2;
  add(parts, SHAPES.tube, p.wood, at(x, y + size * 0.6, z, size * 0.11, size * 1.2, size * 0.11));
  const crown = rand() > 0.5 ? p.leaf : p.leafDeep;
  add(parts, SHAPES.round, crown, at(x, y + size * 1.75, z, size * 0.82, size * 0.9, size * 0.82, rand() * TAU));
  if (rand() > 0.4) {
    add(parts, SHAPES.ball, crown, at(x + size * 0.45, y + size * 1.4, z + size * 0.2, size * 0.5, size * 0.5, size * 0.5, rand() * TAU));
  }
}

function pine(parts: Parts, p: Palette, x: number, z: number, size: number, rand: () => number) {
  const y = height(x, z) - 0.2;
  const turn = rand() * TAU;
  add(parts, SHAPES.tube, p.wood, at(x, y + size * 0.4, z, size * 0.09, size * 0.8, size * 0.09));
  add(parts, SHAPES.cone, p.leafDeep, at(x, y + size * 1.15, z, size * 0.72, size * 1.1, size * 0.72, turn));
  add(parts, SHAPES.cone, p.leafDeep, at(x, y + size * 1.85, z, size * 0.55, size * 0.95, size * 0.55, turn + 0.4));
  add(parts, SHAPES.cone, p.leaf, at(x, y + size * 2.45, z, size * 0.36, size * 0.8, size * 0.36, turn + 0.8));
}

function sheep(parts: Parts, p: Palette, x: number, z: number, turn: number) {
  const y = height(x, z);
  const m = at(x, y, z, 1, 1, 1, turn);
  const put = (shape: THREE.BufferGeometry, colour: THREE.Color, local: THREE.Matrix4) => add(parts, shape, colour, m.clone().multiply(local));
  put(SHAPES.round, p.pale, at(0, 0.62, 0, 0.5, 0.36, 0.34));
  put(SHAPES.ball, p.wood, at(0.5, 0.56, 0, 0.17, 0.2, 0.15));
  for (const [lx, lz] of [[-0.25, -0.14], [-0.25, 0.14], [0.25, -0.14], [0.25, 0.14]] as const) {
    put(SHAPES.box, p.wood, at(lx, 0.18, lz, 0.07, 0.36, 0.07));
  }
}

function fence(parts: Parts, p: Palette, x: number, z: number, posts: number) {
  for (let i = 0; i < posts; i++) add(parts, SHAPES.box, p.wood, at(x + i * 1.6, 0.5, z, 0.11, 1, 0.11));
  const span = (posts - 1) * 1.6;
  add(parts, SHAPES.box, p.wood, at(x + span / 2, 0.78, z, span + 0.5, 0.07, 0.05));
  add(parts, SHAPES.box, p.wood, at(x + span / 2, 0.45, z, span + 0.5, 0.07, 0.05));
}

/** Where things that move stand on a tile, shared so the animation can find them. */
export const TURBINES = [
  { x: -52, z: -33, size: 1.15, start: 0 },
  { x: -41, z: -39, size: 0.95, start: 1.7 },
  { x: 37, z: -36, size: 1.05, start: 3.1 },
] as const;
const HUB = 7.4;

/** Signposts beside the path, by how many there are (as the flat looks space them). */
export const SIGN_X = [[], [-30], [-48, 26], [-58, -6, 46], [-62, -24, 14, 52], [-66, -36, -6, 24, 54]] as const;

export function buildScenery(p: Palette, signs: number) {
  const rand = seeded(7);
  const parts: Parts = [];
  // Trees: plenty on the hills behind, a few on the camera's side that pass in front of the walkers.
  const taken: [number, number][] = [...TURBINES.map((t) => [t.x, t.z] as [number, number])];
  const clear = (x: number, z: number, gap: number) => taken.every(([tx, tz]) => Math.hypot(tx - x, tz - z) > gap);
  let tries = 0;
  let planted = 0;
  while (planted < 46 && tries < 400) {
    tries++;
    const x = (rand() - 0.5) * TILE;
    const z = -4.5 - rand() ** 1.6 * 50;
    if (!clear(x, z, 3.2)) continue;
    taken.push([x, z]);
    planted++;
    const size = 1 + rand() * 1.15;
    if (rand() > 0.42) tree(parts, p, x, z, size, rand);
    else pine(parts, p, x, z, size * 1.05, rand);
  }
  for (const [x, z, size] of [[-61, 4.6, 1.15], [-9, 5.4, 1.3], [33, 4.4, 1.05], [70, 5.6, 1.2]] as const) {
    if (rand() > 0.5) tree(parts, p, x, z, size, rand);
    else pine(parts, p, x, z, size, rand);
  }
  // Rocks and tufts of grass by the path.
  for (let i = 0; i < 26; i++) {
    const x = (rand() - 0.5) * TILE;
    const side = rand() > 0.3 ? -1 : 1;
    const z = side * (2.9 + rand() * (side < 0 ? 16 : 4));
    const y = height(x, z);
    if (rand() > 0.55) {
      const s = 0.25 + rand() * 0.5;
      add(parts, SHAPES.rock, p.rock, at(x, y + s * 0.3, z, s, s * 0.7, s * 0.85, rand() * TAU));
    } else {
      const s = 0.3 + rand() * 0.25;
      add(parts, SHAPES.cone, p.leaf, at(x, y + s * 0.5, z, s * 0.35, s, s * 0.35, rand() * TAU));
      add(parts, SHAPES.cone, p.leaf, at(x + 0.16, y + s * 0.35, z + 0.08, s * 0.3, s * 0.7, s * 0.3, rand() * TAU, 0.3));
    }
  }
  fence(parts, p, -44, -2.5, 6);
  fence(parts, p, 8, -2.5, 4);
  fence(parts, p, 58, -2.5, 7);
  // A bench facing the path.
  add(parts, SHAPES.box, p.wood, at(-17, 0.48, -2.7, 1.7, 0.08, 0.5));
  add(parts, SHAPES.box, p.wood, at(-17, 0.85, -2.95, 1.7, 0.36, 0.07));
  add(parts, SHAPES.box, p.wood, at(-17.7, 0.24, -2.7, 0.09, 0.48, 0.45));
  add(parts, SHAPES.box, p.wood, at(-16.3, 0.24, -2.7, 0.09, 0.48, 0.45));
  // Sheep on the nearer slopes.
  for (const [x, z] of [[-70, -9], [-67, -11.5], [-25, -12], [-21, -10], [-18.5, -13.5], [20, -9.5], [24, -12], [51, -14], [54.5, -11.5], [74, -10]] as const) {
    sheep(parts, p, x, z, rand() * TAU);
  }
  // Wind turbine towers (the blades are separate, they turn).
  for (const t of TURBINES) {
    const y = height(t.x, t.z) - 0.3;
    add(parts, SHAPES.taper, p.pale, at(t.x, y + (HUB * t.size) / 2, t.z, 0.2 * t.size, HUB * t.size, 0.2 * t.size));
    add(parts, SHAPES.box, p.pale, at(t.x, y + HUB * t.size, t.z + 0.25 * t.size, 0.34 * t.size, 0.34 * t.size, 0.9 * t.size));
  }
  // Signposts: the post and the board (the name is a picture laid on the board).
  for (const x of SIGN_X[signs] ?? []) {
    add(parts, SHAPES.box, p.wood, at(x, 0.95, -2.05, 0.12, 1.9, 0.12));
    add(parts, SHAPES.box, p.pale, at(x + 0.55, 1.62, -1.96, 2.1, 0.44, 0.06));
  }
  return fuse(parts);
}

/** Three blades round a hub, facing the camera's side. */
export function buildBlades(p: Palette) {
  const parts: Parts = [];
  add(parts, SHAPES.ball, p.pale, at(0, 0, 0, 0.26));
  for (let i = 0; i < 3; i++) {
    const turn = new THREE.Matrix4().makeRotationZ((i * TAU) / 3);
    add(parts, SHAPES.box, p.pale, turn.multiply(at(0, 1.75, 0, 0.26, 3.5, 0.06)));
  }
  return fuse(parts);
}
export const turbineHub = (t: (typeof TURBINES)[number]) => new THREE.Vector3(t.x, height(t.x, t.z) - 0.3 + HUB * t.size, t.z + 0.75 * t.size);

export function buildBalloon(p: Palette) {
  const parts: Parts = [];
  const envelope = new THREE.SphereGeometry(1, 10, 7).toNonIndexed();
  const pos = envelope.getAttribute("position");
  const count = pos.count;
  const colours = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 3) {
    // Pinch the bottom into the balloon's neck, and stripe it gore by gore.
    for (let k = 0; k < 3; k++) {
      const y = pos.getY(i + k);
      const pinch = y < 0 ? 1 - 0.55 * (-y) ** 1.6 : 1;
      pos.setXYZ(i + k, pos.getX(i + k) * pinch, y < 0 ? y * 1.25 : y, pos.getZ(i + k) * pinch);
    }
    const a = pos.getX(i) + pos.getX(i + 1) + pos.getX(i + 2);
    const b = pos.getZ(i) + pos.getZ(i + 1) + pos.getZ(i + 2);
    const gore = Math.floor(((Math.atan2(b, a) + Math.PI) / TAU) * 10 + 0.001);
    const colour = gore % 2 === 0 ? p.pale : p.primary;
    for (let k = 0; k < 3; k++) colour.toArray(colours, (i + k) * 3);
  }
  envelope.deleteAttribute("uv");
  envelope.setAttribute("color", new THREE.BufferAttribute(colours, 3));
  envelope.applyMatrix4(at(0, 0, 0, 1.9, 2.1, 1.9));
  envelope.computeVertexNormals();
  parts.push(envelope);
  add(parts, SHAPES.box, p.wood, at(0, -3.75, 0, 0.62, 0.5, 0.62));
  for (const [x, z] of [[-0.28, -0.28], [0.28, -0.28], [-0.28, 0.28], [0.28, 0.28]] as const) {
    add(parts, SHAPES.box, p.wood, at(x * 1.25, -3.1, z * 1.25, 0.03, 1, 0.03));
  }
  return fuse(parts);
}

export function buildCloud(p: Palette, seed: number) {
  const rand = seeded(seed);
  const parts: Parts = [];
  const puffs = 3 + Math.floor(rand() * 3);
  for (let i = 0; i < puffs; i++) {
    const s = 1.1 + rand() * 1.1;
    add(parts, SHAPES.round, p.pale, at((i - (puffs - 1) / 2) * 1.7, rand() * 0.5, (rand() - 0.5) * 1.2, s * 1.2, s * 0.72, s, rand() * TAU));
  }
  return fuse(parts);
}

/** One wing of a bird (the other is its mirror), hinged at the body. */
export function buildWing(p: Palette) {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute([0, 0, -0.1, 0, 0, 0.12, 0, 0.04, 0.62, 0, 0, -0.1, 0, 0.04, 0.62, -0.22, 0, 0.4], 3));
  const colours: number[] = [];
  for (let i = 0; i < 6; i++) colours.push(p.wood.r, p.wood.g, p.wood.b);
  g.setAttribute("color", new THREE.Float32BufferAttribute(colours, 3));
  g.computeVertexNormals();
  return g;
}

// ── The walkers ─────────────────────────────────────────────────────────────

export type WalkerKind = {
  /** How tall, against an adult of 1. */
  scale: number;
  hat?: "cap" | "bobble" | "brim";
  hair?: boolean;
  pack?: boolean;
  poles?: boolean;
  wave?: boolean;
  /** Which of the palette's cloth colours: jacket, then trousers. */
  jacket: number;
  legs: number;
};

export type WalkerShapes = { body: THREE.BufferGeometry; thigh: THREE.BufferGeometry; shin: THREE.BufferGeometry; arm: THREE.BufferGeometry; pole: THREE.BufferGeometry };

/** A walker's pieces, each hinged at its own top (hip, knee, shoulder), facing +x. */
export function buildWalker(p: Palette, kind: WalkerKind): WalkerShapes {
  const jacket = p.cloth[kind.jacket % p.cloth.length] ?? p.foreground;
  const trousers = p.cloth[kind.legs % p.cloth.length] ?? p.foreground;
  const body: Parts = [];
  // Hips at 0, so the body bobs and leans from there.
  add(body, SHAPES.box, jacket, at(0, 0.3, 0, 0.24, 0.6, 0.4));
  add(body, SHAPES.box, trousers, at(0, 0.02, 0, 0.22, 0.14, 0.36));
  add(body, SHAPES.round, p.skin, at(0.01, 0.76, 0, 0.135, 0.15, 0.135));
  if (kind.hair) add(body, SHAPES.round, p.wood, at(-0.035, 0.8, 0, 0.14, 0.13, 0.145));
  if (kind.hat === "cap") {
    add(body, SHAPES.tube, p.primary, at(0, 0.87, 0, 0.14, 0.09, 0.14));
    add(body, SHAPES.box, p.primary, at(0.16, 0.84, 0, 0.14, 0.025, 0.2));
  }
  if (kind.hat === "bobble") {
    add(body, SHAPES.cone, p.primary, at(0, 0.93, 0, 0.145, 0.2, 0.145));
    add(body, SHAPES.ball, p.pale, at(0, 1.05, 0, 0.05));
  }
  if (kind.hat === "brim") {
    add(body, SHAPES.tube, p.wood, at(0, 0.86, 0, 0.26, 0.025, 0.26));
    add(body, SHAPES.tube, p.wood, at(0, 0.91, 0, 0.13, 0.1, 0.13));
  }
  if (kind.pack) {
    add(body, SHAPES.box, p.primary, at(-0.21, 0.33, 0, 0.2, 0.46, 0.32));
    add(body, SHAPES.box, p.pale, at(-0.21, 0.6, 0, 0.16, 0.08, 0.26));
  }
  const thigh: Parts = [];
  add(thigh, SHAPES.box, trousers, at(0, -0.22, 0, 0.15, 0.46, 0.15));
  const shin: Parts = [];
  add(shin, SHAPES.box, trousers, at(0, -0.2, 0, 0.12, 0.42, 0.12));
  add(shin, SHAPES.box, p.wood, at(0.04, -0.4, 0, 0.24, 0.09, 0.13));
  const arm: Parts = [];
  add(arm, SHAPES.box, jacket, at(0, -0.25, 0, 0.11, 0.52, 0.11));
  add(arm, SHAPES.ball, p.skin, at(0, -0.54, 0, 0.06));
  const pole: Parts = [];
  add(pole, SHAPES.box, p.wood, at(0, -0.55, 0, 0.025, 1.15, 0.025));
  return { body: fuse(body), thigh: fuse(thigh), shin: fuse(shin), arm: fuse(arm), pole: fuse(pole) };
}

export type DogShapes = { body: THREE.BufferGeometry; leg: THREE.BufferGeometry; tail: THREE.BufferGeometry };

export function buildDog(p: Palette): DogShapes {
  const body: Parts = [];
  add(body, SHAPES.box, p.pale, at(0, 0, 0, 0.62, 0.24, 0.22));
  add(body, SHAPES.box, p.pale, at(0.36, 0.14, 0, 0.2, 0.22, 0.2));
  add(body, SHAPES.box, p.pale, at(0.5, 0.1, 0, 0.14, 0.1, 0.12));
  add(body, SHAPES.box, p.wood, at(0.31, 0.29, 0.08, 0.06, 0.12, 0.05));
  add(body, SHAPES.box, p.wood, at(0.31, 0.29, -0.08, 0.06, 0.12, 0.05));
  add(body, SHAPES.box, p.primary, at(0.26, 0.05, 0, 0.04, 0.26, 0.24));
  const leg: Parts = [];
  add(leg, SHAPES.box, p.pale, at(0, -0.15, 0, 0.07, 0.3, 0.07));
  const tail: Parts = [];
  add(tail, SHAPES.box, p.pale, at(-0.02, 0.13, 0, 0.05, 0.28, 0.05));
  return { body: fuse(body), leg: fuse(leg), tail: fuse(tail) };
}

/** The light a head torch throws: a see-through cone, point at the torch. */
export function buildBeam() {
  const g = new THREE.ConeGeometry(0.75, 3.4, 12, 1, true);
  g.translate(0, -1.7, 0);
  g.rotateZ(Math.PI / 2 - 0.42);
  return g;
}
