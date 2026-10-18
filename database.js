
const mongoose = require("mongoose");

async function connectDatabase() {
  try {
    if (!process.env.MONGODB_URI) {
      console.log("MONGODB_URI is not configured yet.");
      return false;
    }

    await mongoose.connect(process.env.MONGODB_URI);

    console.log("Blue Sky database connected successfully.");
    return true;
  } catch (error) {
    console.error("Database connection failed:", error.message);
    throw error;
  }
}

module.exports = { connectDatabase };
      
