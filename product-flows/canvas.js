(() => {
  'use strict';

  const data = JSON.parse(document.getElementById('flow-data').textContent);
  const byId = new Map(data.items.map(item => [item.id, item]));
  const $ = id => document.getElementById(id);
  const canvas = $('canvas');
  const stage = $('stage');
  const dialog = $('viewer');
  const photoBody = $('large').parentElement;
  let product = data.products[0].id;
  let selectedFlow = null;
  let renderedProduct = null;
  let zoom = 1;
  let sizing = 'width';
  let inset = 0;
  let photoScale = 0;
  let restoreFocus = null;

  function el(tag, text, className) {
    const element = document.createElement(tag);
    if (text) element.textContent = text;
    if (className) element.className = className;
    return element;
  }

  function button(text, handler) {
    const element = el('button', text);
    element.type = 'button';
    element.addEventListener('click', handler);
    return element;
  }

  const file = id => data.assets[byId.get(id)?.asset]?.url;
  const productName = id => data.products.find(item => item.id === id)?.name;
  const clamp = (value, low, high) => Math.max(low, Math.min(high, value));

  function openImage(id, trigger) {
    const item = byId.get(id);
    if (!item || !file(id)) return;
    restoreFocus = trigger || document.activeElement;
    $('viewerTitle').textContent = item.title;
    $('viewerCaption').textContent = productName(item.p) + ' · ' + item.source;
    $('large').src = file(id);
    $('large').alt = item.title + ' · 脱敏截图';
    showPhotoScale(0);
    photoBody.scrollTo(0, 0);
    dialog.showModal();
  }

  function showPhotoScale(next) {
    const large = $('large');
    photoScale = next ? clamp(next, .15, 3) : 0;
    photoBody.classList.toggle('zoomed', Boolean(photoScale));
    if (photoScale && large.naturalWidth) large.style.width = Math.round(large.naturalWidth * photoScale) + 'px';
    else large.style.removeProperty('width');
  }

  function currentPhotoScale() {
    return photoScale || $('large').getBoundingClientRect().width / $('large').naturalWidth;
  }

  $('photoOut').addEventListener('click', () => showPhotoScale(currentPhotoScale() * .8));
  $('photoIn').addEventListener('click', () => showPhotoScale(currentPhotoScale() * 1.25));
  $('photoFit').addEventListener('click', () => showPhotoScale(0));
  $('photoActual').addEventListener('click', () => showPhotoScale(1));
  $('close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    if (restoreFocus?.isConnected) restoreFocus.focus({ preventScroll: true });
  });
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });
  stage.addEventListener('click', event => {
    const node = event.target.closest('button[data-node]');
    if (node) openImage(node.dataset.node, node);
  });

  function resize() {
    const graph = data.canvases[product];
    inset = Math.max(0, (canvas.clientWidth - graph.width * zoom) / 2);
    stage.style.left = inset + 'px';
    stage.style.transform = 'scale(' + zoom + ')';
    $('sizer').style.width = Math.ceil(graph.width * zoom) + 'px';
    $('sizer').style.height = Math.ceil(graph.height * zoom) + 'px';
    $('zoomValue').textContent = Math.round(zoom * 100) + '%';
  }

  function changeZoom(next, x = canvas.clientWidth / 2, y = canvas.clientHeight / 2) {
    const left = (canvas.scrollLeft + x - inset) / zoom;
    const top = (canvas.scrollTop + y) / zoom;
    sizing = 'manual';
    zoom = clamp(next, .04, 3.6);
    resize();
    canvas.scrollLeft = left * zoom + inset - x;
    canvas.scrollTop = top * zoom - y;
  }

  function fit(all = false) {
    const graph = data.canvases[product];
    sizing = all ? 'all' : 'width';
    zoom = clamp(all ? Math.min(canvas.clientWidth / graph.width, canvas.clientHeight / graph.height) : canvas.clientWidth / graph.width, .04, 1);
    resize();
    canvas.scrollTo(0, 0);
  }

  function locateFlow() {
    const graph = data.canvases[product];
    const target = graph.groups.find(group => group.flows.includes(selectedFlow?.id));
    const assets = new Set(selectedFlow?.nodes.map(id => byId.get(id).asset) || []);
    for (const group of stage.querySelectorAll('.wf-group')) group.classList.toggle('active', group.dataset.group === target?.id);
    for (const node of stage.querySelectorAll('.wf-node')) node.classList.toggle('flow-focus', assets.has(node.dataset.asset));
    if (target) {
      const focused = [...stage.querySelectorAll('[data-group="' + target.id + '"] .wf-node')].find(node => assets.has(node.dataset.asset));
      const left = focused ? parseFloat(focused.style.left) * zoom - 100 : 0;
      canvas.scrollTo({ top: target.top * zoom, left: Math.max(0, left) });
    }
  }

  $('zoomIn').addEventListener('click', () => changeZoom(zoom * 1.25));
  $('zoomOut').addEventListener('click', () => changeZoom(zoom / 1.25));
  $('zoomFit').addEventListener('click', () => { fit(); locateFlow(); });
  $('zoomAll').addEventListener('click', () => fit(true));
  canvas.addEventListener('wheel', event => {
    if (!event.ctrlKey && !event.metaKey) return;
    event.preventDefault();
    const bounds = canvas.getBoundingClientRect();
    changeZoom(zoom * Math.exp(-event.deltaY * .003), event.clientX - bounds.left, event.clientY - bounds.top);
  }, { passive: false });

  let drag = null;
  canvas.addEventListener('pointerdown', event => {
    if (event.pointerType !== 'mouse' || event.button !== 0 || event.target.closest('button, a')) return;
    drag = { x: event.clientX, y: event.clientY, left: canvas.scrollLeft, top: canvas.scrollTop };
    canvas.setPointerCapture(event.pointerId);
    canvas.classList.add('drag');
  });
  canvas.addEventListener('pointermove', event => {
    if (!drag) return;
    canvas.scrollLeft = drag.left + drag.x - event.clientX;
    canvas.scrollTop = drag.top + drag.y - event.clientY;
  });
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    canvas.addEventListener(type, () => { drag = null; canvas.classList.remove('drag'); });
  }

  function navigate(hash) {
    if (location.hash.slice(1) === hash) selectFromHash();
    else location.hash = hash;
  }

  function renderCanvas() {
    const graph = data.canvases[product];
    const info = data.products.find(item => item.id === product);
    $('productName').textContent = info.name;
    const prototypes = {
      oa: ['OA', 'engineering-oa.html'],
      ride: ['用车', 'dispatch.html'],
      buy: ['采购', 'procurement-review.html'],
      meal: ['兰亭', 'lanting.html']
    };
    const [name, fileName] = prototypes[product];
    $('prototypeLink').textContent = '体验 ' + name + ' 原型 HTML ↗';
    $('prototypeLink').href = '../materials/prototypes/' + fileName;
    $('productDesc').textContent = graph.images + ' 张截图 · ' + graph.groups.length + ' 组泳道';
    $('flowName').textContent = selectedFlow?.title || info.name + ' · 完整流程';
    $('flowDesc').textContent = selectedFlow?.desc || info.desc;
    const overview = button('完整画布', () => { selectedFlow = null; navigate(product); });
    overview.setAttribute('aria-pressed', String(!selectedFlow));
    $('routes').replaceChildren(overview, ...data.flows.filter(flow => flow.p === product).map(flow => {
      const item = button(flow.title, () => navigate(flow.id));
      item.setAttribute('aria-pressed', String(selectedFlow?.id === flow.id));
      return item;
    }));
    if (renderedProduct !== product) {
      stage.replaceChildren($('canvas-' + product).content.cloneNode(true));
      stage.style.width = graph.width + 'px';
      stage.style.height = graph.height + 'px';
      renderedProduct = product;
      fit();
      if (innerWidth < 700) { zoom = .45; sizing = 'manual'; resize(); }
    } else if (!selectedFlow) fit();
    locateFlow();
  }

  function render() {
    $('products').replaceChildren(...data.products.map(info => {
      const item = button(info.name, () => navigate(info.id));
      item.setAttribute('aria-pressed', String(product === info.id));
      return item;
    }));
    renderCanvas();
  }

  $('flowMode').addEventListener('click', () => { renderedProduct = null; selectFromHash(); });

  function selectFromHash() {
    const hash = location.hash.slice(1);
    selectedFlow = data.flows.find(flow => flow.id === (hash === 'rag' ? 'f10' : hash)) || null;
    product = selectedFlow?.p || data.products.find(info => info.id === hash)?.id || data.products[0].id;
    render();
  }

  window.addEventListener('hashchange', selectFromHash);
  new ResizeObserver(() => {
    if (sizing === 'width') { fit(); locateFlow(); }
    else if (sizing === 'all') fit(true);
    else resize();
  }).observe(canvas);
  selectFromHash();
})();
