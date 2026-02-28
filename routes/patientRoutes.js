const express = require("express");
const router = express.Router();

let patients = [
    { id: 1, name: "Patient A", age: 70 },
    { id: 2, name: "Patient B", age: 75 }
];

// GET all patients (with optional age filter)

router.get("/", (req, res) => {
    const age = parseInt(req.query.age);

    let filteredPatients = patients;

    if (!isNaN(age)) {
        filteredPatients = patients.filter(p => p.age === age);
    }

    res.status(200).json({
        success: true,
        data: filteredPatients
    });
});




router.post("/", (req, res) => {
    const { name, age } = req.body;

    if (!name || !age) {
        return res.status(400).json({
            success: false,
            message: "Name and age are required"
        });
    }

    const newPatient = {
        id: patients.length + 1,
        name,
        age
    };

    patients.push(newPatient);

    res.status(201).json({
        success: true,
        data: newPatient
    });
});
router.put("/:id", (req, res) => {
    const id = parseInt(req.params.id);
    const { name, age } = req.body;

    const patient = patients.find(p => p.id === id);

    if (!patient) {
        return res.status(404).json({
            success: false,
            message: "Patient not found"
        });
    }

    patient.name = name || patient.name;
    patient.age = age || patient.age;

    res.status(200).json({
        success: true,
        data: patient
    });
});
router.delete("/:id", (req, res) => {
    const id = parseInt(req.params.id);

    const index = patients.findIndex(p => p.id === id);

    if (index === -1) {
        return res.status(404).json({
            success: false,
            message: "Patient not found"
        });
    }

    patients.splice(index, 1);

    res.status(200).json({
        success: true,
        message: "Patient deleted"
    });
});
module.exports = router;