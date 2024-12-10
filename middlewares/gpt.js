require('dotenv').config(); // Load environment variables from .env

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const { OpenAI } = require('openai');

// Validate required environment variables
const requiredEnvVars = ['OPENAI_API_KEY'];
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


let pdfFile ;



// Read and extract text from the uploaded PDF
async function extractTextFromPDF(pdfFile) {
  try {
    const dataBuffer = fs.readFileSync(pdfFile);
    const data = await pdfParse(dataBuffer);
    return data.text;
  } catch (error) {
    console.error('Error extracting text from PDF:', error.message);
    throw error;
  }
}

// Organize extracted text into a clean JSON structure using OpenAI
async function organizeResumeData(textContent) {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are a resume parser. Your task is to extract and organize the resume data into a standardized JSON format with the following categories: 
          "personal_information", "objective", "education", "work_experience", "skills", "languages", and "projects". 
          Return only the clean JSON without any additional text. Ensure that the JSON is well-structured and contains no unnecessary information.`,
        },
        { role: 'user', content: textContent },
      ],
    });

    const rawResponse = response.choices[0].message.content.trim();
    let organizedData;
    
    try {
      organizedData = JSON.parse(rawResponse);
    } catch (parseError) {
      console.error('Error parsing OpenAI response. Returning raw response for manual review.');
      organizedData = { raw_response: rawResponse };
    }

    return organizedData;
  } catch (error) {
    console.error('Error organizing resume data:', error.message);
    throw error;
  }
}



// Main function to process PDF and generate organized JSON
async function processResume() {
  try {
    // Step 1: Extract text from PDF
    const extractedText = await extractTextFromPDF(pdfFile);

    // Step 2: Organize data using OpenAI
    const organizedJson = await organizeResumeData(extractedText);

    return organizedJson;

  
  } catch (error) {
    console.error('Error processing resume:', error.message);
  }
}

function convertPDFToJson (data) {
  pdfFile = data;

 return processResume();
}


