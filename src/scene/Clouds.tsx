import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import { CanvasTexture, Color, Mesh, PerspectiveCamera, PlaneGeometry, ShaderMaterial } from 'three';
import { isSmallScreen } from '../lib/device';
import { frame } from './frame';
import { LANDING_TOP } from './Rooftops';
import { smoothstep } from './skyMath';
import { seeded, wrap } from './wrap';

interface Layer {
  z: number;
  count: number;
  size: number;
  speed: number;
  opacity: number;
}

// Near, mid and far layers, and a high layer of thin streaks. Perspective gives the parallax.
const LAYERS: Layer[] = [
  { z: -12, count: 4, size: 9, speed: 0.3, opacity: 0.9 },
  { z: -36, count: 9, size: 15, speed: 0.2, opacity: 0.85 },
  { z: -85, count: 12, size: 30, speed: 0.1, opacity: 0.75 },
];
const STREAKS: Layer = { z: -150, count: 7, size: 70, speed: 0.06, opacity: 0.45 };
/** Extra clouds that fade in only under overcast skies. */
const EXTRA_PER_LAYER = [3, 5, 4];

interface Cloud {
  layer: Layer;
  x: number;
  y: number;
  speed: number;
  opacity: number;
  extra: boolean;
  texture: number;
  scale: number;
  aspect: number;
}

/**
 * A soft cumulus on a 512 x 256 canvas. Alpha is the cloud's shape; the red
 * channel is how much sunlight a point catches (bright on top, shaded
 * underneath), which the shader turns into the sky's colours.
 */
function cumulusTexture(seed: number): CanvasTexture {
  const rand = seeded(seed);
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  const base = 190;
  const puff = (x: number, y: number, r: number) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.55, 'rgba(255,255,255,0.95)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  };
  // A wide base, then a crown of puffs that is tallest just off centre.
  for (let i = 0; i < 9; i++) puff(80 + i * 44 + rand() * 12, base - 18 - rand() * 10, 34 + rand() * 16);
  const peak = 200 + rand() * 120;
  for (let i = 0; i < 9; i++) {
    const x = 110 + rand() * 300;
    const h = 1 - Math.min(1, Math.abs(x - peak) / 200);
    puff(x, base - 40 - h * 70 - rand() * 20, 30 + h * 46 + rand() * 14);
  }
  // Flat underside.
  ctx.globalCompositeOperation = 'destination-out';
  const cut = ctx.createLinearGradient(0, base - 12, 0, base + 18);
  cut.addColorStop(0, 'rgba(0,0,0,0)');
  cut.addColorStop(1, 'rgba(0,0,0,1)');
  ctx.fillStyle = cut;
  ctx.fillRect(0, base - 12, 512, 256 - base + 12);
  softenEdges(ctx, 512, 256);
  // Shading: lit from above, darker toward the base.
  ctx.globalCompositeOperation = 'source-atop';
  const shade = ctx.createLinearGradient(0, 40, 0, base);
  shade.addColorStop(0, 'rgb(255,255,255)');
  shade.addColorStop(0.55, 'rgb(225,225,225)');
  shade.addColorStop(1, 'rgb(120,120,120)');
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, 512, 256);
  return new CanvasTexture(canvas);
}

/** Fades a texture to nothing at its edges, so no plane ever shows a hard border. */
function softenEdges(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.globalCompositeOperation = 'destination-in';
  const across = ctx.createLinearGradient(0, 0, w, 0);
  across.addColorStop(0, 'rgba(0,0,0,0)');
  across.addColorStop(0.14, 'rgba(0,0,0,1)');
  across.addColorStop(0.86, 'rgba(0,0,0,1)');
  across.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = across;
  ctx.fillRect(0, 0, w, h);
  const down = ctx.createLinearGradient(0, 0, 0, h);
  down.addColorStop(0, 'rgba(0,0,0,0)');
  down.addColorStop(0.12, 'rgba(0,0,0,1)');
  down.addColorStop(0.88, 'rgba(0,0,0,1)');
  down.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = down;
  ctx.fillRect(0, 0, w, h);
}

