import { useFrame } from '@react-three/fiber';
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import {
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  Color,
  CylinderGeometry,
  Euler,
  Group,
  IcosahedronGeometry,
  InstancedBufferAttribute,
  InstancedMesh,
  LatheGeometry,
  LineBasicMaterial,
  Matrix4,
  PerspectiveCamera,
  PlaneGeometry,
  Quaternion,
  ShaderMaterial,
  Vector2,
  Vector3,
} from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { isSmallScreen } from '../lib/device';
import { frame } from './frame';
import { hazeChunk, hazeUniforms, updateHaze } from './haze';
import { smoothstep } from './skyMath';
import { seeded } from './wrap';

/** Floor of the home terrace. The kite waits here at the start and falls back here in a cut. */
export const LANDING_TOP = -0.42;
/** Houses run down to this height, lost in the haze long before the camera sees it. */
const GROUND = -26;
const STOREY = 1.25;

const HOUSE_COLOURS = [
  '#EFE3D0', '#E8C9A4', '#DDA584', '#E9D2B0', '#CDA683', '#E6CBC2',
  '#C3D0C1', '#C9D4DC', '#F2EADC', '#DDB27E', '#E3BBA0', '#D4C2A8',
];
const TREE_COLOURS = ['#7E9B6B', '#6E8C64', '#8EA673', '#738F6F'];
const CLOTH_COLOURS = ['#F08C00', '#FFF8EE', '#5B7FA8', '#D6336C', '#F2C230'];
const TANK = '#3E414A';

// Home terrace layout. The camera stands near its front; the back parapet
// runs across the view with the city beyond.
export const PARAPET_Z = -1;
const TERRACE = { left: -9, right: 9, back: PARAPET_Z - 0.3, front: 16 };
const PARAPET_H = 0.62;
/** Top of the parapet's coping, where the kite stands before launch. */
export const COPING_TOP = LANDING_TOP + PARAPET_H + 0.1;
const LINE_X = [-6.4, -3.6];
const LINE_Z = PARAPET_Z + 0.7;

interface Box {
  x: number;
  y: number;
  z: number;
  w: number;
  h: number;
  d: number;
  colour: string;
  /** Roof height, for the window band. */
  top?: number;
  rotY?: number;
}

interface Layout {
  houses: Box[];
  details: Box[];
  rims: Box[];
  tanks: Box[];
  trees: Box[];
  temples: Box[];
  cloths: Box[];
}

