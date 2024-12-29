const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

exports.pdfGeneret = () =>{ (async () => {
  // Launch a headless browser
  const browser = await puppeteer.launch();

  // Open a new page
  const page = await browser.newPage();

  const data = {
    name: "Ilya",
    lastName: "Tsveyrozin",
    occupation: "Software Engineer",
  };

  // Set HTML content
  await page.setContent(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>PDF Example</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
          }
          h1 {
            color: #2c3e50;
          }
          p {
            font-size: 14px;
            line-height: 1.5;
          }

          img {
            width: 100px;
            height: 100px;
          }
        </style>
      </head>
      <body>
        <h1>Hello, Puppeteer!</h1>
        <p>This PDF was generated using Puppeteer. You can style it with CSS!</p>
        <p>${data.name}</p>
        <p>${data.lastName}</p>
        <p>${data.occupation}</p>

        <img src="https://ae01.alicdn.com/kf/S4eb98cd63b3c47ceb854d776d82605c6B.jpg?width=800&height=800&hash=1600" alt="Example Image" />
      </body>
    </html>
  `);

  // Generate the PDF
  await page.pdf({
    path: "output.pdf", // Save to this file
    format: "A4", // Paper format
    printBackground: true, // Include CSS background colors/images
  });

  console.log("PDF generated successfully!");
  console.log(`Image path: file://${path.join(__dirname, "./image.jpg")}`);

  // Close the browser
  await browser.close();
})();
}

