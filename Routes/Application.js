const express = require("express");
const router = express.Router();
const Application = require("../Models/Applications");
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

router.post("/create", async (req, res) => {
  try {
    const {
      jobId,
      userId,
      name,
      email,
      phone,
      workExperience,
      expectedCtc,
      resumeLink,
    } = req.body;

    const applicationExists = await Application.findOne({
      jobId: jobId,
      userId: userId,
    });

    if (applicationExists) {
      res.status(409).json({ status: false, message: "Already Applied" });
      return;
    }

    // Create a new Application instance using the data from req.body
    const application = new Application({
      jobId,
      userId,
      name,
      email,
      phone,
      workExperience,
      expectedCtc,
      resumeLink,
    });

    await application.save();
    const applicationFind = await Application.findOne({
      jobId: jobId,
      userId: userId,
    });
    await transporter.sendMail({
      from: '"SimplHire" <simplhire@focushub.cloud>',
      to: email,
      subject: "Application Submited",
      text: `Hi ${name}, Your application has been successfully submitted<br/> Your Application ID is ${applicationFind.id}. View more details in My Applications Section of your <a href="${process.env.APP_URL}/>profile">Profile</a>.`,
      html: `Hi ${name}, Your application has been successfully submitted<br/> Your Application ID is ${applicationFind.id}. View more details in My Applications Section of your <a href="${process.env.APP_URL}/>profile">Profile</a>`,
    });
    res.status(200).json({ status: true, message: "Application Submitted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false, message: "Something Went Wrong" });
  }
});

router.post("/check-status", async (req, res) => {
  try {
    const application = await Application.findOne({
      jobId: req.body.jobId,
      userId: req.body.userId,
    });
    if (!application) {
      res.status(404).json({ status: false, message: "You have not applied" });
      return;
    }
    res.status(200).json({ status: true, application });
  } catch (error) {
    console.log(error);
    res.status(500).json({ status: false, message: "Something Went Wrong" });
  }
});

router.get("/findByUserId/:userId", async (req, res) => {
  try {
    const application = await Application.find({
      userId: req.params.userId,
    });
    if (!application) {
      res.status(404).json({ status: false, message: "You have not applied" });
      return;
    }
    res.status(200).json({ status: true, application });
  } catch (error) {
    console.log(error);
    res.status(500).json({ status: false, message: "Something Went Wrong" });
  }
});

router.get("/findByJobId/:jobId", async (req, res) => {
  try {
    const application = await Application.find({
      jobId: req.params.jobId,
    });
    if (!application) {
      res.status(404).json({ status: false, message: "You have not applied" });
      return;
    }
    res.status(200).json({ status: true, application });
  } catch (error) {
    console.log(error);
    res.status(500).json({ status: false, message: "Something Went Wrong" });
  }
});

router.put("/change-status", async (req, res) => {
  const { appId, status } = req.body;
  try {
    const application = await Application.findOne({ _id: appId });
    const update = await Application.findOneAndUpdate(
      {
        _id: appId,
      },
      { $set: { status: status } }
    );
    await transporter.sendMail({
      from: '"SimplHire" <simplhire@focushub.cloud>',
      to: application.email,
      subject: "Application Status Changed",
      text: `Hi ${application.name}, Your application status has been changed to <b>${status}</b><br/> Your Application ID is ${application._id}. View more details in My Applications Section of your <a href="${process.env.APP_USER_PROFILE_LINK}">Profile</a>.`,
      html: `Hi ${application.name}, Your application status has been changed to <b>${status}</b><br/> Your Application ID is ${application._id}. View more details in My Applications Section of your <a href="${process.env.APP_USER_PROFILE_LINK}">Profile</a>`,
    });
    res
      .status(200)
      .json({ status: true, message: "Application Status Changed" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ status: false, message: "Something Went Wrong" });
  }
});

router.post("/send-invite", async (req, res) => {
  const {
    appId,
    email,
    name,
    role,
    company,
    inviteMessage,
    inviteMeetLink,
    inviteMeetPassword,
  } = req.body;
  try {
    const application = await Application.find({
      _id: appId,
      email: email,
    });
    if (!application) {
      res.status(404).json({
        status: false,
        message: "Invalid Application, Try Again / Refresh",
      });
      return;
    }
    if (application.status == "invited") {
      res.status(409).json({
        status: false,
        message: "Already Invited",
      });
      return;
    }
    const sendMail = await transporter.sendMail({
      from: '"SimplHire" <simplhire@focushub.cloud>',
      to: email,
      subject: "New Invite Recieved",
      text: `<p>Hii ${name}, You have recieved an Invite for <b>${role}</b> at <b>${company}</b><br/><br/>Your application ID is <b>${appId}</b><br/><br/>${inviteMessage}<br/><br/>Meeting Details:<br/>Link - <a href="${inviteMeetLink}">${inviteMeetLink}</a><br/>Password - ${inviteMeetPassword}<br/><br/>View More Details in your <a href="${process.env.APP_USER_PROFILE_LINK}">Profile</a><div style="color:gray">Do not reply to this email<div></p>`,
      html: `<p>Hii ${name}, You have recieved an Invite for <b>${role}</b> at <b>${company}</b><br/><br/>Your application ID is <b>${appId}</b><br/><br/>${inviteMessage}<br/><br/>Meeting Details:<br/>Link - <a href="${inviteMeetLink}">${inviteMeetLink}</a><br/>Password - ${inviteMeetPassword}<br/><br/>View More Details in your <a href="${process.env.APP_USER_PROFILE_LINK}">Profile</a><div style="color:gray">Do not reply to this email<div></p>`,
    });
    if (!sendMail) {
      res.status(409).json({
        status: false,
        message: "Error while sending invite...Try Again",
      });
      return;
    }
    const update = await Application.findOneAndUpdate(
      {
        _id: appId,
      },
      { $set: { status: "invited" } }
    );
    res.status(200).json({
      status: true,
      message: "Invitation Sent",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ status: false, message: "Something Went Wrong" });
  }
});

module.exports = router;