function layoutCity(small: boolean): Layout {
  const rand = seeded(23);
  const pick = <T,>(list: T[]) => list[Math.floor(rand() * list.length)];
  const out: Layout = { houses: [], details: [], rims: [], tanks: [], trees: [], temples: [], cloths: [] };
  const cell = 8.5;
  const keep = small ? 0.6 : 1;

  const addHouse = (x: number, z: number, top: number) => {
    const w = 4 + rand() * 3.4;
    const d = 4 + rand() * 3.4;
    const colour = pick(HOUSE_COLOURS);
    out.houses.push({ x, y: (top + GROUND) / 2, z, w, h: top - GROUND, d, colour, top });
    // Parapet rim, slightly lighter than the walls.
    const rim = new Color(colour).lerp(new Color('#ffffff'), 0.25).getStyle();
    out.rims.push({ x, y: top, z, w: w + 0.04, h: 0.38, d: d + 0.04, colour: rim });
    if (rand() < 0.42) {
      out.tanks.push({ x: x + (rand() - 0.5) * w * 0.5, y: top + 0.42, z: z + (rand() - 0.5) * d * 0.5, w: 1, h: 1, d: 1, colour: TANK });
    }
    if (rand() < 0.3) {
      // Stair room ("mumty") on one corner of the roof.
      const sx = x + (rand() < 0.5 ? -1 : 1) * (w / 2 - 0.9);
      out.details.push({ x: sx, y: top + 0.75, z: z - d / 2 + 1.1, w: 1.8, h: 1.5, d: 2.2, colour });
    }
  };

  // Neighbours beyond the parapet, out to the horizon. Far rows thin out: the haze hides them anyway.
  for (let z = -6; z > -240; z -= cell) {
    const half = 26 + -z * 1.0;
    const density = keep * (1 - 0.45 * smoothstep(-60, -220, z));
    for (let x = -half; x < half; x += cell) {
      if (rand() > density) continue;
      const jx = x + (rand() - 0.5) * 2.4;
      const jz = z + (rand() - 0.5) * 2.4;
      if (rand() < 0.12) {
        const r = 1.6 + rand() * 1.2;
        out.trees.push({ x: jx, y: LANDING_TOP - 1.6 + rand() * 1.4, z: jz, w: r, h: r * 0.8, d: r, colour: pick(TREE_COLOURS) });
        continue;
      }
      // Close behind the parapet the roofs stay low, so the view opens over the city.
      const near = smoothstep(-40, -8, z);
      const storeys = Math.floor(rand() * 4) + (rand() < 0.08 ? 3 : 0);
      const top = LANDING_TOP - 0.6 - near * 1.6 + (storeys - 1.5) * STOREY * (1 - 0.6 * near);
      addHouse(jx, jz, top);
    }
  }

  // Neighbours to the left and right of the home terrace.
  for (let z = 14; z > -6; z -= cell) {
    for (const side of [-1, 1]) {
      for (let i = 0; i < 3; i++) {
        if (rand() > keep) continue;
        addHouse(side * (14 + i * cell + rand() * 2), z + (rand() - 0.5) * 2, LANDING_TOP - 0.4 + (rand() - 0.6) * 2.6);
      }
    }
  }

  // Two temple spires on the skyline, faint in the haze.
  out.temples.push({ x: -62, y: LANDING_TOP - 4, z: -150, w: 1.9, h: 1.9, d: 1.9, colour: '#E9D5B8' });
  out.temples.push({ x: 92, y: LANDING_TOP - 4, z: -232, w: 2.4, h: 2.4, d: 2.4, colour: '#E4CBAA' });

  // The home terrace: floor, parapets with a coping, a stair room, a tank and a washing line.
  const t = LANDING_TOP;
  const floor = '#E8D6BC';
  const wall = '#E2C7A2';
  const cap = '#F1E2CB';
  const { left, right, back, front } = TERRACE;
  out.details.push({ x: 0, y: (t + GROUND) / 2, z: (back + front) / 2, w: right - left, h: t - GROUND, d: front - back, colour: floor });
  out.details.push({ x: 0, y: t + PARAPET_H / 2, z: PARAPET_Z, w: right - left, h: PARAPET_H, d: 0.26, colour: wall });
  out.details.push({ x: 0, y: t + PARAPET_H + 0.05, z: PARAPET_Z, w: right - left + 0.1, h: 0.1, d: 0.42, colour: cap });
  for (const sx of [left, right]) {
    out.details.push({ x: sx, y: t + PARAPET_H / 2, z: (PARAPET_Z + front) / 2, w: 0.26, h: PARAPET_H, d: front - PARAPET_Z, colour: wall });
    out.details.push({ x: sx, y: t + PARAPET_H + 0.05, z: (PARAPET_Z + front) / 2, w: 0.42, h: 0.1, d: front - PARAPET_Z, colour: cap });
  }
  // Stair room in the back left corner, with its door.
  out.details.push({ x: left + 1.6, y: t + 1.25, z: PARAPET_Z + 1.4, w: 3.2, h: 2.5, d: 2.8, colour: wall });
  out.details.push({ x: left + 1.6, y: t + 2.55, z: PARAPET_Z + 1.4, w: 3.4, h: 0.12, d: 3.0, colour: cap });
  out.details.push({ x: left + 2.2, y: t + 0.85, z: PARAPET_Z + 2.82, w: 0.9, h: 1.7, d: 0.05, colour: '#8C6A4E' });
  out.tanks.push({ x: 7.7, y: t + 0.5, z: PARAPET_Z + 0.8, w: 0.95, h: 1, d: 0.95, colour: TANK });
  // Tulsi pots on the parapet coping.
  const copingTop = t + PARAPET_H + 0.1;
  for (const px of [-2.6, 3.1]) {
    out.tanks.push({ x: px, y: copingTop + 0.15, z: PARAPET_Z, w: 0.4, h: 0.3, d: 0.4, colour: '#B4603F' });
    out.trees.push({ x: px, y: copingTop + 0.42, z: PARAPET_Z, w: 0.3, h: 0.26, d: 0.3, colour: '#6F8F5A' });
  }
  // Washing line between two poles in the back left, with clothes drying.
  for (const px of LINE_X) {
    out.details.push({ x: px, y: t + 0.65, z: LINE_Z, w: 0.06, h: 1.3, d: 0.06, colour: '#9A8A78' });
  }
  CLOTH_COLOURS.slice(0, 4).forEach((colour, i) => {
    out.cloths.push({ x: LINE_X[0] + 0.55 + i * 0.66, y: t + 1.24, z: LINE_Z, w: 0.4 + (i % 2) * 0.08, h: 0.38 + (i % 3) * 0.08, d: 1, colour });
  });
  return out;
}

