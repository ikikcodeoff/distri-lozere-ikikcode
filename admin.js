// Initialisation Supabase
const SUPABASE_URL = "https://jgtmrlrohszuhtppisud.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpndG1ybHJvaHN6dWh0cHBpc3VkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4ODQ3NTUsImV4cCI6MjA3NjQ2MDc1NX0._Z9vQL55O3tLL2seJVa1l3Wwy5Er8-p-hWb7y_sJ3go";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Connexion admin
function connexionAdmin() {
  const email = document.getElementById("admin-email").value;
  const password = document.getElementById("admin-password").value;

  if (email === "admin@rapidmarket.fr" && password === "admin123") {
    localStorage.setItem("adminConnecte", "true");
    document.getElementById("login-section").classList.add("hidden");
    document.getElementById("admin-dashboard").classList.remove("hidden");
    chargerProduits();
  } else {
    alert("Identifiants incorrects !");
  }
}

// Déconnexion
function deconnexionAdmin() {
  localStorage.removeItem("adminConnecte");
  document.getElementById("admin-dashboard").classList.add("hidden");
  document.getElementById("login-section").classList.remove("hidden");
}

// Charger produits
async function chargerProduits() {
  const { data, error } = await supabaseClient.from("produits").select("*");
  const liste = document.getElementById("liste-produits");
  liste.innerHTML = "";

  if (error) {
    console.error(error);
    liste.innerHTML = "<p>Erreur de chargement.</p>";
    return;
  }

  data.forEach((p) => {
    const div = document.createElement("div");
    div.classList.add("produit-admin");
    div.innerHTML = `
      <strong>${p.nom}</strong> - ${p.prix} €<br>
      <em>${p.description}</em><br>
      <img src="${p.image_url || 'placeholder.png'}" alt="${p.nom}" style="height:60px"><br>
      <button onclick="supprimerProduit(${p.id})">🗑 Supprimer</button>
    `;
    liste.appendChild(div);
  });
}

// Ajouter un produit
async function ajouterProduit() {
  const nom = document.getElementById("nom-produit").value;
  const description = document.getElementById("description-produit").value;
  const prix = parseFloat(document.getElementById("prix-produit").value);
  const image_url = document.getElementById("image-produit").value;

  if (!nom || !description || isNaN(prix)) {
    alert("Veuillez remplir tous les champs !");
    return;
  }

  const { error } = await supabaseClient.from("produits").insert([
    { nom, description, prix, image_url }
  ]);

  if (error) {
    alert("Erreur d’ajout du produit.");
    console.error(error);
  } else {
    alert("Produit ajouté !");
    chargerProduits();
  }
}

// Supprimer un produit
async function supprimerProduit(id) {
  if (!confirm("Supprimer ce produit ?")) return;
  const { error } = await supabaseClient.from("produits").delete().eq("id", id);
  if (error) console.error(error);
  chargerProduits();
}

// Vérifie la session au chargement
window.onload = () => {
  if (localStorage.getItem("adminConnecte") === "true") {
    document.getElementById("login-section").classList.add("hidden");
    document.getElementById("admin-dashboard").classList.remove("hidden");
    chargerProduits();
  }
};

