const Patient = require("../models/Patient");
const User = require("../models/User");

const { readJSON, writeJSON } = require("../services/fileStore");
const { sendAlert } = require("../services/emailService");

const PATIENTS_FILE = "data/patients.json";

// GET ALL PATIENTS
exports.getPatients = async (req, res, next) => {
  try {
    const age = parseInt(req.query.age);

    const patients = await readJSON(PATIENTS_FILE, []);
    let filteredPatients = patients;

    if (req.user && req.user.role === "caretaker") {
      filteredPatients = patients.filter(
        (p) => p.loggedBy === req.user.username
      );
    }

    if (req.user && req.user.role === "family") {
      filteredPatients = patients;
    }

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
};

// GET TIMETABLE
exports.getTimetable = async (req, res, next) => {
  try {
    let patient = null;

    if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      patient = await Patient.findById(req.params.id);
    } else {
      patient = await Patient.findOne({ name: req.params.id });
    }

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    res.json({
      success: true,
      data: patient.medicineTimetable || {},
    });
  } catch (err) {
    next(err);
  }
};

// UPDATE TIMETABLE
exports.updateTimetable = async (req, res, next) => {
  try {
    let patient = null;

    if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      patient = await Patient.findByIdAndUpdate(
        req.params.id,
        { medicineTimetable: req.body.timetable },
        { new: true }
      );
    } else {
      patient = await Patient.findOneAndUpdate(
        { name: req.params.id },
        { medicineTimetable: req.body.timetable },
        { new: true, upsert: true }
      );
    }

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    res.json({
      success: true,
      data: patient.medicineTimetable,
    });
  } catch (err) {
    next(err);
  }
};

// CREATE PATIENT
exports.createPatient = async (req, res, next) => {
  try {
    const patients = await readJSON(PATIENTS_FILE, []);

    const newEntry = {
      id: patients.length + 1,
      ...req.body,
      loggedBy: req.user.username,
    };

    patients.push(newEntry);

    await writeJSON(PATIENTS_FILE, patients);

    res.json({
      success: true,
      data: newEntry,
    });
  } catch (err) {
    console.error("POST ERROR:", err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// UPDATE PATIENT
exports.updatePatient = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);

    const patients = await readJSON(PATIENTS_FILE, []);

    const index = patients.findIndex(
      (p) => Number(p.id) === id
    );

    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    patients[index] = {
      ...patients[index],
      ...req.body,
    };

    await writeJSON(PATIENTS_FILE, patients);

    res.status(200).json({
      success: true,
      data: patients[index],
    });
  } catch (err) {
    next(err);
  }
};

// DELETE PATIENT
exports.deletePatient = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);

    const patients = await readJSON(PATIENTS_FILE, []);

    const index = patients.findIndex(
      (p) => Number(p.id) === id
    );

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
};