const vertexShader = /* glsl */ `
  #ifdef WINDOWS
  attribute float aTop;
  varying float vTop;
  #endif
  varying vec3 vColor;
  varying vec3 vNormalW;
  varying vec3 vWorld;
  void main() {
    mat4 m = modelMatrix * instanceMatrix;
    vec4 world = m * vec4(position, 1.0);
    vWorld = world.xyz;
    vNormalW = normalize(mat3(m) * normal);
    vColor = instanceColor;
    #ifdef WINDOWS
    vTop = aTop;
    #endif
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const fragmentShader = /* glsl */ `
  ${hazeChunk}
  uniform float uLit;
  varying vec3 vColor;
  varying vec3 vNormalW;
  varying vec3 vWorld;
  #ifdef WINDOWS
  varying float vTop;
  #endif

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  void main() {
    vec3 n = normalize(vNormalW);
    vec3 col = lightFace(vColor, n);
    float dist = length(vWorld - cameraPosition);

    #ifdef WINDOWS
    if (abs(n.y) < 0.5) {
      float u = abs(n.x) > 0.5 ? vWorld.z : vWorld.x;
      float v = vWorld.y + 40.0;
      vec2 cell = vec2(floor(u / 1.5), floor(v / ${STOREY.toFixed(2)}));
      float fu = fract(u / 1.5);
      float fv = fract(v / ${STOREY.toFixed(2)});
      float below = step(vWorld.y, vTop - 0.45);
      // Floor slabs project a little: a soft shadow line under each one.
      col *= 1.0 - 0.1 * below * smoothstep(0.84, 0.9, fv);
      float window = step(0.3, fu) * step(fu, 0.7) * step(0.32, fv) * step(fv, 0.72) * below;
      window *= 1.0 - smoothstep(50.0, 120.0, dist);
      vec3 pane = col * 0.6;
      float lit = step(hash(cell + vColor.rg * 17.0), uLit);
      pane = mix(pane, vec3(1.0, 0.78, 0.45), lit);
      col = mix(col, pane, window);
    }
    #endif

    #ifndef WINDOWS
    // Square tiles on the home terrace floor.
    if (n.y > 0.5 && abs(vWorld.y - ${LANDING_TOP.toFixed(2)}) < 0.01) {
      vec2 tile = vWorld.xz / 1.1;
      vec2 f = abs(fract(tile) - 0.5);
      vec2 w = fwidth(tile) * 1.2;
      float line = max(smoothstep(0.5 - 0.025 - w.x, 0.5 - 0.025, f.x), smoothstep(0.5 - 0.025 - w.y, 0.5 - 0.025, f.y));
      col *= (1.0 - 0.07 * line) * (0.97 + 0.05 * hash(floor(tile)));
    }
    #endif

    float haze = 1.0 - exp(-dist * 0.0095);
    // House walls fade out below the roofs, so no ground is needed.
    haze = max(haze, smoothstep(${(LANDING_TOP - 3).toFixed(2)}, ${(LANDING_TOP - 13).toFixed(2)}, vWorld.y));
    gl_FragColor = vec4(finishColour(col, haze), 1.0);
    #include <colorspace_fragment>
  }
