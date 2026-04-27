const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const passport = require("passport");

// REGISTER
router.post("/register", async (req, res) => {
  try {
    const { username, password, role, notifyEmail, notifyPhone } = req.body;

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Username already exists"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      password: hashedPassword,
      role,
      notifyEmail: notifyEmail || null,
      notifyPhone: notifyPhone || null
    });

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password"
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password"
      });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      token,
      userId: user._id,
      username: user.username,
      role: user.role,
      profilePic: user.profilePic,
      notifyEmail: user.notifyEmail,
      notifyPhone: user.notifyPhone
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
});

// Google OAuth - initiate login
router.get("/google", passport.authenticate("google", {
  scope: ["profile", "email"]
}));

// Google OAuth - callback
router.get("/google/callback",
  passport.authenticate("google", { failureRedirect: "/login.html", session: false }),
  (req, res) => {
    const token = jwt.sign(
      { userId: req.user._id, role: req.user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.redirect(`/dashboard.html?token=${token}`);
  }
);

module.exports = router;