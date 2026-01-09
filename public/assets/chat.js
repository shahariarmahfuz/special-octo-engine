ensureAuth();
bindLogout();

const chatThread = document.getElementById("chatThread");
const chatText = document.getElementById("chatText");
const sendBtn = document.getElementById("sendBtn");
const likeBtn = document.getElementById("likeBtn");
const chatMedia = document.getElementById("chatMedia");
const chatName = document.getElementById("chatName");
const chatAvatar = document.getElementById("chatAvatar");
const chatHero = document.getElementById("chatHero");
const chatHeroAvatar = document.getElementById("chatHeroAvatar");
const chatHeroName = document.getElementById("chatHeroName");
const chatHeroSubtitle = document.getElementById("chatHeroSubtitle");
const chatHeroLink = document.getElementById("chatHeroLink");

let currentUserId = null;
let activeChatId = null;
let activeProfile = null;
const userCache = new Map();

const socket = io({
  auth: { token: getToken() }
});

const queryParams = new URLSearchParams(window.location.search);
const queryUser = queryParams.get("user");
const queryChat = queryParams.get("chatId");

socket.on("dm:message:new", async (message) => {
  if (message.chatId !== activeChatId) {
    return;
  }
  const sender = await getUser(message.senderId);
  appendMessage(message, sender);
});

async function loadCurrentUser() {
  const response = await apiFetch("/auth/me");
  currentUserId = response.data?.id || response.data?.userId || response.data?.user?.id || null;
}

async function loadChatHeader(profile) {
  const name = profile?.displayName || profile?.username || "Chat";
  if (chatName) {
    chatName.textContent = name;
  }
  if (chatAvatar) {
    if (profile?.avatarUrl) {
      chatAvatar.innerHTML = `<img src="${profile.avatarUrl}" alt="${name}" />`;
    } else {
      chatAvatar.textContent = name.charAt(0).toUpperCase();
    }
  }
  if (chatHero) {
    chatHeroName.textContent = name;
    chatHeroSubtitle.textContent = profile?.bio || "You're connected on NekoBook";
    if (profile?.avatarUrl) {
      chatHeroAvatar.innerHTML = `<img src="${profile.avatarUrl}" alt="${name}" />`;
    } else {
      chatHeroAvatar.textContent = name.charAt(0).toUpperCase();
    }
    chatHeroLink.href = `/u/${profile?.username || ""}`;
  }
}

async function startChatWithUsername(username) {
  const response = await apiFetch("/chats/dm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username })
  });
  activeChatId = response.data.id;
  socket.emit("dm:join", { chatId: activeChatId });
  const chat = await apiFetch("/chats");
  const match = (chat.data || []).find((item) => item.id === activeChatId);
  if (match) {
    const otherId = match.participantIds.find((id) => id !== currentUserId) || match.participantIds[0];
    const other = await getUser(otherId);
    activeProfile = other?.profile || null;
    if (activeProfile) {
      await loadChatHeader(activeProfile);
    }
  }
  await loadMessages(activeChatId);
}

async function loadMessages(chatId) {
  if (!chatId) {
    return;
  }
  const response = await apiFetch(`/chats/${chatId}/messages`);
  const messages = response.data || [];
  chatThread.querySelectorAll(".msg-row, .seen-text, .date-divider").forEach((el) => el.remove());
  let lastSender = null;
  for (const message of messages) {
    const sender = await getUser(message.senderId);
    const isNewGroup = lastSender && lastSender !== message.senderId;
    appendMessage(message, sender, isNewGroup);
    lastSender = message.senderId;
  }
  scrollToBottom();
}

function renderMedia(message) {
  if (message.mediaType && message.mediaType.startsWith("video")) {
    return `<div class="bubble media"><video src="${message.mediaUrl}" controls></video></div>`;
  }
  return `<div class="bubble media"><img src="${message.mediaUrl}" alt="media" /></div>`;
}

function appendMessage(message, sender, isNewGroup = false) {
  const isMe = message.senderId === currentUserId;
  const row = document.createElement("div");
  row.className = `msg-row ${isMe ? "me" : "them"}`;
  if (isNewGroup) {
    row.dataset.newGroup = "true";
  }
  const wrapper = document.createElement("div");
  wrapper.className = "bubble-wrapper";
  const content = message.mediaUrl
    ? renderMedia(message)
    : `<div class="bubble">${message.text || ""}</div>`;
  wrapper.innerHTML = content;
  row.appendChild(wrapper);
  chatThread.appendChild(row);
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

function scrollToBottom() {
  chatThread.scrollTop = chatThread.scrollHeight;
}

chatText?.addEventListener("input", () => {
  chatText.style.height = "auto";
  chatText.style.height = `${chatText.scrollHeight}px`;
  if (chatText.value.trim().length > 0) {
    sendBtn.classList.add("active");
    likeBtn.classList.add("hidden");
  } else {
    sendBtn.classList.remove("active");
    likeBtn.classList.remove("hidden");
  }
});

sendBtn?.addEventListener("click", async () => {
  const text = chatText.value.trim();
  if (!text || !activeChatId) {
    return;
  }
  socket.emit("dm:message", { chatId: activeChatId, text }, (response) => {
    if (!response?.success) {
      return;
    }
    chatText.value = "";
    chatText.style.height = "auto";
    sendBtn.classList.remove("active");
    likeBtn.classList.remove("hidden");
  });
});

likeBtn?.addEventListener("click", () => {
  if (!activeChatId) {
    return;
  }
  socket.emit("dm:message", { chatId: activeChatId, text: "👍" }, () => {
    chatText.value = "";
  });
});

chatMedia?.addEventListener("change", async () => {
  if (!activeChatId || !chatMedia.files?.length) {
    return;
  }
  const formData = new FormData();
  formData.set("media", chatMedia.files[0]);
  await apiFetch(`/chats/${activeChatId}/messages`, {
    method: "POST",
    body: formData
  });
  chatMedia.value = "";
  await loadMessages(activeChatId);
});

async function init() {
  await loadCurrentUser();
  if (queryChat) {
    activeChatId = queryChat;
    socket.emit("dm:join", { chatId: activeChatId });
    await loadMessages(activeChatId);
    return;
  }
  if (queryUser) {
    await startChatWithUsername(queryUser);
  }
}

init();
