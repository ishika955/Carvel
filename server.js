// server configuration
const cors = require("cors");
require("dotenv").config();
const express = require("express");
const path = require("path");
const session = require("express-session");
const passport = require("./config/passport");
const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const patientRoutes = require("./routes/patientRoutes");
const alertRoutes = require("./routes/alertRoutes");
const uploadRoutes = require("./routes/uploadRoutes");

const logger = require("./middleware/logger");
const authMiddleware = require("./middleware/authMiddleware");
const errorHandler = require("./middleware/errorHandler");
const { startScheduler } = require("./services/schedulerService");
startScheduler();
const app = express();
connectDB();

const PORT = 3000;

// Session & Passport
app.use(session({
  secret: process.env.JWT_SECRET,
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://carvel.vercel.app"
  ],
  credentials: true
}));
app.use(logger);

// Routes
app.use("/auth", authRoutes);
app.use("/patients", authMiddleware, patientRoutes);
app.use("/alerts", authMiddleware, alertRoutes);
app.use("/upload", uploadRoutes);

// API routes for React frontend
app.use("/api/auth", authRoutes);
app.use("/api/patients", authMiddleware, patientRoutes);
app.use("/api/alerts", authMiddleware, alertRoutes);
app.use("/api/upload", uploadRoutes);
// Serve static files
app.use(express.static(path.join(__dirname, "views")));

// Basic route
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "index.html"));
});

app.use(errorHandler);
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});