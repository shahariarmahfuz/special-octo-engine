ensureAuth();
bindLogout();

const feedList = document.getElementById("feedList");
const postForm = document.getElementById("postForm");
const postMessage = document.getElementById("postMessage");
const userCache = new Map();

async function loadFeed() {
  feedList.innerHTML = "<div class=\"loading\">Loading feed...</div>";
  try {
    const response = await apiFetch("/feed");
    const items = response.data.items || [];
    if (!items.length) {
      feedList.innerHTML = "<div class=\"card\">No posts yet. Create the first one!</div>";
      return;
    }
    feedList.innerHTML = "";
    for (const post of items) {
      const author = await getAuthor(post.authorId);
      const engagement = await loadEngagement(post.id);
      const card = document.createElement("article");
      card.className = "card post-card";
      const authorName = author?.profile?.displayName || "Unknown";
      const authorUsername = author?.profile?.username || "unknown";
      const authorAvatar = author?.profile?.avatarUrl;
      const authorMarkup = authorAvatar
        ? `<div class="avatar"><img src="${authorAvatar}" alt="${authorName}" /></div>`
        : `<div class="avatar">${authorName.charAt(0).toUpperCase()}</div>`;
      card.innerHTML = `
        <a class="post-author" href="/u/${authorUsername}">
          ${authorMarkup}
          <span>${authorName}</span>
        </a>
        <div class="post-meta">
          <span>Post ID: ${post.id}</span>
          <span>${new Date(post.createdAt).toLocaleString()}</span>
        </div>
        <p>${post.text || "(no text)"}</p>
        ${post.mediaUrl ? renderMedia(post) : ""}
        <div class="post-meta">
          <span>${engagement.likes} likes · ${engagement.comments} comments</span>
          <a class="button small" href="/post/${post.id}">Open</a>
        </div>
        <div class="post-actions">
          <button class="button small" data-like>Like</button>
          <button class="button small" data-comment>Comment</button>
          <button class="button small" data-share>Share</button>
        </div>
        <div class="comment-list" data-comments></div>
      `;

      const likeBtn = card.querySelector("[data-like]");
      const commentBtn = card.querySelector("[data-comment]");
      const shareBtn = card.querySelector("[data-share]");
      const commentsContainer = card.querySelector("[data-comments]");

      likeBtn.addEventListener("click", async () => {
        try {
          if (likeBtn.dataset.liked === "true") {
            await apiFetch(`/posts/${post.id}/like`, { method: "DELETE" });
            likeBtn.textContent = "Like";
            likeBtn.dataset.liked = "false";
          } else {
            await apiFetch(`/posts/${post.id}/like`, { method: "POST" });
            likeBtn.textContent = "Unlike";
            likeBtn.dataset.liked = "true";
          }
          await loadFeed();
        } catch (error) {
          alert(error.message);
        }
      });

      commentBtn.addEventListener("click", async () => {
        const text = prompt("Write a comment");
        if (!text) {
          return;
        }
        try {
          await apiFetch(`/posts/${post.id}/comments`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text })
          });
          await loadComments(post.id, commentsContainer, 3);
        } catch (error) {
          alert(error.message);
        }
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

      await loadComments(post.id, commentsContainer, 3);
      feedList.appendChild(card);
    }
  } catch (error) {
    feedList.innerHTML = `<div class="card">${error.message}</div>`;
  }
}

function renderMedia(post) {
  if (post.mediaType && post.mediaType.startsWith("video")) {
    return `<div class="post-media"><video src="${post.mediaUrl}" controls></video></div>`;
  }
  return `<div class="post-media"><img src="${post.mediaUrl}" alt="post media" /></div>`;
}

async function loadComments(postId, container, limit) {
  try {
    const response = await apiFetch(`/posts/${postId}/comments`);
    const comments = response.data || [];
    const sliced = typeof limit === "number" ? comments.slice(0, limit) : comments;
    container.innerHTML = sliced
      .map((comment) => `<div class="comment">${comment.text}</div>`)
      .join("");
  } catch (error) {
    container.innerHTML = "";
  }
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

postForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  postMessage.textContent = "";
  const formData = new FormData(postForm);
  try {
    await apiFetch("/posts", {
      method: "POST",
      body: formData
    });
    postForm.reset();
    await loadFeed();
  } catch (error) {
    postMessage.textContent = error.message;
  }
});

loadFeed();
