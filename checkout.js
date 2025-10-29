// checkout.js
const SUPABASE_URL = "https://jgtmrlrohszuhtppisud.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpndG1ybHJvaHN6dWh0cHBpc3VkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4ODQ3NTUsImV4cCI6MjA3NjQ2MDc1NX0._Z9vQL55O3tLL2seJVa1l3Wwy5Er8-p-hWb7y_sJ3go";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const cart = JSON.parse(localStorage.getItem('cart')||'[]');
const checkoutItems = document.getElementById('checkoutItems');
const checkoutTotal = document.getElementById('checkoutTotal');

function displayCheckout(){
  if(!checkoutItems) return;
  if(!cart.length){ checkoutItems.innerHTML = '<p>Panier vide.</p>'; checkoutTotal.textContent = '0 €'; return; }
  let total=0; checkoutItems.innerHTML='';
  cart.forEach(it=>{
    total += (it.price||0)*it.qty;
    const div = document.createElement('div');
    div.className='cart-row';
    div.innerHTML = `<span>${escapeHtml(it.name)} x${it.qty}</span><span>${(it.price*it.qty).toFixed(2)} €</span>`;
    checkoutItems.appendChild(div);
  });
  checkoutTotal.textContent = total.toFixed(2)+' €';
}
displayCheckout();

document.getElementById('orderForm') && document.getElementById('orderForm').addEventListener('submit', async function(e){
  e.preventDefault();
  if(cart.length===0) return alert('Panier vide');
  const prenom = document.getElementById('prenom').value.trim();
  const nom = document.getElementById('nom').value.trim();
  const email = document.getElementById('email').value.trim();
  const adresse = document.getElementById('adresse').value.trim();
  const ville = document.getElementById('ville').value.trim();
  const cp = document.getElementById('cp').value.trim();
  if(!prenom||!nom||!email||!adresse) return alert('Remplissez les champs requis');

  // create order
  const total = cart.reduce((s,i)=>s + (i.price||0)*i.qty, 0);
  const { data: order, error: orderErr } = await supabaseClient.from('orders').insert([{ prenom, nom, email, adresse, ville, cp, total }]).select();
  if(orderErr){ console.error(orderErr); return alert('Erreur création commande'); }
  const orderId = order[0].id;

  // insert items and update stock
  for(const it of cart){
    const { error: itemErr } = await supabaseClient.from('order_items').insert([{ order_id: orderId, product_id: it.id, quantite: it.qty, prix: it.price }]);
    if(itemErr){ console.error(itemErr); }
    // update product stock safely: fetch current, then update subtracting qty (avoid negative)
    const { data: prodData } = await supabaseClient.from('produits').select('stock').eq('id', it.id).single();
    const currentStock = prodData && prodData.stock ? parseInt(prodData.stock,10) : 0;
    const newStock = Math.max(0, currentStock - it.qty);
    await supabaseClient.from('produits').update({ stock: newStock }).eq('id', it.id);
  }

  localStorage.removeItem('cart');
  window.location.href = 'merci.html';
});
