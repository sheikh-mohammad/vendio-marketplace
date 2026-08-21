import { api } from "./api.js";
import { updateHeader, setButtonLoading, showFormMessage } from "./auth.js";

updateHeader();

const email = sessionStorage.getItem("vendio_reset_email");
if (!email) {
  window.location.href = "forgot-password.html";
}

const maskedEmail = email
  ? email.replace(/^(.)(.*)(@.*)$/, (_, a, b, c) => a + "*".repeat(b.length) + c)
  : "";

const desc = document.querySelector(".auth-head p");
if (desc && maskedEmail) {
  desc.textContent = `We sent a 6-digit code to ${maskedEmail}. Enter it below to verify it's you.`;
}

const form = document.querySelector("form");
const otpInputs = Array.from(document.querySelectorAll(".otp"));
const submitBtn = form.querySelector('button[type="submit"]');

otpInputs.forEach((input, i) => {
  input.addEventListener("input", () => {
    input.value = input.value.replace(/\D/g, "");
    if (input.value && i < otpInputs.length - 1) {
      otpInputs[i + 1].focus();
    }
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Backspace" && !input.value && i > 0) {
      otpInputs[i - 1].focus();
    }
  });

  input.addEventListener("paste", (e) => {
    e.preventDefault();
    const pasted = (e.clipboardData.getData("text") || "").replace(/\D/g, "").slice(0, 6);
    pasted.split("").forEach((ch, j) => {
      if (otpInputs[j]) otpInputs[j].value = ch;
    });
    const focusIdx = Math.min(pasted.length, otpInputs.length - 1);
    otpInputs[focusIdx].focus();
  });
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const otp = otpInputs.map((i) => i.value).join("");

  if (otp.length !== 6) {
    showFormMessage(form, "Please enter all 6 digits of the code.", true);
    return;
  }

  setButtonLoading(submitBtn, true);

  const data = await api("/auth/verify-otp", {
    method: "POST",
    body: { email, otp },
  });

  setButtonLoading(submitBtn, false, "Verify code");

  if (!data.status) {
    showFormMessage(form, data.message, true);
    return;
  }

  window.location.href = "reset-password.html";
});
