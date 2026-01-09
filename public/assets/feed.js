ensureAuth();
bindLogout();

const feedList = document.getElementById("feedList");
const meAvatar = document.getElementById("meAvatar");
const userCache = new Map();

async function loadMe() {
  try {
    const response = await apiFetch("/users/me");
    const profile = response.data.profile;
    const name = profile.displayName || "ME";
    if (profile.avatarUrl) {
      meAvatar.innerHTML = `<img src="${profile.avatarUrl}" alt="${name}" />`;
      return;
    }
    meAvatar.textContent = name.charAt(0).toUpperCase();
  } catch (error) {
    meAvatar.textContent = "ME";
  }
}

async function loadFeed() {
  feedList.innerHTML = "<div class=\"loading\">Loading feed...</div>";
  try {
    const response = await apiFetch("/feed");
    const items = response.data.items || [];
    if (!items.length) {
      feedList.innerHTML = "<div class=\"notice\">No posts yet. Create the first one!</div>";
      return;
    }
    feedList.innerHTML = "";
    for (const post of items) {
      const author = await getAuthor(post.authorId);
      const engagement = await loadEngagement(post.id);
      const card = document.createElement("article");
      card.className = "post";
      const authorName = author?.profile?.displayName || "Unknown";
      const authorUsername = author?.profile?.username || "unknown";
      const authorAvatar = author?.profile?.avatarUrl;
      const authorMarkup = authorAvatar
        ? `<div class="post-avatar"><img src="${authorAvatar}" alt="${authorName}" /></div>`
        : `<div class="post-avatar">${authorName.charAt(0).toUpperCase()}</div>`;

      card.innerHTML = `
        <div class="post-header">
          <a class="post-user" href="/u/${authorUsername}">
            ${authorMarkup}
            <div class="meta">
              <div class="name">${authorName}</div>
              <div class="sub">
                <span>${new Date(post.createdAt).toLocaleString()}</span>
                <span>•</span>
                <i class="fa-solid fa-earth-americas"></i>
                <span>Public</span>
              </div>
            </div>
          </a>
          <a class="post-more-btn" href="/post/${post.id}" aria-label="Open post">
            <i class="fa-solid fa-ellipsis"></i>
          </a>
        </div>
        <div class="post-text">${post.text || ""}</div>
        ${post.mediaUrl ? renderMedia(post) : ""}
        <div class="post-stats">
          <div class="likes">
            <div class="like-badge"><i class="fa-solid fa-thumbs-up"></i></div>
            <span>${engagement.likes}</span>
          </div>
          <div>
            <span>${engagement.comments} comments</span>
          </div>
        </div>
        <div class="post-actions">
          <button class="act like" type="button" data-like>
            <i class="fa-regular fa-thumbs-up"></i> Like
          </button>
          <button class="act" type="button" data-comment>
            <i class="fa-regular fa-comment-dots"></i> Comment
          </button>
          <button class="act" type="button" data-share>
            <i class="fa-solid fa-share-from-square"></i> Share
          </button>
        </div>
      `;

      const likeBtn = card.querySelector("[data-like]");
      const commentBtn = card.querySelector("[data-comment]");
      const shareBtn = card.querySelector("[data-share]");

      likeBtn.addEventListener("click", async () => {
        try {
          if (likeBtn.classList.contains("active")) {
            await apiFetch(`/posts/${post.id}/like`, { method: "DELETE" });
            likeBtn.classList.remove("active");
            likeBtn.querySelector("i").className = "fa-regular fa-thumbs-up";
          } else {
            await apiFetch(`/posts/${post.id}/like`, { method: "POST" });
            likeBtn.classList.add("active");
            likeBtn.querySelector("i").className = "fa-solid fa-thumbs-up";
          }
          await loadFeed();
        } catch (error) {
          alert(error.message);
        }
      });

      commentBtn.addEventListener("click", () => {
        window.location.href = `/post/${post.id}`;
      });

      shareBtn.addEventListener("click", async () => {
        const text = prompt("Add a note to share (optional)") || "";
        try {
          await apiFetch(`/posts/${post.id}/share`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text })
          });
          await loadFeed();
        } catch (error) {
          alert(error.message);
        }
      });

      feedList.appendChild(card);
    }
  } catch (error) {
    feedList.innerHTML = `<div class="notice">${error.message}</div>`;
  }
}

function renderMedia(post) {
  if (post.mediaType && post.mediaType.startsWith("video")) {
    return `<div class="post-media"><video src="${post.mediaUrl}" controls></video></div>`;
  }
  return `<div class="post-media"><img src="${post.mediaUrl}" alt="post media" /></div>`;
}

async function loadEngagement(postId) {
  try {
    const [likes, comments] = await Promise.all([
      apiFetch(`/posts/${postId}/likes`),
      apiFetch(`/posts/${postId}/comments`)
    ]);
    return { likes: likes.data.count || 0, comments: (comments.data || []).length };
  } catch (error) {
    return { likes: 0, comments: 0 };
  }
}

async function getAuthor(authorId) {
  if (userCache.has(authorId)) {
    return userCache.get(authorId);
  }
  try {
    const response = await apiFetch(`/users/${authorId}`);
    userCache.set(authorId, response.data);
    return response.data;
  } catch (error) {
    return null;
  }
}

loadMe();
loadFeed();
