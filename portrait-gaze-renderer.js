import {gazeAtlasGLSL} from './portrait-gaze-atlas.js';

// Complete photographic eye patches, registered once before shader compilation.
// Directions only select a photograph; no iris/eyelid UV deformation runs here.
const number=value=>Number(value).toFixed(8);
const dot=(row)=>`dot(vec3(pixel,1.0),vec3(${row.map(number).join(',')}))`;

export function registeredGazeGLSL(registration){
 const coordinates=registration.frames.map((frame,index)=>{
  const sides=['left','right'].map(side=>{
   const matrix=frame.eyes[side].portraitToTile.map(row=>row.slice());
   // Registration uses integer tile boundaries; sprite selection uses thirds.
   matrix[0][2]+=frame.rect[0]-frame.col*registration.atlasSize[0]/3-.5;
   matrix[1][2]+=frame.rect[1]-frame.row*registration.atlasSize[1]/3-.5;
   return `vec2(${dot(matrix[0])},${dot(matrix[1])})`;
  });
  return `if(index<${(index+.5).toFixed(1)})return isLeft?${sides[0]}:${sides[1]};`;
 }).join('\n');
 return `${gazeAtlasGLSL}
vec2 registeredEyePixel(vec2 pixel,float index,bool isLeft){
 ${coordinates}
 return vec2(0.0);
}
vec4 photographicGaze(vec2 pixel,vec2 mouse,vec4 original){
 // Fade on surrounding skin, well outside both the sclera and lash lines.
 bool isLeft=pixel.x<633.0;
 vec2 center=isLeft?vec2(534.0,461.0):vec2(732.0,459.0);
 vec2 distance=(pixel-center)/vec2(68.0,39.0);
 float alpha=1.0-smoothstep(.78,1.0,length(distance));
 if(alpha<=0.0)return original;
 vec2 cell=floor(clamp(mouse,vec2(-.99),vec2(.99))*1.5+1.5);
 float index=cell.y*3.0+cell.x;
 vec2 source=registeredEyePixel(pixel,index,isLeft);
 vec4 gaze=gazeAtlasSample(source/(uPersonalGazeAtlasSize/3.0-1.0),mouse);
 return vec4(mix(original.rgb,gaze.rgb,alpha),original.a);
}
`;
}
