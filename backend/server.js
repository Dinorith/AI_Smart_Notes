import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Root route
app.get("/", (req, res) => {
  res.json({ message: "Backend server is running", status: "ok" });
});

app.post("/api/generate", async (req, res) => {
  let { text, options } = req.body;

  if (!text || text.trim() === "") {
    return res.status(400).json({ error: "Text is required" });
  }

  // Clean up common artifacts (xref tables, binary data, etc.)
  if (text.includes("xref") && text.includes("trailer") && text.includes("startxref")) {
    return res.status(400).json({ 
      error: "This appears to be PDF binary/metadata instead of extracted text. The PDF parsing failed on the frontend. Please ensure your PDF contains readable text." 
    });
  }

  // Limit text to avoid rate limiting
  if (text.length > 5000) {
    text = text.substring(0, 5000) + "... (text truncated)";
  }

  // Use summary length directly (1-10 sentences)
  const sentenceCount = Math.max(1, Math.min(10, options?.summaryLength || 5));

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ error: "GEMINI_API_KEY not configured" });
    }

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        contents: [
          {
            parts: [
              {
                text: `You are a study notes generator. Generate ONLY the following for this text, with strict formatting:

**SUMMARY**
Write exactly ${sentenceCount} sentences summarizing the main points.

**KEYWORDS**
${options?.keywords ? "List 5-8 important keywords or phrases from the text, one per line." : "Skip this section"}

**FLASHCARDS**
${options?.flashcards ? "Create 3-5 question-answer pairs that test understanding. Format each as:\nQ: [question about the text]\nA: [answer from the text]" : "Skip this section"}

**SHORT NOTES**
${options?.shortNotes ? "Write 3-5 bullet points with key takeaways." : "Skip this section"}

TEXT TO ANALYZE:
${text}`,
              },
            ],
          },
        ],
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const outputText = response.data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    if (!outputText) {
      return res.status(500).json({ error: "No response from AI service" });
    }

    // Better parsing that handles various formats
    let summary = "";
    let keywords = [];
    let flashcards = [];

    // Split by sections
    const summaryMatch = outputText.match(/\*\*SUMMARY\*\*\n([\s\S]*?)(?=\*\*|$)/i);
    const keywordsMatch = outputText.match(/\*\*KEYWORDS\*\*\n([\s\S]*?)(?=\*\*|$)/i);
    const flashcardsMatch = outputText.match(/\*\*FLASHCARDS\*\*\n([\s\S]*?)(?=\*\*|$)/i);
    const notesMatch = outputText.match(/\*\*SHORT NOTES\*\*\n([\s\S]*?)(?=\*\*|$)/i);

    // Extract summary
    if (summaryMatch && summaryMatch[1]) {
      summary = summaryMatch[1]
        .trim()
        .split('\n')
        .filter(line => line.trim().length > 0 && !line.trim().startsWith('*'))
        .join(' ')
        .trim();
    }
    
    // If no summary found, use first meaningful chunk
    if (!summary || summary.length < 20) {
      const lines = outputText.split('\n').filter(l => l.trim().length > 10 && !l.includes('**'));
      summary = lines[0] || outputText.substring(0, 200);
    }

    // Extract keywords
    if (keywordsMatch && keywordsMatch[1]) {
      keywords = keywordsMatch[1]
        .trim()
        .split('\n')
        .map(k => k.replace(/^[-*•\d.)\s]+/, '').trim())
        .filter(k => k.length > 2 && k.length < 50 && !k.includes('**'))
        .slice(0, 10);
    }
    
    // If no keywords, extract from text
    if (keywords.length === 0) {
      const words = text.toLowerCase().split(/[^a-z]+/);
      const freq = {};
      words.forEach(w => {
        if (w.length > 4) freq[w] = (freq[w] || 0) + 1;
      });
      keywords = Object.entries(freq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([k]) => k);
    }

    // Extract flashcards with better parsing
    if (flashcardsMatch && flashcardsMatch[1]) {
      const fcText = flashcardsMatch[1].trim();
      // Match Q: ... A: ... patterns
      const qaPairs = fcText.match(/[Qq]:?\s*([^\n]+)\n[Aa]:?\s*([^\n]+)/g);
      
      if (qaPairs) {
        qaPairs.forEach(pair => {
          const match = pair.match(/[Qq]:?\s*([^\n]+)\n[Aa]:?\s*([^\n]+)/i);
          if (match && match[1] && match[2]) {
            flashcards.push({
              question: match[1].trim(),
              answer: match[2].trim()
            });
          }
        });
      }
    }
    
    // If no flashcards found, create from text
    if (flashcards.length === 0) {
      const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
      
      if (sentences.length >= 1) {
        flashcards.push({
          question: 'What is the main idea of this text?',
          answer: sentences[0].trim()
        });
      }
      
      if (sentences.length >= 2) {
        flashcards.push({
          question: 'What are the key details mentioned?',
          answer: sentences[1].trim()
        });
      }
      
      if (sentences.length >= 3) {
        flashcards.push({
          question: 'What conclusion can be drawn?',
          answer: sentences[2].trim()
        });
      }
    }

    res.json({ summary, keywords, flashcards });
  } catch (err) {
    console.error("Error:", err.message);
    if (err.response) {
      console.error("API Response Status:", err.response.status);
      console.error("API Response Data:", err.response.data);
    }
    
    // Fallback: Generate a simple summary from the text if API fails
    if (err.response?.status === 503 || err.response?.status === 401 || err.response?.status === 429) {
      console.log("API failed or rate limited, using fallback mode");
      
      // Split into sentences properly
      const sentences = text
        .split(/[.!?]+/)
        .map(s => s.trim())
        .filter(s => s.length > 10);
      
      // Generate summary - use the sentenceCount directly
      const numSentences = Math.min(sentences.length, sentenceCount);
      const summary = sentences.slice(0, numSentences).join(". ") + ".";
      
      // Extract keywords - get important words (longer than 5 chars, not common words)
      const commonWords = new Set(["the", "and", "that", "this", "with", "from", "have", "about", "which", "their", "would", "could", "should"]);
      const words = text
        .toLowerCase()
        .split(/[^a-z]+/)
        .filter(w => w.length > 4 && !commonWords.has(w));
      
      // Count word frequency
      const wordFreq = {};
      words.forEach(w => {
        wordFreq[w] = (wordFreq[w] || 0) + 1;
      });
      
      const keywords = Object.entries(wordFreq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([word]) => word)
        .filter(w => w.length > 3);
      
      // Generate flashcards from sentences
      const flashcards = [];
      if (sentences.length > 1) {
        flashcards.push({
          question: "What is the main topic discussed?",
          answer: sentences[0]
        });
      }
      if (sentences.length > 2) {
        flashcards.push({
          question: "What are the key points mentioned?",
          answer: sentences.slice(0, 2).join(". ")
        });
      }
      if (sentences.length > 3) {
        flashcards.push({
          question: "What details support the main idea?",
          answer: sentences.slice(2, 4).join(". ")
        });
      }
      
      // Include note about fallback mode if rate limited
      const apiNote = err.response?.status === 429 ? 
        " (Generated using fallback mode due to API rate limiting)" : 
        " (Generated using fallback mode)";
      
      return res.json({ summary: summary + apiNote, keywords, flashcards });
    }
    
    res.status(500).json({ error: `Failed to generate notes: ${err.message}` });
  }
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
