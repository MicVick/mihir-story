import { useFrame } from '@react-three/fiber';
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import {
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  Color,
  CylinderGeometry,
  DirectionalLight,
  DoubleSide,
  Group,
  HemisphereLight,
  InstancedMesh,
  LineBasicMaterial,
  MeshBasicMaterial,
  MeshLambertMaterial,
  Object3D,
  PerspectiveCamera,
  PlaneGeometry,
} from 'three';
import { cutStop } from '../content/beats';
import { isSmallScreen } from '../lib/device';
import { frame, WORLD_PER_METRE } from './frame';
import { REST_Z } from './Kite';
import { seeded } from './wrap';

const HOUSE_COLOURS = ['#E9B98F', '#DE9C7A', '#F2D4AE', '#CF8466', '#EBCB9F', '#C77B62', '#F0E0C4', '#D8A47F'];
const CLOTH_COLOURS = ['#F08C00', '#FFF8EE', '#5B7FA8', '#D6336C'];
/** Houses run down to this height, well below anything the camera sees. */
const GROUND = -30;

/** Top of the terrace where a cut kite comes to rest, just under the resting kite. */
export const LANDING_TOP = cutStop('snap').fallTo * WORLD_PER_METRE - 0.42;

interface House {
  x: number;
  z: number;
  w: number;
  d: number;
  top: number;
  colour: string;
  tank: boolean;
}

function layoutCity(count: number): House[] {
  const rand = seeded(23);
  return Array.from({ length: count }, () => {
    const z = -10 - rand() * 90;
    return {
      x: (rand() - 0.5) * (60 + -z * 1.1),
      z,
      w: 3 + rand() * 4,
      d: 3 + rand() * 4,
      top: -3 + rand() * 6.5,
      colour: HOUSE_COLOURS[Math.floor(rand() * HOUSE_COLOURS.length)],
      tank: rand() < 0.35,
    };
  });
}

/**
 * Low-poly flat-roofed houses with water tanks, in flat warm colours. The
 * terrace a cut kite lands on (with its parapet and washing line) only
 * appears during a cut, so the opening view stays open.
 */
