var express = require("express");
const { ResumeModel, validResume } = require("../models/resumeModel");
const { auth } = require("../middlewares/auth");
const { convertPDFToJson, cvUpgrade } = require("../middlewares/gpt");
const { pdfGeneret } = require("../middlewares/pdfStyle");
var router = express.Router();
const fs = require("fs");
const multer = require("multer");
const { log } = require("util");
const upload = multer({ dest: "uploads/" });

/* GET home page. */
router.get("/", (req, res, next) => {
  res.json({ msg: "Work from resumes.js" });
});

// Convert from PDF to json
router.post("/convert", auth, upload.single("file"), async (req, res, next) => {
  try {
    let json = await convertPDFToJson(req.file.path);
    let validBody = validResume(json);
    if (validBody.error) {
      return res.status(400).json(validBody.error.details);
    }
    let _idUser = req.tokenData._id;
    let upgrateData = await cvUpgrade(json);
    console.log(upgrateData);
    if (upgrateData.syntaxError) {
      console.log("22222222222222");
      upgrateData = await cvUpgrade(json);
      if (upgrateData.syntaxError) {
        return res.status(400).json(upgrateData.SyntaxError);
      }
    }
    let resume = new ResumeModel(upgrateData);
    resume._idUser = _idUser;
    const data = await resume.save();
    console.log(data);
    fs.unlinkSync(req.file.path); // Delete file from upload after read
    res.status(201).json(data);
  } catch (err) {
    console.log(err);
  }
});

// Upgrades the resume
router.post("/upgrade", auth, async (req, res, next) => {
  let validBody = validResume(req.body);
  if (validBody.error) {
    return res.status(400).json(validBody.error.details);
  }
  try {
    let _idUser = req.tokenData._id;
    let data = req.body;
    let upgrateData = await cvUpgrade(data);
    console.log(upgrateData);
    if (upgrateData.SyntaxError) {
      console.log("22222222222222");
      upgrateData = await cvUpgrade(json);
      if (upgrateData.SyntaxError) {
        return res.status(400).json(upgrateData.SyntaxError);
      }
    }
    let resume = new ResumeModel(upgrateData);
    resume._idUser = _idUser;
    await resume.save();
    res.status(201).json(resume);
  } catch (err) {
    console.log(err);
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
    console.log(err);
  }
});

router.post("/template", async (req, res, next) => {
  pdfGeneret();
  res.end();
});

module.exports = router;
