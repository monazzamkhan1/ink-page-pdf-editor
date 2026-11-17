'use strict';
(()=>{
const $=id=>document.getElementById(id);
const M={src:new Map(),blocks:[],selB:new Set(),selP:new Set(),open:new Set(),uid:1,gn:0,last0:null,busy:false,out:null,undo:[],redo:[],cur:'',tgt:null};
const say=(m,e)=>{$('mStatus').textContent=m;$('mStatus').style.color=e?'#b34332':'#46674c';};
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const base=n=>n.replace(/\.[^.]+$/,'');
const nid=p=>p+(M.uid++);
const snap=()=>JSON.stringify({b:M.blocks,gn:M.gn});
const flat=()=>M.blocks.flatMap(b=>b.pages);
const loc=id=>{for(const b of M.blocks){const i=b.pages.findIndex(p=>p.id===id);if(i>=0)return{b,i};}};
const clone=p=>({...p,id:nid('p')});
const safe=n=>(n||'').replace(/[\\/:*?"<>|]+/g,'-').trim();

/* ---------- tabs ---------- */
function show(tab){const m=tab==='merge';$('viewSign').hidden=m;$('viewMerge').hidden=!m;$('tabSign').classList.toggle('on',!m);$('tabMerge').classList.toggle('on',m);history.replaceState(null,'',m?'#merge':location.pathname+location.search);window.dispatchEvent(new Event('resize'));}
$('tabSign').onclick=()=>show('sign');$('tabMerge').onclick=()=>show('merge');
if(location.hash==='#merge')show('merge');

/* ---------- auto-save (IndexedDB) ---------- */
const idb=()=>new Promise((res,rej)=>{const r=indexedDB.open('ink-page',1);r.onupgradeneeded=()=>r.result.createObjectStore('kv');r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);});
async function idbOp(mode,fn){const d=await idb();return new Promise((res,rej)=>{const t=d.transaction('kv',mode);const q=fn(t.objectStore('kv'));t.oncomplete=()=>res(q&&q.result);t.onerror=()=>rej(t.error);});}
let st;const save=()=>{clearTimeout(st);st=setTimeout(()=>{const used=new Set(flat().map(p=>p.s));idbOp('readwrite',s=>s.put({uid:M.uid,gn:M.gn,blocks:M.blocks,src:[...M.src.values()].filter(x=>used.has(x.id)).map(({id,name,type,mime,bytes})=>({id,name,type,mime,bytes}))},'merge')).catch(()=>say('Auto-save failed (storage full?). Your list stays while this tab is open.',1));},500);};
async function hydrate(s){if(s.type==='pdf'){s.doc=await pdfjsLib.getDocument({data:s.bytes.slice(),isEvalSupported:false}).promise;s.encrypted=(await s.doc.getPermissions())!==null;}else s.url=URL.createObjectURL(new Blob([s.bytes],{type:s.mime}));M.src.set(s.id,s);}

/* ---------- history ---------- */
function change(){const n=snap();if(n!==M.cur){M.undo.push(M.cur);if(M.undo.length>60)M.undo.shift();M.redo=[];M.cur=n;}render();save();}
function jump(from,to){if(!from.length)return;to.push(M.cur);M.cur=from.pop();const o=JSON.parse(M.cur);M.blocks=o.b;M.gn=o.gn;M.selP.clear();M.selB.clear();render();save();}
const undo=()=>jump(M.undo,M.redo),redo=()=>jump(M.redo,M.undo);
$('mUndo').onclick=undo;$('mRedo').onclick=redo;

/* ---------- adding files (new item, or into an existing file at a position) ---------- */
async function addFiles(files,tgt){
  let lastId=null;
  for(const f of files){
    try{
      const isPdf=f.type==='application/pdf'||/\.pdf$/i.test(f.name);
      if(!isPdf&&!/^image\//.test(f.type))throw new Error('unsupported file type');
      const s={id:nid('s'),name:f.name,mime:isPdf?'application/pdf':f.type,type:isPdf?'pdf':'img',bytes:new Uint8Array(await f.arrayBuffer())};
      await hydrate(s);const n=isPdf?s.doc.numPages:1;
      const pages=Array.from({length:n},(_,i)=>({id:nid('p'),s:s.id,i}));
      const b=tgt&&M.blocks.find(x=>x.id===tgt.b);
      if(b){b.pages.splice(tgt.at,0,...pages);tgt.at+=n;M.open.add(b.id);lastId=pages[n-1].id;}else M.blocks.push({id:nid('b'),name:base(f.name),pages});
    }catch(e){say(`${f.name}: ${e.name==='PasswordException'?'password-protected PDF, unlock it first':e.message}`,1);}
  }
  if(lastId){M.selP=new Set([lastId]);M.selB.clear();M.last0=lastId;}
  change();
}
$('mInput').onchange=async e=>{const f=[...e.target.files];e.target.value='';await addFiles(f);};
const fi=document.createElement('input');fi.type='file';fi.multiple=true;fi.accept='application/pdf,.pdf,image/*';fi.hidden=true;document.body.append(fi);
fi.onchange=async()=>{const f=[...fi.files],t=M.tgt;fi.value='';if(t)await addFiles(f,t);};
const pick=(b,at)=>{M.tgt={b,at};fi.click();};
const dz=$('mDrop');dz.ondragover=e=>{if(e.dataTransfer.types.includes('Files'))e.preventDefault();};dz.ondrop=e=>{e.preventDefault();addFiles([...e.dataTransfer.files]);};

/* ---------- thumbnails ---------- */
const cache=new Map();
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){io.unobserve(e.target);draw(e.target);}}),{rootMargin:'300px'});
async function draw(c){
  const key=`${c.dataset.s}:${c.dataset.i}`;let src=cache.get(key);
  try{
    if(!src){
      src=document.createElement('canvas');
      if(!c.dataset.s){src.width=240;src.height=340;const x=src.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,240,340);}
      else{const s=M.src.get(c.dataset.s);
        if(s.type==='img'){const im=new Image();im.src=s.url;await im.decode();const k=240/im.naturalWidth;src.width=240;src.height=Math.max(1,Math.round(im.naturalHeight*k));src.getContext('2d').drawImage(im,0,0,src.width,src.height);}
        else{const pg=await s.doc.getPage(+c.dataset.i+1);const v=pg.getViewport({scale:240/pg.getViewport({scale:1}).width});src.width=v.width;src.height=v.height;await pg.render({canvasContext:src.getContext('2d'),viewport:v}).promise;}}
      cache.set(key,src);
    }
    c.width=src.width;c.height=src.height;c.getContext('2d').drawImage(src,0,0);
  }catch{}
}

