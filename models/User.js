const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, default: "caretaker" },
  profilePic: { type: String } // ✅ yahi hona chahiye
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);