`;

function createMaterial(windows: boolean) {
  return new ShaderMaterial({
    vertexShader,
    fragmentShader,
    defines: windows ? { WINDOWS: '' } : {},
    uniforms: { ...hazeUniforms(), uLit: { value: 0 } },
  });
}

/** A unit parapet frame: four thin walls around the edge of a roof, base at y = 0. */
function rimGeometry() {
  const t = 0.07;
  const walls = [
    [0, 0.5 - t / 2, 1, t],
    [0, -0.5 + t / 2, 1, t],
    [0.5 - t / 2, 0, t, 1],
    [-0.5 + t / 2, 0, t, 1],
  ].map(([x, z, w, d]) => new BoxGeometry(w, 1, d).translate(x, 0.5, z));
  return mergeGeometries(walls)!;
}

/** Octagonal temple shikhara with its amalaka and a saffron flag pole. */
function templeGeometry() {
  const profile = [
    [1.7, 0], [1.7, 1.1], [1.35, 1.2], [1.35, 2.6], [1.2, 4.4], [0.92, 6.0], [0.6, 7.2],
    [0.36, 7.7], [0.62, 7.85], [0.36, 8.05], [0.16, 8.2], [0.12, 8.7], [0, 9],
  ].map(([r, y]) => new Vector2(r, y));
  const spire = new LatheGeometry(profile, 8);
  const pole = new BoxGeometry(0.05, 1.6, 0.05).translate(0, 9.6, 0);
  const flag = new BufferGeometry();
  flag.setAttribute('position', new BufferAttribute(new Float32Array([0, 10.4, 0, 0.9, 10.15, 0, 0, 9.9, 0]), 3));
  flag.computeVertexNormals();
  const parts = [spire.toNonIndexed(), pole.toNonIndexed(), flag];
  // Only positions and normals are used; drop the rest so the parts merge.
  parts.forEach((g) => g.deleteAttribute('uv'));
  return mergeGeometries(parts)!;
}

function fill(mesh: InstancedMesh | null, boxes: Box[]) {
  if (!mesh) return;
  const m = new Matrix4();
  const q = new Quaternion();
  const e = new Euler();
  const colour = new Color();
  boxes.forEach((b, i) => {
    q.setFromEuler(e.set(0, b.rotY ?? 0, 0));
    m.compose(new Vector3(b.x, b.y, b.z), q, new Vector3(b.w, b.h, b.d));
    mesh.setMatrixAt(i, m);
    mesh.setColorAt(i, colour.set(b.colour));
  });
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  mesh.computeBoundingSphere();
}

/**
 * Vadodara at dawn: flat-roofed houses in soft whitewash, sand and pastel,
 * with parapets, black water tanks, stair rooms, trees and two temple
 * spires, all dissolving into the haze. In front, the home terrace where
 * the kite waits for launch and where a cut kite falls back to.
 */
export function Rooftops() {
  const city = useRef<Group>(null);
  const refs = {
    houses: useRef<InstancedMesh>(null),
    details: useRef<InstancedMesh>(null),
    rims: useRef<InstancedMesh>(null),
    tanks: useRef<InstancedMesh>(null),
    trees: useRef<InstancedMesh>(null),
    temples: useRef<InstancedMesh>(null),
    cloths: useRef<InstancedMesh>(null),
  };

  const parts = useMemo(() => {
    const layout = layoutCity(isSmallScreen());
    const line = new BufferGeometry();
    const lineY = LANDING_TOP + 1.25;
    line.setAttribute(
      'position',
      new BufferAttribute(new Float32Array([LINE_X[0], lineY, LINE_Z, LINE_X[1], lineY, LINE_Z]), 3),
    );
    const box = new BoxGeometry(1, 1, 1);
    box.setAttribute('aTop', new InstancedBufferAttribute(new Float32Array(layout.houses.map((h) => h.top ?? 0)), 1));
    return {
      layout,
      box,
      detailBox: new BoxGeometry(1, 1, 1),
      rim: rimGeometry(),
      tank: new CylinderGeometry(0.5, 0.5, 1, 12),
      tree: new IcosahedronGeometry(1, 1),
      temple: templeGeometry(),
      cloth: new PlaneGeometry(1, 1).translate(0, -0.5, 0),
      line,
      houseMaterial: createMaterial(true),
      detailMaterial: createMaterial(false),
      lineMaterial: new LineBasicMaterial({ color: '#5a5046' }),
    };
  }, []);

  useLayoutEffect(() => {
    const { layout } = parts;
    fill(refs.houses.current, layout.houses);
    fill(refs.details.current, layout.details);
    fill(refs.rims.current, layout.rims);
    fill(refs.tanks.current, layout.tanks);
    fill(refs.trees.current, layout.trees);
    fill(refs.temples.current, layout.temples);
    fill(refs.cloths.current, layout.cloths);
  }, [parts]);

  useEffect(
    () => () => {
      [parts.box, parts.detailBox, parts.rim, parts.tank, parts.tree, parts.temple, parts.cloth, parts.line].forEach((g) =>
        g.dispose(),
      );
      [parts.houseMaterial, parts.detailMaterial, parts.lineMaterial].forEach((m) => m.dispose());
    },
    [parts],
  );

  useFrame((state) => {
    const camera = state.camera as PerspectiveCamera;
    // The city fades into the sky as the kite climbs away from it.
    const fade = smoothstep(9, 30, camera.position.y - LANDING_TOP);
    if (city.current) city.current.visible = fade < 0.999;
    if (fade >= 0.999) return;
    const { width, height } = state.gl.domElement;
    // A few windows still lit at dawn.
    const lit = 0.16 * (1 - smoothstep(20, 160, frame.skyAltitude)) + 0.5 * frame.sky.night;
    for (const m of [parts.houseMaterial, parts.detailMaterial]) {
      updateHaze(m.uniforms as ReturnType<typeof hazeUniforms>, width, height, fade);
      m.uniforms.uLit.value = lit;
    }
    parts.lineMaterial.color.set('#5a5046').lerp(frame.sky.horizon, fade);
  });

  const { layout } = parts;
  return (
    <group ref={city}>
      <instancedMesh ref={refs.houses} args={[parts.box, parts.houseMaterial, layout.houses.length]} frustumCulled={false} />
      <instancedMesh ref={refs.rims} args={[parts.rim, parts.detailMaterial, layout.rims.length]} frustumCulled={false} />
      <instancedMesh ref={refs.details} args={[parts.detailBox, parts.detailMaterial, layout.details.length]} frustumCulled={false} />
      <instancedMesh ref={refs.tanks} args={[parts.tank, parts.detailMaterial, layout.tanks.length]} frustumCulled={false} />
      <instancedMesh ref={refs.trees} args={[parts.tree, parts.detailMaterial, layout.trees.length]} frustumCulled={false} />
      <instancedMesh ref={refs.temples} args={[parts.temple, parts.detailMaterial, layout.temples.length]} frustumCulled={false} />
      <instancedMesh ref={refs.cloths} args={[parts.cloth, parts.detailMaterial, layout.cloths.length]} frustumCulled={false} />
      <lineSegments geometry={parts.line} material={parts.lineMaterial} />
    </group>
  );
}
