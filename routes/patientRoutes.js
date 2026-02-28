const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
    res.json([
        { id: 1, name: "Patient A", age: 70 },
        { id: 2, name: "Patient B", age: 75 }
    ]);
});

module.exports = router;