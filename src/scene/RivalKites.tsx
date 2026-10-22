import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import {
  BufferAttribute,
  BufferGeometry,
  Color,
  Group,
  Line,
  LineBasicMaterial,
  PerspectiveCamera,
} from 'three';
import { rivalKites } from '../content/palette';
import { isSmallScreen } from '../lib/device';
import { useFlight } from '../state/store';
import { SNAP } from './cutTimeline';
import { frame } from './frame';
import { createSailMaterial, sailGeometry, sparGeometry, createSparMaterial } from './kiteModel';
import { smoothstep } from './skyMath';
import { seeded, wrap } from './wrap';

/** Other lives on other terraces. Each string runs down and away toward its own roof. */
const STRING_DIR = { x: -0.55, y: -1 };
const STRING_LENGTH = 18;
/** Where the cutter settles, relative to the cross point: up and right, along its own string. */
const CUTTER_END = { x: -STRING_DIR.x * 3, y: -STRING_DIR.y * 3 };

interface Rival {
  x: number;
  y: number;
  z: number;
  phase: number;
  speed: number;
  side: 1 | -1;
}

function stringLine(material: LineBasicMaterial) {
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(new Float32Array(6), 3));
  // Dark at the kite, fading to nothing toward the far roof.
  g.setAttribute('color', new BufferAttribute(new Float32Array([0.24, 0.17, 0.17, 1, 0.24, 0.17, 0.17, 0]), 4));
  return new Line(g, material);
}

function setLine(line: Line, x: number, y: number, z: number, side: number) {
  const attr = line.geometry.getAttribute('position') as BufferAttribute;
  attr.setXYZ(0, x, y, z);
  attr.setXYZ(1, x + side * STRING_DIR.x * STRING_LENGTH, y + STRING_DIR.y * STRING_LENGTH, z);
  attr.needsUpdate = true;
  line.geometry.computeBoundingSphere();
}

const muted = (hex: string) => new Color(hex).lerp(new Color('#ffffff'), 0.55);

/**
 * 4 to 8 rival kites drifting and bobbing at different depths, and the one
 * that comes in from the left and crosses the string at Cut 1.
 */
