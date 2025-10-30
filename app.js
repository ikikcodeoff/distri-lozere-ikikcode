// app.js — charges produits + gère le panier (localStorage)
const SUPABASE_URL = "https://jgtmrlrohszuhtppisud.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpndG1ybHJvaHN6dWh0cHBpc3VkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4ODQ3NTUsImV4cCI6MjA3NjQ2MDc1NX0._Z9vQL55O3tLL2seJVa1l3Wwy5Er8-p-hWb7y_sJ3go";
const supabase = supabaseCreateClient();

function supabaseCreateClient(){
  if (!window.supabase) {
    console.error("SDK Supabase non chargé. Ajoute le <script> CDN.");
    return window.supabase;
  }
  return window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
}

let allProducts = [];

// utilities
function stockStatus(qte){
  if (qte <= 0) return {label:"En rupture", cls:"rupture"};
  if (qte < 5) return {label:"Bientôt en rupture", cls:"bientot"};
  return {label:"En stock", cls:"en-stock"};
}

/* ---------- PRODUITS PAGE ---------- */
async function loadProductsPage(){
  try{
    const { data, error } = await supabase.from("produits").select("*").order('nom');
    if (error) throw error;
    allProducts = data || [];
    renderCategories();
    renderProducts(allProducts);
  }catch(e){ console.error(e); document.getElementById('productList') && (document.getElementById('productList').innerHTML = "<p>Erreur de chargement</p>") }
}

function renderCategories(){
  const catEl = document.getElementById('categoryFilter');
  if(!catEl) return;
  const cats = Array.from(new Set(allProducts.map(p => p.categorie).filter(Boolean)));
  catEl.innerHTML = '<option value="">Toutes les catégories</option>' + cats.map(c=>`<option value="${c}">${c}</option>`).join('');
}

function renderProducts(list){
  const cont = document.getElementById('productList');
  if(!cont) return;
  cont.innerHTML = '';
  if(!list.length){ cont.innerHTML = '<p>Aucun produit trouvé.</p>'; return; }
  list.forEach(p=>{
    const s = stockStatus(p.stock || 0);
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <img src="${p.image_url || 'placeholder.png'}" alt="${escapeHtml(p.nom)}">
      <h3>${escapeHtml(p.nom)}</h3>
      <p>${escapeHtml(p.description || '')}</p>
      <div style="display:flex;justify-content:space-between;align-items:center">
        <strong>${(p.prix||0).toFixed(2)} €</strong>
        <div class="stock ${s.cls}">${s.label}</div>
      </div>
      <div class="actions">
        <button class="btn-primary" ${s.cls==='rupture'?'disabled':''} onclick="addToCart(${p.id}, '${escapeJsString(p.nom)}', ${p.prix})">Ajouter</button>
        <button class="btn-ghost" onclick="window.location='produits.html'">Détails</button>
      </div>
    `;
    cont.appendChild(card);
  });
}

/* ---------- RECHERCHE / FILTRE ---------- */
document.addEventListener('input', (e)=>{
  if(e.target && e.target.id === 'searchInput'){ applyFilters(); }
});
document.addEventListener('change', (e)=>{
  if(e.target && e.target.id === 'categoryFilter'){ applyFilters(); }
});

function applyFilters(){
  const q = document.getElementById('searchInput') ? document.getElementById('searchInput').value.toLowerCase() : '';
  const cat = document.getElementById('categoryFilter') ? document.getElementById('categoryFilter').value : '';
  const filt = allProducts.filter(p=>{
    const name = (p.nom||'').toLowerCase();
    const condName = !q || name.includes(q);
    const condCat = !cat || (p.categorie === cat);
    return condName && condCat;
  });
  renderProducts(filt);
}

/* ---------- PANIER (localStorage) ---------- */
function getCart(){ return JSON.parse(localStorage.getItem('cart')||'[]'); }
function saveCart(c){ localStorage.setItem('cart', JSON.stringify(c)); }

function addToCart(id, name, price){
  let cart = getCart();
  const item = cart.find(i=>i.id===id);
  if(item){ item.qty += 1; }
  else cart.push({id, name, price, qty:1});
  saveCart(cart);
  alert(`${name} ajouté au panier`);
  renderCartPage(); // update if on panier
}

/* Render panier page */
function renderCartPage(){
  const cart = getCart();
  const itemsEl = document.getElementById('cartItems');
  const summaryEl = document.getElementById('summaryList');
  const totalEl = document.getElementById('cartTotal');
  if(itemsEl){
    itemsEl.innerHTML = '';
    if(!cart.length) itemsEl.innerHTML = '<p>Panier vide.</p>';
    cart.forEach((it, idx)=>{
      const div = document.createElement('div');
      div.className = 'card';
      div.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div>
            <strong>${escapeHtml(it.name)}</strong>
            <div class="small-muted">${(it.price||0).toFixed(2)} €</div>
          </div>
          <div style="display:flex;gap:8px;align-items:center">
            <button class="btn-ghost" onclick="updateQty(${idx}, -1)">-</button>
            <div>${it.qty}</div>
            <button class="btn-ghost" onclick="updateQty(${idx}, 1)">+</button>
            <button class="btn-ghost" onclick="removeFromCart(${idx})">Suppr</button>
          </div>
        </div>
      `;
      itemsEl.appendChild(div);
    });
  }
  if(summaryEl){
    summaryEl.innerHTML = cart.map(i=>`<div class="cart-row">${escapeHtml(i.name)} x${i.qty}<span>${(i.price*i.qty).toFixed(2)} €</span></div>`).join('');
  }
  if(totalEl){
    const total = cart.reduce((s,i)=>s + (i.price||0)*i.qty, 0);
    totalEl.textContent = total.toFixed(2)+' €';
  }
}

function updateQty(idx, delta){
  let cart = getCart();
  if(!cart[idx]) return;
  cart[idx].qty = Math.max(0, cart[idx].qty + delta);
  if(cart[idx].qty === 0) cart.splice(idx,1);
  saveCart(cart);
  renderCartPage();
}

function removeFromCart(idx){
  let cart = getCart(); cart.splice(idx,1); saveCart(cart); renderCartPage();
}

/* ---------- UTIL ---------- */
function escapeHtml(s){ return String(s||'').replace(/[&<>"']/g, (m)=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m])); }
function escapeJsString(s){ return String(s||'').replace(/'/g,"\\'").replace(/\n/g,' '); }

/* ---------- INIT ---------- */
document.addEventListener('DOMContentLoaded', ()=>{
  loadProductsPage();
  renderCartPage();
});
