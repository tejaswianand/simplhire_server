const mongoose = require("mongoose");

const jobsSchema = new mongoose.Schema(
  {
    postedBy: { type: String, required: true },
    role: { type: String, required: true },
    companyName: { type: String, required: true },
    location: { type: String, required: true },
    expRequired: { type: String, required: true },
    minSalary: { type: String, required: true },
    maxSalary: { type: String, required: true },
    description: { type: String, required: true },
    totalPositions: { type: String, required: true },
    acceptTill: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Job = mongoose.model("Job", jobsSchema);

module.exports = Job;
