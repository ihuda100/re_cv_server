var express = require("express");
var router = express.Router();

/* GET home page. */
router.get("/", (req, res, next) => {
  res.json({ msg: "Work from resumes.js" });
});

router.post("/", async (req, res, next) => {
  try {
    let data = await convertPDFToJson(req.pdf);
    let upgrateData = await cvUpgrade(data);
    await upgrateData.save();
    res.json(upgrateData);
  } catch (err) {
    console.log(err);
  }
});

module.exports = router;
