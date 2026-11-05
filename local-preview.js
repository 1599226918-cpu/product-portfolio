(() => {
  const cfg=window.PORTFOLIO_CONFIG;
  const report=()=>{};
  let personalized=false;
  let portraitHero=null;
  let disposePortrait=null;
  const portraitModule=import('/product-portfolio/portrait-interactions.js');
  const faceMap=window.PORTFOLIO_FACE_MAP||{};
  // Card-peel creates SVG <image> nodes; replace those too, including router clones.
  function personalizeFaces(){
    for(const el of document.querySelectorAll('img,svg image')){
      const attr=el instanceof HTMLImageElement?'src':'href';
      const raw=el.getAttribute(attr)||el.getAttribute('xlink:href');
      if(!raw)continue;
      let key;try{key=new URL(raw,location.href).pathname;}catch{continue;}
      const entry=faceMap[key]||faceMap[decodeURI(key)];
      if(!entry)continue;
      el.setAttribute(attr,entry.src);
      if(el.hasAttribute('xlink:href'))el.setAttributeNS('http://www.w3.org/1999/xlink','href',entry.src);
      el.removeAttribute('srcset');el.removeAttribute('sizes');
      el.setAttribute('data-personal-expression',entry.expression);
      el.setAttribute('data-portrait-kind',entry.kind);
    }
  }
  const portraitVisibility=new IntersectionObserver(entries=>{
    for(const entry of entries){
      if(entry.target===portraitHero)document.documentElement.classList.toggle('has-portrait-in-view',entry.isIntersecting);
    }
  });
  function mountPortrait(){
    if(cfg.nativeHero)return;
    const hero=document.querySelector('#sectionHero.hero_wrap.is-home');
    if(hero===portraitHero)return;
    disposePortrait?.();disposePortrait=null;
    if(portraitHero)portraitVisibility.unobserve(portraitHero);
    portraitHero=hero;
    document.documentElement.classList.remove('has-portrait-in-view');
    const src=cfg.heroArtwork;
    if(!hero||typeof src!=='string'||!src.startsWith('/')||src.startsWith('//'))return;
    const stage=document.createElement('div');
    stage.className='personal-portrait-stage';
    const portrait=new Image();
    portrait.className='personal-portrait';
    portrait.alt='正面人像与完整辫子的撕纸拼贴，头顶是电脑、书籍和播放器';
    portrait.src=src;
    portrait.fetchPriority='high';
    portrait.decoding='async';
    stage.append(portrait);
    hero.append(stage);
    hero.classList.add('has-personal-portrait');
    portraitVisibility.observe(hero);
    portraitModule.then(({enhancePortrait})=>enhancePortrait(stage,cfg)).then(dispose=>{
      if(portraitHero===hero)disposePortrait=dispose;else dispose?.();
    }).catch(error=>report('portrait-error',{message:String(error)}));
  }
  function personalize(){
    mountPortrait();
    personalizeFaces();
    for(const [selector,src] of Object.entries(cfg.images||{})){
      if(!src.startsWith('/')||src.startsWith('//'))continue;
      document.querySelectorAll(selector).forEach(el=>{if(el instanceof HTMLImageElement&&el.getAttribute('src')!==src){el.removeAttribute('srcset');el.src=src;}});
    }
    if(personalized)return;personalized=true;
    const replacements={...cfg.text};if(cfg.name)replacements['Trevor Noah']=cfg.name;
    if(Object.keys(replacements).length){
      const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;
      while(n=walker.nextNode()){
        if(n.parentElement.closest('script,style'))continue;
        for(const [from,to] of Object.entries(replacements))n.textContent=n.textContent.split(from).join(to);
      }
    }
  }
  document.addEventListener('DOMContentLoaded',()=>{
    personalize();
    // The reference router swaps main content without reloading this script.
    let pending=false;
    new MutationObserver(()=>{
      if(pending)return;pending=true;
      queueMicrotask(()=>{pending=false;mountPortrait();personalizeFaces();});
    }).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['src','srcset','href','xlink:href']});
    report('dom-ready',{width:innerWidth,height:innerHeight,title:document.title});
  });
  window.addEventListener('app:ready',e=>{personalize();report('app-ready',{modules:e.detail?.modules,initTime:e.detail?.initTime,canvas:!!document.querySelector('canvas')});});
  setTimeout(()=>report('health',{appStatus:window.app?.status,canvasCount:document.querySelectorAll('canvas').length,bodyWidth:document.body.scrollWidth,viewportWidth:innerWidth,images:[...document.images].filter(i=>!i.complete||i.naturalWidth===0).map(i=>i.currentSrc||i.src)}),12000);
  // Form submissions never leave the local prototype.
  document.addEventListener('submit',e=>{
    e.preventDefault();e.stopImmediatePropagation();
    const overlay=document.createElement('div');overlay.className='local-preview-dialog';
    overlay.innerHTML='<div role="dialog" aria-modal="true" aria-label="本地预览"><strong>本地预览</strong><p>表单交互已触发。个人联系方式配置完成后，可连接你的收件方式。</p><button type="button">返回页面</button></div>';
    overlay.querySelector('button').onclick=()=>overlay.remove();document.body.append(overlay);overlay.querySelector('button').focus();
  },true);
})();
