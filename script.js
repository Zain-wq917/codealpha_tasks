
const postForm = document.getElementById("postForm");
const postText = document.getElementById("postText");
const postImage = document.getElementById("postImage");
const feedList = document.getElementById("feedList");
const searchInput = document.getElementById("searchInput");
const formMessage = document.getElementById("formMessage");

const STORAGE_KEY = "blueSkyPosts";

const reactions = [
  { name: "Like", emoji: "👍" },
  { name: "Love", emoji: "❤️" },
  { name: "Haha", emoji: "😂" },
  { name: "Wow", emoji: "😮" },
  { name: "Sad", emoji: "😢" },
  { name: "Angry", emoji: "😡" }
];

function makeElement(tag, className = "", text = "") {
  const element = document.createElement(tag);

  if (className) element.className = className;
  if (text !== "") element.textContent = text;

  return element;
}

function loadPosts() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

let posts = loadPosts();

function savePosts() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
  } catch {
    if (formMessage) {
      formMessage.textContent = "Posts save nahi ho sake.";
    }
  }
}

function getReactionData(post) {
  if (!post.reactions || typeof post.reactions !== "object") {
    post.reactions = {};
  }

  reactions.forEach((reaction) => {
    if (!Number.isFinite(post.reactions[reaction.name])) {
      post.reactions[reaction.name] = 0;
    }
  });

  return post.reactions;
}

function changeReaction(post, reactionName) {
  const counts = getReactionData(post);
  const previous = post.userReaction || null;

  if (previous === reactionName) {
    counts[reactionName] = Math.max(0, counts[reactionName] - 1);
    post.userReaction = null;
  } else {
    if (previous && counts[previous] > 0) {
      counts[previous]--;
    }

    counts[reactionName]++;
    post.userReaction = reactionName;
  }

  savePosts();
  renderPosts(searchInput ? searchInput.value : "");
}

function createPostCard(post) {
  const card = makeElement("article", "card post-card");

  const header = makeElement("div", "post-header");
  const avatar = makeElement("div", "avatar", "B");
  const userInfo = makeElement("div");
  const userName = makeElement(
    "strong",
    "",
    post.author || "Blue Sky User"
  );

  const postDate = makeElement(
    "small",
    "post-date",
    post.createdAt
      ? new Date(post.createdAt).toLocaleString()
      : "Just now"
  );

  userInfo.append(userName, postDate);
  header.append(avatar, userInfo);

  const content = makeElement("p", "post-content", post.text || "");
  card.append(header, content);

  if (post.image) {
    try {
      const url = new URL(post.image);

      if (url.protocol === "https:" || url.protocol === "http:") {
        const image = makeElement("img", "post-image");
        image.src = url.href;
        image.alt = "Post image";
        image.loading = "lazy";
        image.addEventListener("error", () => image.remove());
        card.append(image);
      }
    } catch {
      // Invalid image URL ko ignore karein.
    }
  }

  // Reaction buttons
  const reactionArea = makeElement("div", "reaction-area");
  const reactionCounts = makeElement("div", "reaction-counts");
  const counts = getReactionData(post);

  reactions.forEach((reaction) => {
    const button = makeElement(
      "button",
      "reaction-button",
      `${reaction.emoji} ${reaction.name}`
    );

    button.type = "button";

    const selected = post.userReaction === reaction.name;
    button.setAttribute("aria-pressed", String(selected));

    if (selected) {
      button.classList.add("selected-reaction");
    }

    button.addEventListener("click", () => {
      changeReaction(post, reaction.name);
    });

    reactionArea.append(button);

    if (counts[reaction.name] > 0) {
      reactionCounts.append(
        makeElement(
          "span",
          "reaction-count",
          `${reaction.emoji} ${counts[reaction.name]}`
        )
      );
    }
  });

  card.append(reactionArea, reactionCounts);

  // Comments
  if (!Array.isArray(post.comments)) {
    post.comments = [];
  }

  const actions = makeElement("div", "post-actions");
  const commentButton = makeElement("button", "", "💬 Comments");
  commentButton.type = "button";

  const commentsArea = makeElement("div", "comment-list");

  post.comments.forEach((comment) => {
    commentsArea.append(makeElement("p", "comment", `💬 ${comment}`));
  });

  const commentForm = makeElement("form", "comment-form");
  const commentInput = makeElement("input");

  commentInput.type = "text";
  commentInput.placeholder = "Write a comment...";
  commentInput.maxLength = 500;
  commentInput.required = true;
  commentInput.setAttribute("aria-label", "Write a comment");

  const commentSubmit = makeElement("button", "", "Comment");
  commentSubmit.type = "submit";

  commentForm.append(commentInput, commentSubmit);
  actions.append(commentButton);

  commentForm.hidden = true;
  commentsArea.hidden = true;

  commentButton.addEventListener("click", () => {
    commentForm.hidden = !commentForm.hidden;
    commentsArea.hidden = !commentsArea.hidden;
  });

  commentForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const text = commentInput.value.trim();
    if (!text) return;

    post.comments.push(text);
    savePosts();
    renderPosts(searchInput ? searchInput.value : "");
  });

  card.append(actions, commentsArea, commentForm);

  return card;
}

function renderPosts(searchTerm = "") {
  if (!feedList) return;

  feedList.replaceChildren();

  const query = searchTerm.trim().toLowerCase();

  const filteredPosts = posts.filter((post) =>
    (post.text || "").toLowerCase().includes(query)
  );

  if (filteredPosts.length === 0) {
    feedList.append(
      makeElement(
        "p",
        "muted",
        query ? "Koi matching post nahi mila." : "Abhi koi post nahi hai."
      )
    );
    return;
  }

  filteredPosts.forEach((post) => {
    feedList.append(createPostCard(post));
  });
}

// Publish new post
if (postForm) {
  postForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const text = postText.value.trim();
    const image = postImage.value.trim();

    if (!text) {
      formMessage.textContent = "Pehle post likhein.";
      return;
    }

    if (image) {
      try {
        const url = new URL(image);

        if (url.protocol !== "https:" && url.protocol !== "http:") {
          formMessage.textContent = "Valid image URL enter karein.";
          return;
        }
      } catch {
        formMessage.textContent = "Image URL theek nahi hai.";
        return;
      }
    }

    const newPost = {
      id: Date.now().toString(),
      author: "Blue Sky User",
      text,
      image,
      createdAt: new Date().toISOString(),
      reactions: {
        Like: 0,
        Love: 0,
        Haha: 0,
        Wow: 0,
        Sad: 0,
        Angry: 0
      },
      userReaction: null,
      comments: []
    };

    posts.unshift(newPost);
    savePosts();
    postForm.reset();

    if (formMessage) {
      formMessage.textContent = "Post publish ho gayi! 🎉";
    }

    renderPosts(searchInput ? searchInput.value : "");
  });
}

// Search posts
if (searchInput) {
  searchInput.addEventListener("input", () => {
    renderPosts(searchInput.value);
  });
}

// Display saved posts
renderPosts();
  
