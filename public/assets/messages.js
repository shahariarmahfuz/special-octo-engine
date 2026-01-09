ensureAuth();
bindLogout();

const dmForm = document.getElementById("dmForm");
const dmMessage = document.getElementById("dmMessage");
const chatList = document.getElementById("chatList");
const chatHeader = document.getElementById("chatHeader");
const chatMessages = document.getElementById("chatMessages");
const messageForm = document.getElementById("messageForm");
const messageMessage = document.getElementById("messageMessage");
const friendStories = document.getElementById("friendStories");
const friendSearch = document.getElementById("friendSearch");
const searchResults = document.getElementById("searchResults");

let activeChatId = null;
let currentUserId = null;
const userCache = new Map();
const socket = io({
  auth: { token: getToken() }
});
const queryUser = new URLSearchParams(window.location.search).get("user");
const friendStateKey = "friendState";
let friendProfiles = [];

socket.on("dm:message:new", async (message) => {
  if (message.chatId === activeChatId) {
    const sender = await getUser(message.senderId);
    appendMessage(message, sender);
  }
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
      item.addEventListener("click", async () => {
        document.querySelectorAll(".thread-item").forEach((el) => el.classList.remove("active"));
        item.classList.add("active");
        activeChatId = chat.id;
        chatHeader.innerHTML = renderChatHeader(other);
        socket.emit("dm:join", { chatId: chat.id });
        await loadMessages(chat.id);
      });
      chatList.appendChild(item);
    }
  } catch (error) {
    chatList.innerHTML = `<li class=\"thread-item\">${error.message}</li>`;
  }
}

async function loadMessages(chatId) {
  if (!chatId) {
    return;
  }
  try {
    const response = await apiFetch(`/chats/${chatId}/messages`);
    const messages = response.data || [];
    chatMessages.innerHTML = "";
    for (const message of messages) {
      const sender = await getUser(message.senderId);
      appendMessage(message, sender);
    }
    chatMessages.scrollTop = chatMessages.scrollHeight;
  } catch (error) {
    chatMessages.innerHTML = `<div class=\"form-message\">${error.message}</div>`;
  }
}

function renderMedia(message) {
  if (message.mediaType && message.mediaType.startsWith("video")) {
    return `<div class=\"post-media\"><video src=\"${message.mediaUrl}\" controls></video></div>`;
  }
  return `<div class=\"post-media\"><img src=\"${message.mediaUrl}\" alt=\"media\" /></div>`;
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

function renderChatHeader(user) {
  if (!user?.profile) {
    return "Select a chat";
  }
  const name = user.profile.displayName || user.profile.username;
  const avatar = user.profile.avatarUrl
    ? `<span class=\"avatar\"><img src=\"${user.profile.avatarUrl}\" alt=\"${name}\" /></span>`
    : `<span class=\"avatar\">${name.charAt(0).toUpperCase()}</span>`;
  return `<div class=\"post-author\">${avatar}<span>${name}</span></div>`;
}

function appendMessage(message, sender) {
  const isMe = message.senderId === currentUserId;
  const bubble = document.createElement("div");
  bubble.className = `chat-bubble ${isMe ? "me" : "you"}`;
  const senderName = sender?.profile?.displayName || "User";
  const senderAvatar = sender?.profile?.avatarUrl
    ? `<span class=\"avatar\"><img src=\"${sender.profile.avatarUrl}\" alt=\"${senderName}\" /></span>`
    : `<span class=\"avatar\">${senderName.charAt(0).toUpperCase()}</span>`;
  bubble.innerHTML = `
    <div class="chat-author">${senderAvatar}<span>${senderName}</span></div>
    <div>${message.text || ""}</div>
    ${message.mediaUrl ? renderMedia(message) : ""}
    <div class="post-meta">${new Date(message.createdAt).toLocaleString()}</div>
  `;
  chatMessages.appendChild(bubble);
}

async function getUser(userId) {
  if (!userId) {
    return null;
  }
  if (userCache.has(userId)) {
    return userCache.get(userId);
  }
  try {
    const response = await apiFetch(`/users/${userId}`);
    userCache.set(userId, response.data);
    return response.data;
  } catch (error) {
    return null;
  }
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
        searchResults.innerHTML = "";
        friendSearch.value = "";
      }
    });
  });
}

async function startChatWithUsername(username) {
  try {
    const response = await apiFetch("/chats/dm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username })
    });
    activeChatId = response.data.id;
    socket.emit("dm:join", { chatId: activeChatId });
    await loadChats();
    await loadMessages(activeChatId);
  } catch (error) {
    dmMessage.textContent = error.message;
  }
}

dmForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  dmMessage.textContent = "";
  const formData = new FormData(dmForm);
  const payload = Object.fromEntries(formData.entries());
  await startChatWithUsername(payload.username);
});

messageForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!activeChatId) {
    messageMessage.textContent = "Select a chat first";
    return;
  }
  messageMessage.textContent = "";
  const formData = new FormData(messageForm);
  try {
    const text = formData.get("text");
    const media = formData.get("media");
    if (media && media instanceof File && media.size > 0) {
      await apiFetch(`/chats/${activeChatId}/messages`, {
        method: "POST",
        body: formData
      });
      messageForm.reset();
      await loadMessages(activeChatId);
      return;
    }
    socket.emit("dm:message", { chatId: activeChatId, text: String(text || "") }, (response) => {
      if (!response?.success) {
        messageMessage.textContent = response?.message || "Message failed";
        return;
      }
      messageForm.reset();
    });
  } catch (error) {
    messageMessage.textContent = error.message;
  }
});

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
  if (queryUser && dmForm) {
    dmForm.username.value = queryUser;
    dmForm.requestSubmit();
  }
}

init();
