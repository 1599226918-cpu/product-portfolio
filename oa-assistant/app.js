(() => {
  'use strict';
  const knowledge = window.OA_KNOWLEDGE;
  const $ = id => document.getElementById(id);
  const documents = new Map(knowledge.documents.map(document => [document.id, document]));
  const chat = $('chat-body');
  let lastAnswer = null;
  let generation = 0;
  let busy = false;
  let openedDocument = null;
  let sourceTrigger = null;
  let libraryTrigger = null;

  function element(tag, text, className) {
    const node = document.createElement(tag);
    if (text) node.textContent = text;
    if (className) node.className = className;
    return node;
  }
  function button(text, callback, className) {
    const node = element('button', text, className);
    node.type = 'button';
    node.addEventListener('click', callback);
    return node;
  }
  function symbol(name) {
    const node = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    node.setAttribute('class', 'icon');
    node.setAttribute('aria-hidden', 'true');
    const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', '#i-' + name);
    node.append(use);
    return node;
  }

  function openDocument(id, sectionId, trigger) {
    const document = documents.get(id);
    if (!document) return;
    openedDocument = document;
    sourceTrigger = trigger || window.document.activeElement;
    $('source-title').textContent = document.title;
    $('source-subtitle').textContent = document.category + ' · ' + document.sections.length + ' 个章节';
    $('source-origin').textContent = '整理依据 · ' + document.sourceTitle;
    $('document-body').replaceChildren(...document.sections.map(section => {
      const block = element('section', '', 'source-section');
      block.dataset.section = section.id;
      block.classList.toggle('active', section.id === sectionId);
      const text = element(section.id === sectionId ? 'mark' : 'p', section.text);
      block.append(element('h3', section.title, 'section-title'), text);
      return block;
    }));
    for (const item of window.document.querySelectorAll('.knowledge-item')) item.classList.toggle('active', item.dataset.document === id);
    $('source-dialog').showModal();
    requestAnimationFrame(() => {
      const target = $('document-body').querySelector('.active');
      if (target) target.scrollIntoView({ block: 'center' });
      else $('document-body').scrollTop = 0;
    });
  }

  function renderLibrary() {
    const query = $('library-search').value.trim().toLowerCase();
    const rows = knowledge.documents.filter(document => !query || [document.title, document.category, ...document.sections.map(section => section.title + section.text)].some(text => text.toLowerCase().includes(query)));
    $('library-grid').replaceChildren(...rows.map(document => {
      const card = button('', () => {
        $('library-dialog').close();
        openDocument(document.id, null, $('open-library'));
      }, 'library-card');
      card.append(symbol('file'), element('strong', document.title), element('span', document.category + ' · ' + document.sections.length + ' 个章节'), element('p', document.sections[0].text.slice(0, 72) + '…'));
      return card;
    }));
    if (!rows.length) $('library-grid').append(element('p', '未找到相关资料，请换个关键词。', 'empty-state'));
  }
  function openLibrary(trigger) {
    libraryTrigger = trigger || window.document.activeElement;
    renderLibrary();
    $('library-dialog').showModal();
  }
  $('open-library').addEventListener('click', event => openLibrary(event.currentTarget));
  $('nav-documents').addEventListener('click', event => openLibrary(event.currentTarget));
  $('nav-library').addEventListener('click', event => openLibrary(event.currentTarget));
  $('nav-chat').addEventListener('click', () => $('question').focus());
  $('close-library').addEventListener('click', () => $('library-dialog').close());
  $('library-dialog').addEventListener('close', () => libraryTrigger?.focus({ preventScroll: true }));
  $('library-search').addEventListener('input', renderLibrary);
  $('close-source').addEventListener('click', () => $('source-dialog').close());
  $('source-dialog').addEventListener('close', () => {
    if (sourceTrigger?.isConnected) sourceTrigger.focus({ preventScroll: true });
  });
  for (const dialog of [$('source-dialog'), $('library-dialog')]) {
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const bounds = dialog.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
    });
  }
  $('download-document').addEventListener('click', () => {
    if (!openedDocument) return;
    const text = '# ' + openedDocument.title + '\n\n' + openedDocument.sections.map(section => '## ' + section.title + '\n\n' + section.text).join('\n\n') + '\n\n整理依据 · ' + openedDocument.sourceTitle + '\n';
    const url = URL.createObjectURL(new Blob([text], { type: 'text/markdown;charset=utf-8' }));
    const anchor = element('a');
    anchor.href = url;
    anchor.download = openedDocument.title + '.md';
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });

  $('document-count').textContent = knowledge.documents.length + ' 份';
  for (const document of knowledge.documents) {
    const item = button('', () => openDocument(document.id, null, item), 'knowledge-item');
    item.dataset.document = document.id;
    item.append(element('span', '文', 'doc-mark'));
    const info = element('span', '', 'doc-info');
    info.append(element('strong', document.title.replace('操作说明', '')), element('small', document.category));
    item.append(info);
    $('knowledge-list').append(item);
    const option = element('option', document.title.replace('操作说明', ''));
    option.value = document.id;
    $('knowledge-scope').append(option);
  }
  function updateScope() {
    $('scope-count').textContent = ($('knowledge-scope').value === 'all' ? knowledge.documents.length : 1) + ' 份资料';
  }
  $('knowledge-scope').addEventListener('change', () => { lastAnswer = null; updateScope(); });
  updateScope();

  function normalize(text) {
    return text.toLowerCase().replace(/只有查看权限|只有查看|只读/g, '仅查看').replace(/能不能|可不可以|是否可以|可以|能否/g, '能').replace(/资料/g, '文件').replace(/退回/g, '驳回').replace(/重提|再次提交/g, '重新提交').replace(/[^\p{L}\p{N}]/gu, '');
  }
  function pairs(text) {
    return new Set(Array.from({ length: Math.max(0, text.length - 1) }, (_, index) => text.slice(index, index + 2)));
  }
  function scoreAnswer(query, answer) {
    const normalized = normalize(query);
    const tokens = pairs(normalized);
    let similarity = 0;
    for (const question of [...answer.questions, answer.title]) {
      const candidate = normalize(question);
      if (candidate === normalized) return 100;
      const candidateTokens = pairs(candidate);
      const overlap = [...tokens].filter(token => candidateTokens.has(token)).length;
      similarity = Math.max(similarity, overlap / Math.max(1, Math.min(tokens.size, candidateTokens.size)) * 16);
    }
    const keywords = answer.keywords.reduce((score, keyword) => score + (normalized.includes(normalize(keyword)) ? Math.min(keyword.length, 6) * 1.2 : 0), 0);
    return similarity + keywords;
  }
  function retrieve(question) {
    if (/多少钱|交.{0,4}钱|工资|薪水|薪资|薪酬|年薪|月薪|电话|手机号|身份证|联系方式|邮箱|住址|姓名/.test(question)) return null;
    if (/(?:这个|这份|这笔|我们|本月|今天|实时|当前)(?:项目|合同|公司)?.*(?:金额|多少|几笔|数量|审批进度|是否通过|付款|预算)|(?:竣工|开工|验收|完工)日期|预算余额|合同总额/.test(question)) return null;
    const scope = $('knowledge-scope').value;
    const followup = /^(那|那么|这样|它|之前的|恢复后|然后|还要|还会)/.test(question.trim());
    if (followup && lastAnswer?.id === 'file-finalization' && /权限|授权/.test(question)) return null;
    const ranked = knowledge.answers.filter(answer => scope === 'all' || answer.paragraphs.some(paragraph => paragraph.documentId === scope)).map(answer => {
      let score = scoreAnswer(question, answer);
      if (followup && lastAnswer && answer.paragraphs[0].documentId === lastAnswer.paragraphs[0].documentId && score >= 3) score += 4;
      return { answer, score };
    }).sort((first, second) => second.score - first.score);
    const first = ranked[0];
    if (!first || first.score < 6) return null;
    if (first.score < 12 && ranked[1] && first.score - ranked[1].score < 1) return null;
    return first.answer;
  }

  const featured = [
    ['项目成员有哪几档权限？', '查看、下载和编辑的权限边界'],
    ['合同被驳回后怎么办？', '查看意见、修改合同并重新提交'],
    ['条件失效会丢失任务进度吗？', '任务前置条件与状态恢复'],
    ['普通审批通过后是否就归档完成了？', '纸质合同归档与责任人确认']
  ];
  function welcome() {
    const panel = element('div', '', 'welcome');
    const icon = element('span', '', 'welcome-icon');
    icon.append(symbol('spark'));
    panel.append(icon, element('h2', '你好，有什么可以帮你？'), element('p', '查询工程项目 OA 的制度、流程与操作规则，回答附带原文依据。'));
    const grid = element('div', '', 'question-grid');
    for (const [question, description] of featured) {
      const card = button('', () => ask(question), 'question-card');
      card.append(element('strong', question), element('small', description), symbol('arrow'));
      grid.append(card);
    }
    panel.append(grid);
    chat.append(panel);
  }
  function reset() {
    generation += 1;
    busy = false;
    lastAnswer = null;
    $('send').disabled = false;
    $('question').value = '';
    chat.replaceChildren();
    welcome();
    chat.scrollTop = 0;
  }
  function addMessage(role, text) {
    const row = element('article', '', 'msg-row ' + role);
    const avatar = element('span', role === 'user' ? '我' : '', 'message-avatar');
    if (role === 'bot') avatar.append(symbol('spark'));
    const content = element('div', '', 'message-content');
    content.append(element('div', role === 'user' ? '我' : '工程项目智能客服', 'sender'));
    const bubble = element('div', text, 'bubble');
    content.append(bubble);
    row.append(avatar, content);
    chat.append(row);
    return { row, content, bubble };
  }
  function renderAnswer(message, answer) {
    if (!answer) {
      message.row.dataset.answer = 'insufficient';
      message.bubble.append(element('p', '当前收录的操作资料未提供足够依据，暂时无法确认这个问题。'), element('p', '可以补充具体操作、文件名称或流程节点，也可以从知识资料中查找相关说明。'));
      message.content.append(button('查看知识资料', event => openLibrary(event.currentTarget), 'chip'));
      lastAnswer = null;
      return;
    }
    lastAnswer = answer;
    message.row.dataset.answer = answer.id;
    message.bubble.append(element('p', answer.intro));
    const list = element('ol');
    const references = [];
    for (const paragraph of answer.paragraphs) {
      const key = paragraph.documentId + '/' + paragraph.sectionId;
      if (!references.some(reference => reference.key === key)) references.push({ key, ...paragraph });
      const number = references.findIndex(reference => reference.key === key) + 1;
      const line = element('li', paragraph.text);
      const citation = button('[' + number + ']', event => openDocument(paragraph.documentId, paragraph.sectionId, event.currentTarget), 'citation-ref');
      citation.setAttribute('aria-label', '查看引用 ' + number);
      line.append(citation);
      list.append(line);
    }
    message.bubble.append(list);
    const sources = element('div', '', 'sources');
    sources.append(element('p', '引用依据 · ' + references.length + ' 处原文', 'sources-heading'));
    references.forEach((reference, index) => {
      const document = documents.get(reference.documentId);
      const section = document.sections.find(item => item.id === reference.sectionId);
      const source = button('', event => openDocument(document.id, section.id, event.currentTarget), 'source-card');
      source.append(element('span', String(index + 1), 'source-number'));
      const label = element('span', '', 'source-text');
      label.append(element('strong', document.title), element('small', section.title));
      source.append(label, symbol('arrow'));
      sources.append(source);
    });
    message.content.append(sources);
    if (answer.followups?.length) {
      const suggestions = element('div', '', 'suggestions');
      for (const question of answer.followups.slice(0, 2)) suggestions.append(button(question, () => ask(question), 'chip'));
      message.content.append(suggestions);
    }
  }
  async function ask(value) {
    const question = value.trim();
    if (!question || busy) return;
    busy = true;
    $('send').disabled = true;
    const token = generation;
    $('question').value = '';
    chat.querySelector('.welcome')?.remove();
    addMessage('user', question);
    await Promise.resolve();
    if (token !== generation) return;
    const message = addMessage('bot', '');
    renderAnswer(message, retrieve(question));
    busy = false;
    $('send').disabled = false;
    chat.scrollTop = chat.scrollHeight;
  }
  $('composer').addEventListener('submit', event => { event.preventDefault(); ask($('question').value); });
  $('question').addEventListener('keydown', event => {
    if (event.key === 'Enter' && !event.shiftKey && !event.isComposing && event.keyCode !== 229) {
      event.preventDefault();
      $('composer').requestSubmit();
    }
  });
  $('new-chat').addEventListener('click', () => { reset(); $('question').focus(); });
  $('collapse-nav').addEventListener('click', () => {
    const collapsed = window.document.body.classList.toggle('nav-collapsed');
    $('collapse-nav').setAttribute('aria-expanded', String(!collapsed));
    $('collapse-nav').setAttribute('aria-label', collapsed ? '展开导航' : '收起导航');
  });
  reset();
  const parameters = new URLSearchParams(location.search);
  const query = parameters.get('q');
  if (query) ask(query.slice(0, 600)).then(() => {
    if (parameters.has('source')) openDocument(parameters.get('source'), parameters.get('section'));
  });
  else if (parameters.get('view') === 'library') openLibrary();
})();
