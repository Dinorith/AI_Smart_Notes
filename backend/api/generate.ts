import type { Request, Response } from "express";
import * as dotenv from "dotenv";

dotenv.config();

interface GenerateRequest {
  text: string;
  options: {
    shortNotes: boolean;
    keywords: boolean;
    flashcards: boolean;
    summaryLength: number;
  };
}

interface Flashcard {
  question: string;
  answer: string;
}

interface GenerateResponse {
  summary: string;
  keywords: string[];
  flashcards: Flashcard[];
}

export async function generateNotes(
  req: Request,
  res: Response
) {
  if (req.method && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { text, options }: GenerateRequest = req.body;

  if (!text || text.trim() === "") {
    return res.status(400).json({ error: "Text is required" });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ error: "API key not configured" });
    }

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" +
        apiKey,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Summarize the following text and provide:
${options.shortNotes ? "- Short notes\n" : ""}${options.keywords ? "- Keywords list\n" : ""}${options.flashcards ? "- Study flashcards with Q: and A: format\n" : ""}

Limit summary to ${options.summaryLength} sentences.

Text:
${text}`,
                },
              ],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API error: ${error}`);
    }

    const data = await response.json();
    const outputText =
      data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    if (!outputText) {
      return res
        .status(500)
        .json({ error: "No response from AI service" });
    }

    // Parse the AI output
    const summaryMatch = outputText.match(/summary:?([\s\S]*?)(?=keywords:|$)/i);
    const keywordsMatch = outputText.match(
      /keywords?:?([\s\S]*?)(?=flashcards?:|$)/i
    );
    const flashcardsMatch = outputText.match(/flashcards?:([\s\S]*?)$/i);

    const summary = summaryMatch ? summaryMatch[1].trim() : outputText;
    const keywords = keywordsMatch
      ? keywordsMatch[1]
          .split(/[,\n]/)
          .map((k: string) => k.trim())
          .filter((k: string) => k.length > 0)
      : [];
    const flashcards: Flashcard[] = [];

    if (flashcardsMatch) {
      const lines = flashcardsMatch[1]
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);
      for (let i = 0; i < lines.length; i += 2) {
        if (lines[i] && lines[i + 1]) {
          flashcards.push({
            question: lines[i].replace(/^[Qq]\d*:?\s*/, ""),
            answer: lines[i + 1].replace(/^[Aa]\d*:?\s*/, ""),
          });
        }
      }
    }

    res.status(200).json({ summary, keywords, flashcards });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate notes" });
  }
}
