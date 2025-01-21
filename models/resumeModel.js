const mongoose = require("mongoose");
const Joi = require("joi");

const resumeSchema = new mongoose.Schema({
  _idUser: String,
  fullName: String,
  email: String,
  phone: String,
  linkdin: String,
  gitHub: String,
  body: String,
  ifUpdate: {
    type: Boolean,
    default: false,
  },
});
exports.ResumeModel = mongoose.model("resumes", resumeSchema);

exports.validResume = (_bodyData) => {
  let joiSchema = Joi.object({
    _id: Joi.string().optional(),
    __v: Joi.number().optional(),
    _idUser: Joi.string().optional(),
    fullName: Joi.string().min(5).max(30).required(),
    email: Joi.string().min(5).max(30).email().required(),
    phone: Joi.string().min(10).max(15).required(),
    linkdin: Joi.string().max(100).allow("").optional(),
    gitHub: Joi.string().max(100).allow("").optional(),
    ifUpdate: Joi.boolean().allow(""),
    body: Joi.alternatives()
      .try(Joi.object().min(1).max(50), Joi.string().min(5).max(10000))
      .required(),
  });
  return joiSchema.validate(_bodyData);
};
