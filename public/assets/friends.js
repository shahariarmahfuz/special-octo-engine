ensureAuth();
bindLogout();

const requestList = document.getElementById("requestList");
const suggestionList = document.getElementById("suggestionList");
const stateKey = "friendState";

function loadState() {
  try {
    const raw = localStorage.getItem(stateKey);
    if (!raw) {
      return { incoming: [], sent: [], friends: [] };
    }
    return JSON.parse(raw);
  } catch (error) {
    return { incoming: [], sent: [], friends: [] };
  }
}

function saveState(state) {
  localStorage.setItem(stateKey, JSON.stringify(state));
}

function renderAvatar(profile, name) {
  if (profile?.avatarUrl) {
    return `<div class="post-avatar"><img src="${profile.avatarUrl}" alt="${name}" /></div>`;
  }
  return `<div class="post-avatar">${name.charAt(0).toUpperCase()}</div>`;
}

function renderEmpty(target, message) {
  target.innerHTML = `<div class="notice">${message}</div>`;
}

async function loadSuggestions() {
  try {
    const response = await apiFetch("/feed");
    const items = response.data.items || [];
    const uniqueAuthors = Array.from(new Set(items.map((post) => post.authorId)));
    const results = [];
    for (const authorId of uniqueAuthors) {
      try {
        const user = await apiFetch(`/users/${authorId}`);
        results.push({ id: authorId, data: user.data });
      } catch (error) {
        // ignore individual failures
      }
    }
    return results;
  } catch (error) {
    return [];
  }
}

function ensureIncomingSeed(state, suggestions) {
  if (state.incoming.length) {
    return state;
  }
  const seed = suggestions
    .filter((person) => !state.friends.includes(person.id))
    .slice(0, 2)
    .map((person) => person.id);
  if (seed.length) {
    state.incoming = seed;
    saveState(state);
  }
  return state;
}

function renderRequests(state, suggestions) {
  const incoming = state.incoming
    .map((id) => suggestions.find((person) => person.id === id))
    .filter(Boolean);

  if (!incoming.length) {
    renderEmpty(requestList, "No new friend requests.");
    return;
  }

  requestList.innerHTML = "";
  for (const person of incoming) {
    const profile = person.data.profile;
    const name = profile?.displayName || "Unknown";
    const card = document.createElement("div");
    card.className = "friend-card";
    card.innerHTML = `
      <div class="friend-meta">
        ${renderAvatar(profile, name)}
        <div>
          <div class="meta">
            <div class="name">${name}</div>
            <div class="sub">@${profile?.username || "user"}</div>
          </div>
        </div>
      </div>
      <div class="friend-actions">
        <button class="button primary" data-accept>Accept</button>
        <button class="button" data-remove>Remove</button>
      </div>
    `;
    card.querySelector("[data-accept]").addEventListener("click", () => {
      state.incoming = state.incoming.filter((id) => id !== person.id);
      if (!state.friends.includes(person.id)) {
        state.friends.push(person.id);
      }
      saveState(state);
      renderRequests(state, suggestions);
      renderSuggestions(state, suggestions);
    });
    card.querySelector("[data-remove]").addEventListener("click", () => {
      state.incoming = state.incoming.filter((id) => id !== person.id);
      saveState(state);
      renderRequests(state, suggestions);
    });
    requestList.appendChild(card);
  }
}

function renderSuggestions(state, suggestions) {
  const filtered = suggestions.filter((person) => !state.friends.includes(person.id));
  if (!filtered.length) {
    renderEmpty(suggestionList, "No suggestions yet.");
    return;
  }
  suggestionList.innerHTML = "";
  for (const person of filtered) {
    const profile = person.data.profile;
    const name = profile?.displayName || "Unknown";
    const isRequested = state.sent.includes(person.id);
    const card = document.createElement("div");
    card.className = "friend-card";
    card.innerHTML = `
      <div class="friend-meta">
        ${renderAvatar(profile, name)}
        <div>
          <div class="meta">
            <div class="name">${name}</div>
            <div class="sub">@${profile?.username || "user"}</div>
          </div>
        </div>
      </div>
      <div class="friend-actions">
        <button class="button primary" data-request ${isRequested ? "disabled" : ""}>
          ${isRequested ? "Requested" : "Add Friend"}
        </button>
        <button class="button" data-cancel ${isRequested ? "" : "disabled"}>Cancel</button>
      </div>
    `;
    card.querySelector("[data-request]").addEventListener("click", () => {
      if (!state.sent.includes(person.id)) {
        state.sent.push(person.id);
      }
      saveState(state);
      renderSuggestions(state, suggestions);
    });
    card.querySelector("[data-cancel]").addEventListener("click", () => {
      state.sent = state.sent.filter((id) => id !== person.id);
      saveState(state);
      renderSuggestions(state, suggestions);
    });
    suggestionList.appendChild(card);
  }
}

async function initFriends() {
  const suggestions = await loadSuggestions();
  const state = ensureIncomingSeed(loadState(), suggestions);
  renderRequests(state, suggestions);
  renderSuggestions(state, suggestions);
}

initFriends();
