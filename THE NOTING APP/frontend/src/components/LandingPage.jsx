import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DocumentUpload from './DocumentUpload';
import Header from './Header';
import Features from './Features';
import Footer from './Footer';
import { useDocumentText } from './DocumentTextContext';
import AnimatedBackground from './ui/AnimatedBackground';
import toast from 'react-hot-toast';
import { ProgressiveBlur } from './ui/ProgressiveBlur';

const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://the-noting-app.onrender.com' : 'http://localhost:5000');

const LandingPage = () => {
    const navigate = useNavigate();
    const [uploadedFile, setUploadedFile] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [showUploader, setShowUploader] = useState(false);
    const { setDocumentText, setNotebookId, setSummaryText, setFlowchartData } = useDocumentText();

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

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(`${API_BASE}/api/upload`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) throw new Error('Upload failed');

            const data = await response.json();
            console.log('[DEBUG] Upload response:', data);

            // Store in context for workspace
            setDocumentText(data.textContent || '');
            setSummaryText(data.summary || '');
            setFlowchartData(data.flowchartData || null);

            // Navigate to workspace if we got a notebookId
            if (data.notebookId) {
                setNotebookId(data.notebookId);
                toast.success('Document processed! Opening workspace...');
                navigate(`/workspace/${data.notebookId}`);
            } else {
                // Legacy fallback — no DB, show content inline
                toast.success('Document processed!');
            }

        } catch (error) {
            console.error('Upload error:', error);
            toast.error('Upload failed. Please try again.');
            setUploadedFile(null);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleLinkSubmit = async (url) => {
        setUploadedFile({ name: 'Google Drive Link' });
        setIsProcessing(true);

        try {
            const response = await fetch(`${API_BASE}/api/scrape`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url }),
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Scraping failed');
            }

            const data = await response.json();
            console.log('[DEBUG] Scrape response:', data);

            setDocumentText(data.textContent || '');
            setSummaryText(data.summary || '');
            setFlowchartData(data.flowchartData || null);

            if (data.notebookId) {
                setNotebookId(data.notebookId);
                toast.success('Link processed! Opening workspace...');
                navigate(`/workspace/${data.notebookId}`);
            } else {
                toast.success('Link processed!');
            }

        } catch (error) {
            console.error('Link processing error:', error);
            toast.error(error.message || 'Failed to process link.');
            setUploadedFile(null);
        } finally {
            setIsProcessing(false);
        }
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
                                    downloadUrl={null}
                                    onOpenChat={() => {}}
                                />
                            </div>

                        </div>
                    </div>
                </section>

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
