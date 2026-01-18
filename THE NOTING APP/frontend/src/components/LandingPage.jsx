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
import { ProgressiveBlur } from './ui/ProgressiveBlur';


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

      // Use localhost for development
      const response = await fetch('http://localhost:5000/api/upload', {
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
      toast.error('Upload failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLinkSubmit = async (url) => {
    setUploadedFile({ name: 'Google Drive Link' });
    setIsProcessing(true);
    setDownloadUrl(null);
    setDocumentText('');

    try {
      const response = await fetch('http://localhost:5000/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Scraping failed');
      }

      const data = await response.json();
      setDownloadUrl(data.downloadUrl);
      setDocumentText(data.textContent || '');
      toast.success('Link processed successfully!');

    } catch (error) {
      console.error('Link processing error:', error);
      toast.error(error.message || 'Failed to process link.');
      setUploadedFile(null); // Reset if failed
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

              <h1 className="hero-title swoop-in-blur swoop-delay-1 leading-[0.9]">
                <span className="font-bold text-[5rem] normal-case leading-[0.9]" style={{ fontFamily: "'Satoshi-Bold', sans-serif" }}>
                  Transform your Documents
                </span>
                <br />
                <span className="font-bold text-[5rem] normal-case leading-[0.9]" style={{ fontFamily: "'Satoshi-Bold', sans-serif" }}>
                  into Smart Notes;
                </span>
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
                  onLinkSubmit={handleLinkSubmit}
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

      <div className="fixed bottom-0 left-0 w-full z-10 pointer-events-none">
        <ProgressiveBlur
          position="bottom"
          height="80px"
          blurAmount="4px"
          backgroundColor="#1a1a1e"
        />
      </div>
    </div>
  );
};

export default LandingPage;