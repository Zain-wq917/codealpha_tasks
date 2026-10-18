
const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    author: {
      type: String,
      default: "Blue Sky User"
    },
    text: {
      type: String,
      required: true,
      maxlength: 2000
    },
    image: {
      type: String,
      default: ""
    },
    reactions: {
      type: Map,
      of: Number,
      default: {}
    },
    comments: {
      type: [String],
      default: []
    }
  },
  {
    timestamps: true
  }
);

const Post = mongoose.model("Post", postSchema);

module.exports = { Post };
      
