// A single eye source for every expression. Never sample a cross-faded eye.
export const IRIS=Object.freeze({radius:21,maxX:8,maxY:4,halfWidth:44});
const smooth=(a,b,v)=>{const t=Math.max(0,Math.min(1,(v-a)/(b-a)));return t*t*(3-2*t);};
// Manually traced against the approved 1272 x 1237 portrait, in atlas pixels.
export const EYE_EDGES=Object.freeze({
 left:{upper:[3,-4,-9,-11.5,-12,-11,-7,.5,12],lower:[5,13,16.7,17.5,17,16,14,13,14]},
 right:{upper:[13,1,-8,-12,-13,-11,-7,-2,3],lower:[14,15,16,17.5,17,14.5,11,7,3.5]}
});
export function eyeEdges(x,tilt=5){
 const e=tilt>0?EYE_EDGES.left:EYE_EDGES.right,t=Math.max(0,Math.min(8,(x+40)/10)),i=Math.min(7,Math.floor(t)),a=t-i;
 return [e.upper[i]*(1-a)+e.upper[i+1]*a,e.lower[i]*(1-a)+e.lower[i+1]*a];
}
export function irisAperture(x,y,tilt=5){
 if(Math.abs(x)>=40)return 0;
 const [upper,lower]=eyeEdges(x,tilt);
 return smooth(0,.6,Math.min(y-upper,lower-y))*(1-smooth(38,40,Math.abs(x)));
}
const edgeGLSL=(key,axis)=>{
 const a=EYE_EDGES[key][axis];
 return a.slice(0,-1).map((v,i)=>`if(x<=${(-30+i*10).toFixed(1)})return mix(${v.toFixed(1)},${a[i+1].toFixed(1)},clamp((x-(${(-40+i*10).toFixed(1)}))/10.0,0.0,1.0));`).join('\n')+`return ${a[8].toFixed(1)};`;
};
export function irisOffset(x,y){return{x:Math.max(-1,Math.min(1,x))*IRIS.maxX,y:Math.max(-1,Math.min(1,y))*IRIS.maxY};}
export const irisGLSL=`
vec4 eyeSource(vec2 pixel){return texture2D(tMap,vec2(pixel.x/1272.0,1.0-pixel.y/1237.0));}
float leftUpper(float x){${edgeGLSL('left','upper')}}
float leftLower(float x){${edgeGLSL('left','lower')}}
float rightUpper(float x){${edgeGLSL('right','upper')}}
float rightLower(float x){${edgeGLSL('right','lower')}}
vec2 eyeEdges(float x,float tilt){return tilt>0.0?vec2(leftUpper(x),leftLower(x)):vec2(rightUpper(x),rightLower(x));}
float irisAperture(vec2 p,float tilt){
 if(abs(p.x)>=40.0)return 0.0;
 vec2 edges=eyeEdges(p.x,tilt);
 return smoothstep(0.0,.6,min(p.y-edges.x,edges.y-p.y))*(1.0-smoothstep(38.0,40.0,abs(p.x)));
}
vec4 moveIris(vec2 pixel,vec2 center,vec2 offset,float tilt,vec4 original){
 vec2 local=pixel-center;
 float aperture=irisAperture(local,tilt);
 if(aperture<=0.0||length(offset)<.001)return original;
 // One continuous inverse mapping: no second iris and no painted sclera.
 // The center moves rigidly; the existing white on each side fills the gap.
 float x=local.x;
 float sx=x-offset.x;
 float left=-21.0+offset.x,right=21.0+offset.x;
 if(x<left)sx=mix(-40.0,-21.0,clamp((x+40.0)/(left+40.0),0.0,1.0));
 if(x>right)sx=mix(21.0,40.0,clamp((x-right)/(40.0-right),0.0,1.0));
 // Keep both photographed eyelid boundaries fixed. Mapping stays strictly
 // inside the eye opening and never samples a lash or skin into the eyeball.
 vec2 dest=eyeEdges(x,tilt);
 vec2 source=eyeEdges(sx,tilt);
 float t=clamp((local.y-dest.x)/max(dest.y-dest.x,.5),0.0,1.0);
 float originalCenter=clamp(-source.x/max(source.y-source.x,.5),.15,.85);
 float movedCenter=clamp((offset.y-dest.x)/max(dest.y-dest.x,.5),.15,.85);
 float sy=t<movedCenter?t/movedCenter*originalCenter:
  originalCenter+(t-movedCenter)/(1.0-movedCenter)*(1.0-originalCenter);
 vec3 moved=eyeSource(center+vec2(sx,mix(source.x,source.y,sy))).rgb;
 return vec4(mix(original.rgb,moved,aperture),original.a);
}
`;
