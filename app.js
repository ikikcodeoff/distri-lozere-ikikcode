// app.js
const SUPABASE_URL = "https://jgtmrlrohszuhtppisud.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpndG1ybHJvaHN6dWh0cHBpc3VkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4ODQ3NTUsImV4cCI6MjA3NjQ2MDc1NX0._Z9vQL55O3tLL2seJVa1l3Wwy5Er8-p-hWb7y_sJ3go";

const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);

// ----------- PAGE PRODUITS -----------
async function afficherProduits() {
  const { data: produits, error } = await supabaseClient.from("produits").select("*");
  if (error) {
    console.error("Erreur produits:", error);
    return;
  }

  const container = document.getElementById("liste-produits");
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

function afficherPanier() {
  const panier = JSON.parse(localStorage.getItem("panier")) || [];
  const container = document.getElementById("contenu-panier");
  container.innerHTML = "";

  let total = 0;

  panier.forEach((item, index) => {
    total += item.prix * item.quantite;
    const ligne = document.createElement("div");
    ligne.classList.add("ligne-panier");
    ligne.innerHTML = `
      <span>${item.nom} (${item.quantite})</span>
      <span>${item.prix * item.quantite} €</span>
      <button onclick="supprimerDuPanier(${index})">X</button>
    `;
    container.appendChild(ligne);
  });

  document.getElementById("total-panier").innerText = total.toFixed(2) + " €";
}

function supprimerDuPanier(index) {
  let panier = JSON.parse(localStorage.getItem("panier")) || [];
  panier.splice(index, 1);
  localStorage.setItem("panier", JSON.stringify(panier));
  afficherPanier();
}

// ----------- COMMANDE -----------
async function validerCommande() {
  const panier = JSON.parse(localStorage.getItem("panier")) || [];
  if (panier.length === 0) return alert("Panier vide !");
  
  const { data, error } = await supabaseClient
    .from("orders")
    .insert([{ total: panier.reduce((t, i) => t + i.prix * i.quantite, 0) }])
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

// ----------- ADMIN -----------
async function connexionAdmin() {
  const email = document.getElementById("admin-email").value;
  const motdepasse = document.getElementById("admin-password").value;

  if (email === "admin@rapidmarket.fr" && motdepasse === "admin123") {
    localStorage.setItem("admin", "connecté");
    window.location.href = "admin.html";
  } else {
    alert("Email ou mot de passe incorrect");
  }
}

async function afficherCommandes() {
  const { data, error } = await supabaseClient.from("orders").select("*");
  const container = document.getElementById("liste-commandes");
  container.innerHTML = "";

  data.forEach((cmd) => {
    const div = document.createElement("div");
    div.classList.add("commande");
    div.innerHTML = `<p>Commande #${cmd.id} — Total : ${cmd.total} €</p>`;
    container.appendChild(div);
  });
}
