const mongoose = require("mongoose");

const timeSlotSchema = new mongoose.Schema({
  morning:   { type: String, default: "" },
  afternoon: { type: String, default: "" },
  evening:   { type: String, default: "" },
  night:     { type: String, default: "" }
}, { _id: false });

const patientSchema = new mongoose.Schema({
  name:      { type: String, required: true },
  age:       { type: Number },
  loggedBy:  { type: String }, // caretaker username
  medicineTimetable: {
    Monday:    { type: timeSlotSchema, default: {} },
    Tuesday:   { type: timeSlotSchema, default: {} },
    Wednesday: { type: timeSlotSchema, default: {} },
    Thursday:  { type: timeSlotSchema, default: {} },
    Friday:    { type: timeSlotSchema, default: {} },
    Saturday:  { type: timeSlotSchema, default: {} },
    Sunday:    { type: timeSlotSchema, default: {} },
  }
}, { timestamps: true });

module.exports = mongoose.model("Patient", patientSchema);