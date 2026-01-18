import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import toast from 'react-hot-toast'
import { FiPaperclip, FiArrowUp, FiFile, FiCheck, FiDownload, FiMessageSquare, FiX, FiLink } from 'react-icons/fi'

const backendBase = "http://localhost:5000/"; // Updated to localhost for dev

const MAX_FILE_SIZE_MB = 25;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const DocumentUpload = ({ onFileUpload, onLinkSubmit, isProcessing, uploadedFile, downloadUrl, onOpenChat }) => {
  const [inputValue, setInputValue] = useState('');

  const onDrop = useCallback((acceptedFiles) => {
    console.log('DEBUG: Files dropped:', acceptedFiles)
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0]
      console.log('DEBUG: File selected:', file)

      // Validate file type
      const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
      if (!allowedTypes.includes(file.type)) {
        console.log('DEBUG: Invalid file type:', file.type)
        toast.error('Please upload a PDF, DOCX, or TXT file')
        return
      }

      // Validate file size (25MB limit)
      if (file.size > MAX_FILE_SIZE_BYTES) {
        console.log('DEBUG: File too large:', file.size)
        toast.error(`File size must be less than ${MAX_FILE_SIZE_MB}MB`)
        return
      }

      console.log('DEBUG: File passed validation, calling onFileUpload')
      onFileUpload(file)
      toast.success('File uploaded successfully! Processing...')
    } else {
      console.log('DEBUG: No files accepted')
    }
  }, [onFileUpload])

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    },
    multiple: false,
    noClick: true, // We will use the paperclip button for click
    noKeyboard: true
  })

  // Handle Download (same logic as before)
  const handleViewAndDownloadSummary = async () => {
    if (downloadUrl) {
      const url = downloadUrl.startsWith('http') ? downloadUrl : backendBase.replace(/\/$/, '') + downloadUrl;
      // Open in new tab for viewing
      window.open(url, '_blank');
      // Download in current tab using Blob
      try {
        const response = await fetch(url);
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = (uploadedFile?.name?.replace(/\.[^/.]+$/, '') || 'summary') + '_summary.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
        toast.success('Opened summary in new tab and started download!');
      } catch (err) {
        console.error('Download error:', err);
        toast.error('Failed to download summary.');
      }
    } else {
      toast.error('No summary available to view.');
    }
  }

  const handleSubmit = () => {
    if (!inputValue.trim()) return;
    if (onLinkSubmit) {
      onLinkSubmit(inputValue.trim());
      setInputValue('');
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <div className="w-full max-w-3xl mx-auto px-4">
      {/* Upload/Input Area */}
      {!uploadedFile ? (
        <div
          {...getRootProps()}
          className={`relative group bg-[#1a1a1e]/80 backdrop-blur-xl border transition-all duration-300 rounded-3xl p-2
            ${isDragActive ? 'border-violet-500/50 ring-4 ring-violet-500/10' : 'border-white/10 hover:border-white/20 shadow-2xl shadow-black/50'}
          `}
        >
          <input {...getInputProps()} />

          <div className="flex items-center gap-2">
            <button
              onClick={open}
              className="p-3 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
              title="Upload file"
            >
              <FiPaperclip size={20} />
            </button>

            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isDragActive ? "Drop file here..." : "Paste a Google Drive link or upload a document..."}
              className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-500 px-2 py-3 text-lg font-light"
            />

            <button
              onClick={handleSubmit}
              disabled={!inputValue.trim()}
              className={`p-3 rounded-full transition-all duration-300 
                ${inputValue.trim()
                  ? 'bg-white text-black hover:scale-105 active:scale-95 shadow-lg shadow-white/10'
                  : 'bg-white/5 text-gray-500 cursor-not-allowed'}
              `}
            >
              <FiArrowUp size={20} className={inputValue.trim() ? "stroke-[3]" : ""} />
            </button>
          </div>

          {/* Overlay for drag active */}
          {isDragActive && (
            <div className="absolute inset-0 bg-violet-600/10 backdrop-blur-sm rounded-3xl flex items-center justify-center border-2 border-violet-500 border-dashed z-10">
              <div className="text-violet-200 font-medium flex items-center gap-2">
                <FiFile size={24} />
                Drop to upload
              </div>
            </div>
          )}

          <div className="absolute -bottom-8 left-0 right-0 text-center">
            <p className="text-xs text-gray-500">Supported: PDF, DOCX, TXT (Max {MAX_FILE_SIZE_MB}MB)</p>
          </div>
        </div>
      ) : (
        /* Processing / Result State */
        <div className="bg-[#1a1a1e]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl max-w-2xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center text-violet-300">
              {uploadedFile.name === 'Google Drive Link' ? <FiLink size={24} /> : <FiFile size={24} />}
            </div>
            <div className="flex-1 overflow-hidden">
              <h3 className="text-white font-medium truncate">{uploadedFile.name}</h3>
              <p className="text-sm text-gray-400">
                {uploadedFile.size ? `${(uploadedFile.size / 1024 / 1024).toFixed(2)} MB` : 'Remote Resource'}
              </p>
            </div>
            {isProcessing && (
              <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
            )}
            {!isProcessing && downloadUrl && (
              <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">
                <FiCheck size={16} />
              </div>
            )}
          </div>

          {!isProcessing && downloadUrl && (
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleViewAndDownloadSummary}
                className="flex-1 flex items-center justify-center gap-2 bg-white text-black px-6 py-3 rounded-xl font-medium hover:bg-gray-100 transition-colors"
              >
                <FiDownload size={18} />
                Download Notes
              </button>
              <button
                onClick={typeof onOpenChat === 'function' ? onOpenChat : undefined}
                className="flex-1 flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-6 py-3 rounded-xl font-medium transition-colors shadow-lg shadow-violet-900/20"
              >
                Open Chat
                <FiMessageSquare size={18} />
              </button>
            </div>
          )}

          {!isProcessing && !downloadUrl && (
            <div className="text-center">
              <p className="text-red-400 mb-4">Processing failed. Please try again.</p>
              <button
                onClick={() => window.location.reload()}
                className="text-white bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-sm transition-colors"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default DocumentUpload
