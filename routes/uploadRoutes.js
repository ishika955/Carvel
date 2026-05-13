// const express = require("express");
// const router = express.Router();
// const multer = require("multer");
// const cloudinary = require("../config/cloudinary");

// const storage = multer.memoryStorage();
// const upload = multer({ storage });

// router.post("/", upload.single("image"), async (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({ success: false, message: "No file uploaded" });
//     }

//     const result = await new Promise((resolve, reject) => {
//       cloudinary.uploader.upload_stream(
//         { folder: "carvel/profiles" },
//         (error, result) => {
//           if (error) reject(error);
//           else resolve(result);
//         }
//       ).end(req.file.buffer);
//     });

//     res.json({
//       success: true,
//       imageUrl: result.secure_url,
//       message: "Image uploaded successfully"
//     });

//   } catch (err) {
//     console.log(err);
//     res.status(500).json({ message: err.message });
//   }
// });

// module.exports = router;
const express = require("express");
const router = express.Router();

const upload = require("../middleware/uploadMiddleware");
const {
  uploadImage
} = require("../controllers/uploadController");

router.post("/", upload.single("image"), uploadImage);

module.exports = router;