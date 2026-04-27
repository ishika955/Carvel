const express = require("express");
const router = express.Router();
const { readJSON, writeJSON } = require("../services/fileStore");
const { sendAlert } = require("../services/emailService");
const ALERTS_FILE = "data/alerts.json";
const PATIENTS_FILE = "data/patients.json";

// GET all alerts
router.get("/", async (req, res, next) => {
  try {
    const alerts = await readJSON(ALERTS_FILE, []);
    if (!Array.isArray(alerts)) {
      return res.status(500).json({ success: false, message: "alerts.json must contain an array []" });
    }
    res.status(200).json({ success: true, data: alerts });
  } catch (err) {
    next(err);
  }
});

// GET alert by ID
router.get("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const alerts = await readJSON(ALERTS_FILE, []);
    const alert = alerts.find((a) => Number(a.id) === id);
    if (!alert) {
      return res.status(404).json({ success: false, message: "Alert not found" });
    }
    res.status(200).json({ success: true, data: alert });
  } catch (err) {
    next(err);
  }
});

// POST create alert + send email
router.post("/", async (req, res, next) => {
  try {
    const { patientId, message, level, type, title, description } = req.body;

    if (!message && !description) {
      return res.status(400).json({ success: false, message: "message is required" });
    }

    const alerts = await readJSON(ALERTS_FILE, []);
    const nextId = alerts.length > 0 ? Math.max(...alerts.map((a) => Number(a.id) || 0)) + 1 : 1;

    const newAlert = {
      id: nextId,
      patientId: patientId !== undefined ? Number(patientId) : null,
      type: type || "warning",
      title: title || "Alert",
      message: message || description,
      description: description || message,
      level: level || "warning",
      read: false,
      createdAt: new Date().toISOString(),
    };

    alerts.push(newAlert);
    await writeJSON(ALERTS_FILE, alerts);

    // Send email for critical alerts
    if (level === "critical" || type === "emergency") {
      await sendAlert({
        subject: `🚨 Carvèl Alert: ${title || "Critical Alert"}`,
        title: `🚨 ${title || "Critical Alert"}`,
        message: message || description,
        details: `Time: ${new Date().toLocaleString("en-IN")} | Level: ${level || "critical"}`
      });
    }

    res.status(201).json({ success: true, data: newAlert });
  } catch (err) {
    next(err);
  }
});

// POST run auto-alert check (missed medications)
router.post("/run", async (req, res, next) => {
  try {
    const patients = await readJSON(PATIENTS_FILE, []);
    const alerts = await readJSON(ALERTS_FILE, []);

    const now = Date.now();
    let created = [];

    for (const p of patients) {
      if (p.type !== "medication") continue;
      if (p.status === "given") continue;

      // Check if medication time has passed by more than 1 hour
      if (!p.time) continue;

      const [hours, minutes] = p.time.split(":").map(Number);
      const today = new Date();
      const scheduledTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes);
      const hoursPassed = (now - scheduledTime.getTime()) / (1000 * 60 * 60);

      if (hoursPassed >= 1) {
        const alreadyOpen = alerts.some(
          (a) => a.status === "OPEN" && a.type === "MED_MISSED" && a.medication === p.medication
        );
        if (alreadyOpen) continue;

        const newAlert = {
          id: alerts.length + 1,
          type: "MED_MISSED",
          title: "💊 Missed Medication",
          message: `${p.medication} not given to ${p.patientName}`,
          description: `${p.medication} was scheduled at ${p.time} but has not been marked as given.`,
          level: "critical",
          status: "OPEN",
          read: false,
          medication: p.medication,
          patientName: p.patientName,
          createdAt: new Date().toISOString(),
        };

        alerts.push(newAlert);
        created.push(newAlert);

        // Send email for missed medication
        await sendAlert({
          subject: `💊 Missed Medication: ${p.medication}`,
          title: `💊 Missed Medication Alert`,
          message: `${p.medication} was not given to ${p.patientName}`,
          details: `Scheduled time: ${p.time} | Dosage: ${p.dosage || "N/A"} | Date: ${new Date().toLocaleDateString("en-IN")}`
        });
      }
    }

    await writeJSON(ALERTS_FILE, alerts);

    res.json({ success: true, message: `Generated ${created.length} alerts`, data: created });
  } catch (err) {
    next(err);
  }
});

module.exports = router;