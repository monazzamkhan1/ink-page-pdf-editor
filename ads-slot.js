'use strict';
// Future educational-page placement only. This component never loads ad code.
// Activation requires an owner-approved Google integration and a certified CMP.
class InkAdSlot extends HTMLElement {
 connectedCallback(){
  this.hidden=true;
  if(!window.InkAds?.enabled||window.InkAds.consent!=='granted')return;
  this.hidden=false;this.setAttribute('aria-label','Advertisement');
  this.style.cssText='display:block;min-height:280px;margin:40px auto;max-width:970px';
  const label=document.createElement('small');label.textContent='Advertisement';this.append(label);
 }
}
customElements.define('ink-ad-slot',InkAdSlot);
