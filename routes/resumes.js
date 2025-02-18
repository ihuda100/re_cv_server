var express = require("express");
const { ResumeModel, validResume } = require("../models/resumeModel");
const { auth, authAdmin } = require("../middlewares/auth");
const { convertPDFToJson, cvUpgrade } = require("../middlewares/gpt");
const { pdfGeneret } = require("../middlewares/pdfStyle");
var router = express.Router();
const fs = require("fs");
const multer = require("multer");
const { log } = require("util");
const { error } = require("console");
const { resourceLimits } = require("worker_threads");
const jwt = require("jsonwebtoken");
const upload = multer({ dest: "uploads/" });

/* GET home page. */
router.get("/", (req, res, next) => {
  res.json({ msg: "Work from resumes.js" });
});

//GET information on client by ID for Admin
router.get("/userlist/:id", authAdmin, async (req, res, next) => {
  let id = req.params.id;
  try {
    let userList = await ResumeModel.find({ _idUser: id });
    userList = userList.filter((resume) => resume.ifUpdate )
    if (userList.length == 0) {
      return res.status(404).json({ error: "No resumes found for this ID" });
    }
    res.status(200).json(userList);
  } catch (err) {
    res.status(404).json({ error: "dont have resumes in this id" });
  }
});
// Convert from PDF to json
router.post("/convert", auth, upload.single("file"), async (req, res, next) => {
  try {
    let json;
    try {
      json = await convertPDFToJson(req.file.path);
      fs.unlinkSync(req.file.path);
    } catch (error) {
      fs.unlinkSync(req.file.path);
      return res.status(422).json({ message: error.message });
    }
    let validBody = validResume(json);
    if (validBody.error) {
      return res.status(400).json(validBody.error.details);
    }
    let _idUser = req.tokenData._id;
    let upgrateData;
    try {
      upgrateData = await cvUpgrade(json);
    } catch (error) {
      return res.status(422).json({ message: error.message });
    }
    let resume = new ResumeModel(upgrateData);
    resume._idUser = _idUser;
    const data = await resume.save();
    console.log(data);
    res.status(201).json(data);
  } catch (error) {
    res.status(401).json(error);
  }
});

// Upgrades the resume
router.post("/upgrade", auth, async (req, res, next) => {
  let validBody = validResume(req.body);
  if (validBody.error) {
    return res.status(400).json(validBody.error.details);
  }
  let _idUser = req.tokenData._id;
  let data = req.body;
  try {
    let upgrateData;
    try {
      upgrateData = await cvUpgrade(data);
    } catch (error) {
      return res.status(422).json({ message: error.message });
    }
    let resume = new ResumeModel(upgrateData);
    resume._idUser = _idUser;
    await resume.save();
    res.status(201).json(resume);
  } catch (error) {
    res.status(401).json(error);
  }
});

// Updates the resume after change and approval
router.post("/update", async (req, res, next) => {
  let validBody = validResume(req.body);
  if (validBody.error) {
    return res.status(400).json(validBody.error.details);
  }
  try {
    let data = req.body;
    let resume = await ResumeModel.findOne({ _id: data._id });
    resume = data;
    resume.ifUpdate = true;
    let updateData = await ResumeModel.updateOne({ _id: resume._id }, resume);
    res.status(200).json(updateData);
  } catch (err) {
    res.status(401).json(err);
  }
});

// get resume information for client
router.post("/getinfo", async (req, res, next) => {
  try {
    let _id = req.body.id;
    const resume = await ResumeModel.findOne({ _id });
    if (resume.ifUpdate == false) {
      return res.status(400).json({ message: "Please verify you resumes" });
    }
    res.status(200).json(resume);
  } catch (err) {
    res.status(404).json({ err, message: "the _id is not found" });
  }
});

router.get("/history", auth, async (req, res, next) => {
  const _idUser = req.tokenData._id;
  try {
    let history = await ResumeModel.find({ _idUser: _idUser });
    history = history.filter((resume) => resume.ifUpdate)
    if (history.length == 0) {
      return res.status(404).json({ error: "No resumes found" });
    }
    res.status(200).json(history);
  } catch (err) {
    res.status(404).json(err);
  }
});

//  Choosing template
router.patch("/template", async (req, res) => {
  let thisTemplate = req.body.template;
  let _id = req.body.id; 
  try {
    let resume = await ResumeModel.findOne({ _id });
    console.log(resume);
    resume.template = thisTemplate;
    let newData = await ResumeModel.updateOne({ _id: resume._id }, resume);
    res.status(200).json(newData);
  } catch (err) {
    console.log(err);
    return res.status(500).json(err);
  }
});

module.exports = router;
