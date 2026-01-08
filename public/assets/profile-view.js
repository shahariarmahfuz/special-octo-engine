ensureAuth();
bindLogout();

const profileCard = document.getElementById("profileCard");
const username = window.location.pathname.split("/").pop();

async function loadProfile() {
  if (!username || !profileCard) {
    return;
  }
  try {
    const response = await apiFetch(`/profiles/${username}`);
    const profile = response.data;
    profileCard.innerHTML = `
      <div class="profile-preview">
        ${profile.avatarUrl ? `<img src="${profile.avatarUrl}" alt="avatar" />` : ""}
        <div><strong>${profile.displayName}</strong></div>
        <div>@${profile.username}</div>
        <div>${profile.bio || "No bio yet."}</div>
      </div>
    `;
  } catch (error) {
    profileCard.innerHTML = `<div class="form-message">${error.message}</div>`;
  }
}

loadProfile();
