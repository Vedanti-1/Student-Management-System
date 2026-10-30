const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const app = express();

const allowedOrigins = [
  "https://vedanti-student-portal-291047.vercel.app",
  "http://localhost:5000",
  "http://localhost:5500",
  "http://localhost:3000",
  "http://127.0.0.1:5500"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || !process.env.FRONTEND_URL || process.env.FRONTEND_URL === "*") {
      return callback(null, true);
    }
    if (allowedOrigins.includes(origin) || origin === process.env.FRONTEND_URL || origin.endsWith(".vercel.app")) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

// Identify frontend directory (handles both local repo and Docker container setups)
const possibleFrontendDirs = [
  path.resolve(__dirname, "../frontend"),
  path.resolve(__dirname, "frontend"),
  path.resolve(process.cwd(), "frontend")
];
const frontendDir = possibleFrontendDirs.find(dir => fs.existsSync(dir)) || possibleFrontendDirs[0];

// Serve static frontend assets
if (fs.existsSync(frontendDir)) {
  app.use(express.static(frontendDir));
}

// Student schema
const studentSchema = new mongoose.Schema(
  {
    studentId: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      trim: true
    },
    department: {
      type: String,
      required: true,
      trim: true
    },
    semester: {
      type: Number,
      required: true
    },
    contact: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
);

const Student = mongoose.model("Student", studentSchema);

// Health check endpoints
app.get(["/health", "/api/health", "/api"], (req, res) => {
  res.json({
    status: "ok",
    message: "Student Management API is running",
    database: mongoose.connection.readyState === 1
      ? "connected"
      : "disconnected"
  });
});

// Fallback for root: serve index.html if frontend is present, otherwise send API status
app.get("/", (req, res) => {
  const indexPath = path.join(frontendDir, "index.html");
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  res.json({
    message: "Student Management API is running",
    database: mongoose.connection.readyState === 1
      ? "connected"
      : "disconnected"
  });
});

// Get all students
app.get("/api/students", async (req, res) => {
  try {
    const students = await Student.find().sort({ createdAt: -1 });
    res.json(students);
  } catch (error) {
    console.error("Fetch students error:", error.message);
    res.status(500).json({ message: "Failed to fetch students" });
  }
});

// Get student by MongoDB ID or studentId
app.get("/api/students/:id", async (req, res) => {
  try {
    const id = req.params.id;

    const student = mongoose.isValidObjectId(id)
      ? await Student.findById(id)
      : await Student.findOne({ studentId: id });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.json(student);
  } catch (error) {
    console.error("Find student error:", error.message);
    res.status(400).json({ message: "Invalid student ID" });
  }
});

// Add student
app.post("/api/students", async (req, res) => {
  try {
    const student = await Student.create(req.body);

    res.status(201).json({
      message: "Student added successfully",
      student
    });
  } catch (error) {
    console.error("Add student error:", error.message);

    res.status(error.code === 11000 ? 409 : 400).json({
      message: error.code === 11000
        ? "Student ID already exists"
        : "Could not add student. Check the required fields."
    });
  }
});

// Update student
app.put("/api/students/:id", async (req, res) => {
  try {
    const id = req.params.id;

    const student = mongoose.isValidObjectId(id)
      ? await Student.findByIdAndUpdate(id, req.body, {
          new: true,
          runValidators: true
        })
      : await Student.findOneAndUpdate(
          { studentId: id },
          req.body,
          { new: true, runValidators: true }
        );

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.json({
      message: "Student updated successfully",
      student
    });
  } catch (error) {
    console.error("Update student error:", error.message);
    res.status(400).json({ message: "Could not update student" });
  }
});

// Delete student
app.delete("/api/students/:id", async (req, res) => {
  try {
    const id = req.params.id;

    const student = mongoose.isValidObjectId(id)
      ? await Student.findByIdAndDelete(id)
      : await Student.findOneAndDelete({ studentId: id });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.json({ message: "Student deleted successfully" });
  } catch (error) {
    console.error("Delete student error:", error.message);
    res.status(400).json({ message: "Could not delete student" });
  }
});

// Server configuration
const PORT = process.env.PORT || 5000;

async function startServer() {
  const mongoUri = process.env.MONGODB_URI;

  if (
    !mongoUri ||
    !/^mongodb(\+srv)?:\/\//.test(mongoUri.trim())
  ) {
    console.error(
      "MONGODB_URI is missing or invalid. Check Render Environment Variables."
    );
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri.trim(), {
      serverSelectionTimeoutMS: 15000
    });

    console.log("Connected to MongoDB Atlas");

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    // Do not log credentials or the connection string.
    console.error("Database connection failed:", error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
