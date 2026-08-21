import { api } from "./api.js";
import { updateHeader, showError, clearAllErrors, setButtonLoading, showFormMessage } from "./auth.js";

updateHeader();

const email = sessionStorage.getItem("vendio_reset_email");
if (!email) {
  window.location.href = "forgot-password.html";
}

const form = document.querySelector("form");
const passwordInput = document.getElementById("new-password");
const confirmInput = document.getElementById("confirm-password");
const passwordError = document.getElementById("new-password-error");
const confirmError = document.getElementById("confirm-password-error");
const submitBtn = form.querySelector('button[type="submit"]');

clearAllErrors(form);

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearAllErrors(form);

  const newPassword = passwordInput.value;
  const confirmPassword = confirmInput.value;
  let valid = true;

  if (!newPassword) {
    showError(passwordError, "Please enter a new password.");
    valid = false;
  } else if (newPassword.length < 8) {
    showError(passwordError, "Password must be at least 8 characters.");
    valid = false;
  }

  if (!confirmPassword) {
    showError(confirmError, "Please confirm your new password.");
    valid = false;
  } else if (newPassword !== confirmPassword) {
    showError(confirmError, "Passwords do not match.");
    valid = false;
  }

  if (!valid) return;

  setButtonLoading(submitBtn, true);

  const data = await api("/auth/reset-password", {
    method: "POST",
    body: { email, newPassword, confirmPassword },
  });

  setButtonLoading(submitBtn, false, "Update password");

  if (!data.status) {
    showFormMessage(form, data.message, true);
    return;
  }

  sessionStorage.removeItem("vendio_reset_email");
  showFormMessage(form, "Password updated successfully! Redirecting to login...", false);
  setTimeout(() => {
    window.location.href = "login.html";
  }, 1500);
});

form.querySelectorAll(".pw-toggle").forEach((toggle) => {
  toggle.addEventListener("click", () => {
    const input = toggle.closest(".pw-wrap").querySelector("input");
    const isPassword = input.type === "password";
    input.type = isPassword ? "text" : "password";
    toggle.setAttribute("aria-label", isPassword ? "Hide password" : "Show password");
  });
});
