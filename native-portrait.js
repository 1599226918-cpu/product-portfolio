import {mouthStateForHover,mouthGLSL} from '/product-portfolio/portrait-expression.js';
import {installPersonalDevices} from '/product-portfolio/native-devices.js';
import {directionForMouse} from '/product-portfolio/portrait-gaze-atlas.js';
import {registeredGazeGLSL} from '/product-portfolio/portrait-gaze-renderer.js';
// Personal textures inside the reference's original Three.js scene.
// The reference's cylindrical vertex shader, dual-sided paper material,
// preloader/reveal timelines, camera and scroll controller remain in charge.
const edge='M0 246 L263 246 L274 241 L285 248 L300 246 L321 255 L337 252 L356 262 L381 266 L399 271 L419 274 L436 275 L454 281 L478 282 L498 291 L523 290 L544 295 L565 286 L581 284 L597 277 L617 278 L632 271 L650 282 L672 286 L694 291 L714 290 L735 281 L755 283 L779 277 L803 270 L820 276 L836 276 L849 287 L866 294 L884 289 L903 298 L927 301 L948 307 L965 299 L984 295 L1004 285 L1024 274 L1046 270 L1272 270';
const load=async url=>{const image=new Image();image.src=url;await image.decode();return image;};
function surface(image,top=false){
 const canvas=document.createElement('canvas');canvas.width=1272;canvas.height=1237;
 const ctx=canvas.getContext('2d');ctx.save();
 ctx.clip(new Path2D(edge+(top?' L1272 0 H0 Z':' L1272 1237 H0 Z')));
 if(top)ctx.drawImage(image,147,3,968,1244);else ctx.drawImage(image,0,0,1272,1237);
 ctx.restore();return canvas;
}
export async function prepareNativePortrait(cfg){
 const [base,surprise,smile,eyeAtlas,eyeRegistration]=await Promise.all([load(cfg.heroArtwork),load('/product-portfolio/portraits/expressions/surprise-v1.webp'),load('/product-portfolio/portraits/expressions/smile-v1.webp'),load('/product-portfolio/portraits/gaze/eye-directions-v1.png'),fetch('/product-portfolio/portraits/gaze/registration-v1.json').then(r=>{if(!r.ok)throw new Error('Gaze registration unavailable');return r.json();})]);
 const bottom=surface(base),top=surface(smile,true);
 window.__installPersonalHead=(scene,THREE)=>{
  const {PlaneGeometry}=THREE;
  scene.heads.visible=true;
  const texture=(source,template)=>{const Texture=Object.getPrototypeOf(Object.getPrototypeOf(template)).constructor;const t=new Texture(source);t.colorSpace=template.colorSpace;t.flipY=true;t.needsUpdate=true;return t;};
  const template=scene.headBottom.frontFace.material.uniforms.tMap.value;
  const gazeEnabled={value:1};
  const mouth={value:0};
  let pointerOver=false,touchPointer=false;
  const reducedGaze=matchMedia('(prefers-reduced-motion: reduce)');
  const maps={bottom:texture(bottom,template),top:texture(top,template),surprise:texture(surprise,template),smile:texture(smile,template)};
  const gazeTexture=texture(eyeAtlas,template);
  gazeTexture.generateMipmaps=false;gazeTexture.minFilter=gazeTexture.magFilter;
  // Original model was a square 42x42 grid. Preserve its world placement but
  // give the longer personal braid its real aspect and a smooth 160x160 mesh.
  for(const mesh of scene.heads.children){
   mesh.geometry=new PlaneGeometry(2.6,2.6*1237/1272,160,160);
   mesh.position.y=-2.2;
   const material=mesh.material;
   material.uniforms.tMap.value=material.defines.IS_TOP?maps.top:maps.bottom;
   material.uniforms.tPersonalSurprise={value:maps.surprise};
   material.uniforms.tPersonalSmile={value:maps.smile};
   material.uniforms.tPersonalGazeAtlas={value:gazeTexture};
   material.uniforms.uPersonalGazeAtlasSize={value:scene.globalHeadUniforms.uMouse.value.clone().set(eyeAtlas.width,eyeAtlas.height)};
   material.uniforms.uPersonalGazeEnabled=gazeEnabled;
   material.uniforms.uMouthOpen=mouth;
   material.fragmentShader=material.fragmentShader.replace('uniform sampler2D tSurprisedFace;',`uniform sampler2D tSurprisedFace;
    uniform sampler2D tPersonalSurprise;
    uniform sampler2D tPersonalSmile;
    uniform float uPersonalGazeEnabled;
    uniform float uMouthOpen;`);
   const start=material.fragmentShader.indexOf('vec4 eyesTexture');
   const end=material.fragmentShader.indexOf('#endif',start);
   material.fragmentShader=material.fragmentShader.slice(0,start)+`
     vec2 pixel=vec2(vUv.x*1272.0,(1.0-vUv.y)*1237.0);
     color=personalFace(pixel);
     color=photographicGaze(pixel,mix(vec2(.2),uMouse,uPersonalGazeEnabled),color);
   `+material.fragmentShader.slice(end);
   const helpers=`${registeredGazeGLSL(eyeRegistration)}\n${mouthGLSL}`;
   material.fragmentShader=material.fragmentShader.replace('void main() {',helpers+'\nvoid main() {');
   material.needsUpdate=true;
  }
  scene.params.dom.querySelector('[data-replay-portrait]')?.addEventListener('click',()=>{
   scene.loadingAnimationTl?.kill();scene.revealAnimationTl?.kill();scene.peelOnScrollTl?.kill();scene.mexicanWaveTimeline?.kill();
   window.scrollTo({top:0,behavior:'instant'});scene.setRevealAnimation();
  });
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){
   const still=()=>{scene.heads.position.y=-1;scene.heads.scale.set(1,1,1);scene.camera.position.z=10;scene.renderPlane.mesh.visible=true;
    for(const mesh of scene.heads.children){mesh.material.uniforms.uBendOrigin.value.set(2,0,0);if(mesh.material.defines.IS_TOP){mesh.material.uniforms.uBendAxis.value.set(-1,1,0);mesh.material.uniforms.uBendOrigin.value.set(5,0,0);}}
    scene.models.children.forEach(x=>x.visible=true);scene.hoverRaycaster.params.disabled=false;};
   scene.setRevealAnimation=still;scene.setLoadingAnimation=still;
  }
  installPersonalDevices(scene,THREE);
  scene.params.dom.dataset.gazeMode='original-nine-photo-frames-v5';
  const point=e=>{pointerOver=true;touchPointer=e.pointerType==='touch';};
  const reset=()=>{pointerOver=false;mouth.value=0;};
  document.addEventListener('pointermove',point,{passive:true});
  document.documentElement.addEventListener('pointerleave',reset);
  window.addEventListener('blur',reset);
  reducedGaze.addEventListener('change',reset);
  const dispose=scene.dispose.bind(scene);
  scene.dispose=function(){document.removeEventListener('pointermove',point);document.documentElement.removeEventListener('pointerleave',reset);window.removeEventListener('blur',reset);reducedGaze.removeEventListener('change',reset);dispose();};
  scene.params.dom.dataset.portraitRenderer='original-three-curved-paper';
  scene.params.dom.dataset.expressionSequence='默认微笑；悬停头顶物件张嘴；移开恢复微笑';
  const originalUpdate=scene.update.bind(scene);
  scene.update=function(){originalUpdate();
   const hovered=pointerOver?this.hoverRaycaster.isHovering.current:false;
   const menuOpen=this.hoverRaycaster.params.disabled||document.querySelector('button[aria-label="打开菜单"]')?.getAttribute('aria-expanded')==='true';
   const state=mouthStateForHover({hovered,menuOpen,dialogOpen:!!document.querySelector('dialog[open]'),touch:touchPointer});
   mouth.value=state==='open'?1:0;
   this.params.dom.dataset.mouthState=state;
   gazeEnabled.value=reducedGaze.matches||touchPointer?0:1;
   const gaze=gazeEnabled.value?this.globalHeadUniforms.uMouse.value:{x:.2,y:.2};
   const direction=directionForMouse(gaze.x,gaze.y);
   this.params.dom.dataset.gazeX=gaze.x.toFixed(3);this.params.dom.dataset.gazeY=gaze.y.toFixed(3);
   this.params.dom.dataset.gazeDirection=direction.name;
   this.params.dom.dataset.gazeFrame=String(direction.index);
   this.params.dom.dataset.revealProgress=(this.revealAnimationTl||this.loadingAnimationTl)?.progress().toFixed(3)||'0';this.params.dom.dataset.expressionProgress=this.headBottom.frontFace.material.uniforms.uSuprisedVisibility.value.toFixed(3);};
 };
}
