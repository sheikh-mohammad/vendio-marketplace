import { api } from "./api.js";
import { updateHeader } from "./auth.js";

updateHeader();

const grid = document.querySelector(".products-grid");
const noResults = document.getElementById("no-results");
const searchInput = document.getElementById("mp-search");
const categorySelect = document.getElementById("mp-category");
const conditionSelect = document.getElementById("mp-condition");
const sortSelect = document.getElementById("mp-sort");
const filterBar = document.querySelector(".filter-bar");
const heroSearch = document.querySelector(".hero-search");

const params = new URLSearchParams(window.location.search);

if (params.get("search")) searchInput.value = params.get("search");
if (params.get("category")) categorySelect.value = params.get("category");
if (params.get("condition")) conditionSelect.value = params.get("condition");
if (params.get("sort")) sortSelect.value = params.get("sort");

function buildQueryString() {
  const q = {};
  if (searchInput.value.trim()) q.search = searchInput.value.trim();
  if (categorySelect.value) q.category = categorySelect.value;
  if (conditionSelect.value) q.condition = conditionSelect.value;
  if (sortSelect.value && sortSelect.value !== "newest") q.sort = sortSelect.value;
  return new URLSearchParams(q).toString();
}

function formatPrice(price) {
  return "Rs " + Number(price).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function createProductCard(product) {
  const article = document.createElement("article");
  article.className = "product-card";

  const catLower = (product.category || "other").toLowerCase();
  const condBadge = product.condition === "New" ? "badge-new" : "badge-used";

  const link = document.createElement("a");
  link.className = "product-media";
  link.href = "product.html#" + product._id;

  const img = document.createElement("img");
  img.src = product.image;
  img.alt = product.title;
  img.loading = "lazy";
  img.width = 640;
  img.height = 480;
  link.appendChild(img);

  const badge = document.createElement("span");
  badge.className = "badge " + condBadge;
  badge.textContent = product.condition;
  link.appendChild(badge);

  const body = document.createElement("div");
  body.className = "product-body";

  const top = document.createElement("div");
  top.className = "product-top";
  const chip = document.createElement("span");
  chip.className = "chip chip-" + catLower;
  chip.textContent = product.category;
  top.appendChild(chip);

  const title = document.createElement("h3");
  title.className = "product-title";
  const titleLink = document.createElement("a");
  titleLink.href = "product.html#" + product._id;
  titleLink.textContent = product.title;
  title.appendChild(titleLink);

  const meta = document.createElement("div");
  meta.className = "product-meta";
  meta.textContent = product.location;

  const price = document.createElement("div");
  price.className = "product-price";
  price.textContent = formatPrice(product.price);

  body.appendChild(top);
  body.appendChild(title);
  body.appendChild(meta);
  body.appendChild(price);

  article.appendChild(link);
  article.appendChild(body);
  return article;
}

async function loadProducts() {
  grid.textContent = "";
  noResults.hidden = true;

  const loading = document.createElement("p");
  loading.className = "loading-text";
  loading.textContent = "Loading products...";
  loading.style.cssText = "grid-column:1/-1;text-align:center;padding:2rem;color:var(--slate-500);";
  grid.appendChild(loading);

  const qs = buildQueryString();
  const data = await api("/products" + (qs ? "?" + qs : ""));

  grid.textContent = "";

  if (!data.status) {
    const err = document.createElement("p");
    err.style.cssText = "grid-column:1/-1;text-align:center;padding:2rem;color:var(--danger);";
    err.textContent = data.message || "Failed to load products.";
    grid.appendChild(err);
    return;
  }

  if (!data.products || data.products.length === 0) {
    noResults.hidden = false;
    return;
  }

  data.products.forEach((p) => grid.appendChild(createProductCard(p)));
}

filterBar.addEventListener("submit", (e) => {
  e.preventDefault();
  const qs = buildQueryString();
  window.history.replaceState(null, "", qs ? "?" + qs : "index.html");
  loadProducts();
});

heroSearch.addEventListener("submit", (e) => {
  e.preventDefault();
  const search = document.getElementById("home-search").value.trim();
  searchInput.value = search;
  const qs = buildQueryString();
  window.history.replaceState(null, "", qs ? "?" + qs : "index.html");
  document.getElementById("featured").scrollIntoView({ behavior: "smooth" });
  loadProducts();
});

loadProducts();
