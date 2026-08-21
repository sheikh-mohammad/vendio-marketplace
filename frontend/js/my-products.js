import { api } from "./api.js";
import { requireAuth, updateHeader } from "./auth.js";

requireAuth();
updateHeader();

const listCard = document.querySelector(".list-card");
const statNum = document.querySelector(".stat-num");

function formatPrice(price) {
  return "$" + Number(price).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function parseSvg(svgString) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgString, "image/svg+xml");
  return document.importNode(doc.documentElement, true);
}

function setSvg(el, svgString) {
  el.textContent = "";
  el.appendChild(parseSvg(svgString));
}

const ICON_EDIT = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/></svg>';
const ICON_VIEW = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.06 12.35a1 1 0 0 1 0-.7 10.75 10.75 0 0 1 19.88 0 1 1 0 0 1 0 .7 10.75 10.75 0 0 1-19.88 0"/><circle cx="12" cy="12" r="3"/></svg>';
const ICON_DELETE = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>';
const ICON_EMPTY = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>';

function createListRow(product) {
  const catLower = (product.category || "other").toLowerCase();
  const condBadge = product.condition === "New" ? "badge-new" : "badge-used";

  const row = document.createElement("div");
  row.className = "list-row";

  const thumb = document.createElement("a");
  thumb.className = "list-thumb";
  thumb.href = "product.html?id=" + product._id;
  const img = document.createElement("img");
  img.src = product.image;
  img.alt = product.title;
  img.width = 92;
  img.height = 72;
  thumb.appendChild(img);

  const info = document.createElement("div");
  info.className = "list-info";
  const title = document.createElement("h3");
  title.className = "list-title";
  const titleLink = document.createElement("a");
  titleLink.href = "product.html?id=" + product._id;
  titleLink.textContent = product.title;
  title.appendChild(titleLink);

  const meta = document.createElement("div");
  meta.className = "list-meta";
  const chip = document.createElement("span");
  chip.className = "chip chip-" + catLower;
  chip.textContent = product.category;
  const badge = document.createElement("span");
  badge.className = "badge " + condBadge;
  badge.textContent = product.condition;
  const loc = document.createElement("span");
  loc.textContent = product.location;
  const date = document.createElement("span");
  date.textContent = "Posted " + formatDate(product.createdAt);
  meta.appendChild(chip);
  meta.appendChild(badge);
  meta.appendChild(loc);
  meta.appendChild(date);

  info.appendChild(title);
  info.appendChild(meta);

  const price = document.createElement("div");
  price.className = "list-price";
  price.textContent = formatPrice(product.price);

  const actions = document.createElement("div");
  actions.className = "list-actions";

  const editBtn = document.createElement("a");
  editBtn.className = "icon-btn icon-btn-sm icon-btn-edit";
  editBtn.href = "edit-product.html?id=" + product._id;
  editBtn.setAttribute("aria-label", "Edit " + product.title);
  setSvg(editBtn, ICON_EDIT);

  const viewBtn = document.createElement("a");
  viewBtn.className = "icon-btn icon-btn-sm";
  viewBtn.href = "product.html?id=" + product._id;
  viewBtn.setAttribute("aria-label", "View " + product.title);
  setSvg(viewBtn, ICON_VIEW);

  const delBtn = document.createElement("button");
  delBtn.className = "icon-btn icon-btn-sm icon-btn-del";
  delBtn.type = "button";
  delBtn.setAttribute("aria-label", "Delete " + product.title);
  setSvg(delBtn, ICON_DELETE);

  delBtn.addEventListener("click", async () => {
    if (!confirm("Are you sure you want to delete \"" + product.title + "\"?")) return;
    const data = await api("/products/" + product._id, { method: "DELETE" });
    if (data.status) {
      row.remove();
      const remaining = document.querySelectorAll(".list-row");
      if (statNum) statNum.textContent = remaining.length;
      if (remaining.length === 0) showEmpty();
    } else {
      alert(data.message || "Failed to delete product.");
    }
  });

  actions.appendChild(editBtn);
  actions.appendChild(viewBtn);
  actions.appendChild(delBtn);

  row.appendChild(thumb);
  row.appendChild(info);
  row.appendChild(price);
  row.appendChild(actions);
  return row;
}

function showEmpty() {
  listCard.textContent = "";
  listCard.style.display = "none";

  const empty = document.createElement("div");
  empty.className = "empty-state mt-3";

  const iconWrap = document.createElement("span");
  iconWrap.className = "empty-icon";
  iconWrap.setAttribute("aria-hidden", "true");
  setSvg(iconWrap, ICON_EMPTY);
  empty.appendChild(iconWrap);

  const h2 = document.createElement("h2");
  h2.textContent = "No listings yet";
  const p = document.createElement("p");
  p.textContent = "You haven't posted anything yet. List your first item and start selling today.";
  const btn = document.createElement("a");
  btn.className = "btn btn-primary";
  btn.href = "add-product.html";
  btn.textContent = "Post your first listing";
  empty.appendChild(h2);
  empty.appendChild(p);
  empty.appendChild(btn);
  listCard.parentNode.insertBefore(empty, listCard.nextSibling);
}

async function loadMyProducts() {
  listCard.textContent = "";

  const loading = document.createElement("p");
  loading.textContent = "Loading your products...";
  loading.style.cssText = "text-align:center;padding:2rem;color:var(--slate-500);";
  listCard.appendChild(loading);

  const data = await api("/products/my");

  listCard.textContent = "";

  if (!data.status) {
    const err = document.createElement("p");
    err.style.cssText = "text-align:center;padding:2rem;color:var(--danger);";
    err.textContent = data.message || "Failed to load products.";
    listCard.appendChild(err);
    return;
  }

  if (statNum) statNum.textContent = data.count;

  if (!data.products || data.products.length === 0) {
    showEmpty();
    return;
  }

  data.products.forEach((p) => listCard.appendChild(createListRow(p)));
}

loadMyProducts();
