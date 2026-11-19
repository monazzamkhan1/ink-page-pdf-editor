(function(root){
  'use strict';
  const limits={fileBytes:100*1024*1024,pages:1500,totalBytes:400*1024*1024};
  function range(value,total,emptyAll=false){
    if(!Number.isInteger(total)||total<1)throw Error('Load a PDF first.');
    const text=String(value).trim().toLowerCase();
    if(!text&&emptyAll)return Array.from({length:total},(_,i)=>i+1);
    const out=new Set();
    for(const token of text.split(',')){
      const m=token.trim().match(/^(\d+|first|last)(?:\s*-\s*(\d+|first|last))?$/);
      if(!m)throw Error('Use page numbers or ranges, for example 1,3-5,last.');
      const read=v=>v==='last'?total:v==='first'?1:Number(v);
      const start=read(m[1]),end=m[2]?read(m[2]):start;
      if(start<1||end>total||start>end)throw Error(`Pages must be between 1 and ${total}, in ascending ranges.`);
      for(let i=start;i<=end;i++)out.add(i);
    }
    return [...out];
  }
  function bounds(p,view,ratio){
    const w=Math.max(.01,Math.min(.9,Number(p.w)||.22,.9*ratio*view.height/view.width));
    const h=w*view.width/ratio/view.height;
    return {x:Math.max(0,Math.min(1-w,p.x||0)),y:Math.max(0,Math.min(1-h,p.y||0)),w,h};
  }
  function origin(view,p,ratio){const b=bounds(p,view,ratio);return {point:view.convertToPdfPoint(b.x*view.width,(b.y+b.h)*view.height),width:b.w*view.width,height:b.h*view.height,rotation:view.rotation};}
  function signatureType(b){if(b[0]===0x89&&b[1]===0x50&&b[2]===0x4e&&b[3]===0x47)return'png';if(b[0]===255&&b[1]===216)return'jpeg';if(String.fromCharCode(...b.slice(0,4))==='RIFF'&&String.fromCharCode(...b.slice(8,12))==='WEBP')return'webp';return null;}
  async function validateFile(file,pdfOnly=false){
    if(!file||file.size===0)throw Error('Choose a non-empty file.');
    if(file.size>limits.fileBytes)throw Error('Each file must be 100 MB or smaller.');
    const head=new Uint8Array(await file.slice(0,1024).arrayBuffer());
    const pdf=new TextDecoder('latin1').decode(head).includes('%PDF-');
    if(!pdf&&(pdfOnly||!signatureType(head)))throw Error(pdfOnly?'This file does not contain a valid PDF header.':'Choose a PDF, PNG, JPEG or WebP file.');
    return pdf?'pdf':signatureType(head);
  }
  const api={limits,range,bounds,origin,signatureType,validateFile};
  if(typeof module!=='undefined')module.exports=api;else root.InkCore=api;
})(typeof window!=='undefined'?window:globalThis);
