import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { clone } from "three/examples/jsm/utils/SkeletonUtils.js";
import { DOG, PEOPLE, characterFile } from "./hero-3d-files";
import { brightness, mix, type Palette } from "./hero-3d-models";

/**
 * The people and the dog for the 3D hero look: ready-made characters with a
 * recorded walk (public-domain models by Quaternius, slimmed down; see
 * hero-3d-files.ts). They are shown in the site's own greys, not the colours they came with.
 */

/** How tall a full-size walker stands, and the dog to the tips of its ears, in metres. */
export const TALL = 1.72;
export const DOG_TALL = 0.68;

export type Person = {
  figure: THREE.Object3D;
  walk: THREE.AnimationClip;
  /** Head to toe, and where the soles are, in the model's own units. */
  height: number;
  floor: number;
  /** How far one full turn of the walk carries the body, in the model's own units. */
  stride: number;
  /** Frees its graphics memory. The character itself is kept, ready for the next scene. */
  dispose: () => void;
};

export type Cast = { people: Person[]; dog: Person | null };

let cast: Promise<Cast> | null = null;

/** The characters, fetched and measured once and then shared by every scene on every page. */
export function loadCast(): Promise<Cast> {
  cast ??= fetchCast().catch((error: unknown) => {
    cast = null;
    throw error;
  });
  return cast;
}

async function fetchCast(): Promise<Cast> {
  const loader = new GLTFLoader();
  const one = async (name: string): Promise<Person> => {
    const file = await loader.loadAsync(characterFile(name));
    const figure = file.scene;
    const walk = file.animations.find((clip) => clip.name === "Walk") ?? file.animations[0];
    if (!walk) throw new Error(`No walk in ${name}`);
    const shapes: THREE.BufferGeometry[] = [];
    const skins: THREE.Material[] = [];
    figure.traverse((part) => {
      const mesh = part as THREE.Mesh;
      if (!mesh.isMesh) return;
      shapes.push(mesh.geometry);
      skins.push(...(Array.isArray(mesh.material) ? mesh.material : [mesh.material]));
    });
    return {
      figure,
      walk,
      ...sizeUp(figure, walk),
      dispose: () => {
        for (const thing of [...shapes, ...skins]) thing.dispose();
      },
    };
  };
  // All the people or none (a mixed group would look odd); the dog can be missing on its own.
  const [people, dog] = await Promise.all([Promise.all(PEOPLE.map(one)), one(DOG).catch(() => null)]);
  return { people, dog };
}

/** Measures a character mid-walk: its height, its soles, and the length of its step. */
function sizeUp(figure: THREE.Object3D, walk: THREE.AnimationClip) {
  const mixer = new THREE.AnimationMixer(figure);
  mixer.clipAction(walk).play();
  const pose = (time: number) => {
    mixer.setTime(time);
    figure.updateMatrixWorld(true);
  };
  pose(0);
  const box = new THREE.Box3();
  figure.traverse((part) => {
    const mesh = part as THREE.SkinnedMesh;
    if (!mesh.isSkinnedMesh) return;
    mesh.computeBoundingBox();
    if (mesh.boundingBox) box.union(mesh.boundingBox.clone().applyMatrix4(mesh.matrixWorld));
  });
  const height = box.max.y - box.min.y || 1;
  // The feet are the low bones that swing furthest: twice their swing is one full turn of the walk.
  const bones: THREE.Object3D[] = [];
  figure.traverse((part) => {
    if ((part as THREE.Bone).isBone) bones.push(part);
  });
  const reach = bones.map(() => ({ min: Infinity, max: -Infinity, y: 0 }));
  const at = new THREE.Vector3();
  const STEPS = 24;
  for (let i = 0; i < STEPS; i++) {
    pose((walk.duration * i) / STEPS);
    bones.forEach((bone, b) => {
      const r = reach[b];
      if (!r) return;
      bone.getWorldPosition(at);
      r.min = Math.min(r.min, at.z);
      r.max = Math.max(r.max, at.z);
      r.y += at.y / STEPS;
    });
  }
  let swing = 0;
  for (const r of reach) if (r.y < box.min.y + height * 0.25) swing = Math.max(swing, r.max - r.min);
  mixer.stopAllAction();
  mixer.uncacheRoot(figure);
  return { height, floor: box.min.y, stride: (swing || height * 0.4) * 1.9 };
}

/** A grey for one part of a character, as light or dark as the colour it came with. */
function tone(palette: Palette, name: string, came: THREE.Color, shift: number) {
  if (/^skin/i.test(name)) return palette.skin;
  const light = brightness(came);
  const plain = /hair|eye|shoe|sock/i.test(name) ? 0 : shift;
  const t = palette.dark ? 0.3 + light * 0.6 - plain : 0.92 - light * 0.75 + plain;
  return mix(palette.background, palette.foreground, Math.min(0.95, Math.max(0.2, t)));
}

/**
 * One walker made from a character: stood on the ground, facing along the
 * path, `tall` metres high, and dressed in greys. `walkTo(t)` puts it at that
 * moment of its walk, with steps timed to `pace` (metres a second) so the feet don't slide.
 */
export function castPerson(person: Person, palette: Palette, tall: number, shift: number, pace: number, keep: <T extends { dispose: () => void }>(thing: T) => T) {
  const figure = clone(person.figure);
  const k = tall / person.height;
  figure.scale.multiplyScalar(k);
  figure.rotation.y = Math.PI / 2;
  figure.position.y = -person.floor * k;
  const skins = new Map<THREE.Material, THREE.Material>();
  figure.traverse((part) => {
    const mesh = part as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.castShadow = true;
    // A walking figure moves outside the box it was measured in.
    mesh.frustumCulled = false;
    const dress = (came: THREE.Material) => {
      let skin = skins.get(came);
      if (!skin) {
        const colour = (came as THREE.MeshStandardMaterial).color ?? palette.foreground;
        skin = keep(new THREE.MeshLambertMaterial({ color: tone(palette, came.name, colour, shift), flatShading: true }));
        skins.set(came, skin);
      }
      return skin;
    };
    mesh.material = Array.isArray(mesh.material) ? mesh.material.map(dress) : dress(mesh.material);
  });
  const mixer = new THREE.AnimationMixer(figure);
  mixer.clipAction(person.walk).play();
  const rate = (pace * person.walk.duration) / (person.stride * k);
  return {
    figure,
    walkTo: (t: number) => mixer.setTime(t * rate),
    done: { dispose: () => mixer.stopAllAction() },
  };
}
