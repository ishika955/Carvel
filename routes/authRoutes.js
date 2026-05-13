const express = require("express");
const router = express.Router();
const passport = require("passport");
const authMiddleware = require("../middleware/authMiddleware");

const {
  registerUser,
  loginUser,
  googleCallback
} = require("../controllers/authController");

router.post("/register", registerUser);
router.post("/login", loginUser);

router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"]
  })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "http://localhost:5173/login",
    session: false
  }),
  googleCallback
);

// JWT wala /me route
router.get("/me", authMiddleware, (req, res) => {
  res.json(req.user);
});

// Logout (JWT mein bas frontend token delete karta hai, backend pe kuch nahi hota)
router.post("/logout", (req, res) => {
  res.json({ success: true, message: "Logged out" });
});

module.exports = router;