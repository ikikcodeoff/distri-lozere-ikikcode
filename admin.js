import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://jgtmrlrohszuhtppisud.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpndG1ybHJvaHN6dWh0cHBpc3VkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4ODQ3NTUsImV4cCI6MjA3NjQ2MDc1NX0._Z9vQL55O3tLL2seJVa1l3Wwy5Er8-p-hWb7y_sJ3go";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Éléments DOM
const loginSection = document.getElementById("loginSection");
const dashboard = document.getElementById("dashboard");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("loginBtn");
const loginMessage = document.getElementById("loginMessage");
const logoutBtn = document.getElementById("logoutBtn");
const productsTable = document.getElementById("productsTable").querySelector("tbody");
const addProductBtn = document.getElementById("addProductBtn");

// Connexion admin
loginBtn.addEventListener("click", async () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();
  if (!email || !password) return;

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    loginMessage.textContent = "Identifiants incorrects.";
    loginMessage.style.color = "red";
  } else {
    loginSection.classList.add("hidden");
    dashboard.classList.remove("hidden");
    logoutBtn.classList.remove("hidden");
    fetchProducts();
  }
});

// Déconnexion
logoutBtn.addEventListener("click", async () => {
  await supabase.auth.signOut();
  dashboard.classList.add("hidden");
  loginSection.classList.remove("hidden");
  logoutBtn.classList.add("hidden");
});

// Ajouter un produit
addProductBtn.addEventListener("click", async () => {
  const nom = document.getElementById("productName").value;
  const description = document.getElementById("productDescription").value;
  const prix = parseFloat(document.getElementById("productPrice").value);

  if (!nom || !description || isNaN(prix)) {
    alert("Veuillez remplir tous les champs.");
    return;
  }

  const { error } = await supabase.from("produits").insert([{ nom, description, prix }]);
  if (error) {
    alert("Erreur lors de l’ajout du produit.");
  } else {
    fetchProducts();
    document.getElementById("productName").value = "";
    document.getElementById("productDescription").value = "";
    document.getElementById("productPrice").value = "";
  }
});

// Charger les produits
async function fetchProducts() {
  const { data, error } = await supabase.from("produits").select("*");
  if (error) {
    console.error(error);
    return;
  }

  productsTable.innerHTML = "";
  data.forEach((p) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${p.id}</td>
      <td>${p.nom}</td>
      <td>${p.description}</td>
      <td>${p.prix.toFixed(2)}</td>
      <td>
        <button class="btn-delete" data-id="${p.id}">🗑️</button>
      </td>
    `;
    productsTable.appendChild(tr);
  });

  document.querySelectorAll(".btn-delete").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-id");
      await supabase.from("produits").delete().eq("id", id);
      fetchProducts();
    });
  });
}