/* ---------- render ---------- */
const cv=p=>`<div class="th r${p.r||0}"><canvas data-s="${p.s||''}" data-i="${p.i}" width="60" height="80"></canvas></div>`;
function render(){
  const total=flat().length;
  $('mList').innerHTML=M.blocks.map((b,bi)=>{
    const ip=insPoint(b),where=ip<b.pages.length?`after page ${ip}`:'at end',sel=M.selB.has(b.id),open=M.open.has(b.id),allSel=b.pages.every(p=>M.selP.has(p.id));
    return `<div class="blk${sel?' sel':''}" data-b="${b.id}"><div class="bh"><span class="grip" draggable="true" title="Drag to reorder">⠿</span><input type="checkbox" data-act="selb"${sel?' checked':''} title="Select"><div class="cover">${cv(b.pages[0])}</div><div class="bi"><input class="bname" data-act="name" value="${esc(b.name)}"><small>${b.group?'Group · ':''}${b.pages.length} page${b.pages.length>1?'s':''}</small></div><div class="ba"><button data-act="up"${bi?'':' disabled'}>▲</button><button data-act="dn"${bi<M.blocks.length-1?'':' disabled'}>▼</button><button data-act="tog">${open?'Hide pages':'Pages'}</button><button data-act="menu" title="More (or right-click)">⋯</button><button data-act="del" class="danger">✕</button></div></div>`+
      (open?`<div class="pg"><div class="pghead"><button data-act="selall">${allSel?'Deselect all pages':'Select all pages'}</button><button data-act="blankhere">＋ Blank page ${where}</button><button data-act="addhere">＋ Add files ${where}</button></div>${b.pages.map((p,pi)=>`<div class="pc${M.selP.has(p.id)?' sel':''}" draggable="true" data-p="${p.id}"><input type="checkbox" data-act="selp"${M.selP.has(p.id)?' checked':''}>${cv(p)}<span>${pi+1}${p.blank?' · blank':''}</span><div class="pa"><button data-act="pl"${pi?'':' disabled'}>◀</button><button data-act="pr"${pi<b.pages.length-1?'':' disabled'}>▶</button><button data-act="rotp">⟳</button><button data-act="menu">⋯</button><button data-act="pd" class="danger">✕</button></div></div>`).join('')}</div>`:'')+'</div>';
  }).join('')||'<p class="hint" style="text-align:center;margin:80px 0">Your files will appear here.</p>';
  $('mList').querySelectorAll('canvas').forEach(c=>io.observe(c));
  $('mCount').textContent=M.blocks.length?`${M.blocks.length} item${M.blocks.length>1?'s':''} · ${total} page${total>1?'s':''}`:'Nothing added yet';
  const n=M.selP.size||M.selB.size;$('mBar').hidden=!n;
  if(n){const p1=M.selP.size;$('mSel').textContent=`${n} ${p1?'page':'file'}${n>1?'s':''} selected`;$('mGroup').textContent=p1===1?'Make its own PDF item':'Merge into one PDF';$('mGroup').disabled=p1?false:n<2;['mCopy','mBlank','mAddF'].forEach(k=>$(k).hidden=!p1);}
  $('mUndo').disabled=!M.undo.length;$('mRedo').disabled=!M.redo.length;$('mCreate').disabled=!total||M.busy;
}

