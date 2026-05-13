const User = require("../models/User");

const { readJSON, writeJSON } = require("../services/fileStore");
const { sendAlert } = require("../services/emailService");
const { generateHealthReportPDF } = require("../services/pdfService");

const ALERTS_FILE = "data/alerts.json";
const PATIENTS_FILE = "data/patients.json";

// GET ALL ALERTS
exports.getAlerts = async (req, res, next) => {
  try {
    const alerts = await readJSON(ALERTS_FILE, []);

    if (!Array.isArray(alerts)) {
      return res.status(500).json({
        success: false,
        message: "alerts.json must contain an array []"
      });
    }

    res.status(200).json({
      success: true,
      data: alerts
    });

  } catch (err) {
    next(err);
  }
};

// GET ALERT BY ID
exports.getAlertById = async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    const alerts = await readJSON(ALERTS_FILE, []);

    const alert = alerts.find(
      (a) => Number(a.id) === id
    );

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

  } catch (err) {
    next(err);
  }
};

// CREATE ALERT
exports.createAlert = async (req, res, next) => {
  try {
    const {
      patientId,
      patientName,
      message,
      level,
      type,
      title,
      description
    } = req.body;

    if (!message && !description) {
      return res.status(400).json({
        success: false,
        message: "message is required"
      });
    }

    const alerts = await readJSON(ALERTS_FILE, []);

    const nextId =
      alerts.length > 0
        ? Math.max(...alerts.map((a) => Number(a.id) || 0)) + 1
        : 1;

    const newAlert = {
      id: nextId,
      patientId: patientId || null,
      patientName: patientName || null,
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

    // EMAIL FOR CRITICAL ALERTS
    if (level === "critical" || type === "emergency") {
      try {

        const today = new Date().toDateString();

        const allData = await readJSON(PATIENTS_FILE, []);

        const todayVitals = allData.filter(
          (e) =>
            e.type === "vitals" &&
            new Date(e.date).toDateString() === today
        );

        const todayMeds = allData.filter(
          (e) => e.type === "medication"
        );

        const finalPatientName =
          patientName ||
          todayVitals[0]?.patientName ||
          "Patient";

        const familyUsers = await User.find({
          role: "family",
          notifyEmail: {
            $exists: true,
            $ne: null
          },
          patients: {
            $in: [
              new RegExp(
                `^${finalPatientName.trim()}$`,
                "i"
              )
            ]
          }
        });

        const recipients = familyUsers.map(
          (u) => u.notifyEmail
        );

        const pdfBuffer =
          await generateHealthReportPDF({
            date: new Date(),
            patientName: finalPatientName,
            vitals: todayVitals,
            medications: todayMeds,
            status:
              type === "emergency"
                ? "Critical"
                : "Warning"
          });

        await sendAlert({
          subject: `🚨 Carvèl Alert: ${title || "Critical Alert"}`,
          title: `🚨 ${title || "Critical Alert"}`,
          message: message || description,
          details: `Time: ${new Date().toLocaleString("en-IN")} | Level: ${level || "critical"}`,
          recipients,
          pdfBuffer
        });

      } catch (emailErr) {
        console.error(
          "Email error:",
          emailErr.message
        );
      }
    }

    res.status(201).json({
      success: true,
      data: newAlert
    });

  } catch (err) {
    next(err);
  }
};

// AUTO ALERTS
exports.runAutoAlerts = async (req, res, next) => {
  try {
    const patients = await readJSON(PATIENTS_FILE, []);
    const alerts = await readJSON(ALERTS_FILE, []);

    const now = Date.now();

    let created = [];

    for (const p of patients) {

      if (p.type !== "medication") continue;

      if (p.status === "given") continue;

      if (!p.time) continue;

      const [hours, minutes] =
        p.time.split(":").map(Number);

      const today = new Date();

      const scheduledTime = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        hours,
        minutes
      );

      const hoursPassed =
        (now - scheduledTime.getTime()) /
        (1000 * 60 * 60);

      if (hoursPassed >= 1) {

        const alreadyOpen = alerts.some(
          (a) =>
            a.status === "OPEN" &&
            a.type === "MED_MISSED" &&
            a.medication === p.medication
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

        const missedFamilyUsers =
          await User.find({
            role: "family",
            notifyEmail: {
              $exists: true,
              $ne: null
            },
            patients: {
              $in: [
                new RegExp(
                  `^${p.patientName.trim()}$`,
                  "i"
                )
              ]
            }
          });

        const missedRecipients =
          missedFamilyUsers.map(
            (u) => u.notifyEmail
          );

        await sendAlert({
          subject: `💊 Missed Medication: ${p.medication}`,
          title: `💊 Missed Medication Alert`,
          message: `${p.medication} was not given to ${p.patientName}`,
          details: `Scheduled time: ${p.time} | Dosage: ${p.dosage || "N/A"} | Date: ${new Date().toLocaleDateString("en-IN")}`,
          recipients: missedRecipients
        });
      }
    }

    await writeJSON(ALERTS_FILE, alerts);

    res.json({
      success: true,
      message: `Generated ${created.length} alerts`,
      data: created
    });

  } catch (err) {
    next(err);
  }
};