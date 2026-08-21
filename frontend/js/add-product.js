import { api, fileToBase64 } from "./api.js";
import { requireAuth, updateHeader, showError, clearAllErrors, setButtonLoading, showFormMessage } from "./auth.js";

requireAuth();
updateHeader();

const form = document.querySelector("form");
const imageInput = document.getElementById("product-image");
const titleInput = document.getElementById("p-title");
const categorySelect = document.getElementById("p-category");
const locationInput = document.getElementById("p-location");
const conditionRadios = document.querySelectorAll('input[name="condition"]');
const priceInput = document.getElementById("p-price");
const descInput = document.getElementById("p-desc");
const imageError = document.getElementById("image-error");
const titleError = document.getElementById("p-title-error");
const locationError = document.getElementById("p-location-error");
const priceError = document.getElementById("p-price-error");
const descError = document.getElementById("p-desc-error");
const submitBtn = form.querySelector('button[type="submit"]');
const dropzone = document.querySelector(".dropzone");

let imageBase64 = null;

clearAllErrors(form);

imageInput.addEventListener("change", () => {
  const file = imageInput.files[0];
  if (!file) return;

  if (file.size > 5 * 1024 * 1024) {
    showError(imageError, "Image must be under 5MB.");
    imageInput.value = "";
    return;
  }

  fileToBase64(file).then((data) => {
    imageBase64 = data;
    dropzone.classList.add("has-image");

    let preview = dropzone.querySelector(".dz-preview");
    if (!preview) {
      preview = document.createElement("img");
      preview.className = "dz-preview";
      preview.style.cssText = "width:100%;height:100%;object-fit:cover;border-radius:inherit;position:absolute;top:0;left:0;";
      dropzone.style.position = "relative";
      dropzone.appendChild(preview);
    }
    preview.src = data;
  });
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearAllErrors(form);

  const title = titleInput.value.trim();
  const category = categorySelect.value;
  const location = locationInput.value.trim();
  const condition = document.querySelector('input[name="condition"]:checked');
  const price = priceInput.value;
  const description = descInput.value.trim();
  let valid = true;

  if (!imageBase64) {
    showError(imageError, "A product image is required.");
    valid = false;
  }

  if (!title) {
    showError(titleError, "Please enter a product title.");
    valid = false;
  }

  if (!category) {
    showFormMessage(form, "Please select a category.", true);
    valid = false;
  }

  if (!location) {
    showError(locationError, "Please enter a location.");
    valid = false;
  }

  if (!condition) {
    showFormMessage(form, "Please select a condition (New or Used).", true);
    valid = false;
  }

  if (!price || Number(price) < 0) {
    showError(priceError, "Please enter a valid price.");
    valid = false;
  }

  if (!description) {
    showError(descError, "Please add a description.");
    valid = false;
  }

  if (!valid) return;

  setButtonLoading(submitBtn, true);

  const data = await api("/products", {
    method: "POST",
    body: {
      title,
      description,
      price: Number(price),
      category,
      condition: condition.value,
      location,
      image: imageBase64,
    },
  });

  setButtonLoading(submitBtn, false, "Publish listing");

  if (!data.status) {
    showFormMessage(form, data.message, true);
    return;
  }

  window.location.href = "my-products.html";
});
