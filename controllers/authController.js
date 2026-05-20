const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

exports.registerUser = async (req, res) => {
  try {
    const { username, password, role, notifyEmail, notifyPhone, patients } = req.body;

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "Username already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let profilePic = "";
    if (req.file) {
      const cloudinary = require("../config/cloudinary");
      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: "carvel/profiles" },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        ).end(req.file.buffer);
      });
      profilePic = result.secure_url;
    }

    const user = await User.create({
      username,
      password: hashedPassword,
      role,
      profilePic,
      notifyEmail: notifyEmail || null,
      notifyPhone: notifyPhone || null,
      patients: patients || []
    });

    res.status(201).json({ success: true, message: "User registered successfully", user });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid username or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid username or password" });
    }

    const token = jwt.sign(
      { userId: user._id, username: user.username, role: user.role },
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
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.googleCallback = (req, res) => {
  const token = jwt.sign(
    { userId: req.user._id, username: req.user.username, role: req.user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

res.redirect(
    `http://localhost:3000/dashboard.html?token=${token}&role=${req.user.role}&username=${encodeURIComponent(req.user.username)}`
  );
};