/* ---------- helpers for operations ---------- */
const swap=(a,i,j)=>{[a[i],a[j]]=[a[j],a[i]];};
const insPoint=b=>{let at=-1;b.pages.forEach((p,i)=>{if(M.selP.has(p.id))at=i;});if(at<0&&M.last0)at=b.pages.findIndex(p=>p.id===M.last0);return at<0?b.pages.length:at+1;};
const selPages=()=>M.selP.size?flat().filter(p=>M.selP.has(p.id)):M.blocks.filter(b=>M.selB.has(b.id)).flatMap(b=>b.pages);
function group(){
  const g0=()=>({id:nid('b'),name:`Group ${++M.gn}`,group:true,pages:[]});
  if(M.selP.size>=1){
    const out=[];let g=null;
    for(const b of M.blocks){
      const runs=[];for(const p of b.pages){const f=M.selP.has(p.id),l=runs[runs.length-1];if(l&&l.f===f)l.p.push(p);else runs.push({f,p:[p]});}
      if(!runs.some(r=>r.f)){out.push(b);continue;}
      let first=true;
      for(const r of runs){
        if(r.f){if(!g){g=g0();out.push(g);}g.pages.push(...r.p);}
        else{if(first){b.pages=r.p;out.push(b);}else{const nb={...b,id:nid('b'),name:b.name+' (cont.)',pages:r.p};if(M.open.has(b.id))M.open.add(nb.id);out.push(nb);}first=false;}
      }
    }
    M.blocks=out;M.open.add(g.id);
    if(g.pages.length===1)g.name=g.pages.length&&M.src.get(g.pages[0].s)?base(M.src.get(g.pages[0].s).name)+' p'+(g.pages[0].i+1):'Page';
  }else if(M.selB.size>1){
    const g=g0(),out=[];
    for(const b of M.blocks){if(M.selB.has(b.id)){if(!g.pages.length)out.push(g);g.pages.push(...b.pages);}else out.push(b);}
    M.blocks=out;
  }else return;
  M.selP.clear();M.selB.clear();M.last0=null;change();say('Done. It stays in the same place in the order. Use ▲▼ or drag to move it.');
}
function delSel(){
  const n=M.selP.size||M.selB.size;if(!n||!confirm(`Delete ${n} selected ${M.selP.size?'page':'file'}${n>1?'s':''}?`))return;
  if(M.selP.size)M.blocks.forEach(b=>b.pages=b.pages.filter(p=>!M.selP.has(p.id)));else M.blocks=M.blocks.filter(b=>!M.selB.has(b.id));
  M.blocks=M.blocks.filter(b=>b.pages.length);M.selP.clear();M.selB.clear();change();
}
const copyNew=(pages,after)=>{const b={id:nid('b'),name:'Copy',pages:pages.map(clone)};const i=M.blocks.findIndex(x=>x.id===after);M.blocks.splice(i+1,0,b);M.open.add(b.id);M.selP.clear();};
$('mGroup').onclick=group;
$('mBlank').onclick=()=>{if(!M.selP.size)return;const ps=selPages(),l=loc(ps[ps.length-1].id),id=nid('p');l.b.pages.splice(l.i+1,0,{id,s:null,i:0,blank:1});M.selP=new Set([id]);M.last0=id;M.open.add(l.b.id);change();};
$('mAddF').onclick=()=>{if(!M.selP.size)return;const ps=selPages(),l=loc(ps[ps.length-1].id);pick(l.b.id,l.i+1);};
const moveSel=(arr,sel,d)=>{if(d<0){for(let i=1;i<arr.length;i++)if(sel(arr[i])&&!sel(arr[i-1]))swap(arr,i,i-1);}else for(let i=arr.length-2;i>=0;i--)if(sel(arr[i])&&!sel(arr[i+1]))swap(arr,i,i+1);};
const moveBar=d=>{if(M.selP.size)M.blocks.forEach(b=>moveSel(b.pages,p=>M.selP.has(p.id),d));else if(M.selB.size)moveSel(M.blocks,b=>M.selB.has(b.id),d);change();};
$('mUp').onclick=()=>moveBar(-1);$('mDn').onclick=()=>moveBar(1);$('mDel').onclick=delSel;
$('mNone').onclick=()=>{M.selP.clear();M.selB.clear();render();};
$('mCopy').onclick=()=>{const ps=selPages();if(!ps.length)return;const l=loc(ps[ps.length-1].id);copyNew(ps,l.b.id);change();};
$('mRot').onclick=()=>{selPages().forEach(p=>p.r=((p.r||0)+90)%360);change();};
$('mDl').onclick=()=>dl(selPages(),'selected');
$('mExp').onclick=()=>{M.blocks.forEach(b=>M.open.add(b.id));render();};
$('mCol').onclick=()=>{M.open.clear();render();};
$('mAll').onclick=()=>{M.blocks.forEach(b=>M.open.add(b.id));M.selB.clear();M.selP=new Set(flat().map(p=>p.id));render();};
$('mSort').onclick=()=>{M.blocks.sort((a,b)=>a.name.localeCompare(b.name,undefined,{numeric:true}));change();};
$('mClear').onclick=async()=>{if(!confirm('Remove all files and groups from this list?'))return;M.src.forEach(s=>s.url&&URL.revokeObjectURL(s.url));Object.assign(M,{blocks:[],selB:new Set(),selP:new Set(),open:new Set(),out:null,undo:[],redo:[]});M.src.clear();cache.clear();M.cur=snap();$('mRes').hidden=true;try{await idbOp('readwrite',s=>s.delete('merge'));}catch{}render();say('Cleared.');};

