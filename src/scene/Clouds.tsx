import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import {
  CanvasTexture,
  Color,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  SRGBColorSpace,
} from 'three';
import { isSmallScreen } from '../lib/device';
import { frame } from './frame';

interface Layer {
  z: number;
  count: number;
  size: number;
  speed: number;
}

// Near, mid and far layers. Perspective gives the parallax as the camera rises.
const LAYERS: Layer[] = [
  { z: -10, count: 6, size: 7, speed: 0.35 },
  { z: -35, count: 10, size: 13, speed: 0.22 },
  { z: -80, count: 14, size: 26, speed: 0.12 },
];
/** Extra clouds that fade in only under overcast skies. */
const EXTRA_PER_LAYER = [3, 4, 3];

interface Cloud {
  layer: Layer;
  x: number;
  y: number;
  speed: number;
  opacity: number;
  extra: boolean;
  texture: number;
  scale: number;
}

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function makeCloudTexture(seed: number): CanvasTexture {
  const rand = seeded(seed);
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  for (let i = 0; i < 10; i++) {
    const x = 50 + rand() * 156;
    const y = 58 + rand() * 26 - (i % 3 === 0 ? 12 : 0);
    const r = 20 + rand() * 26;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, 'rgba(255,255,255,0.9)');
    g.addColorStop(0.6, 'rgba(255,255,255,0.45)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/** Wraps v into [center - half, center + half). */
const wrap = (v: number, center: number, half: number) =>
  center + ((((v - center + half) % (2 * half)) + 2 * half) % (2 * half)) - half;

const WHITE = new Color('#ffffff');
const GREY = new Color('#9aa1aa');

export function Clouds() {
  const meshes = useRef<(Mesh | null)[]>([]);

  const { clouds, textures, materials, geometry } = useMemo(() => {
    const rand = seeded(7);
    const factor = isSmallScreen() ? 0.5 : 1;
    const list: Cloud[] = [];
    LAYERS.forEach((layer, li) => {
      const total = Math.round(layer.count * factor) + Math.round(EXTRA_PER_LAYER[li] * factor);
      for (let i = 0; i < total; i++) {
        list.push({
          layer,
          x: (rand() - 0.5) * 200,
          y: rand() * 200,
          speed: layer.speed * (0.7 + rand() * 0.6),
          opacity: 0.55 + rand() * 0.35,
          extra: i >= Math.round(layer.count * factor),
          texture: Math.floor(rand() * 3),
          scale: layer.size * (0.75 + rand() * 0.5),
        });
      }
    });
    const tex = [makeCloudTexture(11), makeCloudTexture(29), makeCloudTexture(53)];
    const mats = list.map(
      (c) => new MeshBasicMaterial({ map: tex[c.texture], transparent: true, depthWrite: false, opacity: 0 }),
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

  const tint = useMemo(() => new Color(), []);

  useFrame((state, delta) => {
    const camera = state.camera as PerspectiveCamera;
    const dt = Math.min(delta, 0.1);
    const { sky } = frame;
    const tanHalf = Math.tan((camera.fov * Math.PI) / 360);
    const aspect = state.size.width / state.size.height;

    tint
      .copy(WHITE)
      .lerp(sky.horizon, 0.25)
      .lerp(GREY, sky.overcast * 0.7)
      .multiplyScalar(1 - 0.7 * sky.night);

    clouds.forEach((cloud, i) => {
      const mesh = meshes.current[i];
      if (!mesh) return;
      const dist = camera.position.z - cloud.layer.z;
      const halfH = dist * tanHalf + cloud.scale * 0.5;
      const halfW = dist * tanHalf * aspect + cloud.scale;
      cloud.x += cloud.speed * dt;
      mesh.position.set(
        wrap(cloud.x, camera.position.x, halfW),
        wrap(cloud.y, camera.position.y, halfH * 1.2),
        cloud.layer.z,
      );
      const material = materials[i];
      material.color.copy(tint);
      material.opacity = cloud.opacity * (cloud.extra ? sky.overcast : 0.8 + 0.2 * sky.overcast);
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
          scale={[cloud.scale, cloud.scale * 0.5, 1]}
          renderOrder={-500 - Math.round(-cloud.layer.z)}
        />
      ))}
    </group>
  );
}
