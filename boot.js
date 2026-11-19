'use strict';
(async()=>{
 const loader=document.getElementById('engineStatus');
 function script(src){return new Promise((resolve,reject)=>{const el=document.createElement('script');el.src=src;el.onload=resolve;el.onerror=()=>reject(Error(`Could not load ${src}. Refresh and try again.`));document.body.append(el);});}
 try{
  window.pdfjsLib=await import('/vendor/pdf.mjs');
  await script('/vendor/pdf-lib.min.js');
  for(const file of ['core.js','app.js','modern.js','toolkit.js'])await script('/'+file);
  let mergeLoaded=false;
  const openMerge=async()=>{if(!mergeLoaded){await script('/merge.js');mergeLoaded=true;}document.getElementById('tabMerge').click();};
  if(['merge-pdf','organize-pdf','jpg-to-pdf'].includes(document.body.dataset.tool))await openMerge();
  else document.getElementById('tabMerge').onclick=()=>openMerge().catch(()=>tell('Merge tools could not load. Please refresh.',true));
  loader?.remove();document.body.classList.remove('engine-loading');
 }catch(e){if(loader){loader.textContent=e.message;loader.classList.add('error');}console.error('PDF tools initialization failed.');}
})();
