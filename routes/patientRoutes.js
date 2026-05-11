const express = require("express");
const router = express.Router();

router.use((req, res, next) => {
    console.log("Patients Router Middleware Running");
    next();
});

const { readJSON, writeJSON } = require("../services/fileStore");
const PATIENTS_FILE = "data/patients.json";

// GET all patients
router.get("/", async (req, res, next) => {
  try {
    const age = parseInt(req.query.age);
    const patients = await readJSON(PATIENTS_FILE, []);

    let filteredPatients = patients;

    // Caretaker sirf apne patients dekhe
    if (req.user && req.user.role === "caretaker") {
      filteredPatients = patients.filter(
        (p) => p.loggedBy === req.user.username
      );
    }

    // Age filter
    if (!isNaN(age)) {
      filteredPatients = filteredPatients.filter(
        (p) => Number(p.age) === age
      );
    }

    res.status(200).json({
      success: true,
      data: filteredPatients,
    });
  } catch (err) {
    next(err);
  }
});

// POST create patient
router.post("/", async (req, res, next) => {
  try {
    const patients = await readJSON(PATIENTS_FILE, []);

    const newEntry = {
      id: patients.length + 1,
      ...req.body,
      loggedBy: req.user.username  // automatically nurse ka username lagega
    };

    patients.push(newEntry);
    await writeJSON(PATIENTS_FILE, patients);

    res.json({
      success: true,
      data: newEntry
    });

  } catch (err) {
    console.error("POST ERROR:", err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

// PUT update patient
router.put("/:id", async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid patient ID",
      });
    }

    const patients = await readJSON(PATIENTS_FILE, []);

    if (!Array.isArray(patients)) {
      return res.status(500).json({
        success: false,
        message: "patients.json must contain an array []",
      });
    }

    const index = patients.findIndex((p) => Number(p.id) === id);
    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    // Caretaker sirf apna data edit kare
    if (
      req.user.role === "caretaker" &&
      patients[index].loggedBy !== req.user.username
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied — not your patient",
      });
    }

    const { name, age } = req.body;
    if (name !== undefined) patients[index].name = String(name).trim();
    if (age !== undefined) {
      const ageNum = Number(age);
      if (Number.isNaN(ageNum) || ageNum <= 0) {
        return res.status(400).json({
          success: false,
          message: "Age must be a valid number",
        });
      }
      patients[index].age = ageNum;
    }

    await writeJSON(PATIENTS_FILE, patients);
    res.status(200).json({ success: true, data: patients[index] });
  } catch (err) {
    next(err);
  }
});

// DELETE patient
router.delete("/:id", async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid patient ID",
      });
    }

    const patients = await readJSON(PATIENTS_FILE, []);

    const index = patients.findIndex((p) => Number(p.id) === id);
    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    // Caretaker sirf apna data delete kare
    if (
      req.user.role === "caretaker" &&
      patients[index].loggedBy !== req.user.username
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied — not your patient",
      });
    }

    patients.splice(index, 1);
    await writeJSON(PATIENTS_FILE, patients);
    res.status(200).json({ success: true, message: "Patient deleted" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;