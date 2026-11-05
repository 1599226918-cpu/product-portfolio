// The approved photograph is never regenerated: SVG separates its visible
// objects, while a bounded texture displacement animates only the eye sockets.
export const ATLAS = { width: 1272, height: 1237 };
const NS = 'http://www.w3.org/2000/svg';
const headEdge = 'M0 246 L263 246 L274 241 L285 248 L300 246 L321 255 L337 252 L356 262 L381 266 L399 271 L419 274 L436 275 L454 281 L478 282 L498 291 L523 290 L544 295 L565 286 L581 284 L597 277 L617 278 L632 271 L650 282 L672 286 L694 291 L714 290 L735 281 L755 283 L779 277 L803 270 L820 276 L836 276 L849 287 L866 294 L884 289 L903 298 L927 301 L948 307 L965 299 L984 295 L1004 285 L1024 274 L1046 270 L1272 270';
const shapes = [
  {id:'cloud', path:'M252 247 L262 197 L304 171 L300 142 L316 117 L346 110 L373 119 L401 153 L406 180 L350 193 L379 262 Z'},
  {id:'books', path:'M389 73 L554 4 L595 21 L612 69 L656 53 L697 78 L665 107 L646 161 L615 280 L581 289 L535 183 L522 167 L412 185 L393 163 Z', label:'书籍', href:'/product-portfolio/books', center:[550,120]},
  {id:'marks', path:'M826 62 H1065 V220 H975 V146 H826 Z'},
  {id:'laptop', path:'M348 194 L511 165 Q531 164 539 186 L581 293 L544 302 L465 287 L396 273 Z', label:'活动', href:'/product-portfolio/shows', center:[465,220]},
  {id:'player', path:'M618 277 L662 110 Q675 72 708 77 L958 147 Q981 154 971 182 L950 238 L931 223 Q895 205 876 238 L871 261 L884 290 L834 293 L800 278 L743 287 L682 297 Z', label:'影音', href:'/product-portfolio/watch-listen', center:[790,185]},
  {id:'heart', path:'M869 254 Q870 216 901 216 Q925 214 943 239 Q962 218 982 227 Q1017 228 1019 271 L1009 287 L980 309 L940 313 L895 290 Z'},
];
const smooth = (a,b,x) => {const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
export function gazeTarget(x,y,rect){
  const sx=rect.width/ATLAS.width, sy=rect.height/ATLAS.height;
  return {x:Math.max(-1,Math.min(1,(x-(rect.left+635*sx))/(240*sx))),y:Math.max(-1,Math.min(1,(y-(rect.top+461*sy))/(190*sy)))};
}
export function eyeSample(x,y,cx,cy,gaze){
  const radius=Math.hypot((x-cx)/48,(y-cy)/20);
  const weight=1-smooth(.48,1,radius);
  return {x:x-gaze.x*8*weight,y:y-gaze.y*4*weight};
}
function svg(tag,attrs={}){const el=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs))el.setAttribute(k,v);return el;}
export function scrollPeelProgress(scroll,top,height,viewport,reduced=false){
  return reduced?0:Math.max(0,Math.min(1,(scroll-top-viewport*.07)/Math.max(1,height-viewport*.15)));
}
export function peelGeometry(progress){
  const p=Math.max(0,Math.min(1,progress));
  const slope=.18, intercept=ATLAS.height+20-1500*p, compression=.5, d=1+slope*slope, k=1+compression;
  // SVG y increases downward. Start below the braid and move the crease up;
  // only paper BELOW it lifts onto the front, leaving the forehead intact.
  // The compressed reflection keeps every point on the crease attached.
  return {left:intercept,right:intercept+slope*ATLAS.width,slope,
    matrix:[1-k*slope*slope/d,k*slope/d,k*slope/d,1-k/d,-k*slope*intercept/d,k*intercept/d]};
}

