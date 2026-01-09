ensureAuth();
bindLogout();

const mediaList = document.getElementById("mediaList");
const mediaType = mediaList?.dataset.media;

async function loadMedia() {
  if (!mediaList) {
    return;
  }
  mediaList.innerHTML = "<div class=\"loading\">Loading...</div>";
  try {
    const response = await apiFetch("/feed");
    const items = response.data.items || [];
    const filtered = items.filter((post) => {
      if (!post.mediaType) {
        return false;
      }
      return mediaType === "image" ? post.mediaType.startsWith("image") : post.mediaType.startsWith("video");
    });
    if (!filtered.length) {
      mediaList.innerHTML = "<div class=\"card\">No media posts yet.</div>";
      return;
    }
    mediaList.innerHTML = "";
    for (const post of filtered) {
      const card = document.createElement("article");
      card.className = "card";
      card.innerHTML = `
        <div class="post-text">${post.text || ""}</div>
        ${post.mediaUrl ? renderMedia(post) : ""}
        <div class="post-stats">
          <span>${new Date(post.createdAt).toLocaleString()}</span>
          <a class="button small" href="/post/${post.id}">Open</a>
        </div>
      `;
      mediaList.appendChild(card);
    }
  } catch (error) {
    mediaList.innerHTML = `<div class="card">${error.message}</div>`;
  }
}

function renderMedia(post) {
  if (post.mediaType && post.mediaType.startsWith("video")) {
    return `<div class="post-media"><video src="${post.mediaUrl}" controls></video></div>`;
  }
  return `<div class="post-media"><img src="${post.mediaUrl}" alt="post media" /></div>`;
}

loadMedia();
