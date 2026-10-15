// js/admin.js
import { auth, db, storage } from './firebase.js';
import { onSnapshot, collection } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { deleteObject, ref as storageRef } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

const adminAccessMessage = document.getElementById('adminAccessMessage');
const adminOrdersBody = document.getElementById('adminOrdersBody');
const adminGalleryList = document.getElementById('adminGalleryList');
const adminOrderCount = document.getElementById('adminOrderCount');
const adminPendingCount = document.getElementById('adminPendingCount');
const refreshAdminBtn = document.getElementById('refreshAdminBtn');
const logoutBtn = document.getElementById('logoutBtn');

let unsubOrders = null; let unsubGallery = null;

function renderOrders(rows){ adminOrderCount.textContent = rows.length; adminPendingCount.textContent = rows.filter(r=>r.paymentStatus==='pending_verification').length; if(!rows.length){ adminOrdersBody.innerHTML = '<tr><td colspan="6">No orders found.</td></tr>'; return } adminOrdersBody.innerHTML = rows.map(o=>`<tr><td>${o.orderId}</td><td>${o.userId}</td><td>${o.orderStatus||'received'}</td><td>₱${Number(o.totalPrice||0).toLocaleString()}</td><td>${new Date((o.timestamp?.toDate?.()?.getTime?.()||Date.now())).toLocaleDateString()}</td><td><button data-id="${o.id}" class="btn btn-sm btn-outline-terra">View</button></td></tr>`).join(''); }

function renderGallery(items){ if(!items.length){ adminGalleryList.innerHTML = '<div class="small-muted">No gallery items.</div>'; return } adminGalleryList.innerHTML = items.map(item=>`<div class="d-flex gap-3 align-items-center border rounded-3 p-2 mb-2"><img src="${escapeHtml(item.imageUrl)}" style="width:80px;height:60px;object-fit:cover;border-radius:6px"><div class="flex-grow-1"><strong>${escapeHtml(item.title||'')}</strong><div class="small-muted">${escapeHtml(item.description||'')}</div></div><div><button data-id="${item.id}" data-path="${escapeHtml(item.storagePath||'')}" class="btn btn-sm btn-danger delete-gallery">Delete</button></div></div>`).join('');
  adminGalleryList.querySelectorAll('.delete-gallery').forEach(btn=>btn.addEventListener('click', async e=>{const id=btn.dataset.id; const path=btn.dataset.path; if(!confirm('Delete this item?'))return; try{await db.deleteDoc(db.doc(db,'luna_wick_gallery',id)); if(path){await deleteObject(storageRef(storage,path))}alert('Deleted')}catch(err){console.error(err);alert('Delete failed') }})); }

function escapeHtml(s){return String(s||'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));}

export function startAdminListeners(){ if(!auth.currentUser){ adminAccessMessage.innerHTML = '<div class="text-danger">Access denied</div>'; return }
 adminAccessMessage.innerHTML = '<div class="text-sage fw-semibold">Administrator verified</div>';
 unsubOrders = onSnapshot(collection(db,'luna_wick_bulk_orders'), snap=>{ const orders = snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=> (b.timestamp?.toDate?.()?.getTime?.()||0)-(a.timestamp?.toDate?.()?.getTime?.()||0)); renderOrders(orders); }, err=>{console.error(err); adminOrdersBody.innerHTML = '<tr><td colspan="6">Could not load orders</td></tr>'});
 unsubGallery = onSnapshot(collection(db,'luna_wick_gallery'), snap=>{ const items = snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=> (b.createdAt?.toDate?.()?.getTime?.()||0)-(a.createdAt?.toDate?.()?.getTime?.()||0)); renderGallery(items); }, err=>{ console.error(err); adminGalleryList.innerHTML = '<div class="small-muted">Could not load gallery</div>'}); }

refreshAdminBtn && refreshAdminBtn.addEventListener('click', ()=>{ if(unsubOrders) unsubOrders(); if(unsubGallery) unsubGallery(); startAdminListeners(); alert('Refreshing listeners');});
logoutBtn && logoutBtn.addEventListener('click', async ()=>{ try{ await auth.signOut(); location.href = '/index.html'; }catch(e){console.error(e)} });

// start when script loads
startAdminListeners();
