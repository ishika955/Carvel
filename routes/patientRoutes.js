// const express = require("express");
// const router = express.Router();

// const authMiddleware = require("../middleware/authMiddleware");
// const { requireRole } = require("../middleware/authMiddleware");

// const Patient = require("../models/Patient");
// const User = require("../models/User");

// const { readJSON, writeJSON } = require("../services/fileStore");
// const { sendAlert } = require("../services/emailService");

// const PATIENTS_FILE = "data/patients.json";

// router.use((req, res, next) => {
//   console.log("Patients Router Middleware Running");
//   next();
// });

// // GET all patients
// router.get("/", authMiddleware, async (req, res, next) => {
//   try {
//     const age = parseInt(req.query.age);
//     const patients = await readJSON(PATIENTS_FILE, []);
//     let filteredPatients = patients;

//     if (req.user && req.user.role === "caretaker") {
//       filteredPatients = patients.filter(
//         (p) => p.loggedBy === req.user.username
//       );
//     }

// //     if (req.user && req.user.role === "family") {
// //       const users = await readJSON("data/users.json", []);
// // const familyUser = users.find((u) => u.username === req.user.username);
// // const myPatients = familyUser?.patients || [];

// //       filteredPatients = patients.filter((p) =>
// //         myPatients.includes(p.patientName || p.name)
// //       );
// //     }
// if (req.user && req.user.role === "family") {
//   filteredPatients = patients;
// }

//     if (!isNaN(age)) {
//       filteredPatients = filteredPatients.filter(
//         (p) => Number(p.age) === age
//       );
//     }

//     res.status(200).json({ success: true, data: filteredPatients });
//   } catch (err) {
//     next(err);
//   }
// });

// // GET timetable
// router.get("/:id/timetable", authMiddleware, async (req, res, next) => {
//   try {
//     let patient = null;

//     if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
//       patient = await Patient.findById(req.params.id);
//     } else {
//       patient = await Patient.findOne({ name: req.params.id });
//     }

//     if (!patient) {
//       return res.status(404).json({
//         success: false,
//         message: "Patient not found",
//       });
//     }

//     res.json({
//       success: true,
//       data: patient.medicineTimetable || {},
//     });
//   } catch (err) {
//     next(err);
//   }
// });

// // PUT timetable — family only
// router.put(
//   "/:id/timetable",
//   authMiddleware,
//   requireRole("family"),
//   async (req, res, next) => {
//     try {
//       let patient = null;

//       if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
//         patient = await Patient.findByIdAndUpdate(
//           req.params.id,
//           { medicineTimetable: req.body.timetable },
//           { new: true }
//         );
//       } else {
//         patient = await Patient.findOneAndUpdate(
//           { name: req.params.id },
//           { medicineTimetable: req.body.timetable },
//           { new: true, upsert: true }
//         );
//       }

//       if (!patient) {
//         return res.status(404).json({
//           success: false,
//           message: "Patient not found",
//         });
//       }

//       res.json({
//         success: true,
//         data: patient.medicineTimetable,
//       });
//     } catch (err) {
//       next(err);
//     }
//   }
// );

// // POST create patient
// router.post("/", authMiddleware, async (req, res, next) => {
//   try {
//     const patients = await readJSON(PATIENTS_FILE, []);

//     if (!Array.isArray(patients)) {
//       return res.status(500).json({
//         success: false,
//         message: "patients.json must contain an array []",
//       });
//     }

//     const newEntry = {
//       id: patients.length + 1,
//       ...req.body,
//       loggedBy: req.user.username,
//     };

//     patients.push(newEntry);
//     await writeJSON(PATIENTS_FILE, patients);

//     const patientName = newEntry.patientName || newEntry.name;

//     // INSTANT VITALS ALERT
//     if (newEntry.type === "vitals") {
//       const temp = Number(newEntry.temperature);
//       const o2 = Number(newEntry.oxygen);
//       const pulse = Number(newEntry.pulse);

//       const isAbnormal = temp >= 102 || o2 < 90 || pulse > 120;

//       if (isAbnormal) {
//         const familyUsers = await User.find({
//           role: "family",
//           notifyEmail: { $exists: true, $ne: null },
//           patients: patientName,
//         });

//         const alerts = [];

//         if (temp >= 102) alerts.push(`🌡️ High Fever: ${temp}°F`);
//         if (o2 < 90) alerts.push(`💨 Low Oxygen: ${o2}%`);
//         if (pulse > 120) alerts.push(`💓 High Pulse: ${pulse} bpm`);

