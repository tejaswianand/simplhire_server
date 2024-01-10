const { string } = require("joi");
const mongoose = require("mongoose");

const candidateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String },
    password: { type: String, required: true },
    mobile: { type: String },
    profilePicture: {
      type: String,
      default:
        "https://res.cloudinary.com/dwjisi2ul/image/upload/v1704731906/vcyezkcmwhjhbr1zcezs.jpg",
    },
    userType: { type: String, default: "candidate" },
    workExperience: { type: String },
    currentCtc: { type: String },
    expectedCtc: { type: String },
    isActive: { type: Boolean, default: false },
    resume: [
      {
        name: {
          type: String,
          required: true,
        },
        fileLink: {
          type: String,
          required: true,
        },
      },
    ],
    savedJobs: [
      {
        type: String,
      },
    ],
    lastLoginIP: {
      type: String,
    },
    lastLoginTime: {
      type: Date,
    },
    token: {
      type: String,
    },
  },
  { timestamps: true }
);

const Candidate = mongoose.model("Candidate", candidateSchema);

module.exports = Candidate;
