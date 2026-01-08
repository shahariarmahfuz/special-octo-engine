const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");
const loginMessage = document.getElementById("loginMessage");
const signupMessage = document.getElementById("signupMessage");

if (getToken()) {
  window.location.href = "/feed";
}

loginForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  loginMessage.textContent = "";
  const formData = new FormData(loginForm);
  try {
    const payload = Object.fromEntries(formData.entries());
    const response = await apiFetch("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    setToken(response.data.token);
    window.location.href = "/feed";
  } catch (error) {
    loginMessage.textContent = error.message;
  }
});

signupForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  signupMessage.textContent = "";
  const formData = new FormData(signupForm);
  try {
    const payload = Object.fromEntries(formData.entries());
    const response = await apiFetch("/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    setToken(response.data.token);
    window.location.href = "/feed";
  } catch (error) {
    signupMessage.textContent = error.message;
  }
});
