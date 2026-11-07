// Personal hero props, using the same scene and scroll/reveal parents as the original.
export function installPersonalDevices(scene,T){
 const {Group,Mesh,BoxGeometry,PlaneGeometry,MeshBasicMaterial,ShaderMaterial}=T;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 // That map is now an ordinary Texture; its constructor is the direct prototype.
 const TextureClass=scene.headBottom.frontFace.material.uniforms.tMap.value.constructor;
 const mat=hex=>new ShaderMaterial({uniforms:{paint:{value:[((hex>>16)&255)/255,((hex>>8)&255)/255,(hex&255)/255]}},vertexShader:'varying vec3 n; void main(){n=normalize(normalMatrix*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:'uniform vec3 paint; varying vec3 n; void main(){vec3 N=normalize(n);float light=.66+.28*max(dot(N,normalize(vec3(-.5,.9,1.))),0.);float shine=pow(max(dot(N,normalize(vec3(-.2,.6,1.))),0.),22.)*.16;gl_FragColor=vec4(paint*light+shine,1.);}'});
 function box(parent,w,h,d,color,x=0,y=0,z=0,r=.035){
  const g=new BoxGeometry(w,h,d,8,8,4),p=g.attributes.position;
  r=Math.min(r,w/2,h/2,d/2);
  for(let i=0;i<p.count;i++){
   const a=[p.getX(i),p.getY(i),p.getZ(i)],c=a.map((v,k)=>Math.max(-[w,h,d][k]/2+r,Math.min([w,h,d][k]/2-r,v))),v=a.map((n,k)=>n-c[k]),l=Math.hypot(...v)||1;
   p.setXYZ(i,...c.map((n,k)=>n+v[k]/l*r));
  }g.computeVertexNormals();const m=new Mesh(g,mat(color));m.position.set(x,y,z);parent.add(m);return m;
 }
 function screen(parent,w,h,x,y,z,phone=false){
  const c=document.createElement('canvas');c.width=phone?480:960;c.height=phone?960:600;
  const ctx=c.getContext('2d'),W=c.width,H=c.height;
  ctx.fillStyle='#202943';ctx.fillRect(0,0,W,H);
  const grad=ctx.createLinearGradient(0,0,W,H);grad.addColorStop(0,'#495e87');grad.addColorStop(1,'#202943');ctx.fillStyle=grad;ctx.fillRect(0,0,W,H);
  ctx.fillStyle='#ff9cba';ctx.font=`600 ${phone?40:46}px sans-serif`;ctx.fillText(phone?'我的产品':'网站作品',40,phone?180:104);
  ctx.fillStyle='#e9ecf3';ctx.font=`${phone?21:26}px sans-serif`;ctx.fillText(phone?'灵感 · 体验 · 记录':'让想法，成为看得见的产品',40,phone?222:152);
  if(phone){ctx.fillStyle='#fff';ctx.font='500 75px sans-serif';ctx.fillText('09:41',40,100);for(let i=0;i<3;i++){ctx.fillStyle=['#ff9cba','#a7b6d6','#faf7ef'][i];ctx.beginPath();ctx.roundRect(40,300+i*140,400,104,22);ctx.fill();ctx.fillStyle='#263149';ctx.font='24px sans-serif';ctx.fillText(['产品文档','交互原型','灵感笔记'][i],68,363+i*140);}}
  else for(let i=0;i<3;i++){ctx.strokeStyle='#8392b0';ctx.lineWidth=3;ctx.setLineDash([8,10]);ctx.strokeRect(40+i*300,220,270,290);ctx.setLineDash([]);ctx.fillStyle='#a7b6d6';ctx.font='52px sans-serif';ctx.fillText('+',150+i*300,357);}
  const texture=new TextureClass(c);texture.needsUpdate=true;
  const material=new MeshBasicMaterial({map:texture,transparent:true,opacity:phone?0:1,toneMapped:false});
  const mesh=new Mesh(new PlaneGeometry(w,h),material);mesh.position.set(x,y,z);parent.add(mesh);return mesh;
 }
 function remove(name,model){for(const hit of [...scene.hoverRaycaster.raycastMeshes])if(hit.name===name){hit.removeFromParent();hit.geometry.dispose();hit.material.dispose();scene.hoverRaycaster.raycastMeshes.splice(scene.hoverRaycaster.raycastMeshes.indexOf(hit),1);}model.removeFromParent();}
 remove('index:1',scene.modelMic);remove('index:2',scene.modelBook);scene.rootBones=[];
 const laptop=new Group(),hinge=new Group();laptop.name='personal-laptop';
 box(laptop,2.25,.12,1.44,0xc5ccd8,0,0,0,.055);
 box(laptop,1.98,.018,.70,0x3e485c,0,.068,-.19,.008);
 for(let row=0;row<4;row++)for(let col=0;col<11;col++)box(laptop,.14,.017,.11,0x8c97ac,-.88+col*.176,.084,-.43+row*.155,.008);
 box(laptop,.71,.014,.35,0xa8b2c4,0,.07,.42,.005);
 laptop.add(hinge);hinge.position.set(0,.09,-.66);
 box(hinge,2.25,1.40,.105,0xc5ccd8,0,.7,0,.05);
 box(hinge,2.08,1.22,.018,0x141c2b,0,.70,.06,.008);
 screen(hinge,1.98,1.12,0,.70,.071);
 box(hinge,.07,.025,.006,0x7785a0,0,1.34,.059,.003);
 // A small badge on the outside of the lid, visible while closed.
 box(hinge,.28,.15,.01,0xf9d1df,0,.70,-.058,.005);
 hinge.rotation.x=1.40;
 const lp=scene.parentMic;lp.transformation.position.set(-1.65,.46,.4);lp.transformation.rotation.set(.27,-.20,.17);lp.transformation.scale.set(.98,.98,.98);lp.lastItem.add(laptop);scene.modelMic=laptop;
 const phone=new Group();phone.name='personal-phone';
 box(phone,1.15,2.30,.17,0xcfbac8,0,0,0,.08);
 box(phone,1.045,2.17,.035,0x101524,0,0,.095,.017);
 const phoneScreen=screen(phone,.95,2.04,0,0,.116,true);
 box(phone,.30,.072,.016,0x070c16,0,.935,.133,.008);
 box(phone,.30,.019,.009,0xe7e5ed,0,-.948,.132,.004);
 box(phone,.032,.31,.07,0xe1c5d6,-.59,.46,0,.015);
 box(phone,.032,.19,.07,0xe1c5d6,.59,.52,0,.015);
 const pp=scene.parentBook;pp.transformation.position.set(-.10,1.28,-.72);pp.transformation.rotation.set(.05,-.22,.19);pp.transformation.scale.set(.98,.98,.98);pp.lastItem.add(phone);scene.modelBook=phone;
 // A fourth independent prop shares the original reveal and scroll hierarchy.
 const skills=scene.gl.misc.createNestedParents(['reveal','transformation','mexicanWave','interactivity']);
 scene.models.add(skills.firstItem);skills.transformation.position.set(1.82,1.44,-.65);skills.transformation.rotation.set(-.08,-.28,-.20);
 scene.transformationObjects.push({object:skills.transformation,name:'Skills'});scene.revealObjects.push(skills.reveal);scene.mexicanWaveObjects.push(skills.mexicanWave);
 const book=new Group(),cover=new Group();book.name='personal-skills-book';skills.lastItem.add(book);
 box(book,1.12,1.62,.22,0xf1e8d5,0,0,0,.024);
 box(book,1.22,1.73,.065,0x516d61,0,0,-.15,.023);
 box(book,.13,1.73,.35,0x456151,-.57,0,0,.024);
 for(let i=0;i<5;i++)box(book,1.02,.008,.01,0xbeb7a4,.04,-.58+i*.27,.116,.002);
 cover.position.set(-.56,0,.155);book.add(cover);box(cover,1.22,1.73,.06,0x638571,.56,0,0,.024);
 const art=document.createElement('canvas');art.width=600;art.height=850;const ink=art.getContext('2d');
 ink.fillStyle='#638571';ink.fillRect(0,0,600,850);ink.strokeStyle='#dce3bb';ink.lineWidth=3;ink.strokeRect(44,44,512,762);
 ink.fillStyle='#fff1cf';ink.textAlign='center';ink.font='700 96px sans-serif';ink.fillText('Skill',300,272);ink.font='700 74px sans-serif';ink.fillText('合集',300,365);
 ink.font='25px sans-serif';ink.fillText('把方法变成工具',300,440);ink.font='50px monospace';ink.fillText('{  }',300,610);
 const artMap=new TextureClass(art);artMap.needsUpdate=true;
 const lettering=new Mesh(new PlaneGeometry(1.18,1.68),new MeshBasicMaterial({map:artMap,toneMapped:false}));lettering.position.set(.56,0,.032);cover.add(lettering);
 // A stable hit volume contains both lid positions, so opening cannot lose hover.
 scene.hoverRaycaster.addToRaycaster(lp.lastItem,laptop,lp.interactivity,1,'#website-work','index:1',new BoxGeometry(2.35,1.62,1.7),laptop.position.clone().set(0,.65,0));
 scene.hoverRaycaster.addToRaycaster(pp.lastItem,phone,pp.interactivity,1,'/product-portfolio/books','index:2',new BoxGeometry(1.20,2.38,.24),phone.position.clone());
 scene.hoverRaycaster.addToRaycaster(skills.lastItem,book,skills.interactivity,1,'/product-portfolio/skills/','index:4',new BoxGeometry(1.3,1.8,.45),book.position.clone());
 const playerHit=scene.hoverRaycaster.raycastMeshes.find(hit=>hit.name==='index:3');if(playerHit)playerHit.userData.url='/product-portfolio/videos/';
 const dialog=ensureWorkDialog(),hero=scene.params.dom;
 let focused=null;
 const previousClick=scene.disposableFunctions.onHoverClick;
 scene.hoverRaycaster.removeEventListener('hover:click',previousClick);
 const onClick=e=>{if(dialog.open)return;if(scene.hoverRaycaster.params.disabled||document.documentElement.classList.contains('has-modal-menu-open'))return;if(e.detail.url==='#website-work')openWork();else if(['/product-portfolio/videos/','/product-portfolio/skills/'].includes(e.detail.url))location.assign(e.detail.url);else previousClick(e);};
 scene.hoverRaycaster.addEventListener('hover:click',onClick);
 const nav=hero.querySelector('.native-portrait-nav');
 if(nav&&!nav.querySelector('[data-device="skills"]')){const link=document.createElement('a');link.href='/product-portfolio/skills/';link.dataset.device='skills';link.textContent='Skill 合集 ↗';nav.insertBefore(link,nav.querySelector('button'));}
 const controls=hero.querySelectorAll('.native-portrait-nav a,.hero_carousel_slide a');
 controls.forEach(a=>{
  const path=a.getAttribute('href');if(!['/product-portfolio/shows','#website-work','/product-portfolio/books','/product-portfolio/books/','/product-portfolio/watch-listen','/product-portfolio/watch-listen/','/product-portfolio/videos/','/product-portfolio/skills/'].includes(path))return;
  const id=['/product-portfolio/shows','#website-work'].includes(path)?'index:1':path?.replace(/\/$/,'')==='/product-portfolio/books'?'index:2':path==='/product-portfolio/skills/'?'index:4':'index:3';
  if(id==='index:1'){a.href='#website-work';a.dataset.device='laptop';const label=a.querySelector('[data-hero-link]');if(label)label.textContent='网站作品';else a.textContent='网站作品 ↗';}
  else if(id==='index:2')a.dataset.device='phone';
  else if(id==='index:3'){a.href='/product-portfolio/videos/';a.dataset.device='player';const label=a.querySelector('[data-hero-link]');if(label)label.textContent='视频与下载';else a.textContent='视频与下载 ↗';}
  a.addEventListener('focus',()=>focused=id);a.addEventListener('blur',()=>focused=null);
  a.addEventListener('pointerenter',()=>focused=id);a.addEventListener('pointerleave',()=>focused=null);
  if(id==='index:1')a.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();openWork();},true);
  if(id==='index:3'||id==='index:4')a.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();location.assign(a.getAttribute('href'));},true);
 });
 function openWork(){focused=null;scene.hoverRaycaster.cancelHover();scene.hoverRaycaster.prevent.click=true;dialog.showModal();dialog.querySelector('button').focus();}
 const onPointerMove=e=>{if(e.pointerType!=='touch'&&!e.target.closest('[data-device]'))focused=null;};
 hero.addEventListener('pointermove',onPointerMove);
 const openFromHeader=e=>{if(e.target.closest('[data-project-entry]')){e.preventDefault();e.stopImmediatePropagation();if(!dialog.open)openWork();}};
 document.addEventListener('click',openFromHeader,true);
 const close=()=>{scene.hoverRaycaster.prevent.click=false;};dialog.addEventListener('close',close);
 const update=scene.update.bind(scene);let last=performance.now(),l=0,p=0,b=0;
 scene.update=function(){update();const now=performance.now(),dt=Math.min((now-last)/1000,.06);last=now;
  const active=dialog.open?null:focused||this.hoverRaycaster.isHovering.current;
  const blend=reduced.matches?1:1-Math.exp(-dt*9);
  l+=((active==='index:1'?1:0)-l)*blend;p+=((active==='index:2'?1:0)-p)*blend;b+=((active==='index:4'?1:0)-b)*blend;
  hinge.rotation.x=1.40-l*1.53;laptop.scale.setScalar(1+l*.055);phone.scale.setScalar(1+p*.065);phoneScreen.material.opacity=p;
  book.scale.setScalar(1+b*.075);cover.rotation.y=-b*.32;
  hero.dataset.laptopOpen=l.toFixed(3);hero.dataset.phoneLit=p.toFixed(3);hero.dataset.deviceHover=active||'';hero.dataset.laptopScale=laptop.scale.x.toFixed(3);hero.dataset.phoneScale=phone.scale.x.toFixed(3);
  hero.dataset.skillsBookOpen=b.toFixed(3);
 };
 const dispose=scene.dispose.bind(scene);scene.dispose=function(){hero.removeEventListener('pointermove',onPointerMove);document.removeEventListener('click',openFromHeader,true);scene.hoverRaycaster.removeEventListener('hover:click',onClick);dialog.removeEventListener('close',close);dispose();};
 hero.dataset.personalDevices='laptop,phone,player,skills';
}
function ensureWorkDialog(){
 let dialog=document.querySelector('#website-work');if(dialog)return dialog;
 dialog=document.createElement('dialog');dialog.id='website-work';dialog.className='website-work';dialog.setAttribute('aria-labelledby','website-work-title');
 const cases=[
  ['oa','项目信息系统','合同审批、资料授权、归档与智能客服','abe7f4091340f603.webp'],
  ['ride','企业约车','申请、出车确认与行车记录','e339e6876cc0e8e4.webp'],
  ['buy','内部采购','选品、审批、收货与成本','8f77288a2d8dba9c.webp'],
  ['meal','宴请与点餐','菜单生成、菜品定价和出餐','d848415483419569.webp'],
 ];
 dialog.innerHTML=`<button type="button" class="website-work-close" aria-label="关闭网站作品">关闭 ×</button><p class="website-work-kicker">产品经理作品集</p><h2 id="website-work-title">产品项目</h2><p class="website-work-intro">点击项目查看真实页面、关键判断、规则、验收与交付材料。</p><div class="website-work-grid">${cases.map(([id,title,desc,image])=>`<a class="website-work-slot website-work-link" href="/product-portfolio/shows/#${id}/flow"><div class="website-work-browser"><i></i><i></i><i></i></div><div class="website-work-thumb"><img src="/product-portfolio/product-flows/screens/${image}" loading="lazy" alt=""></div><div class="website-work-caption"><h3>${title} ↗</h3><p>${desc}</p></div></a>`).join('')}</div>`;
 document.body.append(dialog);dialog.querySelector('button').addEventListener('click',()=>dialog.close());dialog.addEventListener('click',e=>{e.stopPropagation();if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
 return dialog;
}
