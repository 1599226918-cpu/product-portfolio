(() => {
  'use strict';
  // The portrait's legacy transition router expects a WebGL renderer on its
  // destination. Portfolio evidence pages are independent documents.
  const routes = ['/shows', '/watch-listen', '/books', '/videos', '/skills', '/evidence'];
  window.addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const anchor = event.target instanceof Element ? event.target.closest('a[href]') : null;
    if (!anchor || (anchor.target && anchor.target !== '_self')) return;
    const url = new URL(anchor.href, location.href);
    if (url.origin !== location.origin || !routes.some(route => url.pathname === '/product-portfolio' + route || url.pathname.startsWith('/product-portfolio' + route + '/'))) return;
    event.stopImmediatePropagation();
    if (anchor.hasAttribute('download')) return;
    event.preventDefault();
    location.assign(url.href);
  }, true);
})();
