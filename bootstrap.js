await document.fonts.ready;
if(window.PORTFOLIO_CONFIG?.nativeHero){
 const {prepareNativePortrait}=await import('/product-portfolio/native-portrait.js');
 await prepareNativePortrait(window.PORTFOLIO_CONFIG);
}
await import('/product-portfolio/vendor/trevor-nine.vercel.app/app.js');
