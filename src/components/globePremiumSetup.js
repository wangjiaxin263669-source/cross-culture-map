import * as THREE from 'three';

/**
 * luxury = 高端暗色数字地球（Stripe / Linear 风，配 champagne 主题）
 * refined = 备用哑光 PBR
 */
export const GLOBE_RENDER_STYLE = 'luxury';

const GOLD = {
  soft: new THREE.Color(0xc9b896),
  muted: new THREE.Color(0xa89880),
};

const TEX = {
  day: '/globe/earth-blue-marble.jpg',
  night: '/globe/earth-night.jpg',
  bump: '/globe/earth-topology.png',
  water: '/globe/earth-water.png',
};

const textureLoader = new THREE.TextureLoader();

function loadTexture(url) {
  return new Promise((resolve, reject) => {
    textureLoader.load(
      url,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 8;
        resolve(tex);
      },
      undefined,
      reject,
    );
  });
}

let textureCachePromise = null;
export function getTextures() {
  if (!textureCachePromise) {
    textureCachePromise = Promise.all([
      loadTexture(TEX.day),
      loadTexture(TEX.night),
      loadTexture(TEX.bump),
      loadTexture(TEX.water),
    ]).then(([day, night, bump, water]) => ({ day, night, bump, water }));
  }
  return textureCachePromise;
}

export async function buildGlobeMaterial() {
  const tex = await getTextures();
  if (GLOBE_RENDER_STYLE === 'luxury') {
    return createLuxuryMaterial(tex.day, tex.night, tex.bump, tex.water);
  }
  return createRefinedMaterial(tex.day, tex.night, tex.bump, tex.water);
}

function clearNamed(scene, name) {
  const old = scene.getObjectByName(name);
  if (old) scene.remove(old);
}

function setupRenderer(renderer, exposure) {
  if (!renderer) return;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = exposure;
}

const RIM_VERT = `
  varying vec3 vNormal;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const RIM_FRAG = `
  varying vec3 vNormal;
  uniform vec3 rimColor;
  uniform float strength;
  void main() {
    float rim = 1.0 - max(dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0);
    rim = smoothstep(0.76, 0.98, rim);
    float alpha = pow(rim, 3.0) * strength;
    gl_FragColor = vec4(rimColor, alpha);
  }
`;

function createSoftRim(radius, color, strength, scale = 1.004) {
  return new THREE.Mesh(
    new THREE.SphereGeometry(radius * scale, 72, 72),
    new THREE.ShaderMaterial({
      uniforms: {
        rimColor: { value: color.clone() },
        strength: { value: strength },
      },
      vertexShader: RIM_VERT,
      fragmentShader: RIM_FRAG,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      depthWrite: false,
      glslVersion: THREE.GLSL1,
    }),
  );
}

const LUXURY_VERT = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mv.xyz;
    gl_Position = projectionMatrix * mv;
  }
`;

/** 自然柔光 · 香槟主题 · 暗调与地形质感平衡 */
const LUXURY_FRAG = `
  uniform sampler2D dayMap;
  uniform sampler2D nightMap;
  uniform sampler2D bumpMap;
  uniform sampler2D waterMap;
  uniform vec3 goldSoft;
  uniform vec3 goldAccent;
  uniform vec3 lightDir;

  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewPosition;

  float lum(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }

  void main() {
    vec3 day = texture2D(dayMap, vUv).rgb;
    vec3 night = texture2D(nightMap, vUv).rgb;
    float bump = texture2D(bumpMap, vUv).r;
    float water = texture2D(waterMap, vUv).r;

    float landMask = smoothstep(0.13, 0.29, lum(day));

    vec3 oceanDeep = vec3(0.08, 0.09, 0.12);
    vec3 oceanMid  = vec3(0.12, 0.15, 0.20);
    vec3 oceanHi   = vec3(0.17, 0.21, 0.27);
    vec3 ocean = mix(oceanDeep, oceanMid, bump * 0.52 + 0.18);
    ocean = mix(ocean, oceanHi, water * (1.0 - landMask) * 0.38);
    ocean *= 0.92 + bump * 0.14;

    vec3 landDark = vec3(0.28, 0.24, 0.20);
    vec3 landMid  = vec3(0.46, 0.40, 0.32);
    vec3 landHi   = vec3(0.70, 0.60, 0.46);
    float landTone = smoothstep(0.10, 0.54, lum(day));
    vec3 landCol = mix(landDark, landMid, landTone);
    landCol = mix(landCol, landHi, landTone * landTone * 0.72);
    landCol = mix(landCol, landCol * goldSoft * 1.06, 0.12);
    float geo = 0.88 + lum(day) * 0.22;
    landCol *= geo;

    vec3 albedo = mix(ocean, landCol, landMask);

    vec3 n = normalize(vNormal);
    vec3 l = normalize(lightDir);
    vec3 viewDir = normalize(vViewPosition);
    float ndl = dot(n, l);

    float halfLambert = ndl * 0.5 + 0.5;
    halfLambert = pow(halfLambert, 1.12);
    float ambientFill = 0.34;
    float lightMask = ambientFill + (1.0 - ambientFill) * halfLambert;
    lightMask *= 0.90 + bump * 0.18;

    vec3 base = albedo * lightMask;

    float spec = pow(max(ndl, 0.0), 14.0) * (1.0 - landMask) * 0.08;
    base += goldAccent * spec;

    float city = lum(night);
    city = smoothstep(0.12, 0.44, city);
    city = pow(city, 1.1) * 0.48;
    float nightBlend = 1.0 - smoothstep(0.15, 0.72, ndl) * 0.55;
    base += mix(goldSoft, goldAccent, city) * city * nightBlend * 0.65;

    float fresnel = pow(1.0 - max(dot(n, viewDir), 0.0), 3.4);
    base += goldSoft * fresnel * 0.055;

    gl_FragColor = vec4(base, 1.0);
  }
`;