export function Rooftops() {
  const city = useRef<Group>(null);
  const landing = useRef<Group>(null);
  const hemi = useRef<HemisphereLight>(null);
  const sun = useRef<DirectionalLight>(null);
  const houseMesh = useRef<InstancedMesh>(null);
  const tankMesh = useRef<InstancedMesh>(null);

  const parts = useMemo(() => {
    const houses = layoutCity(isSmallScreen() ? 45 : 90);
    const tanks = houses.filter((h) => h.tank);
    const washing = new BufferGeometry();
    washing.setAttribute('position', new BufferAttribute(new Float32Array([-2.6, 1.3, 0, 2.6, 1.3, 0]), 3));
    return {
      houses,
      tanks,
      box: new BoxGeometry(1, 1, 1),
      tank: new CylinderGeometry(0.42, 0.42, 0.9, 10),
      cloth: new PlaneGeometry(0.5, 0.6),
      washing,
      houseMaterial: new MeshLambertMaterial(),
      tankMaterial: new MeshLambertMaterial({ color: '#2f2f33' }),
      terraceMaterial: new MeshLambertMaterial({ color: '#EED2AE' }),
      parapetMaterial: new MeshLambertMaterial({ color: '#D9B48E' }),
      lineMaterial: new LineBasicMaterial({ color: '#4a4a4a' }),
      clothMaterials: CLOTH_COLOURS.map((c) => new MeshBasicMaterial({ color: c, side: DoubleSide })),
    };
  }, []);

  useLayoutEffect(() => {
    const dummy = new Object3D();
    const colour = new Color();
    parts.houses.forEach((h, i) => {
      dummy.position.set(h.x, (h.top + GROUND) / 2, h.z);
      dummy.scale.set(h.w, h.top - GROUND, h.d);
      dummy.updateMatrix();
      houseMesh.current?.setMatrixAt(i, dummy.matrix);
      houseMesh.current?.setColorAt(i, colour.set(h.colour));
    });
    parts.tanks.forEach((h, i) => {
      dummy.position.set(h.x + h.w * 0.25, h.top + 0.45, h.z - h.d * 0.2);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      tankMesh.current?.setMatrixAt(i, dummy.matrix);
    });
    if (houseMesh.current) {
      houseMesh.current.instanceMatrix.needsUpdate = true;
      if (houseMesh.current.instanceColor) houseMesh.current.instanceColor.needsUpdate = true;
    }
    if (tankMesh.current) tankMesh.current.instanceMatrix.needsUpdate = true;
  }, [parts]);

  useEffect(
    () => () => {
      [parts.box, parts.tank, parts.cloth, parts.washing].forEach((g) => g.dispose());
      [parts.houseMaterial, parts.tankMaterial, parts.terraceMaterial, parts.parapetMaterial, parts.lineMaterial].forEach(
        (m) => m.dispose(),
      );
      parts.clothMaterials.forEach((m) => m.dispose());
    },
    [parts],
  );

  const grey = useMemo(() => new Color('#b9b9b9'), []);
  const warm = useMemo(() => new Color('#fff1dc'), []);

  useFrame((state) => {
    const camera = state.camera as PerspectiveCamera;
    // Only draw the rooftops when the bottom of the view is near them.
    const bottom = camera.position.y - (camera.position.z + 10) * Math.tan((camera.fov * Math.PI) / 360);
    const near = bottom < LANDING_TOP + 6;
    if (city.current) city.current.visible = near;
    if (landing.current) landing.current.visible = frame.cutT >= 0 || frame.relaunchT >= 0;
    const dim = 1 - 0.75 * frame.sky.night;
    if (hemi.current) {
      hemi.current.intensity = 2.4 * dim;
      hemi.current.color.copy(warm).lerp(grey, frame.desat * 0.7);
    }
    if (sun.current) sun.current.intensity = 1.6 * dim * (1 - 0.6 * frame.sky.overcast);
  });

  const t = LANDING_TOP;
  return (
    <group>
      <hemisphereLight ref={hemi} args={['#fff1dc', '#8a6a55', 2.4]} />
      <directionalLight ref={sun} position={[-20, 30, 15]} intensity={1.6} />

      <group ref={city}>
        <instancedMesh ref={houseMesh} args={[parts.box, parts.houseMaterial, parts.houses.length]} />
        <instancedMesh ref={tankMesh} args={[parts.tank, parts.tankMaterial, parts.tanks.length]} />
      </group>

      <group ref={landing} visible={false}>
        <mesh geometry={parts.box} material={parts.terraceMaterial} position={[0, (t + GROUND) / 2, REST_Z]} scale={[7, t - GROUND, 6]} />
        {/* Parapet walls on three sides. */}
        <mesh geometry={parts.box} material={parts.parapetMaterial} position={[0, t + 0.22, REST_Z - 2.9]} scale={[7, 0.45, 0.2]} />
        <mesh geometry={parts.box} material={parts.parapetMaterial} position={[-3.4, t + 0.22, REST_Z]} scale={[0.2, 0.45, 6]} />
        <mesh geometry={parts.box} material={parts.parapetMaterial} position={[3.4, t + 0.22, REST_Z]} scale={[0.2, 0.45, 6]} />
        <mesh geometry={parts.tank} material={parts.tankMaterial} position={[2.6, t + 0.45, REST_Z - 2.2]} />
        {/* Washing line between two poles, at the back of the terrace. */}
        <group position={[0, t, REST_Z - 2.4]}>
          <mesh geometry={parts.box} material={parts.parapetMaterial} position={[-2.6, 0.65, 0]} scale={[0.06, 1.3, 0.06]} />
          <mesh geometry={parts.box} material={parts.parapetMaterial} position={[2.6, 0.65, 0]} scale={[0.06, 1.3, 0.06]} />
          <lineSegments geometry={parts.washing} material={parts.lineMaterial} />
          {parts.clothMaterials.map((m, i) => (
            <mesh key={i} geometry={parts.cloth} material={m} position={[-1.8 + i * 1.2, 0.98, 0]} />
          ))}
        </group>
      </group>
    </group>
  );
}
