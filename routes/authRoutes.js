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

router.get("/google/callback", (req, res, next) => {
  passport.authenticate("google", { session: false }, (err, user, info) => {
    console.log("GOOGLE CALLBACK ERR:", err);
    console.log("GOOGLE CALLBACK USER:", user);
    console.log("GOOGLE CALLBACK INFO:", info);

    if (err || !user) {
      return res.redirect("https://carvel.vercel.app/login");
    }

    req.user = user;
    return googleCallback(req, res);
  })(req, res, next);
});
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