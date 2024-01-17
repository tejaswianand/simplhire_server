const mongoose = require("mongoose");

const applicationsSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    jobId: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    expectedCtc: { type: String, required: true },
    workExperience: { type: String, required: true },
    resumeLink: { type: String, required: true },
    status: { type: String, default: "submitted" },
  },
  { timestamps: true }
);

const Application = mongoose.model("Application", applicationsSchema);

module.exports = Application;
