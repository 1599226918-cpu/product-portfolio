const portraitReady = window.PORTFOLIO_CONFIG?.nativeHero
  ? import('/product-portfolio/native-portrait.js?v=webgl2').then(({ prepareNativePortrait }) =>
      prepareNativePortrait(window.PORTFOLIO_CONFIG))
  : Promise.resolve();

await Promise.all([document.fonts.ready, portraitReady]);
await import('/product-portfolio/vendor/trevor-nine.vercel.app/app.js');
