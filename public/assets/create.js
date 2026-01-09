ensureAuth();
bindLogout();

const createPostForm = document.getElementById("createPostForm");
const createPostMessage = document.getElementById("createPostMessage");

createPostForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  createPostMessage.textContent = "";
  const formData = new FormData(createPostForm);
  try {
    await apiFetch("/posts", {
      method: "POST",
      body: formData
    });
    createPostForm.reset();
    window.location.href = "/feed";
  } catch (error) {
    createPostMessage.textContent = error.message;
  }
});
