// Localized HTML is ready before animation modules split text. This only
// handles labels added later by filtering, menus and the client-side router.
(() => {
  fetch('/product-portfolio/zh-map.json').then(r=>r.json()).then(map=>{
    const translate=root=>{
      const nodes=[];
      if(root.nodeType===Node.TEXT_NODE)nodes.push(root);
      else {const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);while(w.nextNode())nodes.push(w.currentNode);}
      for(const n of nodes){
        if(n.parentElement?.closest('script,style,[data-copy-review]'))continue;
        const key=n.textContent.trim();if(Object.hasOwn(map,key)&&key!==map[key])n.textContent=n.textContent.replace(key,map[key]);
      }
      if(root.nodeType!==Node.ELEMENT_NODE&&root!==document.body)return;
      for(const el of [root,...root.querySelectorAll('[aria-label],[title],[placeholder]')]){
        for(const attr of ['aria-label','title','placeholder']){const value=el.getAttribute(attr);if(Object.hasOwn(map,value)&&map[value]!==value)el.setAttribute(attr,map[value]);}
      }
    };
    translate(document.body);
    new MutationObserver(records=>{
      for(const record of records){if(record.type==='attributes')translate(record.target);else for(const n of record.addedNodes)translate(n);}
    }).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['aria-label','title','placeholder']});
  });
})();
