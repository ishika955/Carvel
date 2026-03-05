const express = require("express");
const router = express.Router();

const { readJSON, writeJSON } = require("../services/fileStore");
const ALERTS_FILE = "data/alerts.json";

// GET all alerts
router.get("/", async (req, res, next) => {
  try {
    const alerts = await readJSON(ALERTS_FILE, []);
    if (!Array.isArray(alerts)) {
      return res.status(500).json({
        success: false,
        message: "alerts.json must contain an array []",
      });
    }

    res.status(200).json({ success: true, data: alerts });
  } catch (err) {
     next(err);
  }
});

// GET alert by ID
router.get("/:id", async (req, res ,next) => {
  try {
    const id = Number(req.params.id);

    const alerts = await readJSON(ALERTS_FILE, []);
    if (!Array.isArray(alerts)) {
      return res.status(500).json({
        success: false,
        message: "alerts.json must contain an array []",
      });
    }

    const alert = alerts.find((a) => Number(a.id) === id);
    if (!alert) {
      return res.status(404).json({ success: false, message: "Alert not found" });
    }

    res.status(200).json({ success: true, data: alert });
  } catch (err) {
     next(err);
  }
});

// POST create alert
router.post("/", async (req, res, next) => {
  try {
    const { patientId, message, level } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: "message is required",
      });
    }

    const alerts = await readJSON(ALERTS_FILE, []);
    if (!Array.isArray(alerts)) {
      return res.status(500).json({
        success: false,
        message: "alerts.json must contain an array []",
      });
    }

    const nextId =
      alerts.length > 0 ? Math.max(...alerts.map((a) => Number(a.id) || 0)) + 1 : 1;

    const newAlert = {
      id: nextId,
      patientId: patientId !== undefined ? Number(patientId) : null,
      message: String(message),
      level: level ? String(level) : "warning",
      createdAt: new Date().toISOString(),
    };

    alerts.push(newAlert);
    await writeJSON(ALERTS_FILE, alerts);

    res.status(201).json({ success: true, data: newAlert });
  } catch (err) {
     next(err);
  }
});

const PATIENTS_FILE = "data/patients.json";

router.post("/run", async (req, res, next) => {
  try {
    const patients = await readJSON(PATIENTS_FILE, []);
    const alerts = await readJSON(ALERTS_FILE, []);

    const now = Date.now();
    let created = [];

    for (const p of patients) {
      if (!p.lastMedicationTakenAt) continue;

      const last = Date.parse(p.lastMedicationTakenAt);
      const hoursPassed = (now - last) / (1000 * 60 * 60);

      if (hoursPassed >= 24) {

         const alreadyOpen = alerts.some(
         (a) => a.status === "OPEN" && a.type === "MED_MISSED" && Number(a.patientId) === Number(p.id)
         );

if (alreadyOpen) continue;

        const newAlert = {
          id: alerts.length + 1,
          patientId: p.id,
          type: "MED_MISSED",
          message: `Medication possibly missed for ${p.name}`,
          level: "critical",
          status: "OPEN",
          createdAt: new Date().toISOString(),
        };

        alerts.push(newAlert);
        created.push(newAlert);
      }
    }

    await writeJSON(ALERTS_FILE, alerts);

    res.json({
      success: true,
      message: `Generated ${created.length} alerts`,
      data: created,
    });
  } catch (err) {
     next(err);
  }
});

module.exports = router;