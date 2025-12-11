import { useState, useRef } from 'react';
import { Upload, File, X } from 'lucide-react';
import { motion } from 'motion/react';

interface FileUploadProps {
  selectedFile: File | null;
  onFileSelect: (file: File | null) => void;
}

export function FileUpload({ selectedFile, onFileSelect }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file && (file.type === 'application/pdf' || 
                 file.type === 'text/plain' ||
                 file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')) {
      onFileSelect(file);
    } else if (file) {
      alert('Please upload a PDF, DOCX, or TXT file.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && (file.type === 'application/pdf' || 
                 file.type === 'text/plain' ||
                 file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')) {
      onFileSelect(file);
    } else if (file) {
      alert('Please upload a PDF, DOCX, or TXT file.');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveFile = () => {
    onFileSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
      <label className="flex items-center gap-2 text-gray-700 mb-3">
        <Upload className="w-5 h-5 text-indigo-600" />
        Upload your PDF, Word, or Text file
      </label>
      
      <motion.div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        animate={{
          borderColor: isDragging ? '#6366f1' : '#e5e7eb',
          backgroundColor: isDragging ? '#eef2ff' : '#ffffff'
        }}
        className="border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
      >
        {selectedFile ? (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-center justify-between bg-indigo-50 border border-indigo-200 rounded-lg p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="bg-indigo-600 rounded-lg p-2">
                <File className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <p className="text-gray-900">{selectedFile.name}</p>
                <p className="text-gray-500">
                  {(selectedFile.size / 1024).toFixed(2)} KB
                </p>
              </div>
            </div>
            <button
              onClick={handleRemoveFile}
              className="p-2 hover:bg-red-100 rounded-lg transition-colors group"
            >
              <X className="w-5 h-5 text-gray-600 group-hover:text-red-600" />
            </button>
          </motion.div>
        ) : (
          <div>
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="inline-block"
            >
              <Upload className="w-12 h-12 text-indigo-300 mx-auto mb-3" />
            </motion.div>
            <p className="text-gray-700 mb-1">
              Drag & drop your file here
            </p>
            <p className="text-gray-500 mb-4">or</p>
            <button className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
              Choose File
            </button>
            <p className="text-gray-500 mt-3">
              Supports PDF, DOCX, and TXT files
            </p>
          </div>
        )}
      </motion.div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.txt"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
