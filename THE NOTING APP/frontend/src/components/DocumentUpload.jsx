import React, { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import toast from 'react-hot-toast'

const backendBase = "http://localhost:5000"; // Change if your backend runs elsewhere

const MAX_FILE_SIZE_MB = 25;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const DocumentUpload = ({ onFileUpload, isProcessing, uploadedFile, downloadUrl, onOpenChat }) => {
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

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    },
    multiple: false
  })

  const handleDownload = () => {
    if (downloadUrl) {
      // Use absolute URL if downloadUrl is relative
      const url = downloadUrl.startsWith('http') ? downloadUrl : backendBase + downloadUrl;
      console.log('DEBUG: Opening download URL in new tab:', url)
      window.open(url, '_blank');
      toast.success('Opened PDF in new tab!')
    } else {
      console.log('DEBUG: No downloadUrl available')
    }
  }

  return (
    <div className="document-upload">
      <div className="upload-container">
        {!uploadedFile ? (
          <div
            {...getRootProps()}
            className={`dropzone ${isDragActive ? 'drag-active' : ''} text-sm`}
          >
            <input {...getInputProps()} />
            <div className="upload-content">
              <div className="upload-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7,10 12,15 17,10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
              </div>
              <h3 className="upload-title text-base">
                {isDragActive ? 'Drop your document here' : 'Upload your document'}
              </h3>
              <p className="upload-subtitle text-xs">
                Drag and drop your PDF, and get notes, Asssistant and Quizzes
              </p>
              <p className="upload-info text-xs">
                Supported formats: PDF, DOCX (Max {MAX_FILE_SIZE_MB}MB)
              </p>
            </div>
          </div>
        ) : (
          <div className="file-info">
            <div className="file-details">
              <div className="file-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14,2 14,8 20,8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10,9 9,9 8,9"/>
                </svg>
              </div>
              <div className="file-text">
                <h4 className="file-name">{uploadedFile.name}</h4>
                <p className="file-size">{(uploadedFile.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            </div>
            
            {isProcessing ? (
              <div className="processing">
                <div className="spinner"></div>
                <p>Processing your document...</p>
                {console.log('DEBUG: Processing document...')}
              </div>
            ) : downloadUrl ? (
              <div className="download-section">
                <button onClick={handleDownload} className="btn btn-primary">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7,10 12,15 17,10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  Download Notes
                </button>
                <button 
                  onClick={typeof onOpenChat === 'function' ? onOpenChat : undefined}
                  style={{
                    background: 'linear-gradient(90deg, #7c3aed 0%, #2563eb 100%)',
                    color: '#fff',
                    fontWeight: 600,
                    padding: '0.75rem 2rem',
                    border: 'none',
                    borderRadius: '1.5rem',
                    fontSize: '1.1rem',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'opacity 0.2s',
                    fontFamily: 'Inter Tight, Inter, sans-serif',
                  }}
                >
                  Open Chat
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginLeft: 8}}>
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12,5 19,12 12,19" />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="error-message">
                <p>Failed to process document. Please try again.</p>
                {console.log('DEBUG: Failed to process document, downloadUrl:', downloadUrl, 'isProcessing:', isProcessing)}
                <button 
                  onClick={() => { console.log('DEBUG: Try Again clicked'); window.location.reload(); }} 
                  className="btn btn-secondary"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default DocumentUpload 