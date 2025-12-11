"use client";
import { useState } from "react";
import { Upload, FileText, Sparkles, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import * as pdfjsLib from "pdfjs-dist";
import * as mammoth from "mammoth";
import { FileUpload } from "./components/FileUpload";
import { OptionsPanel } from "./components/OptionsPanel";
import { OutputTabs } from "./components/OutputTabs";

// Set up PDF.js worker from node_modules
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

interface Result {
  summary: string;
  keywords: string[];
  flashcards: { question: string; answer: string }[];
}

export default function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [textInput, setTextInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  const [options, setOptions] = useState({
    shortNotes: true,
    keywords: true,
    flashcards: true,
    summaryLength: 5,
  });

  const handleFileSelect = (file: File | null) => {
    setSelectedFile(file);
    if (file) setTextInput("");
  };

  const handleGenerate = async () => {
    if (!selectedFile && !textInput.trim()) return;

    setIsLoading(true);
    setHasGenerated(false);

    let text = textInput;

    if (selectedFile) {
      try {
        if (selectedFile.type === 'application/pdf') {
          // Parse PDF
          const arrayBuffer = await selectedFile.arrayBuffer();
          const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
          let pdfText = '';
          
          for (let i = 0; i < pdf.numPages; i++) {
            const page = await pdf.getPage(i + 1);
            const textContent = await page.getTextContent();
            const pageText = textContent.items
              .map((item: any) => item.str)
              .join(' ');
            pdfText += pageText + '\n';
          }
          
          text = pdfText.trim();
        } else if (selectedFile.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
                   selectedFile.name.endsWith('.docx')) {
          // Parse Word document
          const arrayBuffer = await selectedFile.arrayBuffer();
          const result = await mammoth.extractRawText({ arrayBuffer });
          text = result.value;
        } else if (selectedFile.type === 'text/plain' || selectedFile.name.endsWith('.txt')) {
          // Parse text file
          text = await selectedFile.text();
        } else {
          alert('Please upload a PDF, DOCX, or TXT file.');
          setIsLoading(false);
          return;
        }
        
        if (!text || text.trim().length === 0) {
          alert('Could not extract text from file. Please ensure the file contains readable text.');
          setIsLoading(false);
          return;
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        alert(`Error reading file: ${errorMessage}`);
        setIsLoading(false);
        return;
      }
    }

    try {
      const apiUrl = "http://localhost:5000";

      const response = await fetch(`${apiUrl}/api/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text, options }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API error: ${response.status}`);
      }

      const data: Result = await response.json();
      setResult(data);
      setHasGenerated(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      console.error(err);
      alert(`Failed to generate notes: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const canGenerate = (selectedFile || textInput.trim().length > 0) && !isLoading;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-10"
      >
        <div className="max-w-6xl mx-auto px-6 py-6 flex items-center gap-3">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            <Sparkles className="w-8 h-8 text-indigo-600" />
          </motion.div>
          <div>
            <h1 className="text-indigo-900">AI Smart Notes Generator</h1>
            <p className="text-gray-600 mt-1">
              Upload a document or paste text to generate summaries, keywords,
              and study flashcards.
            </p>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <FileUpload selectedFile={selectedFile} onFileSelect={handleFileSelect} />

            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <label className="flex items-center gap-2 text-gray-700 mb-3">
                <FileText className="w-5 h-5 text-indigo-600" />
                Or paste your text here
              </label>
              <textarea
                value={textInput}
                onChange={(e) => {
                  setTextInput(e.target.value);
                  if (e.target.value.trim()) setSelectedFile(null);
                }}
                placeholder="Paste your document text here..."
                className="w-full h-48 px-4 py-3 border border-gray-300 rounded-xl resize-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>

            <motion.button
              onClick={handleGenerate}
              disabled={!canGenerate}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating Notes...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate Notes
                </>
              )}
            </motion.button>
          </div>

          <OptionsPanel options={options} setOptions={setOptions} />
        </div>

        {/* Output Section */}
        <AnimatePresence>
          {hasGenerated && result && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ duration: 0.5 }}
              className="mt-12"
            >
              <OutputTabs options={options} result={result} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="max-w-6xl mx-auto px-6 py-8 text-center"
      >
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 inline-block">
          <p className="text-indigo-900">
            <span className="mr-2">💡</span>
            <strong>Tip:</strong> The clearer your text, the better the AI-generated notes.
          </p>
        </div>
      </motion.footer>
    </div>
  );
}
