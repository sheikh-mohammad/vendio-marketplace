import { api, setToken, setUser, isLoggedIn } from "./api.js";
import { updateHeader, showError, clearError, clearAllErrors, setButtonLoading, showFormMessage } from "./auth.js";

if (isLoggedIn()) {
  window.location.href = "index.html";
}

updateHeader();

const form = document.querySelector(".auth-main form");
const emailInput = document.getElementById("login-email");
const passwordInput = document.getElementById("login-password");
const emailError = document.getElementById("login-email-error");
const passwordError = document.getElementById("login-password-error");
const submitBtn = form.querySelector('button[type="submit"]');

clearAllErrors(form);

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearAllErrors(form);

  const email = emailInput.value.trim();
  const password = passwordInput.value;
  let valid = true;

  if (!email) {
    showError(emailError, "Please enter your email address.");
    valid = false;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showError(emailError, "Please enter a valid email address.");
    valid = false;
  }

  if (!password) {
    showError(passwordError, "Please enter your password.");
    valid = false;
  }

  if (!valid) return;

  setButtonLoading(submitBtn, true);

  const data = await api("/auth/login", {
    method: "POST",
    body: { email, password },
  });

  setButtonLoading(submitBtn, false, "Log in");

  if (!data.status) {
    showFormMessage(form, data.message, true);
    return;
  }

  setToken(data.token);
  setUser(data.user);
  window.location.href = "index.html";
});

const pwToggle = form.querySelector(".pw-toggle");
if (pwToggle) {
  pwToggle.addEventListener("click", () => {
    const isPassword = passwordInput.type === "password";
    passwordInput.type = isPassword ? "text" : "password";
    pwToggle.setAttribute("aria-label", isPassword ? "Hide password" : "Show password");
  });
}
