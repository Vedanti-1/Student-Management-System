
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || "*"
}));
app.use(express.json());

const studentSchema = new mongoose.Schema({
  studentId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  department: { type: String, required: true },
  semester: { type: Number, required: true },
  contact: { type: String, default: "" }
}, { timestamps: true });

const Student = mongoose.model("Student", studentSchema);

app.get("/", (req, res) => {
  res.json({ message: "Student Management API is running" });
});

// View all students
app.get("/api/students", async (req, res) => {
  try {
    const students = await Student.find().sort({ createdAt: -1 });
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch students" });
  }
});

// Search student by MongoDB ID or studentId
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
          new: true, runValidators: true
        })
      : await Student.findOneAndUpdate(
          { studentId: id }, req.body,
          { new: true, runValidators: true }
        );

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }
    res.json({ message: "Student updated successfully", student });
  } catch (error) {
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
    res.status(400).json({ message: "Could not delete student" });
  }
});

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB Atlas");
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Database connection failed:", error.message);
    process.exit(1);
  }
}

startServer();