/* ---------- the one place every action runs (buttons AND menu) ---------- */
function run(m,bid,pid,e){
  const bi=M.blocks.findIndex(x=>x.id===bid),b=M.blocks[bi],l=pid&&loc(pid),tog=(s,id)=>s.has(id)?s.delete(id):s.add(id);
  const insBlank=at=>{const id=nid('p');b.pages.splice(at,0,{id,s:null,i:0,blank:1});M.open.add(b.id);M.selB.clear();M.selP=new Set([id]);M.last0=id;};
  switch(m){
    case 'selb':tog(M.selB,bid);M.selP.clear();break;
    case 'selp':{M.selB.clear();
      if(e&&e.shiftKey&&M.last0&&loc(M.last0)){const f=flat().map(p=>p.id),i=f.indexOf(M.last0),j=f.indexOf(pid);f.slice(Math.min(i,j),Math.max(i,j)+1).forEach(id=>M.selP.add(id));}else tog(M.selP,pid);
      M.last0=pid;break;}
    case 'selall':{M.selB.clear();const all=b.pages.every(p=>M.selP.has(p.id));b.pages.forEach(p=>all?M.selP.delete(p.id):M.selP.add(p.id));break;}
    case 'tog':tog(M.open,bid);break;
    case 'up':case 'dn':swap(M.blocks,bi,bi+(m==='up'?-1:1));break;
    case 'top':M.blocks.unshift(...M.blocks.splice(bi,1));break;
    case 'bottom':M.blocks.push(...M.blocks.splice(bi,1));break;
    case 'del':M.blocks.splice(bi,1);M.selB.delete(bid);b.pages.forEach(p=>M.selP.delete(p.id));break;
    case 'ren':{render();const i=document.querySelector(`.blk[data-b="${bid}"] .bname`);if(i){i.focus();i.select();}return;}
    case 'ungroup':{const runs=[];for(const p of b.pages){const x=runs[runs.length-1];if(x&&x[0].s===p.s)x.push(p);else runs.push([p]);}M.blocks.splice(bi,1,...runs.map(r=>({id:nid('b'),name:r[0].s?base(M.src.get(r[0].s).name):'Pages',pages:r})));M.selB.delete(bid);break;}
    case 'group':return group();
    case 'rotall':b.pages.forEach(p=>p.r=((p.r||0)+90)%360);break;
    case 'dup':M.blocks.splice(bi+1,0,{...b,id:nid('b'),name:b.name+' copy',pages:b.pages.map(clone)});break;
    case 'rev':b.pages.reverse();break;
    case 'blankend':insBlank(b.pages.length);break;
    case 'blankhere':insBlank(insPoint(b));break;
    case 'addhere':return pick(bid,insPoint(b));
    case 'own':M.selB.clear();M.selP=new Set([pid]);return group();
    case 'addin':return pick(bid,b.pages.length);
    case 'splitall':if(b.pages.length>30&&!confirm(`Split into ${b.pages.length} separate items?`))return;M.blocks.splice(bi,1,...b.pages.map((p,i)=>({id:nid('b'),name:`${b.name} p${i+1}`,pages:[p]})));M.selB.delete(bid);break;
    case 'dl':return dl(b.pages,b.name);
    case 'pl':case 'pr':swap(l.b.pages,l.i,l.i+(m==='pl'?-1:1));break;
    case 'pd':{l.b.pages.splice(l.i,1);M.selP.delete(pid);if(!l.b.pages.length)M.blocks.splice(M.blocks.indexOf(l.b),1);break;}
    case 'rotp':{const p=l.b.pages[l.i];p.r=((p.r||0)+90)%360;break;}
    case 'dupp':l.b.pages.splice(l.i+1,0,clone(l.b.pages[l.i]));break;
    case 'blankb':case 'blanka':{const bb=l.b,id=nid('p');bb.pages.splice(l.i+(m==='blanka'?1:0),0,{id,s:null,i:0,blank:1});M.open.add(bb.id);M.selP=new Set([id]);M.last0=id;break;}
    case 'addafter':return pick(l.b.id,l.i+1);
    case 'splith':{const rest=l.b.pages.splice(l.i);const nb={id:nid('b'),name:l.b.name+' (part 2)',group:l.b.group,pages:rest};M.blocks.splice(M.blocks.indexOf(l.b)+1,0,nb);M.open.add(nb.id);break;}
    case 'copynew':{const ps=M.selP.size>1&&M.selP.has(pid)?selPages():[l.b.pages[l.i]];copyNew(ps,l.b.id);break;}
    case 'rotsel':selPages().forEach(p=>p.r=((p.r||0)+90)%360);break;
    case 'dlsel':return dl(selPages(),'selected');
    case 'delsel':return delSel();
    case 'view':return view(pid||b.pages[0].id);
    default:return;
  }
  change();
}
const L=$('mList');
L.addEventListener('input',e=>{const el=e.target.closest('.bname');if(!el)return;const b=M.blocks.find(x=>x.id===el.closest('.blk').dataset.b);if(b){b.name=el.value;M.cur=snap();save();}});
L.addEventListener('click',e=>{
  const a=e.target.closest('[data-act]');if(!a||a.dataset.act==='name')return;
  const bEl=a.closest('.blk'),pEl=a.closest('.pc'),pid=pEl&&pEl.dataset.p;
  if(a.dataset.act==='menu'){const r=a.getBoundingClientRect();return openMenu(r.left,r.bottom+4,bEl.dataset.b,pid);}
  run(a.dataset.act,bEl.dataset.b,pid,e);
});
L.addEventListener('dblclick',e=>{const pc=e.target.closest('.pc');if(pc&&!e.target.closest('button,input'))view(pc.dataset.p);});

