import { getToken, getUser, removeToken, removeUser, isLoggedIn, api } from "./api.js";

export function requireAuth() {
  if (!isLoggedIn()) {
    window.location.href = "login.html";
  }
}

export function updateHeader() {
  const navCta = document.querySelector(".nav-cta");
  if (!navCta) return;

  navCta.innerHTML = "";

  if (isLoggedIn()) {
    const user = getUser();
    const firstName = user ? user.name.split(" ")[0] : "User";
    const initial = user ? user.name.charAt(0).toUpperCase() : "U";

    const chip = document.createElement("a");
    chip.className = "user-chip";
    chip.href = "my-products.html";

    const avatar = document.createElement("span");
    avatar.className = "user-avatar";
    avatar.setAttribute("aria-hidden", "true");
    avatar.textContent = initial;
    chip.appendChild(avatar);
    chip.appendChild(document.createTextNode(" " + firstName));
    navCta.appendChild(chip);

    const logoutLink = document.createElement("a");
    logoutLink.className = "btn btn-ghost btn-sm logout-btn";
    logoutLink.href = "#";
    logoutLink.setAttribute("aria-label", "Log out");
    logoutLink.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/></svg>';
    logoutLink.appendChild(document.createTextNode(" Log out"));
    navCta.appendChild(logoutLink);

    setupLogout();
  } else {
    const loginBtn = document.createElement("a");
    loginBtn.className = "btn btn-ghost btn-sm";
    loginBtn.href = "login.html";
    loginBtn.textContent = "Log in";
    navCta.appendChild(loginBtn);

    const signupBtn = document.createElement("a");
    signupBtn.className = "btn btn-primary btn-sm";
    signupBtn.href = "signup.html";
    signupBtn.textContent = "Get started";
    navCta.appendChild(signupBtn);
  }
}

export function setupLogout() {
  const logoutBtn = document.querySelector(".logout-btn");
  if (!logoutBtn) return;

  logoutBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    await api("/auth/logout", { method: "POST" });
    removeToken();
    removeUser();
    window.location.href = "login.html";
  });
}

export function showError(el, message) {
  if (el) {
    el.textContent = message;
    el.style.display = "block";
  }
}

export function clearError(el) {
  if (el) {
    el.textContent = "";
    el.style.display = "none";
  }
}

export function clearAllErrors(container) {
  if (!container) return;
  container.querySelectorAll(".field-error").forEach((el) => clearError(el));
}

export function setButtonLoading(btn, loading, originalText) {
  if (loading) {
    btn.disabled = true;
    btn.dataset.originalText = btn.textContent;
    btn.textContent = "Please wait...";
  } else {
    btn.disabled = false;
    btn.textContent = originalText || btn.dataset.originalText || "Submit";
  }
}

export function showFormMessage(form, message, isError = false) {
  let msgEl = form.querySelector(".form-message");
  if (!msgEl) {
    msgEl = document.createElement("div");
    msgEl.className = "form-message";
    msgEl.style.cssText = "padding:0.75rem 1rem;border-radius:0.5rem;margin-bottom:1rem;font-size:0.875rem;";
    form.prepend(msgEl);
  }
  msgEl.textContent = message;
  msgEl.style.background = isError ? "#fef2f2" : "#f0fdf4";
  msgEl.style.color = isError ? "#991b1b" : "#166534";
  msgEl.style.border = isError ? "1px solid #fecaca" : "1px solid #bbf7d0";
}
