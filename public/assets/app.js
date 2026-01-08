const tokenKey = "token";

function setToken(token) {
  localStorage.setItem(tokenKey, token);
}

function getToken() {
  return localStorage.getItem(tokenKey);
}

function clearToken() {
  localStorage.removeItem(tokenKey);
}

async function apiFetch(path, options = {}) {
  const headers = new Headers(options.headers || {});
  const token = getToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(path, { ...options, headers });
  const data = await response.json().catch(() => ({ success: false, message: "Invalid response" }));
  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }
  return data;
}

function ensureAuth() {
  if (!getToken()) {
    window.location.href = "/";
  }
}

function bindLogout() {
  const button = document.getElementById("logoutBtn");
  if (button) {
    button.addEventListener("click", () => {
      clearToken();
      window.location.href = "/";
    });
  }
}
