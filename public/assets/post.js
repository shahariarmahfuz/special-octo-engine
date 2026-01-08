ensureAuth();
bindLogout();

const postCard = document.getElementById("postCard");
const commentList = document.getElementById("commentList");
const commentForm = document.getElementById("commentForm");
const commentMessage = document.getElementById("commentMessage");
const loadMoreBtn = document.getElementById("loadMoreComments");
const latestBtn = document.getElementById("latestComments");
const topBtn = document.getElementById("topComments");

const postId = window.location.pathname.split("/").pop();
let commentLimit = 10;
let sortMode = "latest";

async function loadPost() {
  if (!postId || !postCard) {
    return;
  }
  try {
    const response = await apiFetch(`/posts/${postId}`);
    const post = response.data;
    postCard.innerHTML = `
      <div class="post-meta">
        <span>Post ID: ${post.id}</span>
        <span>${new Date(post.createdAt).toLocaleString()}</span>
      </div>
      <p>${post.text || "(no text)"}</p>
      ${post.mediaUrl ? renderMedia(post) : ""}
      <div class="post-actions">
        <button class="button small" id="likeBtn">Like</button>
        <button class="button small" id="shareBtn">Share</button>
      </div>
    `;

    document.getElementById("likeBtn").addEventListener("click", async () => {
      try {
        await apiFetch(`/posts/${post.id}/like`, { method: "POST" });
      } catch (error) {
        alert(error.message);
      }
    });

    document.getElementById("shareBtn").addEventListener("click", async () => {
      const text = prompt("Add a note to share (optional)") || "";
      try {
        await apiFetch(`/posts/${post.id}/share`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text })
        });
      } catch (error) {
        alert(error.message);
      }
    });
  } catch (error) {
    postCard.innerHTML = `<div class="form-message">${error.message}</div>`;
  }
}

async function loadComments() {
  if (!commentList) {
    return;
  }
  try {
    const response = await apiFetch(`/posts/${postId}/comments`);
    let comments = response.data || [];
    if (sortMode === "latest") {
      comments = comments.slice().reverse();
    }
    const sliced = comments.slice(0, commentLimit);
    commentList.innerHTML = sliced.map((comment) => `<div class="comment">${comment.text}</div>`).join("");
  } catch (error) {
    commentList.innerHTML = `<div class="form-message">${error.message}</div>`;
  }
}

function renderMedia(post) {
  if (post.mediaType && post.mediaType.startsWith("video")) {
    return `<div class="post-media"><video src="${post.mediaUrl}" controls></video></div>`;
  }
  return `<div class="post-media"><img src="${post.mediaUrl}" alt="post media" /></div>`;
}

commentForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  commentMessage.textContent = "";
  const formData = new FormData(commentForm);
  const text = formData.get("text");
  try {
    await apiFetch(`/posts/${postId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });
    commentForm.reset();
    await loadComments();
  } catch (error) {
    commentMessage.textContent = error.message;
  }
});

loadMoreBtn?.addEventListener("click", async () => {
  commentLimit += 10;
  await loadComments();
});

latestBtn?.addEventListener("click", async () => {
  sortMode = "latest";
  await loadComments();
});

topBtn?.addEventListener("click", async () => {
  sortMode = "top";
  await loadComments();
});

loadPost();
loadComments();
