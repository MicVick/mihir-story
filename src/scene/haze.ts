// Aerial perspective shared by the solid parts of the scene. Far objects
// fade into the colour of the sky directly behind them on screen, so the
// rooftops dissolve into the haze without a visible edge.

import { Color, Vector2, Vector3 } from 'three';
import { frame } from './frame';

export const hazeUniforms = () => ({
  uTop: { value: new Color() },
  uHorizon: { value: new Color() },
  uResolution: { value: new Vector2(1, 1) },
  uDesat: { value: 0 },
  uNight: { value: 0 },
  /** Warm light on faces turned to the sun; cool fill from the sky on the rest. */
  uLightTint: { value: new Color() },
  uShadeTint: { value: new Color() },
  uSunDir: { value: new Vector3(0, 1, 0) },
  /** 0 to 1. Fades everything into the sky as the camera climbs away. */
  uFade: { value: 0 },
});

export type HazeUniforms = ReturnType<typeof hazeUniforms>;

const WHITE = new Color('#ffffff');
const GREY = new Color('#8f949c');

/** Copies this frame's sky into a material's haze uniforms. */
export function updateHaze(u: HazeUniforms, width: number, height: number, fade: number) {
  const { sky } = frame;
  u.uTop.value.copy(sky.top);
  u.uHorizon.value.copy(sky.horizon);
  u.uResolution.value.set(width, height);
  u.uDesat.value = frame.desat;
  u.uNight.value = sky.night;
  u.uFade.value = fade;
  u.uLightTint.value.copy(WHITE).lerp(sky.horizon, 0.35).lerp(GREY, sky.overcast * 0.5);
  u.uShadeTint.value.copy(sky.top).lerp(sky.horizon, 0.45).lerp(GREY, sky.overcast * 0.4).multiplyScalar(0.82);
  // The sun moves from the left at dawn to the right at sunset.
  u.uSunDir.value.set((sky.sun.x - 0.5) * 2.2, 0.55 + sky.sun.y * 0.6, 0.7).normalize();
}

/** GLSL: the sky gradient behind this pixel, matching Sky.tsx. */
export const hazeChunk = /* glsl */ `
  uniform vec3 uTop;
  uniform vec3 uHorizon;
  uniform vec2 uResolution;
  uniform float uDesat;
  uniform float uNight;
  uniform vec3 uLightTint;
  uniform vec3 uShadeTint;
  uniform vec3 uSunDir;
  uniform float uFade;

  vec3 skyBehind() {
    float y = clamp(gl_FragCoord.y / uResolution.y, 0.0, 1.0);
    return mix(uHorizon, uTop, pow(smoothstep(0.0, 1.0, y), 0.85));
  }

  vec3 lightFace(vec3 base, vec3 n) {
    float sun = max(dot(n, uSunDir), 0.0);
    float sky = 0.5 + 0.5 * n.y;
    vec3 lit = mix(uShadeTint, uLightTint, clamp(0.25 * sky + 0.85 * sun, 0.0, 1.0));
    return base * lit * 1.08;
  }

  vec3 finishColour(vec3 col, float haze) {
    col *= 1.0 - 0.7 * uNight;
    col = mix(col, skyBehind(), clamp(max(haze, uFade), 0.0, 1.0));
    // Same desaturation as the sky during a cut.
    return mix(col, vec3(dot(col, vec3(0.299, 0.587, 0.114))), uDesat * 0.75);
  }
`;
