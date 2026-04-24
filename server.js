// server configuration

require("dotenv").config();
const express = require("express");
const path = require("path");

const connectDB = require("./config/db");



const authRoutes = require("./routes/authRoutes");
const patientRoutes = require("./routes/patientRoutes");
const alertRoutes = require("./routes/alertRoutes");
const uploadRoutes = require("./routes/uploadRoutes");

const logger = require("./middleware/logger"); 
const authMiddleware = require("./middleware/authMiddleware");
const errorHandler = require("./middleware/errorHandler");

const app = express();
connectDB();

const PORT = 3000;

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(logger); 

app.use("/auth", authRoutes);
app.use("/patients", authMiddleware, patientRoutes);
app.use("/alerts", authMiddleware, alertRoutes);
app.use("/upload", authMiddleware, uploadRoutes);
// Serve static files
app.use(express.static(path.join(__dirname, "public")));

// Basic route
app.get("/", (req, res) => {
    res.send("Carvèl server is running");
});

app.use(errorHandler);
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});