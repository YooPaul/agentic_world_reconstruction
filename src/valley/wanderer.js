// First prototype: a simple anime-inspired figure attached to the original animated rig.
// Parts share the valley light and write IDs into alpha for the frame’s ink outlines.
import * as THREE from 'three';
import { loadMan } from '../figure/man.js';
import { COMMON } from '../lib/index.js';

const fragment = /* glsl */ `
${COMMON}
uniform vec3 uLit;
uniform vec3 uShade;
uniform vec3 uLit2;
uniform vec3 uShade2;
uniform float uSplit;
uniform vec2 uInk;
uniform float uInside;
in vec3 vWorld;
in vec3 vN;
in vec3 vBind;
in float vFold;
in vec2 vCloth;
uniform vec3 uTrim;
layout(location = 0) out vec4 outC;
void main() {
  vec3 N = normalize(vN);
  // (which side is seen is asked of the normal, not of the triangle: the hat and the cloth are wound as they come)
  bool back = dot(N, uCamPos - vWorld) < 0.0;
  if (back) N = -N;
  bool lower = vBind.y < uSplit;
  // in the light or out of it, and nothing between: a figure in a film is two tones
  // (the shade of trees and clouds, but not his own shadow on the ground, which he stands in the middle of)
  float open = smoothstep(0.35, 0.6, openAt(vWorld.xz));
  float lit = smoothstep(0.0, 0.035, dot(N, uSunDir) + 0.06) * open;
  // the inside of a cloak is always in its own shade
  if (back && uInside > 0.5) lit = 0.0;
  // The folds of hanging cloth, as they are drawn: a few wedges of deeper colour rising from the hem, and the
  // bottom of whatever fold the wind or his walking has really put in it.
  float deep = 0.0;
  if (uInside > 0.5) {
    float across = vCloth.x * 5.0 + 0.2 * sin(vCloth.x * 23.0);
    float wedge = abs(fract(across) - 0.5);
    float rise = smoothstep(0.28, 1.0, vCloth.y);
    deep = (1.0 - smoothstep(0.13 * rise, 0.13 * rise + 0.012, wedge)) * step(0.3, vCloth.y);
    deep = max(deep, smoothstep(0.011, 0.014, back ? -vFold : vFold));
  }
  vec3 litPaint = lower ? uLit2 : uLit;
  vec3 shadePaint = lower ? uShade2 : uShade;
  // a band of another colour along the hem
  if (uInside > 0.5 && !back && vCloth.y > 0.935) {
    litPaint = uTrim;
    shadePaint = uTrim * vec3(0.66, 0.6, 0.7);
  }
  vec3 sun = uSunColor * 0.42 + uSkyColor * 0.3;
  // (the shade's light is nearly without colour: a shade colour is mixed as it should look, as cel paint is)
  float grey = dot(uSkyColor, vec3(0.333));
  vec3 sky = mix(uSkyColor, vec3(grey), 0.8) * 1.15 + 0.2;
  // three tones in all: in the light, in the shade, and the deep of a fold
  vec3 col = mix(shadePaint * sky, litPaint * sun, lit * (1.0 - deep));
  col = mix(col, shadePaint * sky * vec3(0.64, 0.64, 0.8), deep * (1.0 - lit));
  outC = vec4(applyFog(col, vWorld), lower ? uInk.y : uInk.x);
}
`;

const plainVertex = /* glsl */ `
in float aFold;
out vec3 vWorld;
out vec3 vN;
out vec3 vBind;
out float vFold;
out vec2 vCloth;
void main() {
  vFold = aFold;
  vCloth = uv;
  vec4 w = modelMatrix * vec4(position, 1.0);
  vWorld = w.xyz;
  vN = normalize(mat3(modelMatrix) * normal);
  vBind = vec3(0.0, 10.0, 0.0);
  gl_Position = projectionMatrix * viewMatrix * w;
}
`;

// Prototype palette: pale cardigan, navy dress, and a red school backpack.
export const CLOTHES = {
  SHIRT: [[0.68, 0.78, 0.8], [0.39, 0.49, 0.58]],
  DRESS: [[0.105, 0.13, 0.22], [0.065, 0.075, 0.14]],
  SKIN: [[0.94, 0.73, 0.68], [0.7, 0.47, 0.47]],
  BOOTS: [[0.075, 0.08, 0.11], [0.035, 0.04, 0.065]],
  SOCKS: [[0.16, 0.18, 0.24], [0.08, 0.095, 0.15]],
  HAIR: [[0.075, 0.045, 0.045], [0.035, 0.025, 0.035]],
  EYES: [[0.045, 0.035, 0.045], [0.025, 0.02, 0.03]],
  WHITE: [[0.95, 0.92, 0.86], [0.65, 0.68, 0.73]],
  BAG: [[0.61, 0.105, 0.13], [0.33, 0.055, 0.09]],
};
const INK = { HAIR: 0.03, EYES: 0.03, BOOTS: 0.06, SOCKS: 0.08, DRESS: 0.11, BAG: 0.14, SHIRT: 0.17, WHITE: 0.19, SKIN: 0.21 };

