import { useFrame, useThree } from '@react-three/fiber';
import { useMemo } from 'react';
import { Color, ShaderMaterial, Vector3 } from 'three';
import { frame } from './frame';

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 1.0, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uTop;
  uniform vec3 uHorizon;
  uniform vec3 uSun;
  uniform vec3 uMoon;
  uniform float uStars;
  uniform float uOvercast;
  uniform float uDesat;
  uniform float uAspect;
  uniform float uTime;
  varying vec2 vUv;

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  void main() {
    vec3 col = mix(uHorizon, uTop, pow(smoothstep(0.0, 1.0, vUv.y), 0.85));
    vec2 aspect = vec2(uAspect, 1.0);

    // Sun: soft glow and a disc, dimmed under cloud cover.
    float sunDist = length((vUv - uSun.xy) * aspect);
    float sunVis = uSun.z * (1.0 - 0.97 * uOvercast) * (1.0 - uDesat);
    vec3 sunCol = vec3(1.0, 0.93, 0.78);
    col += sunCol * (exp(-sunDist * 3.2) * 0.16 + exp(-sunDist * 11.0) * 0.3) * sunVis;
    col = mix(col, vec3(1.0, 0.97, 0.9), smoothstep(0.048, 0.04, sunDist) * sunVis);

    // Stars.
    vec2 grid = vUv * aspect * 90.0;
    vec2 id = floor(grid);
    float r = hash(id);
    vec2 offset = vec2(hash(id + 1.3), hash(id + 7.1)) - 0.5;
    float d = length(fract(grid) - 0.5 - offset * 0.6);
    float twinkle = 0.6 + 0.4 * sin(uTime * 2.0 + r * 60.0);
    float star = step(0.975, r) * smoothstep(0.12, 0.0, d) * twinkle;
    col += vec3(star) * uStars * smoothstep(0.15, 0.6, vUv.y);

    // Moon.
    float moonDist = length((vUv - uMoon.xy) * aspect);
    col += vec3(0.85, 0.88, 1.0) * exp(-moonDist * 9.0) * 0.2 * uMoon.z;
    col = mix(col, vec3(0.96, 0.95, 0.9), smoothstep(0.036, 0.031, moonDist) * uMoon.z);

    // Colour drains from the sky during a cut.
    col = mix(col, vec3(dot(col, vec3(0.299, 0.587, 0.114))), uDesat * 0.75);

    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
    // Dither to avoid banding in the long gradients.
    float ign = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))));
    gl_FragColor.rgb += (ign - 0.5) / 255.0;
  }
`;

/** Full-screen gradient quad drawn behind everything else. */
export function Sky() {
  const size = useThree((s) => s.size);
  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader,
        fragmentShader,
        depthTest: false,
        depthWrite: false,
        uniforms: {
          uTop: { value: new Color() },
          uHorizon: { value: new Color() },
          uSun: { value: new Vector3() },
          uMoon: { value: new Vector3(0.78, 0.8, 0) },
          uStars: { value: 0 },
          uOvercast: { value: 0 },
          uDesat: { value: 0 },
          uAspect: { value: 1 },
          uTime: { value: 0 },
        },
      }),
    [],
  );

  useFrame(() => {
    const { sky } = frame;
    const u = material.uniforms;
    u.uTop.value.copy(sky.top);
    u.uHorizon.value.copy(sky.horizon);
    u.uSun.value.set(sky.sun.x, sky.sun.y, sky.sun.v);
    u.uMoon.value.z = sky.night;
    u.uStars.value = sky.night;
    u.uOvercast.value = sky.overcast;
    u.uDesat.value = frame.desat;
    u.uAspect.value = size.width / size.height;
    u.uTime.value = frame.time;
  });

  return (
    <mesh frustumCulled={false} renderOrder={-1000} material={material}>
      <planeGeometry args={[2, 2]} />
    </mesh>
  );
}
