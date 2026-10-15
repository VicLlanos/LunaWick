// js/app.js
import { auth, db } from './firebase.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

export const currentState = { user: null, profile: null, admin: false };

export const $ = id => document.getElementById(id);
export const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':'&quot;',"'":"&#39;"}[ch]));
export const fmt = n => new Intl.NumberFormat("en-PH",{style:"currency",currency:"PHP",maximumFractionDigits:2}).format(Number(n)||0);

export function toast(message,type="info"){const node=document.createElement('div');node.className='toast align-items-center border-0';node.innerHTML=`<div class="d-flex"><div class="toast-body">${escapeHTML(message)}</div><button type="button" class="btn-close me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button></div>`;node.style.background=type==='error'?'#f8d7da':type==='success'?'#e6eee6':'#fff';node.style.color='#1C1C1C';document.getElementById('year').append(node);const t=new bootstrap.Toast(node,{delay:5000});t.show();node.addEventListener('hidden.bs.toast',()=>node.remove());}

onAuthStateChanged(auth, async user => {
  currentState.user = user;
  currentState.profile = null;
  currentState.admin = false;
  if (user) {
    try {
      const snap = await getDoc(doc(db,'users',user.uid));
      if (snap.exists()){
        currentState.profile = snap.data();
        currentState.admin = currentState.profile.role === 'admin';
      }
    } catch(e){console.warn('profile load failed',e)}
  }
});

export async function signOutUser(){
  try{await signOut(auth);}catch(e){console.error(e);}
}
