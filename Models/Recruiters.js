const mongoose = require("mongoose");

const recruiterSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    companyName: { type: String, required: true },
    designation: { type: String, required: true },
    email: { type: String },
    password: { type: String, required: true },
    mobile: { type: String },
    profilePicture: {
      type: String,
      default:
        "https://res.cloudinary.com/dwjisi2ul/image/upload/v1704731906/vcyezkcmwhjhbr1zcezs.jpg",
    },
    userType: { type: String, default: "recruiter" },
    isActive: { type: Boolean, default: false },
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

const Recruiter = mongoose.model("Recruiter", recruiterSchema);

module.exports = Recruiter;
