ensureAuth();
bindLogout();

const dmForm = document.getElementById("dmForm");
const dmMessage = document.getElementById("dmMessage");
const chatList = document.getElementById("chatList");
const chatHeader = document.getElementById("chatHeader");
const chatMessages = document.getElementById("chatMessages");
const messageForm = document.getElementById("messageForm");
const messageMessage = document.getElementById("messageMessage");

let activeChatId = null;

async function loadChats() {
  try {
    const response = await apiFetch("/chats");
    const chats = response.data || [];
    chatList.innerHTML = "";
    if (!chats.length) {
      chatList.innerHTML = "<div class=\"chat-item\">No chats yet</div>";
      return;
    }
    chats.forEach((chat) => {
      const item = document.createElement("div");
      item.className = "chat-item";
      item.textContent = `Chat ${chat.id}`;
      item.addEventListener("click", async () => {
        document.querySelectorAll(".chat-item").forEach((el) => el.classList.remove("active"));
        item.classList.add("active");
        activeChatId = chat.id;
        chatHeader.textContent = `Chat ${chat.id}`;
        await loadMessages(chat.id);
      });
      chatList.appendChild(item);
    });
  } catch (error) {
    chatList.innerHTML = `<div class=\"form-message\">${error.message}</div>`;
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
    messages.forEach((message) => {
      const bubble = document.createElement("div");
      bubble.className = "chat-bubble";
      bubble.innerHTML = `
        <div>${message.text || ""}</div>
        ${message.mediaUrl ? renderMedia(message) : ""}
        <div class="post-meta">${new Date(message.createdAt).toLocaleString()}</div>
      `;
      chatMessages.appendChild(bubble);
    });
    chatMessages.scrollTop = chatMessages.scrollHeight;
  } catch (error) {
    chatMessages.innerHTML = `<div class=\"form-message\">${error.message}</div>`;
  }
}

function renderMedia(message) {
  if (message.mediaType && message.mediaType.startsWith("video")) {
    return `<div class="post-media"><video src="${message.mediaUrl}" controls></video></div>`;
  }
  return `<div class="post-media"><img src="${message.mediaUrl}" alt="media" /></div>`;
}

dmForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  dmMessage.textContent = "";
  const formData = new FormData(dmForm);
  const payload = Object.fromEntries(formData.entries());
  try {
    const response = await apiFetch("/chats/dm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    activeChatId = response.data.id;
    await loadChats();
    await loadMessages(activeChatId);
  } catch (error) {
    dmMessage.textContent = error.message;
  }
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
    await apiFetch(`/chats/${activeChatId}/messages`, {
      method: "POST",
      body: formData
    });
    messageForm.reset();
    await loadMessages(activeChatId);
  } catch (error) {
    messageMessage.textContent = error.message;
  }
});

loadChats();
