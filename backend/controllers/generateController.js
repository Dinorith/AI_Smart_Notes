const fs = require('fs');
const axios = require('axios');
const { parseFile } = require('../utils/fileParser');

exports.generateNotes = async (req, res) => {
  try {
    let text = '';

    // Parse uploaded file
    if (req.file) {
      text = await parseFile(req.file.path);
    }

    // Or use pasted text
    if (req.body.text) text = req.body.text;

    if (!text) return res.status(400).json({ error: 'No text provided' });

    // Call Gemini API
    const response = await axios.post(
      'https://api.openai.com/v1/responses', // Gemini endpoint
      {
        model: process.env.MODEL,
        input: `Summarize, extract keywords, and make flashcards for the following text:\n\n${text}`
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const output = response.data.output_text || response.data.output?.[0]?.content?.[0]?.text;

    // For now, return all as text, frontend can parse
    res.json({
      result: output
    });

  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: 'Server error' });
  }
};
