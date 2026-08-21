const isProd = window.location.hostname === "vendio-marketplace.vercel.app";
const API_BASE = isProd
  ? "https://api-vendio-marketplace.vercel.app/api"
  : "http://localhost:5000/api";

export function getToken() {
  return localStorage.getItem("vendio_token");
}

export function setToken(token) {
  localStorage.setItem("vendio_token", token);
}

export function removeToken() {
  localStorage.removeItem("vendio_token");
}

export function getUser() {
  const raw = localStorage.getItem("vendio_user");
  return raw ? JSON.parse(raw) : null;
}

export function setUser(user) {
  localStorage.setItem("vendio_user", JSON.stringify(user));
}

export function removeUser() {
  localStorage.removeItem("vendio_user");
}

export function isLoggedIn() {
  return !!getToken();
}

export async function api(path, options = {}) {
  const { method = "GET", body, headers = {} } = options;

  const config = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  };

  const token = getToken();
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }

  if (body) {
    config.body = JSON.stringify(body);
  }

  try {
    const res = await fetch(`${API_BASE}${path}`, config);
    return await res.json();
  } catch {
    return { status: false, message: "Network error. Please check your connection and try again." };
  }
}

export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
