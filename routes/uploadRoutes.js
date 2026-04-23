const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const cloudinary = require("../config/cloudinary");
const User = require("../models/User");


router.post("/", upload.single("image"), async (req, res) => {
  try {
    const { userId } = req.body;

    // validation
    if (!userId) {
      return res.status(400).json({ success: false, message: "userId missing" });
    }

    if (!req.file || !req.file.path) {
      return res.status(400).json({ success: false, message: "Image file missing" });
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];

if (!allowedTypes.includes(req.file.mimetype)) {
  return res.status(400).json({
    success: false,
    message: "Only image files allowed"
  });
}

    // upload to cloudinary
    const result = await cloudinary.uploader.upload(req.file.path);


    const fs = require("fs");
fs.unlinkSync(req.file.path);

    // update user directly (clean & safe)
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profilePic: result.secure_url },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.json({
      success: true,
      message: "Profile picture updated",
      imageUrl: result.secure_url,
      user: updatedUser
    });

  } catch (err) {
    console.log("UPLOAD ERROR:", err);
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

module.exports = router;