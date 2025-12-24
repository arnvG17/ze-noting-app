import React, { useState, useEffect } from 'react';
import DocumentUpload from './DocumentUpload';
import Header from './Header';
import Features from './Features';
import Footer from './Footer';
import InlineChatBox from './InlineChatBox';
import QuizSection from './quizz/QuizzPage';
import { useDocumentText } from './DocumentTextContext';
import { FiDownload } from 'react-icons/fi';
import AnimatedBackground from './ui/AnimatedBackground';
import { exportMarkdownToPdf } from '../lib/exportMarkdownToPdf';
import toast from 'react-hot-toast';

const LandingPage = () => {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [isChatExpanded, setIsChatExpanded] = useState(false);
  const { documentText, setDocumentText } = useDocumentText();
  const [showUploader, setShowUploader] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowUploader(window.scrollY > 100);
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleFileUpload = async (file) => {
    setUploadedFile(file);
    setIsProcessing(true);
    setDownloadUrl(null);
    setDocumentText('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('https://the-noting-app.onrender.com/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      console.log('data from upload', data);
      setDownloadUrl(data.downloadUrl);
      setDocumentText(data.textContent || '');

    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = (e) => {
    e.preventDefault();
    if (!documentText) return;
    exportMarkdownToPdf(documentText, uploadedFile ? `${uploadedFile.name.split('.')[0]}-summary.pdf` : 'summary.pdf');
  };

  return (
    <div className="App">
      <AnimatedBackground />
      <Header />

      <main className="main-content">
        <section className="hero-section">
          <div className="container">
            <div className="hero-content">

              <h1 className="hero-title swoop-in-blur swoop-delay-1">
                transform your documents<br />into smart notes;
              </h1>

              <p className="hero-subtitle swoop-in-blur swoop-delay-2">
                ;
              </p>

              <div
                style={{
                  transition: 'all 0.7s',
                  opacity: showUploader ? 1 : 0,
                  filter: showUploader ? 'blur(0px)' : 'blur(8px)',
                  pointerEvents: showUploader ? 'auto' : 'none',
                  marginBottom: 20,
                }}
              >
                <DocumentUpload
                  onFileUpload={handleFileUpload}
                  isProcessing={isProcessing}
                  uploadedFile={uploadedFile}
                  downloadUrl={downloadUrl}
                  onOpenChat={() => setIsChatExpanded(true)}
                />
              </div>

              {/* Inline Expandable Chat - appears after document upload */}
              {documentText && (
                <div style={{ marginTop: '2rem' }}>
                  <InlineChatBox
                    isExpanded={isChatExpanded}
                    onToggle={() => setIsChatExpanded(!isChatExpanded)}
                  />
                </div>
              )}
            </div>
          </div>
        </section>

        {documentText && <QuizSection docText={documentText} />}
        <Features />
      </main>

      <Footer />
    </div>
  );
};

export default LandingPage;