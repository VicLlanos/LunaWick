// js/gallery.js
import { auth, db, storage } from './firebase.js';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

const publicGallery = document.getElementById('publicGallery');
const uploadSection = document.getElementById('uploadSection');
const openUpload = document.getElementById('openUpload');
const cancelUpload = document.getElementById('cancelUpload');

openUpload.addEventListener('click',()=>{
  if (!auth.currentUser) { alert('Please sign in as admin to upload.'); return; }
  // naive admin check: later, Firestore rules should enforce this
  // show upload form
  uploadSection.style.display = '';
  uploadSection.scrollIntoView({behavior:'smooth'});
});

cancelUpload.addEventListener('click',()=>{uploadSection.style.display='none';});

function renderItems(items){ if(!items.length){ publicGallery.innerHTML = '<div class="col-12"><div class="gallery-card"><div class="gallery-placeholder">New studio moments coming soon</div></div></div>'; return }
  publicGallery.innerHTML = items.map(item=>`<div class="col-sm-6 col-lg-4"><article class="gallery-card h-100"><img src="${escapeHtml(item.imageUrl)}" alt="${escapeHtml(item.title||'Luna Wick')}"><div class="p-3"><h5>${escapeHtml(item.title||'')}</h5><p class="small-muted mb-0">${escapeHtml(item.description||'')}</p></div></article></div>`).join(''); }

// simple escape helper here to avoid an import circularity
function escapeHtml(s){return String(s||'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));}

// listen to public gallery
onSnapshot(query(collection(db,'luna_wick_gallery'), where('active','==',true)), snap => {
  const items = snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=> (b.createdAt?.toDate?.()?.getTime?.()||0) - (a.createdAt?.toDate?.()?.getTime?.()||0));
  renderItems(items);
}, err=>{console.error('Gallery load error', err); publicGallery.innerHTML = '<div class="col-12"><div class="notice small-muted">The gallery is temporarily unavailable.</div></div>'});

// upload handling
const galleryUploadForm = document.getElementById('galleryUploadForm');
if (galleryUploadForm) galleryUploadForm.addEventListener('submit', async e=>{
  e.preventDefault();
  const user = auth.currentUser; if (!user) { alert('Only an authorized administrator can upload gallery images.'); return }
  const file = document.getElementById('galleryImageFile').files[0]; if (!file){ alert('Please choose a file.'); return }
  if (!['image/jpeg','image/png','image/webp'].includes(file.type)){ alert('Please choose JPG/PNG/WebP.'); return }
  const title = document.getElementById('galleryTitle').value.trim();
  const description = document.getElementById('galleryDescription').value.trim();
  const btn = document.getElementById('galleryUploadBtn'); btn.disabled = true; document.getElementById('galleryUploadStatus').textContent = 'Uploading image...';

  let path = '';
  try{
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g,'_').slice(-100);
    path = `gallery/${user.uid}/${Date.now()}_${crypto.randomUUID()}_${safeName}`;
    const fileRef = storageRef(storage, path);
    await uploadBytes(fileRef, file);
    const imageUrl = await getDownloadURL(fileRef);
    await addDoc(collection(db,'luna_wick_gallery'), {imageUrl,storagePath:path, title, description, active:true, uploadedBy:user.uid, createdAt: serverTimestamp()});
    document.getElementById('galleryUploadStatus').textContent = 'Upload complete.';
    galleryUploadForm.reset(); uploadSection.style.display='none';
  }catch(err){console.error(err); if (path){ try{ await deleteObject(storageRef(storage,path)) }catch(_e){}} document.getElementById('galleryUploadStatus').textContent = 'Upload failed.' }
  finally{btn.disabled=false}
});
