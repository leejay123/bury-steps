import * as THREE from "three";
import {
  SIGN_X,
  TILE,
  TURBINES,
  buildBalloon,
  buildBeam,
  buildBlades,
  buildCloud,
  buildDog,
  buildGround,
  buildScenery,
  buildWalker,
  buildWing,
  readPalette,
  turbineHub,
  type Palette,
  type WalkerKind,
} from "./hero-3d-models";
import { castPerson, loadPeople, type Person } from "./hero-3d-people";

/**
 * The 3D hero look: a real landscape the group walks through, drawn with
 * three.js. The walkers stay put and the land rolls past them (four copies of
 * one tile, end to end), which keeps the sun's shadows steady. The camera
 * drifts slowly round the group so the depth shows.
 *
 * Loaded only when a page uses this look (see hero-3d.tsx).
 */

export type Hero3D = {
  /** Stops everything and frees the graphics memory. */
  stop: () => void;
};

export type Hero3DOptions = {
  canvas: HTMLCanvasElement;
  /** The box the canvas fills. */
  host: HTMLElement;
  /** The clear band along the bottom of the host that the land is drawn in. */
  strip: HTMLElement;
  /** Names for the signposts, at most five. */
  signs: string[];
  moving: boolean;
  /** Called once the first picture is on screen. */
  onReady: () => void;
};

const TAU = Math.PI * 2;
/** Metres a second the land rolls by. */
const PACE = 1.25;
/** The moment the still picture shows (the "Still" setting, or a device that asks for less motion). */
const STILL_AT = 9;
/** How far the camera stands from the group. */
const REACH = 18;

/**
 * Eight walkers, front to back (x is along the path, z is across it). `model` is which
 * character plays them (see hero-3d-people.ts); the rest dresses the simple stand-in
 * drawn if the characters can't be fetched.
 */
const PARTY: (WalkerKind & { x: number; z: number; model: number; drift?: number })[] = [
  { x: 3.7, z: 0.25, model: 0, scale: 1.02, pack: true, wave: true, jacket: 0, legs: 4 },
  { x: 2.3, z: -0.45, model: 1, scale: 1, jacket: 1, legs: 0 },
  { x: 1.1, z: 0.4, model: 2, scale: 1.04, pack: true, poles: true, jacket: 3, legs: 2 },
  { x: -0.1, z: -0.35, model: 5, scale: 1.06, hat: "brim", jacket: 2, legs: 0 },
  { x: -0.9, z: 0.55, model: 1, scale: 0.8, hat: "bobble", jacket: 5, legs: 1 },
  { x: -2.1, z: -0.3, model: 4, scale: 0.97, hat: "cap", jacket: 4, legs: 3 },
  { x: -3.1, z: 0.4, model: 3, scale: 1.02, hair: true, jacket: 0, legs: 5 },
  { x: -5.2, z: -0.1, model: 0, scale: 0.92, pack: true, jacket: 2, legs: 4, drift: 1 },
];
const DOG = { x: 2.9, z: 0.95 };

type Rig = { update: (t: number) => void };

