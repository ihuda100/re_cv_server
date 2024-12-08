var express = require("express");
var router = express.Router();

/* GET home page. */
router.get("/", (req, res, next) => {
  res.json({ msg: "Work from resumes.js" });
});

// router.post("/", (req, res, next) => {
    
//     let data = gptnnn(req.pdfnn)
//   res.json(data);
// });



module.exports = router;
