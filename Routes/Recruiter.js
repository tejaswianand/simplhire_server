const express = require("express");
const router = express.Router();
const Recruiter = require("../Models/Recruiters");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");

const transporter = nodemailer.createTransport({
  host: "server5.dnspark.in",
  port: 465,
  auth: {
    user: "simplhire@focushub.cloud",
    pass: "simplhire@proton.me",
  },
});

router.post("/signup", async (req, res) => {
  const { name, companyName, designation, email, password } = req.body;
  try {
    const userExists = await Recruiter.findOne({ email: email });
    if (userExists) {
      return res.status(409).json({
        status: false,
        message: "User Already Registered",
      });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new Recruiter({
      name,
      companyName,
      designation,
      email,
      password: hashedPassword,
    });
    await user.save();
    const token = jwt.sign({ userId: user._id }, process.env.JWT_KEY, {
      expiresIn: "1h",
    });
    await Recruiter.findOneAndUpdate(
      { email: email },
      { $push: { token: token } },
      { new: true }
    );
    const activationLink = `${process.env.APP_URL}/auth/activate-account/${token}/recruiter`;
    await transporter.sendMail({
      from: '"SimplHire" <simplhire@focushub.cloud>',
      to: email,
      subject: "Activate your SimplHire (Recruiter) Account",
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
    const user = await Recruiter.findOne({ email: email });
    if (!user) {
      return res.status(409).json({
        status: false,
        message: "Invalid Credentials",
      });
    }
    const matchPassword = await bcrypt.compare(password, user.password);
    if (!matchPassword) {
      return res.status(409).json({
        status: false,
        message: "Invalid Credentials",
      });
    }
    const isAccountActive = user.isActive;
    if (!isAccountActive) {
      return res.status(409).json({
        status: false,
        message: "Account Not Activated",
      });
    }
    const token = jwt.sign({ userId: user._id }, process.env.JWT_KEY, {
      expiresIn: "1h",
    });
    res.status(200).json({
      status: true,
      token: token,
      userId: user._id,
      message: "Logged In",
      userType: "recruiter",
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
    const user = await Recruiter.findOne({ token: token });
    if (!user) {
      return res.status(404).json({
        status: false,
        message: "Invalid Token",
      });
    }
    const isAlreadyActive = user.isActive;
    if (isAlreadyActive) {
      return res.status(409).json({
        status: false,
        message: "Account Already Activated",
      });
    }
    await Recruiter.findOneAndUpdate(
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
    const user = await Recruiter.findById(req.params.id).select("-password");
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
module.exports = router;
