(() => {
  'use strict';
  const library = document.body.dataset.library;
  const list = document.querySelector('[data-items]');
  const count = document.querySelector('[data-count]');
  const videoDialog = document.querySelector('[data-video-dialog]');
  const skillDialog = document.querySelector('[data-skill-dialog]');
  const player = document.querySelector('[data-player]');
  let lastTrigger = null;
  const element = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const localURL = (value) => {
    if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) return '';
    const url = new URL(value, location.origin);
    return url.origin === location.origin ? url.href : '';
  };
  const contentURL = (value) => {
    const local = localURL(value);
    if (local) return local;
    try { const url = new URL(value); return url.protocol === 'https:' ? url.href : ''; }
    catch { return ''; }
  };
  const openDialog = (dialog, trigger) => {
    lastTrigger = trigger;
    document.body.classList.add('dialog-is-open');
    dialog.showModal();
    dialog.querySelector('[data-close]').focus();
  };
  document.querySelectorAll('.work-dialog').forEach(dialog => {
    dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
    });
    dialog.addEventListener('close', () => {
      if (player) { player.pause(); player.removeAttribute('src'); player.load(); }
      document.body.classList.remove('dialog-is-open');
      if (lastTrigger?.isConnected) lastTrigger.focus({preventScroll: true});
    });
  });
  if (player) {
    const pause = document.querySelector('[data-pause]');
    pause.addEventListener('click', () => { if (player.paused) player.play().catch(() => {}); else player.pause(); });
    player.addEventListener('play', () => { pause.textContent = '暂停播放'; });
    player.addEventListener('pause', () => { pause.textContent = '继续播放'; });
    player.addEventListener('error', () => {
      if (player.getAttribute('src')) document.querySelector('[data-video-caption]').textContent = '视频暂时无法播放，请关闭后重试。';
    });
  }
  const videoCard = item => {
    const button = element('button', 'work-card');
    button.type = 'button';
    button.setAttribute('aria-label', `播放：${item.title}`);
    const poster = element('div', 'poster');
    const posterURL = localURL(item.poster);
    if (posterURL) {
      const img = element('img'); img.src = posterURL; img.alt = item.posterAlt || ''; img.loading = 'lazy'; img.decoding = 'async'; poster.append(img);
    }
    const play = element('span', 'play-circle');
    play.setAttribute('aria-hidden', 'true');
    play.innerHTML = '<svg viewBox="0 0 24 24"><path d="M5 2v20l17-10Z"/></svg>';
    poster.append(play);
    if (item.duration) poster.append(element('span', 'duration', item.duration));
    const meta = element('div', 'card-meta');
    const text = element('div'); text.append(element('h2', '', item.title));
    if (item.subtitle) text.append(element('p', '', item.subtitle));
    const tags = element('div', 'card-tags');
    (item.tags || []).forEach(tag => tags.append(element('span', '', tag)));
    text.append(tags); meta.append(text, element('span', 'card-arrow', '↗')); button.append(poster, meta);
    button.addEventListener('click', () => {
      document.querySelector('#video-dialog-title').textContent = item.title;
      document.querySelector('[data-video-caption]').textContent = item.caption || item.subtitle || '';
      player.src = localURL(item.src); player.poster = posterURL;
      openDialog(videoDialog, button);
      player.play().catch(() => { document.querySelector('[data-pause]').textContent = '开始播放'; });
    });
    return button;
  };
  const skillCard = (item, index) => {
    const button = element('button', 'skill-card'); button.type = 'button'; button.setAttribute('aria-haspopup', 'dialog');
    button.setAttribute('aria-label', `查看工作流：${item.title}`);
    button.append(element('span', 'skill-number', `${String(index + 1).padStart(2, '0')} / ${item.category || '可复用工作流'}`));
    button.append(element('h2', '', item.title), element('p', '', item.summary));
    const bottom = element('div', 'skill-card-bottom'); bottom.append(element('span', '', item.status || '查看工作流'), element('span', '', '↗')); button.append(bottom);
    button.addEventListener('click', () => {
      document.querySelector('#skill-dialog-title').textContent = item.title;
      document.querySelector('[data-skill-category]').textContent = item.category || '可复用工作流';
      document.querySelector('[data-skill-summary]').textContent = item.summary;
      document.querySelector('[data-skill-source]').textContent = item.source || '个人工作流整理。';
      const detail = document.querySelector('[data-skill-detail]'); detail.replaceChildren();
      (item.sections || []).forEach(section => {
        const group = element('section', 'detail-section'); group.append(element('h3', '', section.title));
        if (Array.isArray(section.items)) {
          const sectionList = element(section.ordered ? 'ol' : 'ul'); section.items.forEach(text => sectionList.append(element('li', '', text))); group.append(sectionList);
        } else if (section.text) group.append(element('p', '', section.text));
        detail.append(group);
      });
      (item.links || []).forEach(link => {
        const href = contentURL(link.href); if (!href) return;
        const anchor = element('a', 'detail-link', link.label); anchor.href = href;
        if (link.download && localURL(link.href)) anchor.download = '';
        if (new URL(href).origin !== location.origin) { anchor.target = '_blank'; anchor.rel = 'noopener noreferrer'; }
        detail.append(anchor);
      });
      openDialog(skillDialog, button);
    });
    return button;
  };
  fetch('/product-portfolio/work-library-data.json', {cache: 'no-cache'})
    .then(response => { if (!response.ok) throw new Error('library unavailable'); return response.json(); })
    .then(data => {
      const items = (Array.isArray(data[library]) ? data[library] : []).filter(item => item.title && (library !== 'videos' || localURL(item.src)));
      count.textContent = library === 'videos' ? `${items.length} 支作品` : `${items.length} 个工作流`;
      if (!items.length) return;
      list.replaceChildren(...items.map((item, index) => library === 'videos' ? videoCard(item) : skillCard(item, index)));
    })
    .catch(() => { count.textContent = '暂时无法加载'; });
})();
