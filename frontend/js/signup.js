import { api, setToken, setUser, isLoggedIn } from "./api.js";
import { updateHeader, showError, clearAllErrors, setButtonLoading, showFormMessage } from "./auth.js";

if (isLoggedIn()) {
  window.location.href = "index.html";
}

updateHeader();

const form = document.querySelector(".auth-main form");
const nameInput = document.getElementById("signup-name");
const emailInput = document.getElementById("signup-email");
const passwordInput = document.getElementById("signup-password");
const confirmInput = document.getElementById("signup-confirm");
const termsCheckbox = document.getElementById("terms");
const nameError = document.getElementById("signup-name-error");
const emailError = document.getElementById("signup-email-error");
const passwordError = document.getElementById("signup-password-error");
const confirmError = document.getElementById("signup-confirm-error");
const submitBtn = form.querySelector('button[type="submit"]');

clearAllErrors(form);

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearAllErrors(form);

  const name = nameInput.value.trim();
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  const confirm = confirmInput.value;
  let valid = true;

  if (!name) {
    showError(nameError, "Please enter your full name.");
    valid = false;
  }

  if (!email) {
    showError(emailError, "Please enter your email address.");
    valid = false;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showError(emailError, "Please enter a valid email address.");
    valid = false;
  }

  if (!password) {
    showError(passwordError, "Please enter a password.");
    valid = false;
  } else if (password.length < 8) {
    showError(passwordError, "Password must be at least 8 characters.");
    valid = false;
  }

  if (!confirm) {
    showError(confirmError, "Please confirm your password.");
    valid = false;
  } else if (password !== confirm) {
    showError(confirmError, "Passwords do not match.");
    valid = false;
  }

  if (!termsCheckbox.checked) {
    showFormMessage(form, "Please agree to the Terms of Service and Privacy Policy.", true);
    valid = false;
  }

  if (!valid) return;

  setButtonLoading(submitBtn, true);

  const data = await api("/auth/signup", {
    method: "POST",
    body: { name, email, password, confirmPassword: confirm },
  });

  setButtonLoading(submitBtn, false, "Create account");

  if (!data.status) {
    showFormMessage(form, data.message, true);
    return;
  }

  setToken(data.token);
  setUser(data.user);
  window.location.href = "index.html";
});

form.querySelectorAll(".pw-toggle").forEach((toggle) => {
  toggle.addEventListener("click", () => {
    const input = toggle.closest(".pw-wrap").querySelector("input");
    const isPassword = input.type === "password";
    input.type = isPassword ? "text" : "password";
    toggle.setAttribute("aria-label", isPassword ? "Hide password" : "Show password");
  });
});
