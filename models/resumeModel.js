const mongoose = require("mongoose");
const Joi = require("joi");

const resumeSchema = new mongoose.Schema({
    _idUser: String,
    FullName: String,
    email: String,
    phone: String,
    ifUpdate: {
        type: Boolean, default: false
    },
});
exports.ResumeModel = mongoose.model("resumes", resumeSchema);


exports.validResume = (_bodyData) => {
    let joiSchema = Joi.object({
        FullName: Joi.string().min(5).max(30).required(),
        email: Joi.string().min(5).max(30).email().required(),
        phone: Joi.string().min(10).max(15).required(),
    });
    return joiSchema.validate(_bodyData);
};