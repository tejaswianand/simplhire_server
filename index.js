const express = require("express");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const cors = require("cors");
const mongoose = require("mongoose");
const candidateRoutes = require("./Routes/Candidate");
const recruiterRoutes = require("./Routes/Recruiter");
const jobsRoutes = require("./Routes/Job");
const expressUploader = require("express-fileupload");
const fetch = require("node-fetch");
const axios = require("axios");

const app = express();
dotenv.config();
app.use(bodyParser.json());
var corsOptions = {
  origin: ["http://localhost:3000", "http://192.168.1.6:3000"],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(expressUploader());
mongoose.connect(process.env.DB_URL);

mongoose.connection.on("connected", () => {
  console.log("Connected to MongoDB");
});

mongoose.connection.on("error", (err) => {
  console.error("MongoDB connection error:", err);
});

app.post("/upload-resume", async (req, res) => {
  try {
    const response = await axios.post(
      `https://www.filestackapi.com/api/store/S3?key=${process.env.FILESTACK_API_KEY}`,
      req.files.resume.data,
      {
        headers: { "Content-Type": "application/pdf" },
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error("Error uploading resume:", error);
    res.status(500).json({ status: false, message: "Something Went Wrong" });
  }
});

app.use("/recruiter", recruiterRoutes);
app.use("/candidate", candidateRoutes);
app.use("/jobs", jobsRoutes);

const PORT = process.env.PORT || 5002;
app.get("/", (req, res) => {
  res.send("Server is up and running");
});
app.listen(PORT, (req, res) => {
  console.log("Server is up and running");
});
