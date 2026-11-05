/* Personalization entry. Empty values retain the exact reference design.
   Put new portraits in /portraits and edit this file; no external upload needed. */
window.PORTFOLIO_CONFIG = {
  name: '',
  nativeHero: true,
  // Complete transparent collage for the home hero (independent of the original face UVs).
  heroArtwork: '/product-portfolio/portraits/hero-full-braid-v1.webp',
  // Existing destination pages; swap these URLs when personal content is ready.
  heroLinks: {
    laptop: { label: '网站作品', href: '#website-work' },
    books: { label: '产品文档', href: '/product-portfolio/books' },
    player: { label: '视频作品', href: '/product-portfolio/videos/' },
    skills: { label: 'Skill 合集', href: '/product-portfolio/skills/' },
  },
  // Exact phrase replacements, e.g. { 'Get Tickets': '查看作品' }.
  text: {},
  // Ordinary DOM photos, keyed by CSS selector.
  // Example: { '.about_head': '/product-portfolio/portraits/about.webp' }.
  images: {},
  // WebGL image textures. Keys are the original filename; values are local PNG/WebP paths.
  // Must be prepared to match the source UV layout and transparency, not a raw square photo.
  // 'middle-gaze-03.ktx2': '/product-portfolio/portraits/hero-face.webp',
  // 'eyes-scaled-02.ktx2': '/product-portfolio/portraits/hero-eyes.webp',
  // 'suprised-face-03.ktx2': '/product-portfolio/portraits/surprised.webp'
  textures: {
    'born-a-crime-03.ktx2':'/product-portfolio/portraits/expressions/book-smile-uv.png',
    'born-a-crime-ya-edition-04.ktx2':'/product-portfolio/portraits/expressions/book-thoughtful-uv.png',
    'into-the-uncut-grass-04.ktx2':'/product-portfolio/portraits/expressions/book-grass-zh-uv.png',
  },
};
window.__portfolioTextureURL = url => {
  const name=url.split('/').pop();
  const replacement=window.PORTFOLIO_CONFIG.textures[name];
  return typeof replacement==='string'&&replacement.startsWith('/')&&!replacement.startsWith('//') ? replacement : null;
};
// Disable the original analytics consent integration on the local study.
window.dataLayer=[];
window.gtag=()=>{};
