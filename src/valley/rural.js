// A small walkable rural neighborhood: houses, a paved lane, paddies and overhead wires.
// Geometry is generated locally; props share the meadow's light and atmospheric fog.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { COMMON } from '../lib/index.js';
import { fromValley, heightAt } from './world.js';
import { addBuildings, createBuildingMaterial } from './village.js';

export function createRural(field) {
  const group = new THREE.Group();
  const solid = [];
  const list = [];
  for (let i = 0; i < 5; i++) for (const side of [-1, 1]) {
    // Leave an opening on the paddy side of the road.
    if (side === 1 && (i === 2 || i === 3)) continue;
    const [x,z] = fromValley(48 + i * 31, side * 17);
    const turn = Math.atan2(-0.8 * -side, 0.6 * -side);
    list.push({ x,z,turn,scale:0.95,shape:i % 3 === 0 ? 'cottage' : 'house',wall:i % 2 ? [0.76,0.75,0.68] : [0.88,0.84,0.73],roof:i % 2 ? [0.17,0.22,0.26] : [0.24,0.27,0.29] });
    solid.push({x,z,y:heightAt(x,z)+2.7,turn,hx:3.7,hz:5.3,hy:3.4});
  }
  addBuildings(group, createBuildingMaterial(field), list);
  const buckets = new Map();
  const colors = { road:[0.26,0.29,0.28], concrete:[0.53,0.54,0.47], wood:[0.21,0.16,0.12], metal:[0.23,0.28,0.29], water:[0.30,0.48,0.47], rice:[0.37,0.58,0.19], earth:[0.35,0.34,0.20], cream:[0.87,0.82,0.66], red:[0.6,0.12,0.11] };
  const turn = Math.atan2(0.6,0.8);
  const rot = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),turn);
  const add = (geometry, key, u, v, y) => {
    // Local x is the opposite of the valley's v, local z follows the road.
    geometry.translate(-v,y,u).applyQuaternion(rot);
    if (!buckets.has(key)) buckets.set(key,[]);
    buckets.get(key).push(geometry.toNonIndexed ? (geometry.index ? geometry.toNonIndexed() : geometry) : geometry);
  };
  const box = (key,u,v,y,w,h,d) => add(new THREE.BoxGeometry(w,h,d),key,u,v,y);
  box('road',105,0,48.035,5.2,0.07,194);
  for (const side of [-1,1]) {
    box('concrete',105,side*2.9,48.02,0.44,0.12,194);
    box('water',105,side*3.25,47.99,0.23,0.025,194);
  }
  // Rectangular flooded rice plots with raised banks and parallel seedling rows.
  for (let i=0;i<3;i++) for(let j=0;j<2;j++) {
    const u=73+i*37,v=43+j*27;
    box('water',u,v,48.045,24,0.07,33);
    for(const edge of [-1,1]) {
      box('earth',u,v+edge*12.6,48.15,1.2,0.3,35);
      box('earth',u+edge*17,v,48.15,26,0.3,1.1);
    }
    for(let row=0;row<15;row++) for(let col=0;col<11;col++) {
      const pu=u-14+row*2,pv=v-10+col*2;
      const blade=new THREE.ConeGeometry(0.13,0.46,3);
      blade.scale(1,1,0.45);
      add(blade,'rice',pu,pv,48.29);
    }
  }
  // Low garden boundaries, entry slabs, outdoor units and roadside mailboxes.
  for(let i=0;i<5;i++) for(const side of [-1,1]) {
    if(side===1 && (i===2 || i===3)) continue;
    const u=48+i*31;
    box('concrete',u,side*8,48.10,8,0.2,10);
    box('concrete',u-8,side*16,48.6,13,1.2,0.22);
    for(let k=0;k<5;k++) add(new THREE.SphereGeometry(0.65,10,7),'rice',u-7+k*1.4,side*8,48.55);
    box('cream',u+5,side*20,48.6,0.65,0.9,1.0);
    box('metal',u-4,side*5,48.7,0.09,1.4,0.09);
    box('red',u-4,side*5,49.35,0.45,0.35,0.38);
  }
  // Concrete utility poles and two gently sagging cables along the lane.
  for(let i=0;i<7;i++) {
    const u=15+i*30,v=-4.5;
    add(new THREE.CylinderGeometry(0.11,0.16,8,10),'concrete',u,v,52);
    box('wood',u,v,55.5,2.2,0.12,0.14);
    box('metal',u,v,54.8,0.45,0.6,0.4);
    for(const offset of [-0.8,0.8]) {
      add(new THREE.CylinderGeometry(0.07,0.07,0.2,8),'cream',u,v+offset,55.65);
      if(i<6) {
        const pts=[];
        for(let k=0;k<=12;k++) { const t=k/12; const [x,z]=fromValley(u+t*30,v+offset);pts.push(new THREE.Vector3(x,55.7-Math.sin(t*Math.PI)*0.7,z)); }
        const wire=new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),16,0.024,4,false).toNonIndexed();
        if(!buckets.has('metal')) buckets.set('metal',[]);buckets.get('metal').push(wire);
      }
    }
  }
  for(const [key,geometries] of buckets) {
    const material=new THREE.ShaderMaterial({glslVersion:THREE.GLSL3,uniforms:{...field.uniforms,uPaint:{value:new THREE.Color(...colors[key])}},vertexShader:`out vec3 vWorld; out vec3 vNormal;
void main(){vec4 w=modelMatrix*vec4(position,1.0);vWorld=w.xyz;vNormal=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*viewMatrix*w;}`,fragmentShader:`${COMMON}
uniform vec3 uPaint; in vec3 vWorld; in vec3 vNormal; layout(location=0) out vec4 outC;
void main(){float lit=smoothstep(-0.05,0.15,dot(normalize(vNormal),uSunDir));vec3 light=mix(uSkyColor*0.7+0.15,uSunColor*0.42+uSkyColor*0.35,lit);outC=vec4(applyFog(uPaint*light,vWorld),1.0);}`});
    group.add(new THREE.Mesh(mergeGeometries(geometries),material));
    for(const geo of geometries) geo.dispose();
  }
  return {group,solid};
}