function createLuxuryMaterial(day, night, bump, water) {
  return new THREE.ShaderMaterial({
    uniforms: {
      dayMap: { value: day },
      nightMap: { value: night },
      bumpMap: { value: bump },
      waterMap: { value: water },
      goldSoft: { value: new THREE.Color(0xc9b896) },
      goldAccent: { value: new THREE.Color(0xe8dcc8) },
      lightDir: { value: new THREE.Vector3(-0.48, 0.72, 0.52).normalize() },
    },
    vertexShader: LUXURY_VERT,
    fragmentShader: LUXURY_FRAG,
    glslVersion: THREE.GLSL1,
  });
}

function createRefinedMaterial(day, night, bump, water) {
  return new THREE.MeshStandardMaterial({
    map: day,
    bumpMap: bump,
    bumpScale: 2.8,
    roughnessMap: water,
    roughness: 0.88,
    metalness: 0.06,
    color: new THREE.Color(0.55, 0.52, 0.48),
    emissive: GOLD.soft.clone(),
    emissiveMap: night,
    emissiveIntensity: 0.42,
  });
}

function applyLuxuryLights(globe, scene) {
  const key = globe.lights?.()?.find((l) => l.type === 'DirectionalLight');
  if (key) {
    key.color = new THREE.Color(0xf8f0e4);
    key.intensity = 0.52;
    key.position.set(-1.15, 0.92, 1.45);
  }
  clearNamed(scene, 'luxury-hemi');
  const hemi = new THREE.HemisphereLight(0xb0a090, 0x100e0c, 0.28);
  hemi.name = 'luxury-hemi';
  scene.add(hemi);
  clearNamed(scene, 'luxury-fill');
  const fill = new THREE.AmbientLight(0x302820, 0.22);
  fill.name = 'luxury-fill';
  scene.add(fill);
}

function applyRefinedLights(globe, scene) {
  const key = globe.lights?.()?.find((l) => l.type === 'DirectionalLight');
  if (key) {
    key.color = new THREE.Color(0xd4c4a8);
    key.intensity = 0.62;
    key.position.set(-1.4, 0.75, 1.6);
  }
  clearNamed(scene, 'luxury-hemi');
  const hemi = new THREE.HemisphereLight(0x8a8278, 0x060504, 0.32);
  hemi.name = 'luxury-hemi';
  scene.add(hemi);
  clearNamed(scene, 'luxury-fill');
  const fill = new THREE.AmbientLight(0x1a1816, 0.35);
  fill.name = 'luxury-fill';
  scene.add(fill);
}

export async function setupGlobeSceneEffects(globe) {
  if (!globe) return;

  const exposure = GLOBE_RENDER_STYLE === 'luxury' ? 1.06 : 1.02;
  setupRenderer(globe.renderer?.(), exposure);

  const scene = globe.scene?.();
  if (!scene) return;

  scene.fog = null;
  clearNamed(scene, 'luxury-rim-glow');
  clearNamed(scene, 'luxury-rim-outer');

  if (GLOBE_RENDER_STYLE === 'luxury') {
    const goldRim = createSoftRim(100, GOLD.soft, 0.068);
    goldRim.name = 'luxury-rim-glow';
    goldRim.renderOrder = 2;
    scene.add(goldRim);
    clearNamed(scene, 'luxury-rim-outer');
    applyLuxuryLights(globe, scene);
  } else {
    const rim = createSoftRim(100, GOLD.soft, 0.14);
    rim.name = 'luxury-rim-glow';
    rim.renderOrder = 2;
    scene.add(rim);
    applyRefinedLights(globe, scene);
  }
}

export async function applyLuxuryGlobeLook(globe) {
  const material = await buildGlobeMaterial();
  globe.globeMaterial(material);
  await setupGlobeSceneEffects(globe);
}
