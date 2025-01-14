//

require("dotenv").config(); // Load environment variables from .env

const fs = require("fs");
// const path = require('path');
const pdfParse = require("pdf-parse");
const { OpenAI } = require("openai");
const { error } = require("console");

// Validate required environment variables
const requiredEnvVars = ["OPENAI_API_KEY"];
requiredEnvVars.forEach((envVar) => {
  if (!process.env[envVar]) {
    console.error(`Error: Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
});

// Set up OpenAI API client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Read and extract text from the uploaded PDF
async function extractTextFromPDF(pdf) {
  try {
    const dataBuffer = fs.readFileSync(pdf);
    const data = await pdfParse(dataBuffer);
    return data.text;
  } catch (error) {
    console.error("Error extracting text from PDF:", error.message);
    throw error;
  }
}

// Organize extracted text into a clean JSON structure using OpenAI
async function organizeResumeData(textContent) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are a resume parser. Your task is to extract and organize the resume data into a standardized JSON format with the following format:
          {
            "fullName": "",
            "phone": "",
            "email": "",
            "linkdin": "",
            "gitHub": "",
            "body": {
            "education": "",
            "workExpirience": "",
            "freeWords": ""
            }
          } 
          Return only the clean JSON without any additional text. Ensure that the JSON is well-structured and contains no unnecessary information.`,
          // categories // "personal_information", "objective", "education", "work_experience", "skills", "languages", and "projects".
        },
        { role: "user", content: textContent },
      ],
    });

    const rawResponse = response.choices[0].message.content.trim();
    let organizedData;

    try {
      organizedData = JSON.parse(rawResponse);
    } catch (parseError) {
      console.error(
        "Error parsing OpenAI response. Returning raw response for manual review."
      );
      organizedData = { raw_response: rawResponse };
    }

    return organizedData;
  } catch (error) {
    console.error("Error organizing resume data:", error.message);
    throw error;
  }
}

// Function to upgrade a JSON resume using OpenAI and add requested profession
async function upgradeResumeJson(resumeJson, profession) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are a resume enhancer. Your task is to improve the resume JSON provided by adding missing details, enhancing descriptions, and making it more professional and appealing for job applications. 
          Ensure the JSON format:
          {
            "fullName": "", // not change 
            "phone": "", // not change 
            "email": "", // not change 
            "linkdin": "", // please dont change this link optional
            "gitHub": "", // dont upgrade 
            "body": "in string not object please edit it like titel and body for all information drop a line after titel and after body plaese"
          } 
           tailor the resume for the profession: ${profession}.`,
          //  remains standardized with categories such as "personal_information", "objective", "education", "work_experience", "skills", "languages", and "projects". Also,

        },
        { role: "user", content: JSON.stringify(resumeJson) },
      ],
    });

    const rawResponse = response.choices[0].message.content.trim();
    //  upgradedData;

    try {
      let upgradedData = JSON.parse(rawResponse);
      console.log(upgradedData);
      return upgradedData;
    } catch (parseError) {
      console.error(
        "Error parsing OpenAI response. Returning raw response for manual review."
      );
      // upgradedData = { raw_response: rawResponse };
    }
  } catch (error) {
    console.error("Error upgrading resume JSON:", error.message);
    throw error;
  }
}

// Middleware function to convert PDF to JSON
async function processResume(data) {
  try {
    const extractedText = await extractTextFromPDF(data);
    const organizedJson = await organizeResumeData(extractedText);
    return organizedJson;
  } catch (error) {
    console.error("Error converting PDF to JSON:", error.message);
    throw error;
  }
}

const convertPDFToJson = (data) => {
  try{
    return processResume(data);
  } catch (err) {
    console.error(err);
  }
  // upgradeResumeJson(processResume(),"Hitech");
};

const cvUpgrade = (data) => {
  return upgradeResumeJson(data, "Hitech");
};

module.exports = { convertPDFToJson, cvUpgrade };
