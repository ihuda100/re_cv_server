const nodemailer = require("nodemailer");
require("dotenv").config();

//Email sending function
module.exports = async (email, subject, text) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      // user: process.env.USER, 
      user: "ihuda100@gmail.com", 
      pass: "ahgs qeeo nsch tgfy", 
      // pass: process.env.PASS, 
    },
  });

  // Set up email data
  const mailOptions = {
    from: process.env.USER, 
    to: email,
    subject: subject,
    text: text,
  };

  // Send email
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return console.error("Error:", error);
    }
    console.log(" The message with code : " + text + " sent to : " + email);
  });
};