/* ---------- right-click / ⋯ menu ---------- */
const menu=document.createElement('div');menu.id='mMenu';menu.hidden=true;document.body.append(menu);let MC=null;
function items(bid,pid){
  const b=M.blocks.find(x=>x.id===bid),I=[];
  if(pid){
    const multi=M.selP.size>1&&M.selP.has(pid),n=M.selP.size,i=b.pages.findIndex(p=>p.id===pid);
    if(multi)I.push(['group',`Merge ${n} pages into one PDF`],['copynew',`Copy ${n} pages to a new item`],['rotsel','Rotate selected ⟳'],['dlsel','Download selected as PDF'],'-',['delsel',`Delete ${n} pages`,1]);
    else I.push(['view','Preview page'],['rotp','Rotate page ⟳'],['dupp','Duplicate page'],['own','Make this page its own PDF item'],'-',['blankb','Insert blank page before'],['blanka','Insert blank page after'],['addafter','Add PDF / images after this page…'],'-',...(i?[['splith','Split file before this page']]:[]),['copynew','Copy page to a new item'],['pd','Delete page',1]);
  }else{
    if(M.selB.size>1&&M.selB.has(bid))I.push(['group',`Merge ${M.selB.size} files into one PDF`],['rotsel','Rotate selected ⟳'],['dlsel','Download selected as one PDF'],'-');
    I.push(['tog',M.open.has(bid)?'Collapse pages':'Expand into pages'],['ren','Rename'],['view','Preview first page'],'-',['rotall','Rotate all pages ⟳'],['dup','Duplicate'],['rev','Reverse page order'],'-',['blankend','Add blank page at end'],['addin','Add PDF / images into this file…'],...(b.pages.length>1?[['splitall','Split into single pages']]:[]),...(b.group?[['ungroup','Ungroup']]:[]),['dl','Download this as PDF'],'-',['top','Move to top'],['bottom','Move to bottom'],['del','Delete',1]);
  }
  return I;
}
function openMenu(x,y,bid,pid){
  MC={bid,pid};menu.innerHTML=items(bid,pid).map(i=>i==='-'?'<hr>':`<button data-m="${i[0]}"${i[2]?' class="danger"':''}>${i[1]}</button>`).join('');
  menu.hidden=false;menu.style.left=Math.max(4,Math.min(x,innerWidth-menu.offsetWidth-4))+'px';menu.style.top=Math.max(4,Math.min(y,innerHeight-menu.offsetHeight-4))+'px';
}
menu.addEventListener('click',e=>{const b=e.target.closest('[data-m]');if(!b)return;menu.hidden=true;run(b.dataset.m,MC.bid,MC.pid);});
document.addEventListener('click',e=>{if(!e.target.closest('#mMenu,[data-act=menu]'))menu.hidden=true;});
L.addEventListener('contextmenu',e=>{
  const bEl=e.target.closest('.blk');if(!bEl||e.target.closest('input.bname'))return;e.preventDefault();
  const pEl=e.target.closest('.pc'),pid=pEl&&pEl.dataset.p;
  if(pid&&!M.selP.has(pid)){M.selP.clear();M.selB.clear();M.selP.add(pid);M.last0=pid;render();}
  openMenu(e.clientX,e.clientY,bEl.dataset.b,pid);
});

