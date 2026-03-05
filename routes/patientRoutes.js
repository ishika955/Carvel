const express = require("express");
const router = express.Router();

router.use((req, res, next) => {
    console.log("Patients Router Middleware Running");
    next();
});

const { readJSON, writeJSON } = require("../services/fileStore");
const PATIENTS_FILE = "data/patients.json";

// GET all patients (with optional age filter)
router.get("/", async (req, res, next) => {
  try {
    const age = parseInt(req.query.age);
    const patients = await readJSON(PATIENTS_FILE, []);

    let filteredPatients = patients;
    if (!isNaN(age)) {
      filteredPatients = patients.filter((p) => Number(p.age) === age);
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
    const { name, age } = req.body;

    if (!name || age === undefined) {
      return res.status(400).json({
        success: false,
        message: "Name and age are required",
      });
    }

    const ageNum = Number(age);
    if (Number.isNaN(ageNum) || ageNum <= 0) {
      return res.status(400).json({
        success: false,
        message: "Age must be a valid number",
      });
    }

    const patients = await readJSON(PATIENTS_FILE, []);

    const nextId =
      patients.length > 0 ? Math.max(...patients.map((p) => Number(p.id) || 0)) + 1 : 1;

    const newPatient = {
      id: nextId,
      name: String(name).trim(),
      age: ageNum,
    };

    patients.push(newPatient);
    await writeJSON(PATIENTS_FILE, patients);

    res.status(201).json({
      success: true,
      data: newPatient,
    });
  } catch (err) {
    next(err);
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

    const { name, age } = req.body;

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

    res.status(200).json({
      success: true,
      data: patients[index],
    });
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

    patients.splice(index, 1);
    await writeJSON(PATIENTS_FILE, patients);

    res.status(200).json({
      success: true,
      message: "Patient deleted",
    });
  } catch (err) {
     next(err);
  }
});

module.exports = router;