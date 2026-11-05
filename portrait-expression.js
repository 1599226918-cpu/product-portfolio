// Mouth states are discrete: never alpha-blend two different lip contours.
export function mouthStateForHover({hovered=false,menuOpen=false,dialogOpen=false,touch=false}={}){
 return !!hovered&&hovered!=='index:0'&&!menuOpen&&!dialogOpen&&!touch?'open':'smile';
}
export const mouthGLSL=`
vec4 personalFace(vec2 pixel){
 vec4 base=texture2D(tMap,vec2(pixel.x/1272.0,1.0-pixel.y/1237.0));
 // Both lip outlines lie completely inside the opaque inner patch.
 // Feather only the surrounding skin, never the lips or mouth cavity.
 float mouthMask=1.0-smoothstep(.82,1.0,length((pixel-vec2(636.0,663.0))/vec2(130.0,80.0)));
 if(mouthMask<=0.0)return base;
 vec3 expression;
 if(uMouthOpen>.5){
  expression=texture2D(tPersonalSurprise,vec2((pixel.x-104.0)/1046.0,1.0-(pixel.y-31.0)/1168.0)).rgb;
 }else{
  expression=texture2D(tPersonalSmile,vec2((pixel.x-147.0)/968.0,1.0-(pixel.y-3.0)/1244.0)).rgb;
 }
 return vec4(mix(base.rgb,expression,mouthMask),base.a);
}
`;
