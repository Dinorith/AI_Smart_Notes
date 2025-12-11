import { useState } from 'react';
import { motion } from 'motion/react';
import { FileText, Tag, Zap, Copy, Download, Check } from 'lucide-react';

interface Flashcard {
  question: string;
  answer: string;
}

interface OutputTabsProps {
  options: {
    shortNotes: boolean;
    keywords: boolean;
    flashcards: boolean;
    summaryLength: number;
  };
  result: {
    summary: string;
    keywords: string[];
    flashcards: Flashcard[];
  };
}

export function OutputTabs({ options, result }: OutputTabsProps) {
  const [activeTab, setActiveTab] = useState('summary');
  const [copied, setCopied] = useState(false);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);

  const tabs = [
    { id: 'summary', label: 'Summary', icon: FileText, enabled: options.shortNotes },
    { id: 'keywords', label: 'Keywords', icon: Tag, enabled: options.keywords },
    { id: 'flashcards', label: 'Flashcards', icon: Zap, enabled: options.flashcards }
  ].filter(tab => tab.enabled);

  const handleCopy = () => {
    let textToCopy = '';
    if (activeTab === 'summary') textToCopy = result.summary;
    else if (activeTab === 'keywords') textToCopy = result.keywords.join(', ');
    else if (activeTab === 'flashcards') {
      textToCopy = result.flashcards.map((card, i) => `Q${i + 1}: ${card.question}\nA${i + 1}: ${card.answer}`).join('\n\n');
    }

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleCard = (index: number) => {
    setFlippedCards(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
        <h2 className="text-gray-900">Generated Notes</h2>
        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleCopy}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-2 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-green-600" />
                <span className="text-green-600">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy All
              </>
            )}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-2 transition-colors"
          >
            <Download className="w-4 h-4" />
            Download
          </motion.button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </motion.button>
          );
        })}
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {activeTab === 'summary' && (
          <div className="prose max-w-none">
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100">
              <p className="text-gray-800 whitespace-pre-line leading-relaxed">
                {result.summary}
              </p>
            </div>
          </div>
        )}

        {activeTab === 'keywords' && (
          <div className="flex flex-wrap gap-3">
            {result.keywords.map((keyword, index) => (
              <motion.span
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-full shadow-md hover:shadow-lg transition-shadow"
              >
                {keyword}
              </motion.span>
            ))}
          </div>
        )}

        {activeTab === 'flashcards' && (
          <div className="grid md:grid-cols-2 gap-4">
            {result.flashcards.map((card, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => toggleCard(index)}
                className="relative h-48 cursor-pointer perspective-1000"
                style={{ perspective: '1000px' }}
              >
                <motion.div
                  className="relative w-full h-full transition-transform duration-500 preserve-3d"
                  animate={{ rotateY: flippedCards.includes(index) ? 180 : 0 }}
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  {/* Front */}
                  <div
                    className="absolute w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-6 flex flex-col items-center justify-center text-white shadow-lg backface-hidden"
                    style={{ backfaceVisibility: 'hidden' }}
                  >
                    <p className="text-indigo-200 mb-2">Question {index + 1}</p>
                    <p className="text-center">{card.question}</p>
                    <p className="text-indigo-200 mt-4">Click to reveal</p>
                  </div>

                  {/* Back */}
                  <div
                    className="absolute w-full h-full bg-white border-2 border-indigo-200 rounded-xl p-6 flex flex-col items-center justify-center shadow-lg backface-hidden"
                    style={{
                      backfaceVisibility: 'hidden',
                      transform: 'rotateY(180deg)'
                    }}
                  >
                    <p className="text-indigo-600 mb-2">Answer</p>
                    <p className="text-gray-700 text-center">{card.answer}</p>
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