//         for (const family of familyUsers) {
//           await sendAlert({
//             subject: `🚨 Carvèl Alert — ${patientName} needs attention`,
//             title: "🚨 Abnormal Vitals Detected",
//             message: `Abnormal vitals recorded for ${patientName}.`,
//             details: alerts.join(" | "),
//             recipients: [family.notifyEmail],
//           });

//           console.log(`🚨 Instant alert sent to ${family.notifyEmail}`);
//         }
//       }
//     }

//     // MISSED / REFUSED MEDICATION ALERT
//     if (
//       newEntry.type === "medication" &&
//       (newEntry.status === "missed" || newEntry.status === "refused")
//     ) {
//       const familyUsers = await User.find({
//         role: "family",
//         notifyEmail: { $exists: true, $ne: null },
//         patients: patientName,
//       });

//       for (const family of familyUsers) {
//         await sendAlert({
//           subject: `💊 Carvèl Alert — Medication ${newEntry.status} for ${patientName}`,
//           title: `💊 Medication ${
//             newEntry.status === "missed" ? "Missed" : "Refused"
//           }`,
//           message: `${patientName} has ${newEntry.status} their medication.`,
//           details: `Medicine: ${newEntry.medication || "—"} | Dose: ${
//             newEntry.dosage || "—"
//           } | Time: ${newEntry.time || "—"}`,
//           recipients: [family.notifyEmail],
//         });

//         console.log(`💊 Med alert sent to ${family.notifyEmail}`);
//       }
//     }

//     res.json({
//       success: true,
//       data: newEntry,
//     });
//   } catch (err) {
//     console.error("POST ERROR:", err);
//     res.status(500).json({
//       success: false,
//       message: err.message,
//     });
//   }
// });

// // PUT update patient
// router.put("/:id", authMiddleware, async (req, res, next) => {
//   try {
//     const id = parseInt(req.params.id);

//     if (isNaN(id)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid patient ID",
//       });
//     }

//     const patients = await readJSON(PATIENTS_FILE, []);

//     if (!Array.isArray(patients)) {
//       return res.status(500).json({
//         success: false,
//         message: "patients.json must contain an array []",
//       });
//     }

//     const index = patients.findIndex((p) => Number(p.id) === id);

//     if (index === -1) {
//       return res.status(404).json({
//         success: false,
//         message: "Patient not found",
//       });
//     }

//     if (
//       req.user.role === "caretaker" &&
//       patients[index].loggedBy !== req.user.username
//     ) {
//       return res.status(403).json({
//         success: false,
//         message: "Access denied — not your patient",
//       });
//     }

//     const { name, patientName, age } = req.body;

//     if (name !== undefined) patients[index].name = String(name).trim();
//     if (patientName !== undefined)
//       patients[index].patientName = String(patientName).trim();

//     if (age !== undefined) {
//       const ageNum = Number(age);

//       if (Number.isNaN(ageNum) || ageNum <= 0) {
//         return res.status(400).json({
//           success: false,
//           message: "Age must be a valid number",
//         });
//       }

//       patients[index].age = ageNum;
//     }

//     await writeJSON(PATIENTS_FILE, patients);

//     res.status(200).json({
//       success: true,
//       data: patients[index],
//     });
//   } catch (err) {
//     next(err);
//   }
// });

// // DELETE patient
// router.delete("/:id", authMiddleware, async (req, res, next) => {
//   try {
//     const id = parseInt(req.params.id);

//     if (isNaN(id)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid patient ID",
//       });
//     }

//     const patients = await readJSON(PATIENTS_FILE, []);
//     const index = patients.findIndex((p) => Number(p.id) === id);

//     if (index === -1) {
//       return res.status(404).json({
//         success: false,
//         message: "Patient not found",
//       });
//     }

//     if (
//       req.user.role === "caretaker" &&
//       patients[index].loggedBy !== req.user.username
//     ) {
//       return res.status(403).json({
//         success: false,
//         message: "Access denied — not your patient",
//       });
//     }

//     patients.splice(index, 1);
//     await writeJSON(PATIENTS_FILE, patients);

//     res.status(200).json({
//       success: true,
//       message: "Patient deleted",
//     });
//   } catch (err) {
//     next(err);
//   }
// });

// module.exports = router;
const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/authMiddleware");

const {
  getPatients,
  getTimetable,
  updateTimetable,
  createPatient,
  updatePatient,
  deletePatient
} = require("../controllers/patientController");

router.get("/", authMiddleware, getPatients);

router.get("/:id/timetable", authMiddleware, getTimetable);

router.put(
  "/:id/timetable",
  authMiddleware,
  requireRole("family"),
  updateTimetable
);

router.post("/", authMiddleware, createPatient);

router.put("/:id", authMiddleware, updatePatient);

router.delete("/:id", authMiddleware, deletePatient);

module.exports = router;