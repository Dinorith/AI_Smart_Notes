const fs = require('fs');
const pdfParse = require('pdf-parse');

exports.parseFile = async (filePath) => {
  if (filePath.endsWith('.txt')) {
    return fs.readFileSync(filePath, 'utf-8');
  } else if (filePath.endsWith('.pdf')) {
    const dataBuffer = fs.readFileSync(filePath);
    const pdfData = await pdfParse(dataBuffer);
    return pdfData.text;
  } else {
    throw new Error('Unsupported file type');
  }
};