export function RivalKites() {
  const groups = useRef<(Group | null)[]>([]);
  const cutter = useRef<Group>(null);

  const parts = useMemo(() => {
    const rand = seeded(91);
    const count = isSmallScreen() ? 4 : 7;
    const rivals: Rival[] = Array.from({ length: count }, (_, i) => ({
      x: (rand() - 0.5) * 120,
      y: rand() * 120,
      z: -14 - rand() * 40,
      phase: rand() * Math.PI * 2,
      speed: 0.3 + rand() * 0.4,
      side: i % 2 === 0 ? 1 : -1,
    }));
    const stringMaterial = new LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.5 });
    const materials = rivals.map((_, i) => {
      const m = createSailMaterial(true);
      const colour = rivalKites[i % rivalKites.length];
      m.uniforms.uMain.value.set(colour);
      m.uniforms.uSecond.value.copy(muted(colour));
      return m;
    });
    const cutterMaterial = createSailMaterial(true);
    cutterMaterial.uniforms.uMain.value.set(rivalKites[2]);
    cutterMaterial.uniforms.uSecond.value.copy(muted(rivalKites[2]));
    return {
      rivals,
      materials,
      cutterMaterial,
      stringMaterial,
      sail: sailGeometry(),
      spars: sparGeometry(),
      spar: createSparMaterial(),
      strings: rivals.map(() => stringLine(stringMaterial)),
      cutterString: stringLine(stringMaterial),
    };
  }, []);

  useEffect(
    () => () => {
      parts.materials.forEach((m) => m.dispose());
      parts.strings.forEach((l) => l.geometry.dispose());
      parts.cutterString.geometry.dispose();
      [parts.cutterMaterial, parts.stringMaterial, parts.sail, parts.spars, parts.spar].forEach((p) => p.dispose());
    },
    [parts],
  );

  useFrame((state, delta) => {
    const camera = state.camera as PerspectiveCamera;
    const tanHalf = Math.tan((camera.fov * Math.PI) / 360);
    const aspect = state.size.width / state.size.height;
    const t = frame.time;
    // Rival kites go home as night falls.
    const alpha = 1 - frame.sky.night;
    const light = 1 - 0.15 * frame.sky.overcast;
    parts.stringMaterial.opacity = 0.5 * alpha;

    parts.rivals.forEach((r, i) => {
      const g = groups.current[i];
      if (!g) return;
      r.x += r.speed * 0.4 * Math.min(delta, 0.1);
      const dist = camera.position.z - r.z;
      const halfH = dist * tanHalf + 2;
      const halfW = dist * tanHalf * aspect + 2;
      const x = wrap(r.x, camera.position.x, halfW);
      const y = wrap(r.y, camera.position.y, halfH * 1.3) + 0.4 * Math.sin(t * 0.8 + r.phase);
      g.position.set(x, y, r.z);
      g.rotation.set(-0.2, 0.2 * Math.sin(t * 0.5 + r.phase), 0.15 * Math.sin(t * 0.9 + r.phase) + 0.25 * r.side);
      g.visible = alpha > 0.01;
      parts.materials[i].uniforms.uAlpha.value = 0.95 * alpha;
      parts.materials[i].uniforms.uLight.value = light;
      setLine(parts.strings[i], x, y - 0.1, r.z, r.side);
      parts.strings[i].visible = g.visible;
    });

    // The cutter: flies in from the left and lays its string across Mihir's,
    // then pulls away up and to the right after the snap.
    const s = useFlight.getState();
    const c = frame.cutT;
    const g = cutter.current;
    if (!g) return;
    const active = s.phase === 'cut' && s.cut?.id === 'snap' && c >= 0 && c < SNAP.land;
    g.visible = active;
    parts.cutterString.visible = active;
    if (!active) return;
    const anchor = c < SNAP.snap ? frame.crossPoint : frame.cutPoint;
    const halfW = (camera.position.z - anchor.z) * tanHalf * aspect;
    const approach = 1 - (1 - smoothstep(0, SNAP.cross, c)) ** 2;
    const away = Math.max(0, c - SNAP.snap);
    // Its string runs along STRING_DIR from the kite, so ending at CUTTER_END puts it through the
    // cross point. It arcs over Mihir's kite on the way in and stays a little in front of it.
    const ox = -halfW - 2 + (CUTTER_END.x + halfW + 2) * approach + 2.2 * away;
    const oy = CUTTER_END.y + 3 * Math.sin(Math.PI * (1 - approach)) + 1.4 * away;
    g.position.set(anchor.x + ox, anchor.y + oy, anchor.z + 1.2);
    g.rotation.set(-0.2, 0, 0.2 + 0.1 * Math.sin(t * 2));
    parts.cutterMaterial.uniforms.uLight.value = light;
    parts.cutterMaterial.uniforms.uAlpha.value = 1 - smoothstep(SNAP.land - 1, SNAP.land, c);
    setLine(parts.cutterString, g.position.x, g.position.y, g.position.z, 1);
  });

  return (
    <group>
      {parts.rivals.map((_, i) => (
        <group key={i} ref={(el) => (groups.current[i] = el)} scale={0.9}>
          <mesh geometry={parts.sail} material={parts.materials[i]} />
          <lineSegments geometry={parts.spars} material={parts.spar} />
        </group>
      ))}
      {parts.strings.map((line, i) => (
        <primitive key={`s${i}`} object={line} />
      ))}
      <group ref={cutter} visible={false}>
        <mesh geometry={parts.sail} material={parts.cutterMaterial} />
        <lineSegments geometry={parts.spars} material={parts.spar} />
      </group>
      <primitive object={parts.cutterString} />
    </group>
  );
}
