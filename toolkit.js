'use strict';
(()=>{
const tools={
 'split-pdf':['Split PDF','Split a document by page ranges, every N pages, or into individual pages.'],
 'extract-pages':['Extract pages','Create a new PDF from the pages you need.'],
 'pdf-to-jpg':['PDF to images','Export PDF pages as JPG or PNG, with a resolution choice.'],
 'compress-pdf':['Compress PDF','Rebuild pages as JPEG images. Text and interactive fields are flattened.'],
 'metadata':['PDF metadata','Inspect and update title, author, subject and keywords.'],
 'pdf-to-text':['PDF to text','Extract the text layer. Scanned documents need OCR, which is not included.'],
 'watermark-pdf':['Watermark PDF','Use Type / text or upload an image, choose opacity and apply it to a page range.'],
};
const key=document.body.dataset.tool;
const panel=document.createElement('section');panel.className='utility-panel';panel.id='utilityPanel';
panel.innerHTML='<h2 id="utilityTitle">PDF utilities</h2><p id="utilityDescription">Choose an action for the loaded document.</p><label>Pages (blank = all)<input id="utilityRange" placeholder="1,3-5,last"></label><div id="splitOptions"><label>Split mode<select id="splitMode"><option value="selected">Selected pages in one PDF</option><option value="each">One PDF per page (ZIP)</option><option value="chunks">Every N pages (ZIP)</option><option value="ranges">Separate ranges (ZIP)</option></select></label><label>Pages per file<input id="splitChunk" type="number" min="1" max="1500" value="5"></label><label>Separate ranges with semicolons<input id="splitRanges" placeholder="1-3;4-8;last"></label></div><div id="imageOptions"><div class="row"><label>Format<select id="imageFormat"><option value="jpeg">JPG</option><option value="png">PNG</option></select></label><label>Resolution<select id="imageDpi"><option value="72">72 DPI</option><option value="144" selected>144 DPI</option><option value="216">216 DPI</option></select></label></div><label>JPEG quality<input id="imageQuality" type="range" min="25" max="98" value="85"></label></div><div id="metadataOptions"><label>Title<input id="metaTitle" maxlength="500"></label><label>Author<input id="metaAuthor" maxlength="500"></label><label>Subject<input id="metaSubject" maxlength="1000"></label><label>Keywords<input id="metaKeywords" maxlength="1000"></label><button id="readMetadata">Read metadata</button></div><button id="utilityRun" class="primary">Create download</button><p id="utilityStatus" role="status" aria-live="polite"></p>';
if(tools[key]&&key!=='watermark-pdf'){
 document.querySelector('#viewSign aside').append(panel);document.querySelectorAll('#viewSign aside>section').forEach((section,i)=>{if(i>0&&section!==panel)section.hidden=true;});$('download').hidden=true;$('utilityTitle').textContent=tools[key][0];$('utilityDescription').textContent=tools[key][1];
 $('splitOptions').hidden=key!=='split-pdf';$('imageOptions').hidden=!['pdf-to-jpg','compress-pdf'].includes(key);$('metadataOptions').hidden=key!=='metadata';
}
function status(s,error=false){$('utilityStatus').textContent=s;$('utilityStatus').classList.toggle('error',error);}
async function zip(files,name){if(!window.JSZip)await new Promise((res,rej)=>{const s=document.createElement('script');s.src='/vendor/jszip.min.js';s.onload=res;s.onerror=()=>rej(Error('ZIP library failed to load.'));document.head.append(s);});const archive=new JSZip();for(const [name,data]of files)archive.file(name,data);download(await archive.generateAsync({type:'uint8array',compression:'STORE'}),name,'application/zip');}
async function extractPages(pages){
 const out=await PDFLib.PDFDocument.create();let source;try{source=await PDFLib.PDFDocument.load(state.bytes.slice(),{updateMetadata:false});}catch{}
 for(let i=0;i<pages.length;i++){const n=pages[i];if(source){const [page]=await out.copyPages(source,[n-1]);if(Studio.rotations.has(n)){const {view}=await viewportFor(n);page.setRotation(PDFLib.degrees(view.rotation));}out.addPage(page);}else await rasterPage(out,n);status(`Preparing pages… ${i+1}/${pages.length}`);await new Promise(r=>setTimeout(r));}
 return {bytes:await out.save(),flattened:!source};
}
async function imageFile(n,mime,dpi,quality){const {page,view}=await viewportFor(n),scale=Math.min(dpi/72,Math.sqrt(8000000/(view.width*view.height))),v=page.getViewport({scale,rotation:view.rotation}),c=document.createElement('canvas');c.width=Math.ceil(v.width);c.height=Math.ceil(v.height);try{await page.render({canvasContext:c.getContext('2d'),viewport:v,background:'#fff'}).promise;return await new Promise((res,rej)=>c.toBlob(b=>b?res(b):rej(Error('Page image failed.')),mime,quality));}finally{c.width=c.height=1;}}
async function run(){
 if(!state.pdf){status('Upload a PDF first.',true);return;}if(state.busy)return;state.busy=true;$('utilityRun').disabled=true;
 try{
  const pages=InkCore.range($('utilityRange').value,state.pdf.numPages,true),name=state.name.replace(/\.pdf$/i,'');let flattened=false;
  if(key==='pdf-to-jpg'){const format=$('imageFormat').value,mime='image/'+format,ext=format==='jpeg'?'jpg':'png',files=[];for(const n of pages){status(`Exporting image ${files.length+1}/${pages.length}…`);files.push([`${name}-page-${n}.${ext}`,await imageFile(n,mime,Number($('imageDpi').value),Number($('imageQuality').value)/100)]);}if(files.length===1)download(files[0][1],files[0][0],mime);else await zip(files,name+'-images.zip');}
  else if(key==='pdf-to-text'){let text='';for(const n of pages){const content=await(await state.pdf.getPage(n)).getTextContent();text+=`--- Page ${n} ---\n`+content.items.map(i=>i.str+(i.hasEOL?'\n':' ')).join('')+'\n\n';status(`Reading text ${n}/${state.pdf.numPages}…`);}if(!text.replace(/--- Page \d+ ---/g,'').trim())throw Error('No text layer found. OCR for scanned PDFs is not included.');download(text,name+'.txt','text/plain;charset=utf-8');}
  else if(key==='compress-pdf'){const doc=await PDFLib.PDFDocument.create();for(const n of pages){status(`Compressing page ${doc.getPageCount()+1}/${pages.length}…`);await rasterPage(doc,n,Number($('imageDpi').value)/72,Number($('imageQuality').value)/100);}const bytes=await doc.save();download(bytes,name+'-compressed.pdf','application/pdf');status(`Downloaded. Original: ${(state.size/1048576).toFixed(2)} MB; output: ${(bytes.length/1048576).toFixed(2)} MB. ${bytes.length>=state.size?'This document did not become smaller. ':''}Text and forms were flattened.`);return;}
  else if(key==='metadata'){const result=await editableDocument();result.doc.setTitle($('metaTitle').value);result.doc.setAuthor($('metaAuthor').value);result.doc.setSubject($('metaSubject').value);result.doc.setKeywords($('metaKeywords').value.split(',').map(s=>s.trim()));download(await result.doc.save(),name+'-metadata.pdf','application/pdf');flattened=result.flattened;}
  else{
   const groups=[];if(key==='split-pdf'&&$('splitMode').value==='each')pages.forEach(n=>groups.push([n]));
   else if(key==='split-pdf'&&$('splitMode').value==='chunks'){const chunk=Number($('splitChunk').value);if(!Number.isInteger(chunk)||chunk<1)throw Error('Enter a positive number of pages per file.');for(let i=0;i<pages.length;i+=chunk)groups.push(pages.slice(i,i+chunk));}
   else if(key==='split-pdf'&&$('splitMode').value==='ranges'){for(const part of $('splitRanges').value.split(';'))groups.push(InkCore.range(part,state.pdf.numPages));}
   else groups.push(pages);
   const files=[];for(let i=0;i<groups.length;i++){const result=await extractPages(groups[i]);flattened||=result.flattened;files.push([`${name}-${i+1}.pdf`,result.bytes]);}
   if(files.length===1)download(files[0][1],name+'-extracted.pdf','application/pdf');else await zip(files,name+'-split.zip');
  }
  status('Download ready.'+(flattened?' Encrypted PDF pages were rendered; text and forms are flattened.':''));
 }catch(e){status(e.message,true);}finally{state.busy=false;$('utilityRun').disabled=false;}
}
if($('utilityRun'))$('utilityRun').onclick=run;
if($('readMetadata'))$('readMetadata').onclick=async()=>{if(!state.pdf){status('Upload a PDF first.',true);return;}try{const m=await state.pdf.getMetadata();$('metaTitle').value=m.info.Title||'';$('metaAuthor').value=m.info.Author||'';$('metaSubject').value=m.info.Subject||'';$('metaKeywords').value=m.info.Keywords||'';status('Existing metadata loaded.');}catch(e){status(e.message,true);}};
if(key==='watermark-pdf'){$('applyAll').checked=true;$('stampOpacity').value=25;$('typeSignature').textContent='Create text watermark';$('currentSig').insertAdjacentHTML('beforebegin','<p class="hint">Create or upload a watermark, select its image, set opacity below and apply to current/all/range pages. Export with Download edited PDF.</p>');}
window.InkTools={extractPages,imageFile,zip};
})();