/* ---------- drag & drop reorder ---------- */
let D=null;const clearOver=()=>L.querySelectorAll('.over').forEach(x=>x.classList.remove('over'));
L.addEventListener('dragstart',e=>{const g=e.target.closest('.grip'),pc=e.target.closest('.pc');if(g){const b=g.closest('.blk');D={t:'b',id:b.dataset.b};e.dataTransfer.setDragImage(b.querySelector('.bh'),10,10);}else if(pc)D={t:'p',id:pc.dataset.p};else return;e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain','x');});
L.addEventListener('dragover',e=>{if(!D)return;const t=e.target.closest(D.t==='b'?'.blk':'.pc');if(t){e.preventDefault();clearOver();t.classList.add('over');}});
L.addEventListener('dragend',()=>{D=null;clearOver();});
L.addEventListener('drop',e=>{
  if(!D)return;const t=e.target.closest(D.t==='b'?'.blk':'.pc');if(!t)return;e.preventDefault();
  if(D.t==='b'){const from=M.blocks.findIndex(b=>b.id===D.id),to=M.blocks.findIndex(b=>b.id===t.dataset.b);const [x]=M.blocks.splice(from,1);M.blocks.splice(to,0,x);}
  else{const a=loc(D.id),tgt=loc(t.dataset.p);if(a&&tgt){const t0=tgt.i,[p]=a.b.pages.splice(a.i,1);tgt.b.pages.splice(t0,0,p);M.blocks=M.blocks.filter(b=>b.pages.length);}}
  D=null;change();
});

/* ---------- build PDFs ---------- */
async function imagePage(out,s){
  let img;
  if(s.mime==='image/png')img=await out.embedPng(s.bytes);
  else{const bm=await createImageBitmap(new Blob([s.bytes],{type:s.mime})),k=Math.min(1,2800/Math.max(bm.width,bm.height)),c=document.createElement('canvas');c.width=Math.round(bm.width*k);c.height=Math.round(bm.height*k);const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);x.drawImage(bm,0,0,c.width,c.height);bm.close();const blob=await new Promise(r=>c.toBlob(r,'image/jpeg',.92));img=await out.embedJpg(new Uint8Array(await blob.arrayBuffer()));}
  let pw=img.width,ph=img.height,w=pw,h=ph,x=0,y=0;
  if($('mImg').value==='a4'){const land=img.width>img.height;pw=land?841.89:595.28;ph=land?595.28:841.89;const k=Math.min((pw-40)/img.width,(ph-40)/img.height);w=img.width*k;h=img.height*k;x=(pw-w)/2;y=(ph-h)/2;}
  out.addPage([pw,ph]).drawImage(img,{x,y,width:w,height:h});
}
async function buildDirect(pages,prog){
  const {PDFDocument,degrees}=PDFLib,out=await PDFDocument.create(),docs=new Map();
  const rot=(pg,p)=>{if(p.r)pg.setRotation(degrees((pg.getRotation().angle+p.r)%360));};
  for(let k=0;k<pages.length;){
    const p=pages[k];
    if(p.blank){rot(out.addPage([595.28,841.89]),p);k++;}
    else{
      const s=M.src.get(p.s);let j=k;while(j<pages.length&&!pages[j].blank&&pages[j].s===s.id)j++;const first=out.getPageCount();
      if(s.type==='pdf'){let d=docs.get(s.id);if(!d){d=await PDFDocument.load(s.bytes.slice(),{updateMetadata:false});docs.set(s.id,d);}(await out.copyPages(d,pages.slice(k,j).map(x=>x.i))).forEach(x=>out.addPage(x));}
      else for(let q=k;q<j;q++)await imagePage(out,s);
      for(let q=k;q<j;q++)rot(out.getPage(first+q-k),pages[q]);k=j;
    }
    if(prog)prog(k);await new Promise(r=>setTimeout(r));
  }
  return out.save();
}
// PDF.js can display some PDFs whose internal objects cannot be copied by
// pdf-lib. Keep normal pages editable; recover only failed source pages.
async function renderedPage(out,s,p){
  const source=await s.doc.getPage(p.i+1);
  const rotation=((source.rotate+(p.r||0))%360+360)%360;
  const size=source.getViewport({scale:1,rotation});
  const scale=Math.min(2,Math.sqrt(8000000/(size.width*size.height)),8192/Math.max(size.width,size.height));
  const view=source.getViewport({scale,rotation}),canvas=document.createElement('canvas');
  canvas.width=Math.max(1,Math.ceil(view.width));canvas.height=Math.max(1,Math.ceil(view.height));
  try{
    await source.render({canvasContext:canvas.getContext('2d'),viewport:view,background:'#ffffff'}).promise;
    const blob=await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('Page image could not be encoded.')),'image/jpeg',.95));
    const image=await out.embedJpg(new Uint8Array(await blob.arrayBuffer()));
    out.addPage([size.width,size.height]).drawImage(image,{x:0,y:0,width:size.width,height:size.height});
  }finally{canvas.width=canvas.height=1;}
}
async function buildRecovered(pages,prog,force){
  const {PDFDocument,degrees}=PDFLib,out=await PDFDocument.create(),docs=new Map();
  let recovered=0;
  for(let k=0;k<pages.length;k++){
    const p=pages[k],s=p.blank?null:M.src.get(p.s);
    try{
      if(p.blank){const page=out.addPage([595.28,841.89]);if(p.r)page.setRotation(degrees(p.r));}
      else if(!s)throw new Error('The source file is not available. Add this file again.');
      else if(s.type==='img'){await imagePage(out,s);if(p.r){const page=out.getPage(out.getPageCount()-1);page.setRotation(degrees(p.r));}}
      else{
        let copied=false;
        if(!force){
          try{
            if(!docs.has(s.id)){
              try{docs.set(s.id,s.encrypted?null:await PDFDocument.load(s.bytes.slice(),{updateMetadata:false}));}
              catch{docs.set(s.id,null);}
            }
            const source=docs.get(s.id);
            if(source){
              // Isolate a bad object from the destination and verify serialization.
              const temp=await PDFDocument.create();
              const [page]=await temp.copyPages(source,[p.i]);temp.addPage(page);
              if(p.r)page.setRotation(degrees((page.getRotation().angle+p.r)%360));
              await temp.save();
              const [clean]=await out.copyPages(temp,[0]);out.addPage(clean);copied=true;
            }
          }catch{/* Retry this page using its existing, local PDF.js preview. */}
        }
        if(!copied){await renderedPage(out,s,p);recovered++;}
      }
    }catch(e){throw new Error(`${s?s.name:'Blank page'} — page ${p.i+1} (output ${k+1}): ${e.message}`);}
    if(prog)prog(k+1);await new Promise(resolve=>setTimeout(resolve));
  }
  const data=await out.save();M.recovered=recovered;return data;
}
async function build(pages,prog){
  M.recovered=0;
  if($('mCompat').checked)return buildRecovered(pages,prog,true);
  if(pages.some(p=>!p.blank&&M.src.get(p.s)?.encrypted))return buildRecovered(pages,prog,false);
  try{return await buildDirect(pages,prog);}
  catch(e){
    say('Normal merge failed. Recovering pages from their previews…');
    return buildRecovered(pages,prog,false);
  }
}
const recoveryNote=()=>M.recovered?` ${M.recovered} PDF page(s) exported as images for compatibility; text on those pages is not selectable.`:'';
async function dl(pages,name){
  if(!pages.length)return;
  try{say('Building…');download(await build(pages),(safe(name)||'pages')+'.pdf','application/pdf');say(`Downloaded ${pages.length} page${pages.length>1?'s':''}.`+recoveryNote());}
  catch(err){say('Could not create PDF: '+err.message,1);}
}
const fileName=()=>(safe($('mName').value)||'merged').replace(/\.pdf$/i,'')+'.pdf';
$('mCreate').onclick=async()=>{
  const pages=flat();if(!pages.length||M.busy)return;
  M.busy=true;$('mCreate').disabled=true;
  try{
    M.out={data:await build(pages,k=>say(`Building… ${k} / ${pages.length} pages`)),name:fileName()};
    download(M.out.data,M.out.name,'application/pdf');
    $('mRes').hidden=false;say(`Done: ${pages.length} pages. Your list is unchanged, so you can adjust and create again.`+recoveryNote());
  }catch(e){say('Could not create PDF: '+e.message,1);}
  finally{M.busy=false;render();}
};
$('mAgain').onclick=()=>M.out&&download(M.out.data,M.out.name,'application/pdf');
$('mToSign').onclick=()=>{
  if(!M.out)return;const dt=new DataTransfer();dt.items.add(new File([M.out.data],M.out.name,{type:'application/pdf'}));
  $('pdfInput').files=dt.files;$('pdfInput').dispatchEvent(new Event('change'));show('sign');
};

