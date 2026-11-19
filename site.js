'use strict';
(()=>{
 if(location.pathname==='/'&&location.hash==='#merge'){location.replace('/tools/merge-pdf');return;}
 const nav=document.getElementById('siteNav'),toggle=document.getElementById('menuToggle');
 toggle?.addEventListener('click',()=>{const expanded=nav.classList.toggle('open');toggle.setAttribute('aria-expanded',expanded);});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'){nav?.classList.remove('open');toggle?.setAttribute('aria-expanded','false');document.querySelectorAll('.site-nav details').forEach(el=>el.open=false);}});
 try{if(localStorage.getItem('ink-theme')==='dark')document.documentElement.classList.add('dark');}catch{}
 document.getElementById('themeToggle')?.addEventListener('click',()=>{const dark=document.documentElement.classList.toggle('dark');try{localStorage.setItem('ink-theme',dark?'dark':'light');}catch{}});
 document.getElementById('clearLocalData')?.addEventListener('click',async()=>{
  const message='Clear all Ink & Page data saved in this browser? Merge files, groups and saved signature images will be deleted. Original files on your device are unchanged.';
  const yes=window.InkStudio?await InkStudio.askConfirm('Clear all local data?',message,'Clear saved data'):confirm(message);if(!yes)return;
  try{
   window.InkMerge?.pausePersistence();
   const db=await new Promise((res,rej)=>{const r=indexedDB.open('ink-page',1);r.onupgradeneeded=()=>r.result.createObjectStore('kv');r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);});
   await new Promise((res,rej)=>{const t=db.transaction('kv','readwrite');t.objectStore('kv').clear();t.oncomplete=res;t.onerror=()=>rej(t.error);});db.close();
   ['ink-page-stamps','ink-page-signature','ink-theme'].forEach(k=>localStorage.removeItem(k));location.reload();
  }catch{alert('Browser storage could not be cleared. Use your browser site-data settings.');}
 });
})();
