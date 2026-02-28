const express = require("express");
const path = require("path");
const authRoutes = require("./routes/authRoutes");
const patientRoutes = require("./routes/patientRoutes");
const alertRoutes = require("./routes/alertRoutes");


const app = express();
const PORT = 3000;

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/auth", authRoutes);
app.use("/patients", patientRoutes);
app.use("/alerts", alertRoutes);

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

// Basic route
app.get("/", (req, res) => {
    res.send("Carvèl server is running");
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});