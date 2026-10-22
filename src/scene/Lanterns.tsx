import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import {
  AdditiveBlending,
  CanvasTexture,
  CylinderGeometry,
  Group,
  MeshBasicMaterial,
  PerspectiveCamera,
  SpriteMaterial,
} from 'three';
import { lantern } from '../content/palette';
import { isSmallScreen } from '../lib/device';
import { frame } from './frame';
import { seeded, wrap } from './wrap';

interface Lantern {
  x: number;
  y: number;
  z: number;
  speed: number;
  phase: number;
}

function glowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.3, 'rgba(255,255,255,0.45)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  return new CanvasTexture(canvas);
}

/**
 * Tukkal: 40 to 60 small glowing lanterns that rise from every terrace once
 * night falls (half as many on phones). The three hero lanterns with the
 * goals are HTML buttons in the overlay, so their text stays real text.
 */
export function Lanterns() {
  const root = useRef<Group>(null);
  const items = useRef<(Group | null)[]>([]);

  const parts = useMemo(() => {
    const rand = seeded(57);
    const count = isSmallScreen() ? 25 : 50;
    const list: Lantern[] = Array.from({ length: count }, () => ({
      x: (rand() - 0.5) * 140,
      y: rand() * 100,
      z: -8 - rand() * 55,
      speed: 0.25 + rand() * 0.35,
      phase: rand() * Math.PI * 2,
    }));
    return {
      list,
      body: new CylinderGeometry(0.16, 0.2, 0.34, 8),
      bodyMaterial: new MeshBasicMaterial({ color: lantern.core, transparent: true }),
      glowMap: glowTexture(),
    };
  }, []);
  const glowMaterial = useMemo(
    () =>
      new SpriteMaterial({
        map: parts.glowMap,
        color: lantern.glow,
        blending: AdditiveBlending,
        transparent: true,
        depthWrite: false,
      }),
    [parts],
  );

  useEffect(
    () => () => {
      parts.body.dispose();
      parts.bodyMaterial.dispose();
      parts.glowMap.dispose();
      glowMaterial.dispose();
    },
    [parts, glowMaterial],
  );

  useFrame((state, delta) => {
    const night = frame.sky.night;
    if (root.current) root.current.visible = night > 0.01;
    if (night <= 0.01) return;
    const camera = state.camera as PerspectiveCamera;
    const tanHalf = Math.tan((camera.fov * Math.PI) / 360);
    const aspect = state.size.width / state.size.height;
    const t = frame.time;
    parts.bodyMaterial.opacity = night;
    glowMaterial.opacity = 0.8 * night;
    parts.list.forEach((l, i) => {
      const g = items.current[i];
      if (!g) return;
      l.y += l.speed * Math.min(delta, 0.1);
      const dist = camera.position.z - l.z;
      const halfH = dist * tanHalf + 1;
      const halfW = dist * tanHalf * aspect + 1;
      g.position.set(
        wrap(l.x + 0.4 * Math.sin(t * 0.3 + l.phase), camera.position.x, halfW),
        wrap(l.y, camera.position.y, halfH * 1.1),
        l.z,
      );
      // Gentle flicker.
      g.scale.setScalar(1 + 0.08 * Math.sin(t * 7 + l.phase) * Math.sin(t * 3.1 + l.phase * 2));
    });
  });

  return (
    <group ref={root} visible={false}>
      {parts.list.map((_, i) => (
        <group key={i} ref={(el) => (items.current[i] = el)}>
          <mesh geometry={parts.body} material={parts.bodyMaterial} />
          <sprite material={glowMaterial} scale={[1.5, 1.5, 1]} />
        </group>
      ))}
    </group>
  );
}
