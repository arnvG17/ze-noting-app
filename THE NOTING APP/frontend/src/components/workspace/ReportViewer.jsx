import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';

const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://the-noting-app.onrender.com' : 'http://localhost:5000');

export default function ReportViewer({ notebookId, documents = [], reportMarkdown, onReportMarkdownChange }) {
  const [tone, setTone] = useState('Formal');
  const [focus, setFocus] = useState('Business');
  const [extraInputs, setExtraInputs] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const readyDocs = documents ? documents.filter(d => d.status === 'ready') : [];

  const handleGenerateReport = async () => {
    if (readyDocs.length === 0) {
      toast.error("Please upload and process documents first to generate a report.");
      return;
    }

    setIsGenerating(true);
    const loadingToast = toast.loading("Researches are compiling. Generating detailed report from document context...");

    try {
      const response = await axios.post(`${API_BASE}/api/report/generate`, {
        notebookId,
        tone,
        focus,
        extraInputs
      });

      onReportMarkdownChange(response.data.reportMarkdown);
      toast.success("Research report generated successfully!", { id: loadingToast });
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "Failed to generate report. Please try again.", { id: loadingToast });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadWord = () => {
    if (!reportMarkdown) return;
    
    // Basic Markdown parser for Word HTML Document formatting
    let htmlBody = reportMarkdown
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^\* (.*$)/gim, '<li>$1</li>')
      .replace(/^- (.*$)/gim, '<li>$1</li>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br/>');

    htmlBody = htmlBody.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');

    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' 
            xmlns:w='urn:schemas-microsoft-com:office:word' 
            xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <title>Research Report</title>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333333; padding: 40px; }
          h1 { color: #7c3aed; font-size: 22pt; margin-top: 24px; margin-bottom: 12px; border-bottom: 2px solid #7c3aed; padding-bottom: 5px; font-weight: bold; }
          h2 { color: #6d28d9; font-size: 16pt; margin-top: 20px; margin-bottom: 10px; font-weight: bold; }
          h3 { color: #374151; font-size: 13pt; margin-top: 15px; margin-bottom: 8px; font-weight: bold; }
          p { font-size: 11pt; margin-bottom: 12px; text-align: justify; }
          ul, ol { margin-bottom: 12px; padding-left: 20px; }
          li { font-size: 11pt; margin-bottom: 6px; }
          strong { font-weight: bold; }
          .meta-info { font-size: 10pt; color: #666666; margin-bottom: 30px; font-style: italic; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px; }
        </style>
      </head>
      <body>
        <h1>RESEARCH REPORT</h1>
        <div class="meta-info">Generated via Noting App — Tone: ${tone} | Focus: ${focus}</div>
        <p>${htmlBody}</p>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff' + htmlContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Research_Report_${tone}_${focus}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success("Word Document (.doc) downloaded successfully!");
  };

  return (
    <div className="flowchart-wrapper report-wrapper" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="flowchart-header report-header">
        <h3>Research Report</h3>
        <p>Generate, customize, and preview detailed research reports from your source documents.</p>
      </div>

      <div className="flowchart-layout-container report-layout" style={{ flex: 1, display: 'flex', gap: '1.25rem', width: '100%', minHeight: 0, overflow: 'hidden' }}>
        {/* Main Canvas Area: Report Preview (Left) */}
        <div className="flowchart-container report-preview-container" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, overflow: 'hidden', background: '#09090b', border: '1px solid rgba(63, 63, 70, 0.4)', borderRadius: '16px', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '12px', marginBottom: '16px', flexShrink: 0 }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: '800', margin: 0, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Report Preview
            </h4>
            {reportMarkdown && (
              <button
                onClick={handleDownloadWord}
                onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#6d28d9'; }}
                onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#7c3aed'; }}
                style={{
                  height: '32px',
                  padding: '0 16px',
                  borderRadius: '6px',
                  backgroundColor: '#7c3aed',
                  color: '#ffffff',
                  fontWeight: '700',
                  fontSize: '11px',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                  boxShadow: '0 4px 10px rgba(124, 58, 237, 0.15)'
                }}
              >
                Download Word Document
              </button>
            )}
          </div>

          {/* Preview Scrollable Box */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px',
            borderRadius: '12px',
            backgroundColor: 'rgba(255, 255, 255, 0.01)',
            border: '1px solid rgba(255, 255, 255, 0.04)',
            lineHeight: '1.7',
            fontSize: '14px',
            color: '#e4e4e7',
            textAlign: 'left'
          }}>
            {isGenerating ? (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center', alignItems: 'center', gap: '15px' }}>
                <div style={{ width: '32px', height: '32px', border: '3px solid #7c3aed', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                <div style={{ fontSize: '13px', color: '#a1a1aa' }}>Analyzing sources and writing report chunks...</div>
              </div>
            ) : reportMarkdown ? (
              <div className="report-markdown-preview">
                <style>{`
                  .report-markdown-preview h1 { font-size: 20px; font-weight: bold; color: #fff; margin-top: 24px; margin-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 6px; }
                  .report-markdown-preview h2 { font-size: 16px; font-weight: bold; color: #a78bfa; margin-top: 20px; margin-bottom: 10px; }
                  .report-markdown-preview h3 { font-size: 14px; font-weight: bold; color: #ffffff; margin-top: 16px; margin-bottom: 8px; }
                  .report-markdown-preview p { margin-bottom: 12px; }
                  .report-markdown-preview ul, .report-markdown-preview ol { padding-left: 20px; margin-bottom: 12px; }
                  .report-markdown-preview li { margin-bottom: 6px; }
                  .report-markdown-preview strong { color: #fff; font-weight: bold; }
                `}</style>
                <ReactMarkdown>{reportMarkdown}</ReactMarkdown>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center', alignItems: 'center', color: '#71717a', gap: '8px' }}>
                <div style={{ fontSize: '14px', fontWeight: 'bold' }}>No Report Generated Yet</div>
                <div style={{ fontSize: '12px' }}>Configure your preferences in the right panel and click generate.</div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Controls: Report Customizer (Right) */}
        <div className="flowchart-sidebar report-sidebar" style={{ width: '250px', background: 'rgba(10, 10, 12, 0.5)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', overflowY: 'auto' }}>
          <div className="sidebar-section">
            <h4>Report Customizer</h4>

            {/* Tone Selector */}
            <div className="form-group">
              <label>Select Tone</label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
              >
                <option value="Formal">Formal</option>
                <option value="Semi-Formal">Semi-Formal</option>
                <option value="Casual">Casual</option>
              </select>
            </div>

            {/* Focus Selector */}
            <div className="form-group">
              <label>Select Focus</label>
              <select
                value={focus}
                onChange={(e) => setFocus(e.target.value)}
              >
                <option value="Academic">Academic</option>
                <option value="Commercial">Commercial</option>
                <option value="Business">Business</option>
              </select>
            </div>

            {/* Extra Guidelines */}
            <div className="form-group">
              <label>Extra Guidelines</label>
              <textarea
                rows={4}
                value={extraInputs}
                onChange={(e) => setExtraInputs(e.target.value)}
                placeholder="E.g., Include SWOT, focus on finances..."
              />
            </div>

            {/* Generate button */}
            <button
              className="toolbar-btn primary"
              onClick={handleGenerateReport}
              disabled={isGenerating}
              style={{ width: '100%' }}
            >
              {isGenerating ? "Compiling..." : "Generate Report"}
            </button>
          </div>

          <div className="sidebar-help">
            <span style={{ fontSize: '1.2rem', color: '#a78bfa', marginBottom: '8px' }}>📝</span>
            <p><strong>Report Advice:</strong></p>
            <ul style={{ paddingLeft: '1.25rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <li style={{ fontSize: '0.75rem', color: '#a1a1aa', lineHeight: '1.35' }}>Academic focuses on citations, data, and rigorous theory.</li>
              <li style={{ fontSize: '0.75rem', color: '#a1a1aa', lineHeight: '1.35' }}>Commercial/Business highlights actionable market conclusions.</li>
              <li style={{ fontSize: '0.75rem', color: '#a1a1aa', lineHeight: '1.35' }}>Once completed, download directly as a Word document.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}


