ensureAuth();
bindLogout();

const userForm = document.getElementById("userForm");
const profileForm = document.getElementById("profileForm");
const userMessage = document.getElementById("userMessage");
const profileMessage = document.getElementById("profileMessage");
const profilePreview = document.getElementById("profilePreview");

async function loadProfile() {
  try {
    const auth = await apiFetch("/auth/me");
    const username = auth.data.username;
    const user = await apiFetch("/users/me");
    const profile = await apiFetch(`/profiles/${username}`);

    userForm.email.value = user.data.user.email;
    profileForm.displayName.value = profile.data.displayName;
    profileForm.bio.value = profile.data.bio || "";
    profileForm.showEmail.checked = profile.data.privacy?.showEmail ?? false;

    profilePreview.innerHTML = `
      ${profile.data.avatarUrl ? `<img src="${profile.data.avatarUrl}" alt="avatar" />` : ""}
      <div><strong>${profile.data.displayName}</strong></div>
      <div>@${profile.data.username}</div>
    `;
  } catch (error) {
    profilePreview.textContent = error.message;
  }
}

userForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  userMessage.textContent = "";
  try {
    const payload = { email: userForm.email.value };
    await apiFetch("/users/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    userMessage.textContent = "Email updated";
  } catch (error) {
    userMessage.textContent = error.message;
  }
});

profileForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  profileMessage.textContent = "";
  try {
    const formData = new FormData(profileForm);
    formData.set(
      "privacy",
      JSON.stringify({ showEmail: profileForm.showEmail.checked })
    );
    await apiFetch("/profiles/me", {
      method: "PATCH",
      body: formData
    });
    profileMessage.textContent = "Profile updated";
    await loadProfile();
  } catch (error) {
    profileMessage.textContent = error.message;
  }
});

loadProfile();
