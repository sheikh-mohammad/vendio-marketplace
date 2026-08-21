import { api, fileToBase64, getUser } from "./api.js";
import { requireAuth, updateHeader, setButtonLoading, showFormMessage } from "./auth.js";

requireAuth();
updateHeader();

const params = new URLSearchParams(window.location.search);
const productId = params.get("id");

if (!productId) {
  window.location.href = "my-products.html";
}

const form = document.querySelector("form");
const imageInput = document.getElementById("product-image");
const titleInput = document.getElementById("p-title");
const categorySelect = document.getElementById("p-category");
const locationInput = document.getElementById("p-location");
const priceInput = document.getElementById("p-price");
const descInput = document.getElementById("p-desc");
const submitBtn = form.querySelector('button[type="submit"]');
const deleteBtn = form.querySelector(".btn-danger");
const dropzone = document.querySelector(".dropzone");
const currentImg = dropzone.querySelector("img");

let newImageBase64 = null;
let currentImageUrl = "";

imageInput.addEventListener("change", () => {
  const file = imageInput.files[0];
  if (!file) return;

  if (file.size > 5 * 1024 * 1024) {
    showFormMessage(form, "Image must be under 5MB.", true);
    imageInput.value = "";
    return;
  }

  fileToBase64(file).then((data) => {
    newImageBase64 = data;
    if (currentImg) currentImg.src = data;
  });
});

async function loadProduct() {
  const data = await api("/products/" + productId);

  if (!data.status) {
    showFormMessage(form, data.message || "Product not found.", true);
    return;
  }

  const p = data.product;
  const user = getUser();

  if (user && p.seller && (p.seller._id !== user.id)) {
    showFormMessage(form, "You do not have permission to edit this product.", true);
    setTimeout(() => { window.location.href = "my-products.html"; }, 2000);
    return;
  }

  currentImageUrl = p.image;
  if (currentImg) {
    currentImg.src = p.image;
    currentImg.alt = "Current photo of " + p.title;
  }

  titleInput.value = p.title;
  categorySelect.value = p.category.toLowerCase();
  locationInput.value = p.location;
  priceInput.value = p.price;
  descInput.value = p.description;

  const condValue = p.condition.toLowerCase();
  const condRadio = document.querySelector('input[name="condition"][value="' + condValue + '"]');
  if (condRadio) condRadio.checked = true;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const title = titleInput.value.trim();
  const category = categorySelect.value;
  const location = locationInput.value.trim();
  const condition = document.querySelector('input[name="condition"]:checked');
  const price = priceInput.value;
  const description = descInput.value.trim();

  if (!title || !category || !location || !condition || !price || !description) {
    showFormMessage(form, "All fields are required.", true);
    return;
  }

  setButtonLoading(submitBtn, true);

  const body = {
    title,
    description,
    price: Number(price),
    category,
    condition: condition.value,
    location,
  };

  if (newImageBase64) {
    body.image = newImageBase64;
  }

  const data = await api("/products/" + productId, {
    method: "PUT",
    body,
  });

  setButtonLoading(submitBtn, false, "Save changes");

  if (!data.status) {
    showFormMessage(form, data.message, true);
    return;
  }

  window.location.href = "my-products.html";
});

deleteBtn.addEventListener("click", async () => {
  if (!confirm("Are you sure you want to delete this product? This cannot be undone.")) return;

  const data = await api("/products/" + productId, { method: "DELETE" });

  if (!data.status) {
    showFormMessage(form, data.message || "Failed to delete product.", true);
    return;
  }

  window.location.href = "my-products.html";
});

loadProduct();
