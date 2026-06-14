import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function ReportViewer({ notebookId, documents = [] }) {
  const [tone, setTone] = useState('Formal');
  const [focus, setFocus] = useState('Business');
  const [extraInputs, setExtraInputs] = useState('');
  const [reportMarkdown, setReportMarkdown] = useState('');
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

      setReportMarkdown(response.data.reportMarkdown);
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
    <div style={{
      display: 'flex',
      flexDirection: 'row',
      height: '100%',
      backgroundColor: '#0c0b10',
      color: '#e4e4e7',
      overflow: 'hidden'
    }}>
      {/* Left Column: Report configuration */}
      <div style={{
        flex: 1.2,
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        borderRight: '1px solid rgba(255, 255, 255, 0.08)',
        height: '100%',
        overflowY: 'auto'
      }}>
        <h3 style={{ fontSize: '15px', fontWeight: '800', margin: 0, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '1px' }}>
          Report Customizer
        </h3>

        {/* Tone Selector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#a1a1aa' }}>Select Tone</label>
          <select
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            style={{
              height: '36px',
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '6px',
              color: '#fff',
              fontSize: '13px',
              padding: '0 8px',
              outline: 'none'
            }}
          >
            <option value="Formal" style={{ backgroundColor: '#0c0b10' }}>Formal</option>
            <option value="Semi-Formal" style={{ backgroundColor: '#0c0b10' }}>Semi-Formal</option>
            <option value="Casual" style={{ backgroundColor: '#0c0b10' }}>Casual</option>
          </select>
        </div>

        {/* Focus Selector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#a1a1aa' }}>Select Focus / Audience</label>
          <select
            value={focus}
            onChange={(e) => setFocus(e.target.value)}
            style={{
              height: '36px',
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '6px',
              color: '#fff',
              fontSize: '13px',
              padding: '0 8px',
              outline: 'none'
            }}
          >
            <option value="Academic" style={{ backgroundColor: '#0c0b10' }}>Academic</option>
            <option value="Commercial" style={{ backgroundColor: '#0c0b10' }}>Commercial</option>
            <option value="Business" style={{ backgroundColor: '#0c0b10' }}>Business</option>
          </select>
        </div>

        {/* Extra Guideline Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#a1a1aa' }}>Extra Context or Guidelines</label>
          <textarea
            rows={4}
            value={extraInputs}
            onChange={(e) => setExtraInputs(e.target.value)}
            placeholder="E.g., Include detailed SWOT analysis, focus on financial projections, write in British English..."
            style={{
              borderRadius: '6px',
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              padding: '10px',
              color: '#fff',
              fontSize: '12px',
              resize: 'none',
              lineHeight: '1.4',
              outline: 'none'
            }}
          />
        </div>

        {/* Generate Button (Text-only, Solid Purple) */}
        <button
          onClick={handleGenerateReport}
          disabled={isGenerating}
          onMouseOver={(e) => { if (!isGenerating) e.currentTarget.style.backgroundColor = '#6d28d9'; }}
          onMouseOut={(e) => { if (!isGenerating) e.currentTarget.style.backgroundColor = '#7c3aed'; }}
          style={{
            height: '40px',
            borderRadius: '8px',
            backgroundColor: '#7c3aed',
            color: '#ffffff',
            fontWeight: '700',
            fontSize: '13px',
            border: 'none',
            cursor: isGenerating ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s',
            boxShadow: '0 4px 15px rgba(124, 58, 237, 0.2)',
            marginTop: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {isGenerating ? "Researching & Compiling..." : "Generate AI Research Report"}
        </button>
      </div>

      {/* Right Column: Report Preview */}
      <div style={{
        flex: 2,
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: '#09080d'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '12px', marginBottom: '16px', flexShrink: 0 }}>
          <h3 style={{ fontSize: '15px', fontWeight: '800', margin: 0, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Report Preview
          </h3>
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

        {/* Preview Container */}
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
                @keyframes spin {
                  from { transform: rotate(0deg); }
                  to { transform: rotate(360deg); }
                }
              `}</style>
              <ReactMarkdown>{reportMarkdown}</ReactMarkdown>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center', alignItems: 'center', color: '#71717a', gap: '8px' }}>
              <div style={{ fontSize: '14px', fontWeight: 'bold' }}>No Report Generated Yet</div>
              <div style={{ fontSize: '12px' }}>Configure your preferences in the left panel and click generate.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
