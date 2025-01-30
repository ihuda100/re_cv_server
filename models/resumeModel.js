const mongoose = require("mongoose");
const Joi = require("joi");

const resumeSchema = new mongoose.Schema({
  _idUser: String,
  fullName: String,
  email: String,
  phone: String,
  linkdin: String,
  gitHub: String,
  body: Object,
  ifUpdate: {
    type: Boolean,
    default: false,
  },
  dateCreated: { type: Date, default: Date.now },
});
exports.ResumeModel = mongoose.model("resumes", resumeSchema);

exports.validResume = (_bodyData) => {
  let joiSchema = Joi.object({
    _id: Joi.string().optional(),
    __v: Joi.number().optional(),
    _idUser: Joi.string().optional(),
    dateCreated: Joi.string().optional(),
    fullName: Joi.string().min(5).max(30).required(),
    email: Joi.string().min(5).max(30).email().required(),
    phone: Joi.string().min(10).max(15).required(),
    linkdin: Joi.string().max(100).allow("").optional(),
    gitHub: Joi.string().max(100).allow("").optional(),
    ifUpdate: Joi.boolean().allow(""),
    body: Joi.alternatives()
      .try(Joi.array().min(1), Joi.object().min(1))
      .required(),
  });
  return joiSchema.validate(_bodyData);
};
