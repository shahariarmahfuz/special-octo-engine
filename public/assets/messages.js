ensureAuth();
bindLogout();

const chatList = document.getElementById("chatList");
const friendStories = document.getElementById("friendStories");
const friendSearch = document.getElementById("friendSearch");
const searchResults = document.getElementById("searchResults");

let currentUserId = null;
const userCache = new Map();
const socket = io({
  auth: { token: getToken() }
});
const friendStateKey = "friendState";
let friendProfiles = [];

socket.on("connect_error", () => {
  // ignore socket errors on list page
});

async function loadCurrentUser() {
  const response = await apiFetch("/auth/me");
  currentUserId = response.data?.id || response.data?.userId || response.data?.user?.id || null;
}

async function loadChats() {
  try {
    const response = await apiFetch("/chats");
    const chats = response.data || [];
    chatList.innerHTML = "";
    if (!chats.length) {
      chatList.innerHTML = "<li class=\"thread-item\">No chats yet</li>";
      return;
    }
    for (const chat of chats) {
      const otherId = chat.participantIds.find((id) => id !== currentUserId) || chat.participantIds[0];
      const other = await getUser(otherId);
      const label = other?.profile?.displayName || `Chat ${chat.id}`;
      const preview = other?.profile?.username ? `@${other.profile.username}` : "Tap to open";
      const avatar = renderThreadAvatar(other?.profile, label);
      const item = document.createElement("li");
      item.className = "thread-item";
      item.innerHTML = `
        <div class="thread-avatar-wrap">
          ${avatar}
          <div class="online-dot"></div>
        </div>
        <div class="thread-main">
          <div class="thread-row1">
            <span class="thread-name">${label}</span>
            <span class="thread-time">${new Date(chat.createdAt).toLocaleDateString()}</span>
          </div>
          <div class="thread-row2">
            <span class="thread-preview">${preview}</span>
          </div>
        </div>
      `;
      item.addEventListener("click", () => {
        window.location.href = `/chat?chatId=${chat.id}`;
      });
      chatList.appendChild(item);
    }
  } catch (error) {
    chatList.innerHTML = `<li class=\"thread-item\">${error.message}</li>`;
  }
}

function renderThreadAvatar(profile, name) {
  if (profile?.avatarUrl) {
    return `<div class=\"thread-avatar-photo\"><img src=\"${profile.avatarUrl}\" alt=\"${name}\" /></div>`;
  }
  return `<div class=\"thread-avatar-photo\"><div class=\"thread-avatar-inner\">${name.charAt(0).toUpperCase()}</div></div>`;
}

function renderStory(profile) {
  const name = profile.displayName || profile.username || "User";
  const photo = profile.avatarUrl
    ? `<img src=\"${profile.avatarUrl}\" alt=\"${name}\" />`
    : `<div class=\"avatar-photo-inner\">${name.charAt(0).toUpperCase()}</div>`;
  return `
    <div class="story-avatar">
      <div class="avatar-wrap">
        <div class="avatar-photo">${photo}</div>
        <div class="online-dot"></div>
      </div>
      <span>${name}</span>
    </div>
  `;
}

async function getUser(userId) {
  if (!userId) {
    return null;
  }
  if (userCache.has(userId)) {
    return userCache.get(userId);
  }
  const response = await apiFetch(`/users/${userId}`);
  userCache.set(userId, response.data);
  return response.data;
}

function loadFriendState() {
  try {
    const raw = localStorage.getItem(friendStateKey);
    return raw ? JSON.parse(raw) : { friends: [] };
  } catch (error) {
    return { friends: [] };
  }
}

async function loadFriendStories() {
  if (!friendStories) {
    return;
  }
  const state = loadFriendState();
  if (!state.friends?.length) {
    friendStories.innerHTML = "<div class=\"notice\">No friends yet.</div>";
    return;
  }
  friendStories.innerHTML = "";
  const profiles = [];
  for (const id of state.friends) {
    const user = await getUser(id);
    if (user?.profile) {
      profiles.push(user.profile);
      friendStories.insertAdjacentHTML("beforeend", renderStory(user.profile));
    }
  }
  friendProfiles = profiles;
}

function renderSearchResults(results) {
  if (!searchResults) {
    return;
  }
  if (!results.length) {
    searchResults.innerHTML = "";
    return;
  }
  searchResults.innerHTML = results
    .map((profile) => {
      const name = profile.displayName || profile.username || "User";
      const avatar = profile.avatarUrl
        ? `<div class=\"thread-avatar-photo\"><img src=\"${profile.avatarUrl}\" alt=\"${name}\" /></div>`
        : `<div class=\"thread-avatar-photo\"><div class=\"thread-avatar-inner\">${name.charAt(0).toUpperCase()}</div></div>`;
      return `
        <div class="thread-item" data-username="${profile.username}">
          <div class="thread-avatar-wrap">
            ${avatar}
            <div class="online-dot"></div>
          </div>
          <div class="thread-main">
            <div class="thread-row1">
              <span class="thread-name">${name}</span>
            </div>
            <div class="thread-row2">
              <span class="thread-preview">@${profile.username}</span>
            </div>
          </div>
        </div>
      `;
    })
    .join("");

  searchResults.querySelectorAll(".thread-item").forEach((item) => {
    item.addEventListener("click", async () => {
      const username = item.dataset.username;
      if (username) {
        await startChatWithUsername(username);
      }
    });
  });
}

async function startChatWithUsername(username) {
  const response = await apiFetch("/chats/dm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username })
  });
  window.location.href = `/chat?chatId=${response.data.id}`;
}

friendSearch?.addEventListener("input", (event) => {
  const term = event.target.value.trim().toLowerCase();
  if (!term) {
    renderSearchResults([]);
    return;
  }
  const results = friendProfiles.filter((profile) => {
    const name = `${profile.displayName || ""} ${profile.username || ""}`.toLowerCase();
    return name.includes(term);
  });
  renderSearchResults(results);
});

async function init() {
  await loadCurrentUser();
  await loadChats();
  await loadFriendStories();
}

init();
