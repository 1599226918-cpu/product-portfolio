// Match the reference site's discrete 3 x 3 eye atlas, without blending eyes.
// uMouse uses the reference's image-axis convention: negative y looks up.
export const GAZE_DIRECTIONS=Object.freeze([
 'up-left','up','up-right',
 'left','center','right',
 'down-left','down','down-right'
]);

const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));
const cellForAxis=value=>Math.floor(clamp(Number.isNaN(value)?0:value,-.99,.99)*1.5+1.5);

/** Atlas rows are numbered from the image's top; index is row-major. */
export function directionForMouse(x=0,y=0){
 const column=cellForAxis(x),row=cellForAxis(y),index=row*3+column;
 return {column,row,index,name:GAZE_DIRECTIONS[index]};
}

/**
 * CPU counterpart for direction/UV inspection and regression checks.
 * u,v describe the patch from top-left (0,0) to bottom-right (1,1).
 * The returned x,y are WebGL UVs for a texture uploaded with flipY=true.
 */
export function atlasUvForMouse(u,v,x,y,width,height){
 if(!(width>=3&&height>=3))throw new RangeError('The gaze atlas must be at least 3 x 3 pixels.');
 const {column,row}=directionForMouse(x,y);
 const insetX=.5/width,insetY=.5/height;
 const imageX=column/3+insetX+clamp(u,0,1)*(1/3-2*insetX);
 const imageY=row/3+insetY+clamp(v,0,1)*(1/3-2*insetY);
 return {x:imageX,y:1-imageY};
}

/**
 * Required material uniforms:
 *   tPersonalGazeAtlas: the 3 x 3 atlas texture, flipY=true
 *   uPersonalGazeAtlasSize: its actual pixel width and height (Vector2)
 *
 * Use LinearFilter for min/mag, generateMipmaps=false and ClampToEdgeWrapping.
 * The half-texel inset confines bilinear filtering to the selected frame;
 * disabling mipmaps is required because atlas-wide mipmaps can mix frames.
 * patchUv is image-oriented (top-left origin). uMouse is the original uniform.
 */
export const gazeAtlasGLSL=`
uniform sampler2D tPersonalGazeAtlas;
uniform vec2 uPersonalGazeAtlasSize;

vec4 gazeAtlasSample(vec2 patchUv,vec2 mouse){
 // Keep the original floor-based direction selection. No temporal crossfade.
 vec2 cell=floor(clamp(mouse,vec2(-.99),vec2(.99))*1.5+1.5);
 vec2 halfTexel=.5/max(uPersonalGazeAtlasSize,vec2(3.0));
 vec2 frameMin=cell/3.0+halfTexel;
 vec2 frameMax=(cell+1.0)/3.0-halfTexel;
 vec2 imageUv=frameMin+clamp(patchUv,vec2(0.0),vec2(1.0))*(frameMax-frameMin);
 // Image top-row -> high texture y because this texture uses flipY=true.
 return texture2D(tPersonalGazeAtlas,vec2(imageUv.x,1.0-imageUv.y));
}
`;