export function startHero3D({ canvas, host, strip, signs, moving, onReady }: Hero3DOptions): Hero3D {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "low-power" });
  renderer.setClearColor(0x000000, 0);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  const camera = new THREE.PerspectiveCamera(30, 2, 1, 400);
  const less = window.matchMedia("(prefers-reduced-motion: reduce)");

  let scene = new THREE.Scene();
  let rigs: Rig[] = [];
  let bin: { dispose: () => void }[] = [];
  let paletteKey = "";
  let size = { w: 0, h: 0, strip: 0 };
  let stopped = false;
  let frame = 0;
  let seen = true;
  let ready = false;
  // The characters, once fetched. Nothing is drawn until they are in (or have failed).
  let people: Person[] | null = null;
  let started = false;
  // The scene's own clock: it only runs while the picture is being drawn.
  let now = STILL_AT;
  let last = 0;

  const keep = <T extends { dispose: () => void }>(thing: T) => {
    bin.push(thing);
    return thing;
  };

  function build(palette: Palette) {
    for (const thing of bin) thing.dispose();
    bin = [];
    rigs = [];
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(palette.background, 34, 105);

    const solid = keep(new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true }));
    const flat = keep(new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true, side: THREE.DoubleSide }));

    // Light: the sky all round, and the sun (or the moon) from the front left, casting shadows.
    const sky = new THREE.HemisphereLight(0xffffff, palette.dark ? 0x444444 : 0x999999, palette.dark ? 1.2 : 1.5);
    const sun = new THREE.DirectionalLight(0xffffff, palette.dark ? 0.9 : 2.2);
    sun.position.set(-22, 34, 20);
    sun.target.position.set(0, 0, -6);
    sun.castShadow = true;
    const wide = Math.min(2048, renderer.capabilities.maxTextureSize);
    sun.shadow.mapSize.set(wide, wide);
    Object.assign(sun.shadow.camera, { left: -46, right: 46, top: 30, bottom: -30, near: 1, far: 130 });
    sun.shadow.bias = -0.0006;
    sun.shadow.normalBias = 0.05;
    sun.shadow.intensity = palette.dark ? 0.6 : 0.8;
    scene.add(sky, sun, sun.target);
    keep(sun.shadow);

    // The land: four copies of one tile, end to end, sliding past.
    const land = new THREE.Group();
    const ground = keep(buildGround(palette));
    const scenery = keep(buildScenery(palette, signs.length));
    const blades = keep(buildBlades(palette));
    const pathShape = keep(new THREE.PlaneGeometry(TILE, 2.3));
    const pathSkin = keep(new THREE.MeshLambertMaterial({ color: palette.path }));
    const boards = signs.map((name) => {
      const texture = keep(signPicture(name, palette, host));
      return keep(new THREE.MeshBasicMaterial({ map: texture, transparent: true, fog: true }));
    });
    const boardShape = keep(new THREE.PlaneGeometry(2, 0.4));
    const spinners: { mesh: THREE.Mesh; start: number }[] = [];
    for (let k = -1; k <= 2; k++) {
      const tile = new THREE.Group();
      tile.position.x = k * TILE;
      const floor = new THREE.Mesh(ground, solid);
      floor.receiveShadow = true;
      const things = new THREE.Mesh(scenery, solid);
      things.castShadow = true;
      things.receiveShadow = true;
      const path = new THREE.Mesh(pathShape, pathSkin);
      path.rotation.x = -Math.PI / 2;
      path.position.y = 0.02;
      path.receiveShadow = true;
      tile.add(floor, things, path);
      for (const t of TURBINES) {
        const mesh = new THREE.Mesh(blades, solid);
        mesh.position.copy(turbineHub(t));
        mesh.scale.setScalar(t.size);
        mesh.castShadow = true;
        tile.add(mesh);
        spinners.push({ mesh, start: t.start + k });
      }
      (SIGN_X[signs.length] ?? []).forEach((x, i) => {
        const board = new THREE.Mesh(boardShape, boards[i]);
        board.position.set(x + 0.55, 1.62, -1.92);
        tile.add(board);
      });
      land.add(tile);
    }
    scene.add(land);
    rigs.push({
      update: (t) => {
        land.position.x = -((t * PACE) % TILE);
        for (const s of spinners) s.mesh.rotation.z = -(t * 1.1 + s.start);
      },
    });

    // The sky: clouds and a balloon drifting more slowly than the land, and birds crossing.
    const cloudShapes = [3, 5, 8].map((seed) => keep(buildCloud(palette, seed)));
    const cloudSkin = keep(new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true, transparent: true, opacity: palette.dark ? 0.2 : 0.9 }));
    const clouds = [
      { x: -60, y: 10.4, z: -40, s: 1.25, shape: 0 },
      { x: -18, y: 11.4, z: -52, s: 1.5, shape: 1 },
      { x: 26, y: 9.6, z: -36, s: 1, shape: 2 },
      { x: 68, y: 11, z: -48, s: 1.35, shape: 0 },
    ].map((c) => {
      const mesh = new THREE.Mesh(cloudShapes[c.shape], cloudSkin);
      mesh.position.set(c.x, c.y, c.z);
      mesh.scale.setScalar(c.s);
      scene.add(mesh);
      return { mesh, x: c.x };
    });
    const balloon = new THREE.Mesh(keep(buildBalloon(palette)), solid);
    balloon.scale.setScalar(1.5);
    scene.add(balloon);
    const wing = keep(buildWing(palette));
    const flock = new THREE.Group();
    const flappers = [
      [0, 0, 0, 0],
      [-0.9, 0.25, 0.7, 0.9],
      [-1.5, -0.2, -0.6, 1.7],
    ].map(([x, y, z, start]) => {
      const bird = new THREE.Group();
      bird.position.set(x ?? 0, y ?? 0, z ?? 0);
      const left = new THREE.Mesh(wing, flat);
      const right = new THREE.Mesh(wing, flat);
      right.scale.z = -1;
      bird.add(left, right);
      flock.add(bird);
      return { left, right, start: start ?? 0 };
    });
    scene.add(flock);
    const wrap = (v: number, span: number) => ((((v + span / 2) % span) + span) % span) - span / 2;
    rigs.push({
      update: (t) => {
        for (const c of clouds) c.mesh.position.x = wrap(c.x - t * 0.35, 150);
        balloon.position.set(wrap(-14 - t * 0.7, 150), 8.2 + Math.sin(t * 0.45) * 0.35, -44);
        balloon.rotation.y = t * 0.12;
        flock.position.set(wrap(30 - t * 3.1, 130), 6.1 + Math.sin(t * 0.7) * 0.4, -9);
        for (const f of flappers) {
          const flap = Math.sin(t * 7.5 + f.start) * 0.62;
          f.left.rotation.x = -flap;
          f.right.rotation.x = flap;
        }
      },
    });

    // After dark: stars, the moon, and head torches.
    if (palette.dark) {
      const rand = seededStars();
      const points: number[] = [];
      for (let i = 0; i < 260; i++) {
        const a = (rand() - 0.5) * 2.5;
        const up = 0.02 + rand() * 0.75;
        points.push(Math.sin(a) * 300, up * 86 + 4, -Math.cos(a) * 300);
      }
      const starShape = keep(new THREE.BufferGeometry());
      starShape.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
      const starSkin = keep(new THREE.PointsMaterial({ color: palette.foreground, size: 2.2, sizeAttenuation: false, fog: false, transparent: true, opacity: 0.55 }));
      scene.add(new THREE.Points(starShape, starSkin));
      const moon = new THREE.Mesh(keep(new THREE.IcosahedronGeometry(7, 2)), keep(new THREE.MeshBasicMaterial({ color: palette.foreground, fog: false })));
      moon.position.set(-58, 30, -260);
      scene.add(moon);
    }

    // The walkers and the dog.
    const beamShape = palette.dark ? keep(buildBeam()) : null;
    const beamSkin = palette.dark
      ? keep(new THREE.MeshBasicMaterial({ color: palette.foreground, transparent: true, opacity: 0.13, depthWrite: false, side: THREE.DoubleSide, fog: false }))
      : null;
    PARTY.forEach((who, index) => {
      const person = people?.[who.model];
      if (person) {
        const s = who.scale;
        const root = new THREE.Group();
        // The same character twice wears a different grey the second time.
        const cast = castPerson(person, palette, s, index >= 4 ? 0.14 : 0, PACE, keep);
        keep(cast.done);
        root.add(cast.figure);
        if (beamShape && beamSkin && index % 2 === 0) {
          const beam = new THREE.Mesh(beamShape, beamSkin);
          beam.position.set(0.16 * s, 1.6 * s, 0);
          beam.scale.setScalar(s);
          const torch = new THREE.PointLight(0xffffff, 9, 7, 1.6);
          torch.position.set(2.2, 0.97 * s, 0);
          root.add(beam, torch);
        }
        scene.add(root);
        const start = index * 0.37;
        rigs.push({
          update: (t) => {
            const lag = who.drift ? Math.sin(t * 0.21) * 1.3 : Math.sin(t * 0.3 + index * 2.1) * 0.12;
            root.position.set(who.x + lag, 0, who.z);
            cast.walkTo(t + start);
          },
        });
        return;
      }
      const shapes = buildWalker(palette, who);
      for (const g of Object.values(shapes)) keep(g);
      const s = who.scale;
      const root = new THREE.Group();
      root.scale.setScalar(s);
      const hips = new THREE.Group();
      const body = new THREE.Mesh(shapes.body, solid);
      hips.add(body);
      const limb = (shape: THREE.BufferGeometry, x: number, y: number, z: number, parent: THREE.Object3D) => {
        const mesh = new THREE.Mesh(shape, solid);
        mesh.position.set(x, y, z);
        mesh.castShadow = true;
        parent.add(mesh);
        return mesh;
      };
      body.castShadow = true;
      const thighs = [limb(shapes.thigh, 0, 0, 0.1, hips), limb(shapes.thigh, 0, 0, -0.1, hips)] as const;
      const shins = [limb(shapes.shin, 0, -0.45, 0, thighs[0]), limb(shapes.shin, 0, -0.45, 0, thighs[1])] as const;
      const arms = [limb(shapes.arm, 0, 0.55, 0.255, hips), limb(shapes.arm, 0, 0.55, -0.255, hips)] as const;
      if (who.poles) for (const arm of arms) limb(shapes.pole, 0.02, -0.52, 0, arm).rotation.z = -0.5;
      if (beamShape && beamSkin && index % 2 === 0) {
        const beam = new THREE.Mesh(beamShape, beamSkin);
        beam.position.set(0.14, 0.8, 0);
        hips.add(beam);
        const torch = new THREE.PointLight(0xffffff, 9, 7, 1.6);
        torch.position.set(2.2, 0.1, 0);
        hips.add(torch);
      }
      root.add(hips);
      scene.add(root);
      // Leg length sets how fast the steps have to be for the feet not to slide.
      const swing = 0.5;
      const rate = (Math.PI * PACE) / (2 * 0.87 * s * Math.sin(swing));
      const start = index * 1.9;
      rigs.push({
        update: (t) => {
          const a = t * rate + start;
          const lag = who.drift ? Math.sin(t * 0.21) * 1.3 : Math.sin(t * 0.3 + index * 2.1) * 0.12;
          hips.position.y = 0.87 + Math.abs(Math.cos(a)) * 0.035 - 0.02;
          hips.rotation.z = -0.06;
          root.position.set(who.x + lag, 0, who.z);
          for (let side = 0; side < 2; side++) {
            const phase = a + side * Math.PI;
            const thigh = thighs[side];
            const shin = shins[side];
            const arm = arms[side];
            if (!thigh || !shin || !arm) continue;
            thigh.rotation.z = Math.sin(phase) * swing + 0.06;
            // The knee bends as the leg comes forward.
            shin.rotation.z = -Math.max(0, Math.cos(phase)) * 0.85 - 0.05;
            if (who.poles) arm.rotation.z = -Math.sin(phase) * 0.35 + 0.55;
            else if (who.wave && side === 0) arm.rotation.z = 2.45 + Math.sin(t * 6) * 0.28;
            else arm.rotation.z = -Math.sin(phase) * 0.42;
          }
        },
      });
    });

    const dog = buildDog(palette);
    for (const g of Object.values(dog)) keep(g);
    const pup = new THREE.Group();
    const trunk = new THREE.Mesh(dog.body, solid);
    trunk.castShadow = true;
    pup.add(trunk);
    const paws = [[0.22, 0.08], [0.22, -0.08], [-0.24, 0.08], [-0.24, -0.08]].map(([x, z]) => {
      const leg = new THREE.Mesh(dog.leg, solid);
      leg.position.set(x ?? 0, -0.1, z ?? 0);
      leg.castShadow = true;
      pup.add(leg);
      return leg;
    });
    const tail = new THREE.Mesh(dog.tail, solid);
    tail.position.set(-0.3, 0.08, 0);
    pup.add(tail);
    scene.add(pup);
    rigs.push({
      update: (t) => {
        const a = t * 9;
        pup.position.set(DOG.x + Math.sin(t * 0.37) * 0.5, 0.4 + Math.abs(Math.sin(a)) * 0.02, DOG.z + Math.sin(t * 0.23) * 0.15);
        paws.forEach((leg, i) => {
          leg.rotation.z = Math.sin(a + (i === 0 || i === 3 ? 0 : Math.PI)) * 0.55;
        });
        tail.rotation.x = Math.sin(t * 13) * 0.5;
        tail.rotation.z = 0.5;
      },
    });
  }

  function frameCamera(t: number) {
    const { w, h } = size;
    if (w === 0 || h === 0) return;
    // How many pixels one metre takes up at arm's length: sized from the band, and
    // on a narrow screen pulled out until the whole group fits across it.
    const focal = Math.min(2.95 * size.strip, (w * REACH) / 13.5);
    camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan(h / (2 * focal)));
    camera.aspect = w / h;
    const around = 0.3 + 0.24 * Math.sin((t * TAU) / 47);
    const up = 3 + 0.55 * Math.sin((t * TAU) / 61 + 1);
    camera.position.set(Math.sin(around) * REACH - 0.6, up, Math.cos(around) * REACH);
    camera.lookAt(-0.6, 1.25, 0);
    // The point the camera looks at sits two fifths of the way up the band, wherever the band is.
    const aim = h - size.strip * 0.4;
    camera.setViewOffset(w, h, 0, h / 2 - aim, w, h);
    camera.updateProjectionMatrix();
  }

  function draw() {
    if (stopped || !started || size.w === 0) return;
    for (const rig of rigs) rig.update(now);
    frameCamera(now);
    renderer.render(scene, camera);
    if (!ready) {
      ready = true;
      onReady();
    }
  }

  const animated = () => moving && !less.matches;

  function tick(time: number) {
    frame = 0;
    if (stopped) return;
    if (last) now += Math.min(0.1, (time - last) / 1000);
    last = time;
    draw();
    queue();
  }
  function queue() {
    if (!frame && !stopped && animated() && seen && !document.hidden) frame = requestAnimationFrame(tick);
  }
  function pause() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    last = 0;
  }
  /** Draws again: carries on moving, or puts up the still picture. */
  function refresh() {
    pause();
    if (animated()) queue();
    else {
      now = STILL_AT;
      draw();
    }
  }

  function measure() {
    const w = host.clientWidth;
    const h = host.clientHeight;
    const band = strip.clientHeight || h * 0.45;
    if (w === size.w && h === size.h && band === size.strip) return false;
    size = { w, h, strip: band };
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h, false);
    return true;
  }

  function repaint() {
    const { palette, key } = readPalette(host);
    if (key === paletteKey) return false;
    paletteKey = key;
    build(palette);
    return true;
  }

  const resized = new ResizeObserver(() => {
    if (measure()) draw();
  });
  resized.observe(host);
  resized.observe(strip);
  // Dark mode and the Customize panel change the colours on <html>.
  const themed = new MutationObserver(() => {
    if (repaint()) draw();
  });
  themed.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "style", "data-sc-theme", "data-sc-base", "data-design"] });
  const inView = new IntersectionObserver(
    ([entry]) => {
      seen = entry?.isIntersecting ?? true;
      if (seen) queue();
      else pause();
    },
    { rootMargin: "80px" },
  );
  inView.observe(host);
  const onVisible = () => (document.hidden ? pause() : queue());
  document.addEventListener("visibilitychange", onVisible);
  less.addEventListener("change", refresh);
  // The site's font may arrive after the first picture: redo the signposts with it.
  void document.fonts?.ready.then(() => {
    if (stopped) return;
    paletteKey = "";
    repaint();
    draw();
  });

  void loadPeople()
    .then((cast) => {
      if (stopped) for (const person of cast) person.dispose();
      else people = cast;
    })
    // The characters didn't arrive: the simple stand-in people walk instead.
    .catch(() => undefined)
    .finally(() => {
      if (stopped) return;
      started = true;
      paletteKey = "";
      repaint();
      measure();
      refresh();
    });

  return {
    stop: () => {
      stopped = true;
      pause();
      resized.disconnect();
      themed.disconnect();
      inView.disconnect();
      document.removeEventListener("visibilitychange", onVisible);
      less.removeEventListener("change", refresh);
      for (const thing of bin) thing.dispose();
      bin = [];
      for (const person of people ?? []) person.dispose();
      renderer.dispose();
    },
  };
}

function seededStars() {
  let a = 99;
  return () => {
    a = (a * 16807) % 2147483647;
    return a / 2147483647;
  };
}

/** A signpost's name as a picture to lay on its board, in the site's own font. */
function signPicture(name: string, palette: Palette, host: HTMLElement) {
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const label = name.length > 24 ? `${name.slice(0, 23).trimEnd()}…` : name;
    const family = getComputedStyle(host).fontFamily || "sans-serif";
    const ink = palette.dark ? palette.background : palette.foreground;
    ctx.fillStyle = `#${ink.getHexString()}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    let px = 62;
    do {
      ctx.font = `600 ${px}px ${family}`;
      px -= 2;
    } while (ctx.measureText(label).width > 600 && px > 20);
    ctx.fillText(label, 320, 68);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

