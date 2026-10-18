
const express = require("express");
const router = express.Router();

let posts = [];
let nextId = 1;

// Get all posts
router.get("/", (req, res) => {
  res.json(posts);
});

// Create a post
router.post("/", (req, res) => {
  const text = String(req.body.text || "").trim();

  if (!text) {
    return res.status(400).json({
      error: "Post text is required."
    });
  }

  const post = {
    id: nextId++,
    text,
    author: "Blue Sky User",
    reactions: {},
    comments: [],
    createdAt: new Date().toISOString()
  };

  posts.unshift(post);
  res.status(201).json(post);
});

module.exports = router;
      
