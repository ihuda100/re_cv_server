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
const upload = multer({ dest: "uploads/" });

/* GET home page. */
router.get("/", (req, res, next) => {
  res.json({ msg: "Work from resumes.js" });
});

//GET information on client by ID for Admin
router.get("/userlist/:id", authAdmin, async (req, res, next) => {
  let id = req.params.id;
  try {
    const uesrList = await ResumeModel.find({ _idUser: id });
    if (uesrList.length == 0) {
      return res.status(404).json({ error: "No resumes found for this ID" });
    }
    res.status(200).json(uesrList);
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

// get resume information for client without verify
// router.post("/forverify/:id", async (req, res, next) => {
//   try {
//     let _id = req.params.id;
//     const resume = await ResumeModel.findOne({ _id });
//     res.status(200).json(resume);
//   } catch (err) {
//     res.status(404).json({ err, message: "the _id is not found" });
//   }
// });

router.get("/history", auth, async (req, res, next) => {
  const _idUser = req.tokenData._id;
  try {
    const history = await ResumeModel.find({ _idUser: _idUser });
    if (history.length == 0) {
      return res.status(404).json({ error: "No resumes found" });
    }
    res.status(200).json(history);
  } catch (err) {
    res.status(404).json(err);
  }
});

module.exports = router;
