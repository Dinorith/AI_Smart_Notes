import { motion } from 'motion/react';
import { Settings, FileText, Tag, Zap, AlignLeft } from 'lucide-react';

interface OptionsPanelProps {
  options: {
    shortNotes: boolean;
    keywords: boolean;
    flashcards: boolean;
    summaryLength: number;
  };
  setOptions: React.Dispatch<React.SetStateAction<{
    shortNotes: boolean;
    keywords: boolean;
    flashcards: boolean;
    summaryLength: number;
  }>>;
}

export function OptionsPanel({ options, setOptions }: OptionsPanelProps) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 sticky top-24">
      <div className="flex items-center gap-2 mb-6">
        <Settings className="w-5 h-5 text-indigo-600" />
        <h2 className="text-gray-900">Options & Settings</h2>
      </div>

      <div className="space-y-4">
        {/* Checkbox Options */}
        <motion.label
          whileHover={{ x: 4 }}
          className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
        >
          <input
            type="checkbox"
            checked={options.shortNotes}
            onChange={(e) => setOptions({ ...options, shortNotes: e.target.checked })}
            className="w-5 h-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
          />
          <FileText className="w-5 h-5 text-gray-600" />
          <span className="text-gray-700">Generate Short Notes</span>
        </motion.label>

        <motion.label
          whileHover={{ x: 4 }}
          className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
        >
          <input
            type="checkbox"
            checked={options.keywords}
            onChange={(e) => setOptions({ ...options, keywords: e.target.checked })}
            className="w-5 h-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
          />
          <Tag className="w-5 h-5 text-gray-600" />
          <span className="text-gray-700">Extract Keywords</span>
        </motion.label>

        <motion.label
          whileHover={{ x: 4 }}
          className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
        >
          <input
            type="checkbox"
            checked={options.flashcards}
            onChange={(e) => setOptions({ ...options, flashcards: e.target.checked })}
            className="w-5 h-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
          />
          <Zap className="w-5 h-5 text-gray-600" />
          <span className="text-gray-700">Generate Flashcards</span>
        </motion.label>

        {/* Slider */}
        <div className="pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <AlignLeft className="w-5 h-5 text-gray-600" />
            <span className="text-gray-700">Summary Length</span>
          </div>
          <div className="mb-3 text-center">
            <span className="text-indigo-600 font-semibold text-lg">{options.summaryLength} Sentences</span>
          </div>
          <input
            type="range"
            min="1"
            max="10"
            value={options.summaryLength}
            onChange={(e) => setOptions({ ...options, summaryLength: parseInt(e.target.value) })}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between mt-3 text-xs">
            <span className="text-gray-500">Very Short<br/>(1)</span>
            <span className="text-gray-500">Very Long<br/>(10)</span>
          </div>
        </div>
      </div>

      <style>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          background: linear-gradient(135deg, #6366f1, #a855f7);
          cursor: pointer;
          border-radius: 50%;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        .slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          background: linear-gradient(135deg, #6366f1, #a855f7);
          cursor: pointer;
          border-radius: 50%;
          border: none;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
      `}</style>
    </div>
  );
}
