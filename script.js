
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

  if (className) {
    element.className = className;
  }

  if (text !== "") {
    element.textContent = text;
  }

  return element;
}

function loadPosts() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(saved) ? saved : [];
  } catch (error) {
    return [];
  }
}

let posts = loadPosts();

function savePosts() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
  } catch (error) {
    if (formMessage) {
      formMessage.textContent =
        "Posts save nahi ho sake. Browser storage check karein.";
    }
  }
}

function formatDate(dateValue) {
  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "Just now";
  }

  return date.toLocaleString();
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
  const previousReaction = post.userReaction || null;

  // Same reaction dobara dabane par reaction remove ho jayega.
  if (previousReaction === reactionName) {
    counts[reactionName] = Math.max(0, counts[reactionName] - 1);
    post.userReaction = null;
  } else {
    // Pehli reaction ko remove karein agar user reaction badal raha ho.
    if (previousReaction && counts[previousReaction] > 0) {
      counts[previousReaction]--;
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
  const userName = makeElement("strong", "", post.author || "Blue Sky User");
  const postDate = makeElement(
    "small",
    "post-date",
    formatDate(post.createdAt)
  );

  userInfo.append(userName, postDate);
  header.append(avatar, userInfo);

  const content = makeElement("p", "post-content", post.text || "");
  card.append(header, content);

  if (post.image) {
    try {
      const imageUrl = new URL(post.image);

      if (imageUrl.protocol === "https:" || imageUrl.protocol === "http:") {
        const image = makeElement("img", "post-image");
        image.src = imageUrl.href;
        image.alt = "Post image";
        image.loading = "lazy";
        image.referrerPolicy = "no-referrer";

        image.addEventListener("error", () => image.remove());
        card.append(image);
      }
    } catch (error) {
      // Invalid image URLs are ignored.
    }
  }

  // Reactions: Like, Love, Haha, Wow, Sad, Angry
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
    button.setAttribute(
      "aria-pressed",
      String(post.userReaction === reaction.name)
    );

    if (post.userReaction === reaction.name) {
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
  const actions = makeElement("div", "post-actions");
  const commentButton = makeElement("button", "", "💬 Comments");
  commentButton.type = "button";

  const commentsArea = makeElement("div", "comment-list");

  if (!Array.isArray(post.comments)) {
    post.comments = [];
  }

  post.comments.forEach((comment) => {
    commentsArea.append(
      makeElement("p", "comment", `💬 ${comment}`)
    );
  });

  const commentForm = makeElement("form", "comment-form");
  const commentInput = makeElement("input");
  commentInput.type = "text";
  commentInput.placeholder = "Write a comment...";
  commentInput.maxLength = 500;
  commentInput.setAttribute("aria-label", "Write a comment");
  commentInput.required = true;

  const commentSubmit = makeElement("button", "", "Comment");
  commentSubmit.type = "submit";

  commentForm.append(commentInput, commentSubmit);

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

  commentForm.hidden = true;
  commentsArea.hidden = true;

  actions.append(commentButton);
  card.append(actions, commentsArea, commentForm);

  return card;
}

function renderPosts(searchTerm = "") {
  if (!feedList) return;

  feedList.replaceChildren();

  const query = searchTerm.trim().toLowerCase();

  const filteredPosts = posts.filter((post) => {
    const text = (post.text || "").toLowerCase();
    return text.includes(query);
  });

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

if (postForm) {
  postForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const text = postText.value.trim();
    const image = postImage.value.trim();

    if (!text) {
      formMessage.textContent = "Post likhein, phir publish karein.";
      return;
    }

    if (image) {
      try {
        const imageUrl = new URL(image);

        if (
          imageUrl.protocol !== "https:" &&
          imageUrl.protocol !== "http:"
        ) {
          formMessage.textContent = "Image ka valid HTTP/HTTPS URL dein.";
          return;
        }
      } catch (error) {
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
    formMessage.textContent = "Post publish ho gayi! 🎉";

    renderPosts(searchInput ? searchInput.value : "");
  });
}

if (searchInput) {
  searchInput.addEventListener("input", () => {
    renderPosts(searchInput.value);
  });
}

renderPosts();
    
