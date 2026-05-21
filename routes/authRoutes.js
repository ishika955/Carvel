const express = require("express");
const router = express.Router();
const passport = require("passport");
const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware"); // ADD THIS

const { registerUser, loginUser, googleCallback } = require("../controllers/authController");

// ADD upload.single("profilePic") here
router.post("/register", upload.single("profilePic"), registerUser);
router.post("/login", loginUser);

router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

router.get(
  "/google/callback",
  passport.authenticate("google", { 
    failureRedirect: "https://carvel.vercel.app/login", 
    session: false 
  }),
  googleCallback
);
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const User = require("../models/User");
    const user = await User.findById(req.user.userId).select("-password");
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
router.post("/logout", (req, res) => res.json({ success: true, message: "Logged out" }));

module.exports = router;