const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  password: { type: String },
  role: { type: String, default: "caretaker" },
  profilePic: { type: String },
  googleId: { type: String },
  email: { type: String },
  phone: { type: String },
  notifyEmail: { type: String },
  notifyPhone: { type: String }
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);