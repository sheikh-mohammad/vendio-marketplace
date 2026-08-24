import { api, getUser } from "./api.js";
import { updateHeader } from "./auth.js";

updateHeader();

const params = new URLSearchParams(window.location.search);
const productId = params.get("id");

function formatPrice(price) {
  return "$" + Number(price).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function timeAgo(dateStr) {
  const now = new Date();
  const then = new Date(dateStr);
  const diffMs = now - then;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "1 day ago";
  return diffDays + " days ago";
}

async function loadProduct() {
  if (!productId) {
    document.querySelector("main").textContent = "No product ID specified.";
    return;
  }

  const data = await api("/products/" + productId);

  if (!data.status) {
    document.querySelector("main").textContent = data.message || "Product not found.";
    return;
  }

  const p = data.product;
  const catLower = (p.category || "other").toLowerCase();

  document.title = p.title + " · " + formatPrice(p.price) + " — Vendio";

  const mainImg = document.querySelector(".main-img img");
  if (mainImg) {
    mainImg.src = p.image;
    mainImg.alt = p.title + " — main photo";
  }

  const thumbs = document.querySelector(".thumbs");
  if (thumbs) {
    thumbs.textContent = "";
    const img = document.createElement("img");
    img.className = "is-active";
    img.src = p.image;
    img.alt = p.title;
    img.setAttribute("role", "listitem");
    thumbs.appendChild(img);
  }

  const breadcrumb = document.querySelector(".breadcrumb");
  if (breadcrumb) {
    breadcrumb.textContent = "";
    const home = document.createElement("a");
    home.href = "index.html";
    home.textContent = "Home";
    breadcrumb.appendChild(home);

    const sep1 = document.createElement("span");
    sep1.textContent = " › ";
    breadcrumb.appendChild(sep1);

    const catLink = document.createElement("a");
    catLink.href = "index.html?category=" + catLower;
    catLink.textContent = p.category;
    breadcrumb.appendChild(catLink);

    const sep2 = document.createElement("span");
    sep2.textContent = " › ";
    breadcrumb.appendChild(sep2);

    const current = document.createElement("span");
    current.className = "current";
    current.textContent = p.title;
    breadcrumb.appendChild(current);
  }

  const chipEl = document.querySelector(".detail-info-card .chip");
  if (chipEl) {
    chipEl.className = "chip chip-" + catLower;
    chipEl.textContent = p.category;
  }

  const badgeEl = document.querySelector(".detail-info-card .badge");
  if (badgeEl) {
    badgeEl.className = "badge " + (p.condition === "New" ? "badge-new" : "badge-used");
    badgeEl.textContent = p.condition;
  }

  const h1 = document.querySelector(".detail-info-card h1");
  if (h1) h1.textContent = p.title;

  const priceEl = document.querySelector(".detail-price");
  if (priceEl) priceEl.textContent = formatPrice(p.price);

  const metaItems = document.querySelectorAll(".detail-meta .meta-item");
  if (metaItems[0]) {
    metaItems[0].textContent = p.location;
  }
  if (metaItems[1]) {
    metaItems[1].textContent = "Posted " + timeAgo(p.createdAt);
  }

  const descCard = document.querySelector(".desc-card");
  if (descCard) {
    const descH2 = descCard.querySelector("h2");
    descCard.textContent = "";
    if (descH2) descCard.appendChild(descH2);

    const descP = document.createElement("p");
    descP.textContent = p.description;
    descCard.appendChild(descP);

    const dl = document.createElement("dl");
    dl.className = "spec-list";

    const specs = [
      ["Condition", p.condition],
      ["Category", p.category],
      ["Location", p.location],
      ["Posted", new Date(p.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })],
    ];

    specs.forEach(([key, val]) => {
      const row = document.createElement("div");
      row.className = "spec-row";
      const dt = document.createElement("dt");
      dt.textContent = key;
      const dd = document.createElement("dd");
      dd.textContent = val;
      row.appendChild(dt);
      row.appendChild(dd);
      dl.appendChild(row);
    });

    descCard.appendChild(dl);
  }

  if (p.seller) {
    const sellerName = p.seller.name || "Unknown";
    const sellerInitial = sellerName.charAt(0).toUpperCase();

    const sellerAvatar = document.querySelector(".seller-avatar");
    if (sellerAvatar) sellerAvatar.textContent = sellerInitial;

    const sellerH3 = document.querySelector(".seller-info h3");
    if (sellerH3) sellerH3.textContent = sellerName;

    const contactBtn = document.getElementById("contact-seller-btn");
    if (contactBtn && p.seller.email) {
      const subject = encodeURIComponent("Vendio inquiry: " + p.title);
      const body = encodeURIComponent(
        "Hi " + sellerName + ",\n\nI'm interested in your listing \"" + p.title +
        "\" (" + formatPrice(p.price) + ") on Vendio.\n\nIs it still available?\n\nThanks!"
      );
      contactBtn.href = "mailto:" + p.seller.email + "?subject=" + subject + "&body=" + body;
    } else if (contactBtn) {
      contactBtn.setAttribute("aria-disabled", "true");
    }
  }

  loadSimilar(p.category, p._id);
}

async function loadSimilar(category, currentId) {
  const data = await api("/products?category=" + category.toLowerCase());
  if (!data.status || !data.products) return;

  const similar = data.products.filter((item) => item._id !== currentId).slice(0, 4);
  const similarGrid = document.querySelectorAll(".products-grid")[0];
  if (!similarGrid || similar.length === 0) return;

  similarGrid.textContent = "";

  similar.forEach((item) => {
    const catLower = (item.category || "other").toLowerCase();
    const article = document.createElement("article");
    article.className = "product-card";

    const link = document.createElement("a");
    link.className = "product-media";
    link.href = "product.html?id=" + item._id;

    const img = document.createElement("img");
    img.src = item.image;
    img.alt = item.title;
    img.loading = "lazy";
    img.width = 640;
    img.height = 480;
    link.appendChild(img);

    const badge = document.createElement("span");
    badge.className = "badge " + (item.condition === "New" ? "badge-new" : "badge-used");
    badge.textContent = item.condition;
    link.appendChild(badge);

    const body = document.createElement("div");
    body.className = "product-body";

    const top = document.createElement("div");
    top.className = "product-top";
    const chip = document.createElement("span");
    chip.className = "chip chip-" + catLower;
    chip.textContent = item.category;
    top.appendChild(chip);

    const title = document.createElement("h3");
    title.className = "product-title";
    const titleLink = document.createElement("a");
    titleLink.href = "product.html?id=" + item._id;
    titleLink.textContent = item.title;
    title.appendChild(titleLink);

    const meta = document.createElement("div");
    meta.className = "product-meta";
    meta.textContent = item.location;

    const price = document.createElement("div");
    price.className = "product-price";
    price.textContent = formatPrice(item.price);

    body.appendChild(top);
    body.appendChild(title);
    body.appendChild(meta);
    body.appendChild(price);

    article.appendChild(link);
    article.appendChild(body);
    similarGrid.appendChild(article);
  });
}

loadProduct();
