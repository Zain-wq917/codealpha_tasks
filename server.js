
const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Frontend files serve karein
app.use(express.static(__dirname));

// Test API route
app.get("/api", (req, res) => {
  res.json({
    message: "Welcome to Blue Sky Social API!",
    status: "Server is running"
  });
});

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "OK" });
});

// Start server
app.listen(PORT, () => {
  console.log(`Blue Sky server running on port ${PORT}`);
});
