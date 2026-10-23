import React, { useState, useRef } from 'react';
import { UploadCloud, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { vaultStore } from '../lib/vaultStore';

interface UploadZoneProps {
  onUploadSuccess?: (fileName: string) => void;
}

export const UploadZone: React.FC<UploadZoneProps> = ({ onUploadSuccess }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
  const maxSizeBytes = 20 * 1024 * 1024; // 20 MB

  const validateFile = (file: File): string | null => {
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(pdf|jpe?g|png)$/i)) {
      return 'Unsupported file format. Please upload a PDF, JPG, or PNG document.';
    }
    if (file.size > maxSizeBytes) {
      return 'File size exceeds 20MB limit.';
    }
    return null;
  };

  const processFile = (file: File) => {
    setErrorMessage(null);
    setSuccessMessage(null);

    const validationError = validateFile(file);
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setIsUploading(true);
    setUploadProgress(15);

    // Simulated parsing and vault addition
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          setTimeout(() => {
            const newDoc = vaultStore.addDocument(file);
            setIsUploading(false);
            setUploadProgress(100);
            setSuccessMessage(`Document "${newDoc.fileName}" added to vault.`);
            if (onUploadSuccess) onUploadSuccess(newDoc.fileName);
            setTimeout(() => setSuccessMessage(null), 4000);
          }, 300);
          return 90;
        }
        return prev + 25;
      });
    }, 100);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div className="w-full">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative bg-white/80 backdrop-blur-md border-2 rounded-2xl p-5 sm:p-6 transition-all duration-200 cursor-pointer shadow-[0_4px_24px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.05)] ${
          isDragging
            ? 'border-indigo-500 bg-indigo-50/50 ring-4 ring-indigo-500/20'
            : 'border-dashed border-indigo-200/90 hover:border-indigo-400'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Left: Icon & Text */}
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0 text-indigo-600 shadow-xs">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-luna-primary">
                Upload a Document
              </h3>
              <p className="text-sm text-luna-secondary mt-0.5">
                Drag & drop or click to upload
              </p>
              <p className="text-xs text-luna-silver mt-0.5">
                PDF, JPG, PNG • Max 20MB
              </p>
            </div>
          </div>

          {/* Right: Upload Action Button */}
          <div className="shrink-0 w-full sm:w-auto">
            <button
              type="button"
              disabled={isUploading}
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 active:from-indigo-800 active:to-indigo-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-indigo-500/25 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            >
              <span>{isUploading ? 'Processing...' : 'Upload'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        {isUploading && (
          <div className="mt-4 pt-3 border-t border-luna-pearl-grey">
            <div className="flex justify-between text-xs text-luna-secondary mb-1">
              <span>Extracting metadata & dates...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-luna-pearl-grey rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-luna-accent h-full transition-all duration-200"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Success Alert */}
        {successMessage && (
          <div className="mt-3 p-2.5 bg-emerald-50 border border-emerald-200 rounded-luna-sm flex items-center gap-2 text-xs text-emerald-800">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span dangerouslySetInnerHTML={{ __html: successMessage }} />
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="mt-3 p-2.5 bg-rose-50 border border-rose-200 rounded-luna-sm flex items-center gap-2 text-xs text-rose-800">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadZone;