export async function enhancePortrait(stage,cfg){
  const img=stage.querySelector('img');
  await img.decode();
  if(!stage.isConnected)return ()=>{};
  const abort=new AbortController(), signal=abort.signal;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const fine=matchMedia('(hover: hover) and (pointer: fine)');
  const art=document.createElement('div');art.className='portrait-artboard';
  const scene=svg('svg',{viewBox:'0 0 1272 1237',class:'portrait-scene','aria-label':'互动人像：选择头顶的电脑、书籍或播放器'});
  const defs=svg('defs');scene.append(defs);
  const props=svg('g');scene.append(props);
  const id='portrait-'+crypto.randomUUID();
  const tooltip=document.createElement('div');tooltip.className='portrait-tooltip';tooltip.setAttribute('role','status');
  const hitLinks=new Map();
  // Reconstruct only surfaces that were hidden behind another object in the
  // flattened reference. These sit beneath its photographic visible pixels.
  // Without them, lifting one object reveals holes in its neighbour's edge.
  function backing(name,parent){
    const surfaces={
      books:[
        ['M395 78 L554 13 L590 28 L645 263 L475 326 Z','#235039'],
        ['M503 101 L657 61 L687 82 L640 323 L563 339 Z','#df8584'],
      ],
      laptop:[['M354 198 L512 171 Q527 168 534 185 L591 320 L409 299 Z','#b6b7bc']],
      player:[['M702 82 Q679 80 667 114 L616 286 Q611 305 632 312 L876 377 Q896 383 906 361 L967 179 Q977 158 955 151 L726 86 Z','#bfc0c0']],
      heart:[['M874 254 Q875 220 901 220 Q925 220 943 243 Q965 222 985 232 Q1015 235 1014 272 L980 310 L945 318 L899 291 Z','#ed7675']],
    };
    for(const [d,fill] of surfaces[name]||[])parent.append(svg('path',{d,fill,'pointer-events':'none'}));
  }
  function layer(name,path,parent){
    const clip=svg('clipPath',{id:id+'-'+name});clip.append(svg('path',{d:path}));defs.append(clip);
    const image=svg('image',{href:cfg.heroArtwork,width:1272,height:1237,'clip-path':`url(#${id}-${name})`,'pointer-events':'none'});parent.append(image);
  }
  for(const spec of shapes){
    const item=svg('g',{'class':'portrait-object','data-object':spec.id});
    item.style.transformOrigin=`${spec.center?.[0]||650}px ${spec.center?.[1]||240}px`;
    props.append(item);
    const floating=svg('g',{class:'portrait-float'});item.append(floating);
    if(spec.href){
      const setting=cfg.heroLinks?.[spec.id]||{};
      const href=setting.href||spec.href,label=setting.label||spec.label;
      const link=svg('a',{href,'aria-label':label,'data-portrait-link':spec.id,tabindex:0});
      floating.append(link);backing(spec.id,link);layer(spec.id,spec.path,link);
      const hit=svg('path',{d:spec.path,fill:'transparent',class:'portrait-hit','pointer-events':'all'});link.append(hit);
      const show=()=>{
        art.dataset.active=spec.id;tooltip.textContent=label+' ↗';
        tooltip.style.left=(spec.center[0]/1272*100)+'%';
        tooltip.style.top=(Math.max(20,spec.center[1]-90)/1237*100)+'%';
        art.classList.add('has-object-focus');
      };
      const hide=()=>{delete art.dataset.active;art.classList.remove('has-object-focus');};
      link.addEventListener('pointerenter',show,{signal});link.addEventListener('pointerleave',hide,{signal});
      link.addEventListener('focus',show,{signal});link.addEventListener('blur',hide,{signal});
      // This link intentionally bypasses the original invisible model's raycast.
      link.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();location.assign(href);},{signal});
      link.addEventListener('keydown',e=>{if(e.key===' '){e.preventDefault();location.assign(href);}},{signal});
      hitLinks.set(spec.id,{label,href,show,hide});
    }else {backing(spec.id,floating);layer(spec.id,spec.path,floating);}
  }
  const faceFront=document.createElement('div');faceFront.className='portrait-sticker-front';
  const faceScene=svg('svg',{viewBox:'0 0 1272 1237',class:'portrait-face-scene','aria-hidden':'true'});
  const face=svg('g',{class:'portrait-face'});faceScene.append(face);
  layer('face',headEdge+' L1272 1237 H0 Z',face);
  faceFront.append(faceScene);
  const reverse=svg('svg',{viewBox:'0 0 1272 1237',class:'portrait-sticker-reverse','aria-hidden':'true'});
  const reverseDefs=svg('defs');reverse.append(reverseDefs);
  const silhouette=svg('mask',{id:id+'-paper',maskUnits:'userSpaceOnUse',x:0,y:0,width:1272,height:1237,style:'mask-type:alpha'});
  const silhouetteImage=svg('g',{'clip-path':`url(#${id}-face)`});
  silhouetteImage.append(svg('image',{href:cfg.heroArtwork,width:1272,height:1237}));silhouette.append(silhouetteImage);reverseDefs.append(silhouette);
  const liftedClip=svg('clipPath',{id:id+'-lifted'}),liftedPath=svg('path');liftedClip.append(liftedPath);reverseDefs.append(liftedClip);
  const gradient=svg('linearGradient',{id:id+'-curl',gradientUnits:'userSpaceOnUse',x1:0,x2:0,y1:0,y2:1});
  for(const [offset,color] of [['0%','#faf9f3'],['12%','#bbb9b0'],['42%','#eeece3'],['100%','#fbfaf4']])gradient.append(svg('stop',{offset,'stop-color':color}));reverseDefs.append(gradient);
  const folded=svg('g',{class:'portrait-folded-paper'});
  const lifted=svg('g',{'clip-path':`url(#${id}-lifted)`});
  lifted.append(svg('rect',{x:0,y:0,width:1272,height:1237,fill:`url(#${id}-curl)`,mask:`url(#${id}-paper)`}));folded.append(lifted);reverse.append(folded);
  art.append(scene,faceFront,reverse,tooltip);
  stage.replaceChildren(art);
  const resize=new ResizeObserver(()=>{
    // The stage defines the close-up width; fitting to viewport height would
    // shrink the face again just to squeeze the complete braid above the fold.
    const width=stage.clientWidth;
    art.style.width=width+'px';art.style.height=(width*1237/1272)+'px';
  });resize.observe(stage);

  // Phone/keyboard alternatives have actual links and stay out of the braid.
  const nav=document.createElement('nav');nav.className='portrait-mobile-nav';nav.setAttribute('aria-label','头像物件导航');
  for(const key of ['laptop','books','player']){const item=hitLinks.get(key);const a=document.createElement('a');a.href=item.href;a.textContent=item.label+' ↗';a.dataset.object=key;
    a.addEventListener('focus',item.show,{signal});a.addEventListener('blur',item.hide,{signal});
    a.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();location.assign(item.href);},{signal});nav.append(a);}
  stage.append(nav);

  // Sample the existing photograph, with zero displacement along eyelid borders.
  // Both eyes share the same target; all pixels outside their sockets stay exact.
  const source=document.createElement('canvas');source.width=1272;source.height=1237;
  const sourceCtx=source.getContext('2d',{willReadFrequently:true});sourceCtx.drawImage(img,0,0);
  const pixels=sourceCtx.getImageData(0,0,1272,1237).data;
  const eyes=[{x:473,y:423,cx:536,cy:462},{x:671,y:423,cx:733,cy:459}].map(spec=>{
    const canvas=document.createElement('canvas');canvas.width=128;canvas.height=80;canvas.className='portrait-eye';canvas.setAttribute('aria-hidden','true');
    Object.assign(canvas.style,{left:spec.x/1272*100+'%',top:spec.y/1237*100+'%',width:128/1272*100+'%',height:80/1237*100+'%'});
    faceFront.append(canvas);const ctx=canvas.getContext('2d');return {...spec,canvas,ctx,output:ctx.createImageData(128,80)};
  });
  let target={x:0,y:0},current={x:0,y:0},frame=0,resetTimer=0,visible=true,disposed=false,lastTime=0;
  function paint(){
    for(const eye of eyes){
      for(let y=0;y<80;y++)for(let x=0;x<128;x++){
        const p=eyeSample(x+eye.x,y+eye.y,eye.cx,eye.cy,current);
        const ix=Math.floor(p.x),iy=Math.floor(p.y),fx=p.x-ix,fy=p.y-iy,di=(y*128+x)*4;
        const si=(iy*1272+ix)*4;
        for(let c=0;c<4;c++)eye.output.data[di+c]=pixels[si+c]*(1-fx)*(1-fy)+pixels[si+4+c]*fx*(1-fy)+pixels[si+1272*4+c]*(1-fx)*fy+pixels[si+1272*4+4+c]*fx*fy;
      }
      eye.ctx.putImageData(eye.output,0,0);
    }
    art.dataset.gazeX=current.x.toFixed(3);art.dataset.gazeY=current.y.toFixed(3);
  }
  function tick(time){
    frame=0;if(disposed||!visible)return;
    const ease=1-Math.exp(-Math.min(time-lastTime||16,50)/70);lastTime=time;
    current.x+=(target.x-current.x)*ease;current.y+=(target.y-current.y)*ease;paint();
    if(Math.abs(target.x-current.x)+Math.abs(target.y-current.y)>.002)frame=requestAnimationFrame(tick);
  }
  function start(){if(!frame&&visible&&!disposed){lastTime=0;frame=requestAnimationFrame(tick);}}
  function reset(){clearTimeout(resetTimer);target={x:0,y:0};start();}
  document.addEventListener('pointermove',e=>{
    if(!fine.matches||reduced.matches||e.pointerType==='touch'||!visible||document.documentElement.classList.contains('has-modal-open'))return;
    target=gazeTarget(e.clientX,e.clientY,art.getBoundingClientRect());start();
    clearTimeout(resetTimer);resetTimer=setTimeout(reset,1600);
  },{signal,passive:true});
  document.documentElement.addEventListener('pointerleave',reset,{signal});window.addEventListener('blur',reset,{signal});
  reduced.addEventListener('change',reset,{signal});
  const visibility=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;art.classList.toggle('is-paused',!visible);if(visible)start();else{cancelAnimationFrame(frame);frame=0;}});
  visibility.observe(stage);paint();
  // Listen to the actual scroll position so touch, wheel, keyboard and the
  // reference smooth-scroll controller all drive the same reversible peel.
  let peelFrame=0;
  const hero=stage.closest('#sectionHero');
  function paintPeel(){
    peelFrame=0;if(disposed)return;
    const rect=hero.getBoundingClientRect();
    const p=scrollPeelProgress(scrollY,rect.top+scrollY,rect.height,innerHeight,reduced.matches);
    const g=peelGeometry(p);
    faceFront.style.clipPath=p===0?'none':`polygon(0 0,100% 0,100% ${g.right/1237*100}%,0 ${g.left/1237*100}%)`;
    liftedPath.setAttribute('d',`M0 ${g.left} L1272 ${g.right} V1237 H0 Z`);
    folded.setAttribute('transform',`matrix(${g.matrix.join(' ')})`);
    // Light and shade follow the crease normal, including its diagonal angle.
    const creaseY=g.left+g.slope*636;
    gradient.setAttribute('x1',636);gradient.setAttribute('y1',creaseY);
    gradient.setAttribute('x2',636-g.slope*300);gradient.setAttribute('y2',creaseY+300);
    const opacity=1-smooth(.86,1,p);
    reverse.style.opacity=p===0?0:opacity;faceFront.style.opacity=opacity;
    // Keep the top objects while the braid/lower face curls. They disappear
    // only when the fold reaches the top of the head.
    props.style.opacity=1-smooth(.58,.76,p);props.style.visibility=p>=.76?'hidden':'visible';
    if(p>=.58){delete art.dataset.active;art.classList.remove('has-object-focus');}
    art.dataset.peelProgress=p.toFixed(3);
  }
  function requestPeel(){if(!peelFrame&&!disposed)peelFrame=requestAnimationFrame(paintPeel);}
  addEventListener('scroll',requestPeel,{signal,passive:true});addEventListener('resize',requestPeel,{signal,passive:true});
  reduced.addEventListener('change',requestPeel,{signal});
  const peelResize=new ResizeObserver(requestPeel);peelResize.observe(hero);paintPeel();
  art.classList.add('is-interactive');
  return ()=>{disposed=true;abort.abort();resize.disconnect();peelResize.disconnect();visibility.disconnect();clearTimeout(resetTimer);cancelAnimationFrame(frame);cancelAnimationFrame(peelFrame);nav.remove();};
}
