const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");

// SIGNUP ROUTE
router.post("/register", (req, res) => {
  const { username, password, role } = req.body;

  const usersPath = path.join(__dirname, "../data/users.json");
  const users = JSON.parse(fs.readFileSync(usersPath, "utf-8"));

  // check if user already exists
  const existingUser = users.find(u => u.username === username);

  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: "Username already exists"
    });
  }

  const newUser = {
    id: Date.now(),
    username,
    password,
    role
  };

  users.push(newUser);

  fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));

  res.json({
    success: true,
    message: "User registered successfully"
  });
});


// LOGIN ROUTE
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