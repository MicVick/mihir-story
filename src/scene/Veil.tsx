import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { Color, Mesh, ShaderMaterial } from 'three';
import { frame } from './frame';

/** Full-screen fade in the sky's horizon colour. Under reduced motion the cuts fade instead of tumbling. */
export function Veil() {
  const mesh = useRef<Mesh>(null);
  const material = useMemo(
    () =>
      new ShaderMaterial({
        transparent: true,
        depthTest: false,
        depthWrite: false,
        uniforms: { uColor: { value: new Color() }, uAlpha: { value: 0 } },
        vertexShader: /* glsl */ `void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }`,
        fragmentShader: /* glsl */ `
          uniform vec3 uColor;
          uniform float uAlpha;
          void main() {
            gl_FragColor = vec4(uColor, uAlpha);
            #include <colorspace_fragment>
          }
        `,
      }),
    [],
  );

  useFrame(() => {
    if (mesh.current) mesh.current.visible = frame.veil > 0.001;
    material.uniforms.uColor.value.copy(frame.sky.horizon);
    material.uniforms.uAlpha.value = frame.veil;
  });

  return (
    <mesh ref={mesh} material={material} frustumCulled={false} renderOrder={2000} visible={false}>
      <planeGeometry args={[2, 2]} />
    </mesh>
  );
}
