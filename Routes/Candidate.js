const express = require("express");
const router = express.Router();
const Candidate = require("../Models/Candidate");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const axios = require("axios");

const transporter = nodemailer.createTransport({
  host: "server5.dnspark.in",
  port: 465,
  auth: {
    user: "simplhire@focushub.cloud",
    pass: "simplhire@proton.me",
  },
});

router.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const userExists = await Candidate.findOne({ email: email });
    if (userExists) {
      return res.status(409).json({
        status: false,
        message: "User Already Registered",
      });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new Candidate({
      name,
      email,
      password: hashedPassword,
    });
    await user.save();
    const token = jwt.sign({ userId: user._id }, process.env.JWT_KEY, {
      expiresIn: "1h",
    });
    await Candidate.findOneAndUpdate(
      { email: email },
      { $push: { token: token } },
      { new: true }
    );
    const activationLink = `${process.env.APP_URL}/auth/activate-account/${token}/candidate`;
    await transporter.sendMail({
      from: '"SimplHire" <simplhire@focushub.cloud>',
      to: email,
      subject: "Activate your SimplHire (Candidate) Account",
      text: `Hi ${name}, Thank you for registering on SimplHire. Welcome onboard! Please activate your account by clicking on ${activationLink}, This Link is Valid for 1 Day Only`,
      html: `Hi ${name}, Thank you for registering on SimplHire. Welcome onboard! Please activate your account by clicking on ${activationLink}, This Link is Valid for 1 Day Only`,
    });
    res.status(201).json({
      status: true,
      message:
        "Account Created, Please check your email and activate your account",
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: "Something went wrong",
      error: error,
    });
    console.log(error);
  }
});
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    // Check if the company with the given email exists
    const user = await Candidate.findOne({ email: email });
    if (!user) {
      return res.status(409).json({
        status: false,
        message: "Invalid Credentials",
      });
    }
    // Compare Password
    const matchPassword = await bcrypt.compare(password, user.password);
    if (!matchPassword) {
      return res.status(409).json({
        status: false,
        message: "Invalid Credentials",
      });
    }
    // Check if account active
    const isAccountActive = user.isActive;
    if (!isAccountActive) {
      return res.status(409).json({
        status: false,
        message: "Account Not Activated",
      });
    }
    // Generate a Token with expiry 1 Hour
    const token = jwt.sign({ userId: user._id }, process.env.JWT_KEY, {
      expiresIn: "1h",
    });
    res.status(200).json({
      status: true,
      token: token,
      userId: user._id,
      message: "Logged In",
      userType: "candidate",
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: "Something went wrong",
    });
  }
});
router.put("/activate-account/:token", async (req, res) => {
  const token = req.params.token;
  try {
    // Find Company Using Token
    const user = await Candidate.findOne({ token: token });
    if (!user) {
      return res.status(404).json({
        status: false,
        message: "Invalid Token",
      });
    }
    // Check if already activated
    const isAlreadyActive = user.isActive;
    if (isAlreadyActive) {
      return res.status(409).json({
        status: false,
        message: "Account Already Activated",
      });
    }
    // Activate
    await Candidate.findOneAndUpdate(
      { token: token },
      { $set: { isActive: true } },
      { new: true }
    );
    return res.status(200).json({
      status: true,
      message: `Account Activated! ${user.email}`,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      message: "Something Went Wrong",
    });
  }
});

router.get("/find/:id", async (req, res) => {
  try {
    const user = await Candidate.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ status: false, message: "Invalid User" });
    }
    res.status(200).json({ user });
  } catch (error) {
    return res
      .status(500)
      .json({ status: false, message: "Something Went Wrong" });
  }
});

router.put("/save-job", async (req, res) => {
  console.log("save api hit");
  const { userId, jobId } = req.body;
  try {
    const user = await Candidate.findOne({ _id: userId });
    if (!user) {
      return res.status(409).json({
        status: false,
        message: "Invalid Credentials",
      });
    }

    // Check if jobId is already in the savedJobs array
    if (user.savedJobs.includes(jobId)) {
      return res.status(200).json({
        status: true,
        message: `Job already saved`,
      });
    }

    // If not present, add jobId to the savedJobs array
    await Candidate.findOneAndUpdate(
      { _id: userId },
      { $addToSet: { savedJobs: jobId } }
    );
    res.status(200).json({
      status: true,
      message: `Saved`,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: false,
      message: `Something Went Wrong`,
    });
  }
});

router.put("/unsave-job", async (req, res) => {
  console.log("unsave api hit");

  const { userId, jobId } = req.body;
  try {
    const user = await Candidate.findOne({ _id: userId });
    if (!user) {
      return res.status(409).json({
        status: false,
        message: "Invalid Credentials",
      });
    }

    // Check if jobId is in the savedJobs array
    if (!user.savedJobs.includes(jobId)) {
      return res.status(200).json({
        status: true,
        message: `Job not found in saved jobs`,
      });
    }

    // If jobId is present, remove it from the savedJobs array
    await Candidate.findOneAndUpdate(
      { _id: userId },
      { $pull: { savedJobs: jobId } }
    );
    res.status(200).json({
      status: true,
      message: `Removed from saved jobs`,
    });
  } catch (error) {
    res.status(500).json({
      status: true,
      message: `Something Went Wrong`,
    });
  }
});

router.post("/upload-resume/:id", async (req, res) => {
  try {
    const response = await axios.post(
      `https://www.filestackapi.com/api/store/S3?key=${process.env.FILESTACK_API_KEY}`,
      req.files.resume.data,
      {
        headers: { "Content-Type": "application/pdf" },
      }
    );
    await Candidate.findOneAndUpdate(
      { _id: req.params.id },
      {
        $push: {
          resume: { name: req.body.resumeName, fileLink: response.data.url },
        },
      }
    );
    res.json(response.data);
  } catch (error) {
    console.error("Error uploading resume:", error);
    res.status(500).json({ status: false, message: "Something Went Wrong" });
  }
});

router.put("/delete-resume/:id/:resumeId", async (req, res) => {
  try {
    const job = await Candidate.findOneAndUpdate(
      { _id: req.params.id },
      {
        $pull: {
          resume: { _id: req.params.resumeId },
        },
      }
    );
    if (!job) {
      res.status(404).json({ status: false, message: "Job not found" });
      return;
    }
    res.status(200).json({ status: true, message: "Job deleted successfully" });
  } catch (error) {
    res.status(500).json({ status: false, message: "Something Went Wrong" });
  }
});

module.exports = router;
