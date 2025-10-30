// admin.js
const SUPABASE_URL = "https://jgtmrlrohszuhtppisud.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpndG1ybHJvaHN6dWh0cHBpc3VkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4ODQ3NTUsImV4cCI6MjA3NjQ2MDc1NX0._Z9vQL55O3tLL2seJVa1l3Wwy5Er8-p-hWb7y_sJ3go";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const btnLogin = document.getElementById('btnLogin');
const panel = document.getElementById('panel');
const loginBox = document.getElementById('loginBox');
const tbody = document.querySelector('#productsTable tbody');

btnLogin && btnLogin.addEventListener('click', async ()=>{
  const email = document.getElementById('adminEmail').value;
  const pass = document.getElementById('adminPassword').value;
  // simple local check (replace with real auth later)
  if(email === 'admin@rapidmarket.fr' && pass === 'admin123'){
    loginBox.style.display = 'none';
    panel.style.display = 'block';
    loadProductsAdmin();
  } else {
    alert('Identifiants incorrects');
  }
});

document.getElementById('btnAdd') && document.getElementById('btnAdd').addEventListener('click', async ()=>{
  const nom = document.getElementById('newName').value.trim();
  const prix = parseFloat(document.getElementById('newPrice').value || 0);
  const stock = parseInt(document.getElementById('newStock').value || 0,10);
  const cat = document.getElementById('newCat').value.trim();
  const img = document.getElementById('newImg').value.trim();

  if(!nom) return alert('Nom requis');
  const { error } = await supabaseClient.from('produits').insert([{ nom, prix, stock, categorie:cat, image_url:img }]);
  if(error) return alert('Erreur ajout produit');
  document.getElementById('newName').value='';document.getElementById('newPrice').value='';document.getElementById('newStock').value='';document.getElementById('newCat').value='';document.getElementById('newImg').value='';
  loadProductsAdmin();
});

async function loadProductsAdmin(){
  const { data, error } = await supabaseClient.from('produits').select('*').order('id', {ascending:true});
  if(error){ console.error(error); tbody.innerHTML = '<tr><td colspan=6>Erreur</td></tr>'; return; }
  tbody.innerHTML='';
  data.forEach(p=>{
    const s = (p.stock <=0) ? 'En rupture' : (p.stock < 5 ? 'Bientôt en rupture' : 'En stock');
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${escapeHtml(p.nom)}</td>
      <td>${(p.prix||0).toFixed(2)}</td>
      <td><input style="width:80px" type="number" id="stock_${p.id}" value="${p.stock||0}"></td>
      <td>${escapeHtml(p.categorie||'')}</td>
      <td>${s}</td>
      <td>
        <button class="btn-ghost" onclick="updateStock(${p.id})">💾</button>
        <button class="btn-ghost" onclick="deleteProd(${p.id})">🗑️</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

window.updateStock = async function(id){
  const val = parseInt(document.getElementById('stock_'+id).value||0,10);
  const { error } = await supabaseClient.from('produits').update({ stock: val }).eq('id', id);
  if(error) return alert('Erreur mise à jour stock');
  loadProductsAdmin();
};

window.deleteProd = async function(id){
  if(!confirm('Supprimer ce produit ?')) return;
  const { error } = await supabaseClient.from('produits').delete().eq('id', id);
  if(error) return alert('Erreur suppression');
  loadProductsAdmin();
};

/* reuse escapeHtml from app.js logic (simple) */
function escapeHtml(s){ return String(s||'').replace(/[&<>"']/g, (m)=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m])); }

