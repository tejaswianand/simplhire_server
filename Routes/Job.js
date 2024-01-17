const express = require("express");
const router = express.Router();
const Jobs = require("../Models/Jobs");
const Job = require("../Models/Jobs");

router.post("/create", async (req, res) => {
  const {
    postedBy,
    companyName,
    role,
    location,
    expRequired,
    minSalary,
    maxSalary,
    totalPositions,
    acceptTill,
    description,
  } = req.body;
  try {
    const job = new Jobs({
      postedBy,
      companyName,
      role,
      location,
      expRequired,
      minSalary,
      maxSalary,
      totalPositions,
      acceptTill,
      description,
    });
    await job.save();
    res.status(200).json({ status: true, message: "New Job Added" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ status: false, message: "Something Went Wrong" });
  }
});

router.get("/view-all/:id", async (req, res) => {
  try {
    const jobs = await Jobs.find({ postedBy: req.params.id });
    res.status(200).json({ status: true, jobs });
  } catch (error) {
    res.status(500).json({ status: false, message: "Something Went Wrong" });
  }
});

router.get("/view-all", async (req, res) => {
  try {
    const jobs = await Jobs.find({ isActive: true });
    res.status(200).json({ status: true, jobs });
  } catch (error) {
    res.status(500).json({ status: false, message: "Something Went Wrong" });
  }
});

router.get("/view/:id", async (req, res) => {
  try {
    const job = await Jobs.findOne({ _id: req.params.id });
    if (!job) {
      res.status(500).json({ status: false, message: "Something Went Wrong" });
      return;
    }
    res.status(200).json({ status: true, job });
  } catch (error) {
    res.status(500).json({ status: false, message: "Something Went Wrong" });
  }
});

router.delete("/delete/:id", async (req, res) => {
  try {
    const job = await Jobs.findOneAndDelete({ _id: req.params.id });

    if (!job) {
      res.status(404).json({ status: false, message: "Job not found" });
      return;
    }

    res.status(200).json({ status: true, message: "Job deleted successfully" });
  } catch (error) {
    res.status(500).json({ status: false, message: "Something Went Wrong" });
  }
});

router.put("/change-status/:id", async (req, res) => {
  try {
    const job = await Job.findOne({ _id: req.params.id });
    if (!job) {
      res.status(404).json({ status: false, message: "Invalid Job ID" });
    }
    await Job.findOneAndUpdate(
      { _id: req.params.id },
      { $set: { isActive: !job.isActive } }
    );
    res.status(200).json({ status: true, message: "Status Changed" });
  } catch (error) {
    res.status(500).json({ status: false, message: "Something Went Wrong" });
  }
});

router.put("/update/:id", async (req, res) => {
  try {
    const job = await Job.findOne({ _id: req.params.id });
    if (!job) {
      res.status(404).json({ status: false, message: "Invalid Job ID" });
    }
    await Job.findOneAndUpdate({ _id: req.params.id }, { $set: req.body });
    res.status(200).json({ status: true, message: "Job Details Updated" });
  } catch (error) {
    res.status(500).json({ status: false, message: "Something Went Wrong" });
  }
});

module.exports = router;
