const express = require("express");
const router = express.Router();

let alerts = [
    { id: 1, message: "High heart rate detected", level: "critical" },
    { id: 2, message: "Low blood pressure warning", level: "warning" }
];

// GET all alerts
router.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        data: alerts
    });
});

// GET alert by ID
router.get("/:id", (req, res) => {
    const id = parseInt(req.params.id);

    const alert = alerts.find(a => a.id === id);

    if (!alert) {
        return res.status(404).json({
            success: false,
            message: "Alert not found"
        });
    }

    res.status(200).json({
        success: true,
        data: alert
    });
});

module.exports = router;