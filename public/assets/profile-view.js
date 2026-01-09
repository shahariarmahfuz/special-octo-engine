ensureAuth();
bindLogout();

const publicProfile = document.getElementById("publicProfile");
const messageUser = document.getElementById("messageUser");
const username = window.location.pathname.split("/").pop();

async function loadProfile() {
  if (!username || !publicProfile) {
    return;
  }
  try {
    const response = await apiFetch(`/profiles/${username}`);
    const profile = response.data;
    publicProfile.innerHTML = `
      <div class="profile-preview">
        ${profile.avatarUrl ? `<img src="${profile.avatarUrl}" alt="avatar" />` : ""}
        <div><strong>${profile.displayName}</strong></div>
        <div>@${profile.username}</div>
        <div>${profile.bio || "No bio yet."}</div>
      </div>
    `;
    if (messageUser) {
      messageUser.href = `/messages?user=${profile.username}`;
    }
  } catch (error) {
    publicProfile.innerHTML = `<div class="form-message">${error.message}</div>`;
  }
}

loadProfile();
