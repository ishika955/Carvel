const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");

router.post("/login", (req, res) => {
  const { username, password } = req.body;

  const usersPath = path.join(__dirname, "../data/users.json");
  const users = JSON.parse(fs.readFileSync(usersPath, "utf-8"));

  const user = users.find(u => u.username === username && u.password === password);

  if (user) {
    res.status(200).json({
      success: true,
      role: user.role,
      username: user.username
    });
  } else {
    res.status(401).json({
      success: false,
      message: "Invalid username or password"
    });
  }
});

module.exports = router;