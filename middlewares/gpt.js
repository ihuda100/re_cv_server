require("dotenv").config(); // Load environment variables from .env
const fs = require("fs");
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
    throw new Error("Error extracting text from PDF: " + error.message);
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
        },
        { role: "user", content: textContent },
      ],
    });

    const rawResponse = response.choices[0].message.content.trim();
    let organizedData;

    try {
      organizedData = JSON.parse(rawResponse);
    } catch (parseError) {
      throw new Error(
        "Error parsing AI response. Returning raw response for manual review."
      );
    }

    return organizedData;
  } catch (error) {
    throw new Error("Error organizing resume data: " + error.message);
  }
}

async function upgradeResumeJson(resumeJson) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `
          You are a resume enhancer. Your task is to improve the resume JSON provided by adding missing details, enhancing descriptions, and making it more professional and appealing for job applications. 
          Ensure the response is strictly in the following JSON format:
          {
            "fullName": "not change",   
            "phone": "ONLY number",  
            "email": "Do not change the original email",   
            "linkdin": "Return exactly the same value as provided. If empty, keep it empty.", 
            "gitHub": "Return exactly the same value as provided. If empty, keep it empty.",  
            "body": [{
              "key": "title",
              "value": "body in String"
              ONLY in freeWords "key": "", "value": "General strengths extracted or improved from freeWords, in string format"
              ALSO word experience with . and \\n between difference works
            }]  
          } 
          Respond ONLY with JSON in the specified format. Do not include any additional text or special characters outside the JSON structure.
          `,
        },
        { role: "user", content: JSON.stringify(resumeJson) },
      ],
    });
    const rawResponse = response.choices[0].message.content.trim();
    console.log("Raw Response from OpenAI:", rawResponse);
    const sanitizeResponse = (response) => {
      return response
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, "")
        .trim();
    };
    const sanitizedResponse = sanitizeResponse(rawResponse);
    console.log("Sanitized Response:", sanitizedResponse);
    if (
      !sanitizedResponse.startsWith("{") ||
      !sanitizedResponse.endsWith("}")
    ) {
      throw new Error("Response is not in valid JSON format.");
    }
    const upgradedData = JSON.parse(sanitizedResponse);
    if (!upgradedData.fullName || !upgradedData.phone || !upgradedData.body) {
      throw new Error("Missing required fields in the JSON response.");
    }
    console.log("Upgraded Resume JSON:", upgradedData);
    return upgradedData;
  } catch (error) {
    console.log(error);
    throw new Error("Error upgrading resume JSON: " + error.message);
  }
}

// Middleware function to convert PDF to JSON
async function processResume(data) {
  try {
    const extractedText = await extractTextFromPDF(data);
    const organizedJson = await organizeResumeData(extractedText);
    return organizedJson;
  } catch (error) {
    throw new Error("Error converting PDF to JSON: " + error.message);
  }
}

const convertPDFToJson = (data) => {
  try {
    return processResume(data);
  } catch (err) {
    throw new Error(err);
  }
};

const cvUpgrade = (data) => {
  try {
    return upgradeResumeJson(data, "Hitech");
  } catch (err) {
    console.log(err);
    throw new Error(err);
  }
};

module.exports = { convertPDFToJson, cvUpgrade };
