// js/customizer.js
import { auth, db, storage } from './firebase.js';
import { addDoc, collection, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { ref as storageRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

const vesselOptions = {amber:{name:'100ml Amber Glass',cost:0},ceramic:{name:'200ml Matte Ceramic',cost:30},frosted:{name:'250ml Frosted Glass',cost:15}};
const lidOptions = {bamboo:{name:'Raw Bamboo',cost:10},black:{name:'Matte Black Metal',cost:5},none:{name:'No Lid',cost:0}};
const pricing = [{min:1,max:49,price:350},{min:50,max:99,price:250},{min:100,max:299,price:200},{min:300,max:499,price:180},{min:500,max:10000,price:150}];

const state = {quantity:100,vessel:'amber',scent:'Lavender & Sage',lid:'bamboo',labelFile:null};

function priceFor(q){return (pricing.find(t=>q>=t.min&&q<=t.max)||pricing[0]).price}
function calculate(){const q=Math.min(10000,Math.max(1,Math.floor(Number(state.quantity)||1)));state.quantity=q;const base=priceFor(q);const unit=base+vesselOptions[state.vessel].cost+lidOptions[state.lid].cost;const total=unit*q;document.getElementById('summaryQty').textContent=`${q} pcs`;document.getElementById('summaryVessel').textContent=vesselOptions[state.vessel].name;document.getElementById('summaryScent').textContent=state.scent;document.getElementById('summaryLid').textContent=lidOptions[state.lid].name;document.getElementById('summaryUnit').textContent=new Intl.NumberFormat('en-PH',{style:'currency',currency:'PHP'}).format(unit);document.getElementById('summaryTotal').textContent=new Intl.NumberFormat('en-PH',{style:'currency',currency:'PHP'}).format(total);}

// basic wizard
document.querySelectorAll('.option-card[data-vessel]').forEach(el=>el.addEventListener('click',()=>{document.querySelectorAll('.option-card[data-vessel]').forEach(n=>n.classList.remove('selected'));el.classList.add('selected');state.vessel=el.dataset.vessel;calculate();}));
document.querySelectorAll('.option-card[data-scent]').forEach(el=>el.addEventListener('click',()=>{document.querySelectorAll('.option-card[data-scent]').forEach(n=>n.classList.remove('selected'));el.classList.add('selected');state.scent=el.dataset.scent;calculate();}));
document.querySelectorAll('.option-card[data-lid]').forEach(el=>el.addEventListener('click',()=>{document.querySelectorAll('.option-card[data-lid]').forEach(n=>n.classList.remove('selected'));el.classList.add('selected');state.lid=el.dataset.lid;calculate();}));

// wizard buttons
const steps = Array.from(document.querySelectorAll('.wizard-step'));
let currentStep = 0;
function showStep(i){steps.forEach((s,idx)=>s.classList.toggle('d-none',idx!==i));const pct=Math.round(((i+1)/steps.length)*100);document.getElementById('wizardProgress').style.width=pct+'%';}
showStep(0);

document.getElementById('next1').addEventListener('click',()=>{currentStep=1;showStep(currentStep)});
document.getElementById('next2').addEventListener('click',()=>{currentStep=2;showStep(currentStep)});
document.getElementById('next3').addEventListener('click',()=>{currentStep=3;showStep(currentStep)});
document.getElementById('back2').addEventListener('click',()=>{currentStep=0;showStep(currentStep)});
document.getElementById('back3').addEventListener('click',()=>{currentStep=1;showStep(currentStep)});
document.getElementById('back4').addEventListener('click',()=>{currentStep=2;showStep(currentStep)});

// label upload preview
const labelUpload = document.getElementById('labelUpload');
labelUpload.addEventListener('change',e=>{
  const f = e.target.files && e.target.files[0];
  if (!f) return; state.labelFile = f; const url = URL.createObjectURL(f); const preview = document.getElementById('labelPreview'); preview.innerHTML = `<img src="${url}" alt="label preview" style="max-width:100%;height:auto;">`; document.getElementById('previewLabel').textContent = f.name;
});

// quantity input
document.getElementById('quantityInput').addEventListener('input',e=>{state.quantity = Number(e.target.value||1);calculate();});

// save quote
document.getElementById('saveQuote').addEventListener('click',()=>{const quote = {...state, savedAt: new Date().toISOString()};sessionStorage.setItem('lunaWickQuote', JSON.stringify(quote));alert('Quote saved to your session. You can sign in to submit later.');});

// order submit minimal: add order doc (requires auth)
const orderForm = document.getElementById('orderForm');
orderForm.addEventListener('submit', async e=>{
  e.preventDefault();
  const quantity = state.quantity || 1;
  // A simple check for auth
  const user = auth.currentUser;
  if (!user){alert('Please sign in before submitting an order.');window.location.href = '/index.html';return}
  const company = document.getElementById('orderCompany').value.trim();
  const total = (priceFor(quantity)+vesselOptions[state.vessel].cost+lidOptions[state.lid].cost)*quantity;
  const payload = {
    orderId: 'LW-'+Date.now().toString(36).toUpperCase(),
    userId: user.uid,
    items:[{productName:'Signature Soy Candle',quantity,vessel:vesselOptions[state.vessel].name,scent:state.scent,lid:lidOptions[state.lid].name}],
    totalPrice: total,
    paymentStatus: 'pending_verification',
    orderStatus: 'received',
    shippingDetails: {companyName: company},
    timestamp: serverTimestamp()
  };
  try{
    await addDoc(collection(db,'luna_wick_bulk_orders'), payload);
    alert('Order request received. Reference: ' + payload.orderId);
    orderForm.reset();
  }catch(err){console.error(err);alert('Could not submit order.');}
});

calculate();