/** A deliberately simple blockout on the existing animated rig; no replacement model download. */
export async function createWanderer(field, onProgress, clothes = {}) {
  const palette = { ...CLOTHES, ...clothes };
  const materials = {};
  const paint = (key) => materials[key] ??= new THREE.ShaderMaterial({
    glslVersion: THREE.GLSL3,
    side: THREE.DoubleSide,
    uniforms: {
      ...field.uniforms,
      uLit: { value: new THREE.Color(...palette[key][0]) },
      uShade: { value: new THREE.Color(...palette[key][1]) },
      uLit2: { value: new THREE.Color(...palette[key][0]) },
      uShade2: { value: new THREE.Color(...palette[key][1]) },
      uSplit: { value: -10 },
      uInk: { value: new THREE.Vector2(INK[key], INK[key]) },
      uInside: { value: 0 },
      uTrim: { value: new THREE.Color(0.85, 0.86, 0.82) },
    },
    vertexShader: plainVertex,
    fragmentShader: fragment,
  });
  const man = await loadMan({ base: './figure/', onProgress });
  for (const mesh of man.meshes) mesh.visible = false;
  man.object.updateMatrixWorld(true);
  const position = (bone) => man.bones[bone].getWorldPosition(new THREE.Vector3());
  const attach = (geometry, key, at, scale, bone) => {
    geometry.setAttribute('aFold', new THREE.BufferAttribute(new Float32Array(geometry.attributes.position.count), 1));
    const mesh = new THREE.Mesh(geometry, paint(key));
    mesh.position.copy(at.isVector3 ? at : new THREE.Vector3(...at));
    mesh.scale.set(...scale);
    mesh.frustumCulled = false;
    man.object.add(mesh);
    man.object.updateMatrixWorld(true);
    man.bones[bone].attach(mesh);
    return mesh;
  };
  const ball = (key, at, scale, bone) => attach(new THREE.SphereGeometry(1, 24, 16), key, at, scale, bone);
  const box = (key, at, scale, bone) => attach(new THREE.BoxGeometry(1, 1, 1), key, at, scale, bone);
  const segment = (a, b, key, radius, bone) => {
    const delta = b.clone().sub(a);
    const mesh = attach(new THREE.CylinderGeometry(radius * 0.9, radius, delta.length(), 16), key, a.clone().add(b).multiplyScalar(0.5), [1, 1, 1], bone);
    // Set its world-space direction before reattaching to the rig.
    man.object.attach(mesh);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize());
    mesh.updateMatrixWorld(true);
    man.bones[bone].attach(mesh);
    return mesh;
  };

  // Simple fitted torso; separate cardigan panels reveal a dark dress down the middle.
  ball('DRESS', [0, 1.19, 0.01], [0.19, 0.27, 0.115], 'spine_03');
  for (const side of [-1, 1]) {
    ball('SHIRT', [side * 0.105, 1.23, 0.025], [0.105, 0.24, 0.125], 'spine_03');
    box('BAG', [side * 0.155, 1.27, 0.144], [0.037, 0.34, 0.023], 'spine_03');
  }
  ball('WHITE', [0.015, 1.39, 0.146], [0.014, 0.014, 0.008], 'spine_03');
  segment(new THREE.Vector3(0, 1.42, 0), new THREE.Vector3(0, 1.56, 0), 'SKIN', 0.064, 'neck_01');

  // Flared skirt, with a narrow pale band at the hem.
  const skirt = attach(new THREE.CylinderGeometry(0.185, 0.265, 0.43, 32, 5, true), 'DRESS', [0, 0.84, 0.015], [1, 1, 0.68], 'pelvis');
  attach(new THREE.CylinderGeometry(0.26, 0.264, 0.016, 32, 1, true), 'WHITE', [0, 0.637, 0.015], [1, 1, 0.68], 'pelvis');

  const sleeves = [];
  for (const side of ['l', 'r']) {
    const shoulder = position('upperarm_' + side), elbow = position('lowerarm_' + side), wrist = position('hand_' + side);
    // A continuous deforming sleeve, built in world space after the rig moves.
    // Lower the fabric shoulder below the rig's high joint; no exposed joint sphere.
    const geometry = new THREE.BufferGeometry();
    const ringCount = 6, sides = 16;
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(ringCount*sides*3),3).setUsage(THREE.DynamicDrawUsage));
    geometry.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(ringCount*sides*2),2));
    geometry.setAttribute('aFold', new THREE.BufferAttribute(new Float32Array(ringCount*sides),1));
    const indices=[];
    for(let j=0;j<ringCount-1;j++) for(let i=0;i<sides;i++) {
      const a=j*sides+i,b=j*sides+(i+1)%sides,c=a+sides,d=b+sides;
      indices.push(a,c,b,b,c,d);
    }
    geometry.setIndex(indices);
    const mesh = new THREE.Mesh(geometry,paint('SHIRT'));
    mesh.frustumCulled=false;
    sleeves.push({mesh,geometry,side});
    ball('SKIN', wrist.clone().add(new THREE.Vector3(side === 'l' ? 0.035 : -0.035, 0, 0)), [0.075, 0.035, 0.044], 'hand_' + side);
    const hip = position('thigh_' + side), knee = position('calf_' + side), ankle = position('foot_' + side);
    segment(hip, knee, 'SKIN', 0.065, 'thigh_' + side);
    segment(knee, ankle, 'SOCKS', 0.052, 'calf_' + side);
    ball('BOOTS', ankle.clone().add(new THREE.Vector3(0, -0.015, 0.065)), [0.07, 0.052, 0.14], 'foot_' + side);
  }

  // Oversized head and graphic face establish an anime silhouette at gameplay distance.
  const headY = position('Head').y + 0.08;
  ball('SKIN', [0, headY, 0.025], [0.18, 0.218, 0.155], 'Head');
  for (const side of [-1, 1]) {
    ball('SKIN', [side * 0.176, headY - 0.025, 0.01], [0.034, 0.056, 0.026], 'Head');
    ball('WHITE', [side * 0.071, headY + 0.005, 0.164], [0.047, 0.026, 0.01], 'Head');
    ball('EYES', [side * 0.069, headY + 0.005, 0.173], [0.021, 0.025, 0.009], 'Head');
    ball('WHITE', [side * 0.069 - 0.006, headY + 0.014, 0.182], [0.006, 0.007, 0.003], 'Head');
    box('HAIR', [side * 0.072, headY + 0.052, 0.159], [0.073, 0.009, 0.012], 'Head');
  }
  ball('SKIN', [0, headY - 0.035, 0.179], [0.018, 0.023, 0.025], 'Head');
  ball('EYES', [0, headY - 0.089, 0.164], [0.032, 0.004, 0.004], 'Head');
  attach(new THREE.SphereGeometry(1, 32, 16, 0, Math.PI * 2, 0, 1.22), 'HAIR', [0, headY + 0.01, 0.005], [0.195, 0.235, 0.178], 'Head');
  // Back of the bob and side locks leave the face uncovered.
  ball('HAIR', [0, headY - 0.025, -0.092], [0.185, 0.22, 0.105], 'Head');
  for (const side of [-1, 1]) ball('HAIR', [side * 0.165, headY - 0.018, -0.004], [0.042, 0.18, 0.10], 'Head');
  for (let i = 0; i < 7; i++) {
    const x = (i - 3) * 0.046;
    const bang = ball('HAIR', [x, headY + 0.105 + Math.abs(x) * 0.18, 0.15 - Math.abs(x) * 0.17], [0.033, 0.09 - Math.abs(x) * 0.15, 0.026], 'Head');
    bang.rotateZ((i - 3) * -0.07);
  }
  const bag = box('BAG', [0, 1.23, -0.19], [0.30, 0.35, 0.15], 'spine_03');
  box('BAG', [0, 1.18, -0.278], [0.25, 0.18, 0.04], 'spine_03');
  box('WHITE', [0, 1.24, -0.302], [0.035, 0.025, 0.008], 'spine_03');
  const group = new THREE.Group();
  group.add(man.object, ...sleeves.map(s => s.mesh));
  const updateSleeves = () => {
    man.object.updateMatrixWorld(true);
    for (const {geometry,side} of sleeves) {
      const shoulder=position('upperarm_'+side), elbow=position('lowerarm_'+side), wrist=position('hand_'+side);
      const centre=position('spine_03');
      shoulder.lerp(new THREE.Vector3(centre.x,shoulder.y,centre.z),0.13);
      shoulder.y-=0.085;
      const axis=elbow.clone().sub(shoulder).normalize();
      const centres=[shoulder.clone().addScaledVector(axis,-0.035),shoulder,shoulder.clone().lerp(elbow,0.35),elbow.clone().lerp(shoulder,0.12),elbow.clone().lerp(wrist,0.16),wrist];
      const radii=[0.025,0.061,0.066,0.061,0.057,0.052];
      const data=geometry.attributes.position;
      for(let j=0;j<centres.length;j++) {
        const tangent=centres[Math.min(j+1,5)].clone().sub(centres[Math.max(j-1,0)]).normalize();
        const normal=new THREE.Vector3(0,0,1).cross(tangent).normalize();
        const binormal=tangent.clone().cross(normal).normalize();
        for(let i=0;i<16;i++) {
          const angle=i*Math.PI*2/16;
          const point=centres[j].clone().addScaledVector(normal,Math.cos(angle)*radii[j]).addScaledVector(binormal,Math.sin(angle)*radii[j]);
          data.setXYZ(j*16+i,point.x,point.y,point.z);
        }
      }
      data.needsUpdate=true;
      geometry.computeVertexNormals();
    }
  };
  updateSleeves();
  const skirtRest = skirt.rotation.z;
  const bagRest = bag.rotation.x;
  let elapsed = 0;
  return {
    man, group,
    update(dt) {
      elapsed += dt;
      updateSleeves();
      // A little secondary motion; locomotion and breathing come from the animation mixer.
      skirt.rotation.z = skirtRest + Math.sin(elapsed * 2.1) * 0.012;
      bag.rotation.x = bagRest + Math.sin(elapsed * 2.1) * 0.012;
    },
  };
}
