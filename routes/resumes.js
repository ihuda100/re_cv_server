var express = require("express");
const { ResumeModel, validResume } = require("../models/resumeModel");
const { auth } = require("../middlewares/auth");
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

//GET information on client by ID
router.get("/:id", async (req, res, next) => {
  let id = req.params.id;
  console.log(id);
  try {
    const uesrList = await ResumeModel.find({ _idUser: id });
    if (!userList) {
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
    let json = await convertPDFToJson(req.file.path);
    fs.unlinkSync(req.file.path); // Delete file from upload after read
    let validBody = validResume(json);
    if (validBody.error) {
      return res.status(400).json(validBody.error.details);
    }
    let _idUser = req.tokenData._id;
    try {
      let upgrateData = await cvUpgrade(json);
      console.log(upgrateData);
      // if (upgrateData.syntaxError) {
      //   console.log("22222222222222");
      //   upgrateData = await cvUpgrade(json);
      //   if (upgrateData.syntaxError) {
      //     return res.status(400).json(upgrateData.SyntaxError);
      //   }
      // }
      let resume = new ResumeModel(upgrateData);
      console.log(resume);

      resume._idUser = _idUser;
      const data = await resume.save();
      console.log(data);
      res.status(201).json(data);
    } catch (err) {
      console.log(err);
    }
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

module.exports = router;