/* ---------- full-size preview ---------- */
const pv=document.createElement('div');pv.id='mPv';pv.hidden=true;pv.innerHTML='<div class="pvbar"><button data-v="-1">← Prev</button><span></span><button data-v="1">Next →</button><button data-v="0">✕ Close</button></div><canvas></canvas>';document.body.append(pv);
let pvI=0;
async function paint(){
  const f=flat(),p=f[pvI],c=pv.querySelector('canvas'),w=Math.min(900,innerWidth-32);if(!p)return;pv.querySelector('span').textContent=`${pvI+1} / ${f.length}`;
  try{
    const x=c.getContext('2d');
    if(p.blank){c.width=w;c.height=Math.round(w*1.414);x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);return;}
    const s=M.src.get(p.s);
    if(s.type==='pdf'){const pg=await s.doc.getPage(p.i+1),rot=(pg.rotate+(p.r||0))%360,v0=pg.getViewport({scale:1,rotation:rot}),v=pg.getViewport({scale:w/v0.width,rotation:rot});c.width=v.width;c.height=v.height;await pg.render({canvasContext:x,viewport:v}).promise;}
    else{const im=new Image();im.src=s.url;await im.decode();const o=(p.r||0)%180,iw=o?im.naturalHeight:im.naturalWidth,ih=o?im.naturalWidth:im.naturalHeight,k=w/iw;c.width=w;c.height=Math.round(ih*k);x.translate(c.width/2,c.height/2);x.rotate((p.r||0)*Math.PI/180);x.drawImage(im,-im.naturalWidth*k/2,-im.naturalHeight*k/2,im.naturalWidth*k,im.naturalHeight*k);}
  }catch{}
}
function view(pid){pvI=Math.max(0,flat().findIndex(p=>p.id===pid));pv.hidden=false;paint();}
const step=d=>{const n=pvI+d;if(n>=0&&n<flat().length){pvI=n;paint();}};
pv.addEventListener('click',e=>{const v=e.target.closest('[data-v]');if(v){+v.dataset.v?step(+v.dataset.v):pv.hidden=true;}else if(e.target===pv)pv.hidden=true;});

/* ---------- keyboard ---------- */
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){pv.hidden=true;menu.hidden=true;return;}
  if(!pv.hidden){if(e.key==='ArrowRight')step(1);if(e.key==='ArrowLeft')step(-1);return;}
  if($('viewMerge').hidden||/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName))return;
  const k=e.key.toLowerCase();
  if((e.ctrlKey||e.metaKey)&&k==='z'){e.preventDefault();e.shiftKey?redo():undo();}
  else if((e.ctrlKey||e.metaKey)&&k==='y'){e.preventDefault();redo();}
  else if(e.key==='Delete')delSel();
});

/* ---------- restore after reload ---------- */
(async()=>{
  try{
    const v=await idbOp('readonly',s=>s.get('merge'));if(!v||!v.blocks.length){M.cur=snap();render();return;}
    for(const s of v.src)await hydrate(s);
    Object.assign(M,{uid:v.uid,gn:v.gn,blocks:v.blocks});M.cur=snap();render();say('Your previous list was restored.');
  }catch{M.cur=snap();render();}
})();
})();
