const mongoose = require("mongoose");

const applicationsSchema = new mongoose.Schema(
  {
    postedBy: { type: String, required: true },
    submittedBy: { type: String, required: true },
    appliedFor: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    expectedCTC: { type: String, required: true },
    experience: { type: String, required: true },
  },
  { timestamps: true }
);

const Application = mongoose.model("Application", applicationsSchema);

module.exports = Application;
