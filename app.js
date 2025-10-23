// app.js
// Charger Supabase depuis le CDN global (pas en module)
const SUPABASE_URL = "https://jgtmrlrohszuhtppisud.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpndG1ybHJvaHN6dWh0cHBpc3VkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4ODQ3NTUsImV4cCI6MjA3NjQ2MDc1NX0._Z9vQL55O3tLL2seJVa1l3Wwy5Er8-p-hWb7y_sJ3go";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ----------- PAGE PRODUITS -----------
async function afficherProduits() {
  const { data: produits, error } = await supabaseClient.from("produits").select("*");
  if (error) {
    console.error("Erreur produits:", error);
    return;
  }

  const container = document.getElementById("product-list");
  if (!container) return;
  container.innerHTML = "";

  produits.forEach((p) => {
    const card = document.createElement("div");
    card.classList.add("produit");

    card.innerHTML = `
      <img src="${p.image_url || 'placeholder.png'}" alt="${p.nom}">
      <h3>${p.nom}</h3>
      <p>${p.description}</p>
      <p class="prix">${p.prix} €</p>
      <button onclick="ajouterAuPanier(${p.id}, '${p.nom}', ${p.prix})">Ajouter</button>
    `;
    container.appendChild(card);
  });
}

// ----------- PANIER -----------
function ajouterAuPanier(id, nom, prix) {
  let panier = JSON.parse(localStorage.getItem("panier")) || [];
  const item = panier.find((i) => i.id === id);
  if (item) item.quantite += 1;
  else panier.push({ id, nom, prix, quantite: 1 });
  localStorage.setItem("panier", JSON.stringify(panier));
  alert(`${nom} ajouté au panier.`);
}

// ----------- COMMANDE -----------
async function validerCommande() {
  const panier = JSON.parse(localStorage.getItem("panier")) || [];
  if (panier.length === 0) return alert("Panier vide !");

  const total = panier.reduce((t, i) => t + i.prix * i.quantite, 0);

  const { data, error } = await supabaseClient
    .from("orders")
    .insert([{ total }])
    .select();

  if (error) {
    console.error(error);
    return alert("Erreur lors de la commande.");
  }

  const orderId = data[0].id;

  for (let item of panier) {
    await supabaseClient.from("order_items").insert([
      { order_id: orderId, product_id: item.id, quantite: item.quantite, prix: item.prix },
    ]);
  }

  localStorage.removeItem("panier");
  window.location.href = "merci.html";
}

// ----------- LANCEMENT AUTO -----------
document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("product-list")) afficherProduits();
});