/** Long thin streaks for the high layer. */
function streakTexture(seed: number): CanvasTexture {
  const rand = seeded(seed);
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  for (let i = 0; i < 14; i++) {
    const x = 150 + rand() * 210;
    const y = 40 + rand() * 50;
    const w = 60 + rand() * 110;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(1, 0.09 + rand() * 0.06);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, w);
    g.addColorStop(0, 'rgba(255,255,255,0.55)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, w, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  softenEdges(ctx, 512, 128);
  return new CanvasTexture(canvas);
}

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform sampler2D uMap;
  uniform vec3 uLit;
  uniform vec3 uShade;
  uniform float uOpacity;
  varying vec2 vUv;
  void main() {
    vec4 t = texture2D(uMap, vUv);
    vec3 col = mix(uShade, uLit, t.r);
    gl_FragColor = vec4(col, t.a * uOpacity);
    #include <colorspace_fragment>
  }
`;

const WHITE = new Color('#ffffff');
const GREY = new Color('#9aa1aa');
const NIGHT = new Color('#3a4566');

export function Clouds() {
  const meshes = useRef<(Mesh | null)[]>([]);

  const { clouds, textures, materials, geometry } = useMemo(() => {
    const rand = seeded(7);
    const factor = isSmallScreen() ? 0.5 : 1;
    const list: Cloud[] = [];
    const add = (layer: Layer, count: number, extra: boolean, streak: boolean) => {
      for (let i = 0; i < count; i++) {
        list.push({
          layer,
          x: (rand() - 0.5) * 220,
          y: rand() * 220,
          speed: layer.speed * (0.7 + rand() * 0.6),
          opacity: layer.opacity * (0.75 + rand() * 0.25),
          extra,
          texture: streak ? 4 : Math.floor(rand() * 4),
          scale: layer.size * (0.7 + rand() * 0.6),
          aspect: streak ? 0.25 : 0.5,
        });
      }
    };
    LAYERS.forEach((layer, li) => {
      add(layer, Math.round(layer.count * factor), false, false);
      add(layer, Math.round(EXTRA_PER_LAYER[li] * factor), true, false);
    });
    add(STREAKS, Math.round(STREAKS.count * factor), false, true);
    const tex = [cumulusTexture(11), cumulusTexture(29), cumulusTexture(53), cumulusTexture(71), streakTexture(5)];
    const mats = list.map(
      (c) =>
        new ShaderMaterial({
          vertexShader,
          fragmentShader,
          transparent: true,
          depthWrite: false,
          uniforms: {
            uMap: { value: tex[c.texture] },
            uLit: { value: new Color() },
            uShade: { value: new Color() },
            uOpacity: { value: 0 },
          },
        }),
    );
    return { clouds: list, textures: tex, materials: mats, geometry: new PlaneGeometry() };
  }, []);

  useEffect(
    () => () => {
      geometry.dispose();
      textures.forEach((t) => t.dispose());
      materials.forEach((m) => m.dispose());
    },
    [geometry, textures, materials],
  );

  const lit = useMemo(() => new Color(), []);
  const shade = useMemo(() => new Color(), []);

  useFrame((state, delta) => {
    const camera = state.camera as PerspectiveCamera;
    const dt = Math.min(delta, 0.1);
    const { sky } = frame;
    const tanHalf = Math.tan((camera.fov * Math.PI) / 360);
    const aspect = state.size.width / state.size.height;
    const grey = Math.max(sky.overcast * 0.7, frame.desat * 0.6);

    // Sunlit tops take a little of the horizon's warmth; shaded bases take the sky's own colour.
    lit.copy(WHITE).lerp(sky.horizon, 0.18).lerp(GREY, grey * 0.6).lerp(NIGHT, sky.night * 0.85);
    shade
      .copy(sky.top)
      .lerp(sky.horizon, 0.35)
      .lerp(GREY, grey)
      .multiplyScalar(0.9)
      .lerp(NIGHT, sky.night * 0.7)
      .multiplyScalar(1 - 0.35 * sky.night);

    clouds.forEach((cloud, i) => {
      const mesh = meshes.current[i];
      if (!mesh) return;
      const dist = camera.position.z - cloud.layer.z;
      const halfH = dist * tanHalf + cloud.scale * 0.5;
      const halfW = dist * tanHalf * aspect + cloud.scale;
      cloud.x += cloud.speed * dt;
      const y = wrap(cloud.y, camera.position.y, halfH * 1.2);
      mesh.position.set(wrap(cloud.x, camera.position.x, halfW), y, cloud.layer.z);
      const u = materials[i].uniforms;
      u.uLit.value.copy(lit);
      u.uShade.value.copy(shade);
      const cover = Math.max(sky.overcast, frame.desat);
      // No clouds down among the houses.
      const aboveRoofs = smoothstep(LANDING_TOP + 3, LANDING_TOP + 10, y);
      u.uOpacity.value = cloud.opacity * (cloud.extra ? cover : 0.85 + 0.15 * cover) * aboveRoofs;
    });
  });

  return (
    <group>
      {clouds.map((cloud, i) => (
        <mesh
          key={i}
          ref={(m) => (meshes.current[i] = m)}
          geometry={geometry}
          material={materials[i]}
          scale={[cloud.scale, cloud.scale * cloud.aspect, 1]}
          renderOrder={-500 - Math.round(-cloud.layer.z)}
        />
      ))}
    </group>
  );
}
