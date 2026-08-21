import { api } from "./api.js";
import { updateHeader, showError, clearAllErrors, setButtonLoading, showFormMessage } from "./auth.js";

updateHeader();

const form = document.querySelector("form");
const emailInput = document.getElementById("reset-email");
const emailError = document.getElementById("reset-email-error");
const submitBtn = form.querySelector('button[type="submit"]');

clearAllErrors(form);

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearAllErrors(form);

  const email = emailInput.value.trim();
  let valid = true;

  if (!email) {
    showError(emailError, "Please enter your email address.");
    valid = false;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showError(emailError, "Please enter a valid email address.");
    valid = false;
  }

  if (!valid) return;

  setButtonLoading(submitBtn, true);

  const data = await api("/auth/forgot-password", {
    method: "POST",
    body: { email },
  });

  setButtonLoading(submitBtn, false, "Send reset code");

  if (!data.status) {
    showFormMessage(form, data.message, true);
    return;
  }

  sessionStorage.setItem("vendio_reset_email", email);
  window.location.href = "otp-verification.html";
});
