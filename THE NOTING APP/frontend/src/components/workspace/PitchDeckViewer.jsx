import React, { useState, useEffect, useRef } from 'react';
import { Player } from '@remotion/player';
import { MainVideo } from '../../remotion/MainVideo';
import { 
  Play, 
  Pause, 
  Sparkles, 
  Download, 
  Copy, 
  Check, 
  Loader2, 
  Video, 
  AlertTriangle,
  RotateCcw,
  MessageSquare,
  GitBranch,
  HelpCircle,
  Wand2,
  ChevronDown,
  ChevronUp,
  FileBarChart,
  Presentation,
  ChevronLeft,
  ChevronRight,
  Monitor,
  Layers,
  Upload
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import pptxgen from 'pptxgenjs';

const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://the-noting-app.onrender.com' : 'http://localhost:5000');

const PLACEHOLDER_SCRIPT = {
  productName: "Your Subject",
  hookText: "A compelling hook question about your subject matter will be generated here.",
  problemText: "The main problems or challenges in your subject's domain will be summarized here.",
  solutionText: "The core solutions, innovations, or findings from your files will be outlined here.",
  features: [
    {
      title: "Core Concept 1",
      description: "Details about your first major pillar or key result will go here.",
      simulatedChat: {
        userQuestion: "How does it work?",
        aiAnswer: "Once you upload your files, this chat will simulate real-time Q&A about this concept."
      }
    },
    {
      title: "Methodology & Flow",
      description: "Details about your second major pillar or process flow will go here.",
      simulatedFlowchart: {
        nodeA: "Phase One",
        nodeB: "Phase Two",
        nodeC: "Phase Three"
      }
    },
    {
      title: "Key Fact / Quiz",
      description: "Details about your third major pillar or validation will go here.",
      simulatedQuiz: {
        question: "Q1. What is the key question testing this concept?",
        options: [
          "A) Option One",
          "B) Option Two",
          "C) Option Three",
          "D) Option Four"
        ],
        correctIndex: 2,
        feedback: "Correct explanation is generated here."
      }
    }
  ],
  demoSteps: [
    { action: "First workflow stage...", detail: "Details about the first phase" },
    { action: "Second workflow stage...", detail: "Details about the second phase" },
    { action: "Third workflow stage...", detail: "Details about the third phase" }
  ],
  ctaText: "Your concluding vision or call to action statement will go here."
};

export default function PitchDeckViewer({ notebookId, documents = [], selectedDocIds = [], pitchScript, onPitchScriptChange }) {
  const script = pitchScript;
  const setScript = (newScriptOrFn) => {
    if (typeof newScriptOrFn === 'function') {
      onPitchScriptChange(newScriptOrFn(pitchScript));
    } else {
      onPitchScriptChange(newScriptOrFn);
    }
  };

  const [userInput, setUserInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportResult, setExportResult] = useState(null);
  const [exportError, setExportError] = useState(null);
  const [copiedProps, setCopiedProps] = useState(false);
  const [expandedSection, setExpandedSection] = useState('metadata');
  
  // Tab control: 'video' or 'presentation'
  const [activeTab, setActiveTab] = useState('video');
  const [activeSlide, setActiveSlide] = useState(0);

  const playerRef = useRef(null);

  const readyDocs = documents ? documents.filter(d => d.status === 'ready') : [];

  // Generate script from LLM using workspace context + user input
  const handleGenerateScript = async () => {
    setIsGenerating(true);
    setExportResult(null);
    setExportError(null);
    const loadingToast = toast.loading("Analyzing workspace documents to write customized pitch script & slides...");

    try {
      const response = await axios.post(`${API_BASE}/api/pitch/generate`, { 
        notebookId,
        userInput 
      });
      
      const cleanScript = {
        ...PLACEHOLDER_SCRIPT,
        ...response.data
      };
      
      setScript(cleanScript);
      toast.success("AI script & presentation generated successfully!", { id: loadingToast });
      
      if (playerRef.current) {
        playerRef.current.seekTo(0);
        playerRef.current.play();
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "Failed to generate script. Using default.", { id: loadingToast });
    } finally {
      setIsGenerating(false);
    }
  };

  // Export video using backend Remotion CLI
  const handleExportVideo = async () => {
    setIsExporting(true);
    setExportResult(null);
    setExportError(null);
    const renderToast = toast.loading("Rendering high-quality 60-second video on server (takes about a minute)...", { duration: 10000 });

    try {
      const response = await axios.post(`${API_BASE}/api/pitch/export`, { 
        script,
        notebookId 
      });
      
      setExportResult(response.data.videoUrl);
      toast.success("Video rendered successfully!", { id: renderToast });
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.error || "Rendering failed.";
      const errDetails = err.response?.data?.details || "Server error";
      setExportError({ msg: errMsg, details: errDetails });
      toast.error("Rendering failed on server.", { id: renderToast });
    } finally {
      setIsExporting(false);
    }
  };

  // Export Presentation to PowerPoint (.pptx)
  const handleExportPPTX = () => {
    try {
      const pptx = new pptxgen();
      pptx.layout = 'LAYOUT_16x9';

      // Design Constants (harmonious dark violet palette)
      const bgColor = '09080D';
      const textColor = 'FFFFFF';
      const secondaryColor = 'A1A1AA';
      const primaryAccent = 'A78BFA';
      const redAccent = 'F43F5E';
      const greenAccent = '10B981';
      const blueAccent = '3B82F6';

      // Slide 1: Hook
      let slide1 = pptx.addSlide();
      slide1.background = { color: bgColor };
      slide1.addText(script.productName.toUpperCase(), { 
        x: 1.0, y: 1.8, w: 8.0, h: 0.5, 
        fontSize: 16, color: primaryAccent, bold: true, tracking: 3 
      });
      slide1.addText(script.hookText, { 
        x: 1.0, y: 2.5, w: 8.0, h: 2.0, 
        fontSize: 34, color: textColor, bold: true, fontFace: 'Georgia' 
      });

      // Slide 2: Problem
      let slide2 = pptx.addSlide();
      slide2.background = { color: bgColor };
      slide2.addText("THE CHALLENGE", { 
        x: 1.0, y: 1.0, w: 8.0, h: 0.5, 
        fontSize: 16, color: redAccent, bold: true 
      });
      slide2.addText(script.problemText, { 
        x: 1.0, y: 2.0, w: 8.0, h: 3.0, 
        fontSize: 24, color: textColor, fontFace: 'Arial', lineSpacing: 34 
      });

      // Slide 3: Solution
      let slide3 = pptx.addSlide();
      slide3.background = { color: bgColor };
      slide3.addText("THE SOLUTION", { 
        x: 1.0, y: 1.0, w: 8.0, h: 0.5, 
        fontSize: 16, color: greenAccent, bold: true 
      });
      slide3.addText(script.solutionText, { 
        x: 1.0, y: 2.0, w: 8.0, h: 3.0, 
        fontSize: 24, color: textColor, fontFace: 'Arial', lineSpacing: 34 
      });

      // Slide 4: Key Features (3 Columns)
      let slide4 = pptx.addSlide();
      slide4.background = { color: bgColor };
      slide4.addText("KEY CAPABILITIES", { 
        x: 1.0, y: 0.8, w: 8.0, h: 0.5, 
        fontSize: 16, color: primaryAccent, bold: true 
      });
      script.features.forEach((feature, idx) => {
        let colX = 1.0 + idx * 2.8;
        slide4.addText(feature.title, { 
          x: colX, y: 1.8, w: 2.6, h: 0.4, 
          fontSize: 18, color: textColor, bold: true 
        });
        slide4.addText(feature.description, { 
          x: colX, y: 2.3, w: 2.6, h: 2.5, 
          fontSize: 13, color: secondaryColor, fontFace: 'Arial', lineSpacing: 18 
        });
      });

      // Slide 5: Demo Workflow (Timeline)
      let slide5 = pptx.addSlide();
      slide5.background = { color: bgColor };
      slide5.addText("INTELLIGENT WORKFLOW", { 
        x: 1.0, y: 0.8, w: 8.0, h: 0.5, 
        fontSize: 16, color: blueAccent, bold: true 
      });
      script.demoSteps.forEach((step, idx) => {
        let rowY = 1.6 + idx * 1.1;
        slide5.addText(`0${idx+1} — ${step.action}`, { 
          x: 1.0, y: rowY, w: 8.0, h: 0.3, 
          fontSize: 15, color: textColor, bold: true 
        });
        slide5.addText(step.detail, { 
          x: 1.0, y: rowY + 0.35, w: 8.0, h: 0.3, 
          fontSize: 12, color: secondaryColor 
        });
      });

      // Slide 6: CTA
      let slide6 = pptx.addSlide();
      slide6.background = { color: bgColor };
      slide6.addText("JOIN THE REVOLUTION", { 
        x: 1.0, y: 1.8, w: 8.0, h: 0.5, 
        fontSize: 16, color: primaryAccent, bold: true, tracking: 3 
      });
      slide6.addText(script.ctaText, { 
        x: 1.0, y: 2.5, w: 8.0, h: 2.0, 
        fontSize: 26, color: textColor, bold: true, lineSpacing: 36 
      });

      pptx.writeFile({ fileName: `${script.productName}_Presentation.pptx` });
      toast.success("PowerPoint (.pptx) downloaded successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate PowerPoint file.");
    }
  };

  const copyPropsToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(script, null, 2));
    setCopiedProps(true);
    toast.success("Props JSON copied to clipboard!");
    setTimeout(() => setCopiedProps(false), 2000);
  };

  const resetToDefault = () => {
    setScript(PLACEHOLDER_SCRIPT);
    toast.success("Reset to default script");
  };

  // Handle nested feature text edits
  const handleFeatureChange = (index, field, value) => {
    const updatedFeatures = [...script.features];
    updatedFeatures[index] = { ...updatedFeatures[index], [field]: value };
    setScript(prev => ({ ...prev, features: updatedFeatures }));
  };

  // Handle nested simulation edits
  const handleSimulationChange = (index, subKey, field, value) => {
    const updatedFeatures = [...script.features];
    const simulationData = { ...updatedFeatures[index][subKey] };
    simulationData[field] = value;
    updatedFeatures[index] = { ...updatedFeatures[index], [subKey]: simulationData };
    setScript(prev => ({ ...prev, features: updatedFeatures }));
  };

  // Handle nested option changes for Quiz options
  const handleQuizOptionChange = (optionIndex, value) => {
    const updatedFeatures = [...script.features];
    const quizData = { ...updatedFeatures[2].simulatedQuiz };
    const updatedOptions = [...quizData.options];
    updatedOptions[optionIndex] = value;
    quizData.options = updatedOptions;
    updatedFeatures[2].simulatedQuiz = quizData;
    setScript(prev => ({ ...prev, features: updatedFeatures }));
  };

  // Handle nested demo steps edits
  const handleDemoStepChange = (index, field, value) => {
    const updatedSteps = [...script.demoSteps];
    updatedSteps[index] = { ...updatedSteps[index], [field]: value };
    setScript(prev => ({ ...prev, demoSteps: updatedSteps }));
  };

  const toggleSection = (sectionName) => {
    setExpandedSection(expandedSection === sectionName ? null : sectionName);
  };

  // Render a specific slide in our Slide Presentation Tab
  const renderSlideDOM = () => {
    switch (activeSlide) {
      case 0: // Hook
        return (
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', padding: '40px', textAlign: 'center', position: 'relative' }}>
            <div style={{ padding: '6px 16px', borderRadius: '20px', backgroundColor: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.25)', color: '#a78bfa', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '20px' }}>
              {script.productName}
            </div>
            <h1 style={{ fontSize: '30px', fontWeight: '800', color: '#fff', fontFace: 'Georgia', fontStyle: 'italic', maxWidth: '85%', lineHeight: '1.4' }}>
              "{script.hookText}"
            </h1>
          </div>
        );
      case 1: // Problem
        return (
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start', height: '100%', padding: '60px' }}>
            <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#f43f5e', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '16px' }}>THE CHALLENGE</div>
            <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#fff', maxWidth: '90%', lineHeight: '1.5', margin: 0 }}>
              {script.problemText}
            </h1>
          </div>
        );
      case 2: // Solution
        return (
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start', height: '100%', padding: '60px' }}>
            <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#10b981', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '16px' }}>THE SOLUTION</div>
            <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#fff', maxWidth: '90%', lineHeight: '1.5', margin: 0 }}>
              {script.solutionText}
            </h1>
          </div>
        );
      case 3: // Features
        return (
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', padding: '40px' }}>
            <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#a78bfa', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '30px' }}>KEY CAPABILITIES</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
              {script.features.map((feat, idx) => (
                <div key={idx} style={{ padding: '20px', borderRadius: '12px', backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#fff', marginBottom: '10px' }}>{feat.title}</div>
                  <div style={{ fontSize: '11px', color: '#a1a1aa', lineHeight: '1.5' }}>{feat.description}</div>
                </div>
              ))}
            </div>
          </div>
        );
      case 4: // Demo Flow
        return (
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', padding: '40px' }}>
            <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#3b82f6', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '35px' }}>INTELLIGENT WORKFLOW</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {script.demoSteps.map((step, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.3)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyCenter: 'center', fontSize: '12px', fontWeight: 'bold', flexShrink: 0, justifyContent: 'center' }}>{idx+1}</div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#fff' }}>{step.action}</div>
                    <div style={{ fontSize: '11px', color: '#a1a1aa', marginTop: '2px' }}>{step.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 5: // CTA
        return (
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', padding: '40px', textAlign: 'center' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '14px', background: 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)', display: 'flex', alignItems: 'center', justifyCenter: 'center', fontSize: '24px', fontWeight: 'bold', color: '#fff', marginBottom: '20px', justifyContent: 'center' }}>N</div>
            <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#fff', marginBottom: '12px', maxWidth: '85%' }}>
              {script.ctaText}
            </h2>
            <div style={{ padding: '8px 20px', borderRadius: '20px', background: 'linear-gradient(135deg, #a78bfa 0%, #3b82f6 100%)', color: '#fff', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Get Started Now
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const SLIDE_NAMES = ["Hook Question", "The Problem", "The Solution", "Key Features", "RAG Workflow", "Call to Action"];

  if (isGenerating && !pitchScript) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', backgroundColor: '#09080d', gap: '15px', color: '#e4e4e7', height: '100%' }}>
        <Loader2 size={36} className="animate-spin text-purple-500" style={{ color: '#a78bfa' }} />
        <span style={{ fontSize: '14px', color: '#a1a1aa', fontWeight: '500' }}>AI is writing script & slides...</span>
      </div>
    );
  }

  if (!pitchScript) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', backgroundColor: '#09080d', gap: '20px', color: '#e4e4e7', height: '100%', padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '40px' }}>🎬</div>
        <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '700', color: '#ffffff' }}>No Pitch Deck Generated Yet</h3>
        <p style={{ margin: 0, fontSize: '0.85rem', color: '#a1a1aa', maxWidth: '360px', lineHeight: '1.5' }}>
          Generate a customized cinematic video and slide presentation from your uploaded documents.
        </p>
        <button
          onClick={handleGenerateScript}
          disabled={isGenerating || readyDocs.length === 0}
          style={{
            padding: '10px 24px',
            borderRadius: '10px',
            backgroundColor: '#7c3aed',
            color: '#ffffff',
            fontWeight: '700',
            fontSize: '13px',
            border: 'none',
            cursor: readyDocs.length === 0 ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s',
            opacity: readyDocs.length === 0 ? 0.5 : 1,
            boxShadow: '0 4px 12px rgba(124, 58, 237, 0.25)'
          }}
        >
          Generate Pitch Deck
        </button>
        {readyDocs.length === 0 && (
          <span style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '5px' }}>⚠️ Please upload ready documents in the workspace first.</span>
        )}
      </div>
    );
  }

  return (
    <div className="flowchart-wrapper pitch-wrapper" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="flowchart-header pitch-header">
        <h3>Pitch Video & Slides</h3>
        <p>Generate, review, customize, and export cinematic pitch videos or PowerPoint slide presentations.</p>
      </div>

      <div className="flowchart-layout-container pitch-layout" style={{ flex: 1, display: 'flex', gap: '1.25rem', width: '100%', minHeight: 0, overflow: 'hidden' }}>
        
        {/* Left Column: Player / Slides Preview (Main Content Canvas) */}
        <div className="flowchart-container pitch-preview-container" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, overflow: 'hidden', background: '#09090b', border: '1px solid rgba(63, 63, 70, 0.4)', borderRadius: '16px', padding: '24px' }}>
          
          {/* Tab Controls inside main view */}
          <div style={{
            display: 'flex',
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: '10px',
            padding: '4px',
            gap: '4px',
            marginBottom: '20px',
            flexShrink: 0
          }}>
            <button
              onClick={() => setActiveTab('video')}
              style={{
                flex: 1,
                height: '36px',
                borderRadius: '7px',
                backgroundColor: activeTab === 'video' ? '#7c3aed' : 'transparent',
                color: '#ffffff',
                fontWeight: '700',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                cursor: 'pointer',
                border: 'none',
                transition: 'background-color 0.2s'
              }}
            >
              <span>Cinematic Video Preview</span>
            </button>
            <button
              onClick={() => setActiveTab('slides')}
              style={{
                flex: 1,
                height: '36px',
                borderRadius: '7px',
                backgroundColor: activeTab === 'slides' ? '#7c3aed' : 'transparent',
                color: '#ffffff',
                fontWeight: '700',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                cursor: 'pointer',
                border: 'none',
                transition: 'background-color 0.2s'
              }}
            >
              <span>Slide Presentation Preview</span>
            </button>
          </div>

          {/* Viewer Area */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: 0, overflow: 'hidden', position: 'relative' }}>
            {activeTab === 'video' ? (
              <div style={{
                width: '100%',
                backgroundColor: '#040406',
                borderRadius: '12px',
                border: '1px solid rgba(139, 92, 246, 0.15)',
                overflow: 'hidden',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
                position: 'relative'
              }}>
                {isGenerating ? (
                  <div style={{ width: '100%', aspectRatio: '16/9', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', backgroundColor: '#09080d', gap: '15px' }}>
                    <Loader2 size={36} className="animate-spin text-purple-500" style={{ color: '#a78bfa' }} />
                    <span style={{ fontSize: '14px', color: '#a1a1aa', fontWeight: '500' }}>AI is writing script & slides...</span>
                  </div>
                ) : (
                  <Player
                    ref={playerRef}
                    component={MainVideo}
                    durationInFrames={1800}
                    fps={30}
                    compositionWidth={1920}
                    compositionHeight={1080}
                    style={{
                      width: '100%',
                      aspectRatio: '16/9'
                    }}
                    inputProps={script}
                    controls
                  />
                )}
              </div>
            ) : (
              <div style={{
                width: '100%',
                aspectRatio: '16/9',
                backgroundColor: '#09080d',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                overflow: 'hidden',
                position: 'relative',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                display: 'flex',
                flexDirection: 'column'
              }}>
                <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(to right, rgba(99, 102, 241, 0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(99, 102, 241, 0.03) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
                
                <div style={{ flex: 1, zIndex: 10, position: 'relative' }}>
                  {isGenerating ? (
                    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', backgroundColor: '#09080d', gap: '15px' }}>
                      <Loader2 size={36} className="animate-spin text-purple-500" style={{ color: '#a78bfa' }} />
                      <span style={{ fontSize: '14px', color: '#a1a1aa', fontWeight: '500' }}>AI is compiling slides...</span>
                    </div>
                  ) : renderSlideDOM()}
                </div>

                {/* Navigation Controller & Dot Selector */}
                <div style={{
                  height: '46px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                  backgroundColor: 'rgba(10, 10, 15, 0.7)',
                  zIndex: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0 20px'
                }}>
                  <button
                    disabled={activeSlide === 0 || isGenerating}
                    onClick={() => setActiveSlide(prev => Math.max(0, prev - 1))}
                    style={{
                      backgroundColor: 'transparent',
                      border: 'none',
                      color: (activeSlide === 0 || isGenerating) ? '#52525b' : '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      cursor: (activeSlide === 0 || isGenerating) ? 'not-allowed' : 'pointer',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}
                  >
                    Prev
                  </button>
                  
                  {/* Slide Indicators */}
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {[0, 1, 2, 3, 4, 5].map(idx => (
                      <div
                        key={idx}
                        onClick={() => !isGenerating && setActiveSlide(idx)}
                        title={SLIDE_NAMES[idx]}
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: activeSlide === idx ? '#a78bfa' : 'rgba(255,255,255,0.2)',
                          cursor: isGenerating ? 'not-allowed' : 'pointer',
                          transition: 'background-color 0.2s'
                        }}
                      />
                    ))}
                  </div>

                  <button
                    disabled={activeSlide === 5 || isGenerating}
                    onClick={() => setActiveSlide(prev => Math.min(5, prev + 1))}
                    style={{
                      backgroundColor: 'transparent',
                      border: 'none',
                      color: (activeSlide === 5 || isGenerating) ? '#52525b' : '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      cursor: (activeSlide === 5 || isGenerating) ? 'not-allowed' : 'pointer',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Export rendering status messages at the bottom of the preview panel */}
          {(isExporting || exportResult || exportError) && (
            <div style={{ marginTop: '16px', flexShrink: 0 }}>
              {isExporting && (
                <div style={{
                  padding: '16px',
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <Loader2 size={20} className="animate-spin" style={{ color: '#a78bfa' }} />
                  <div>
                    <div style={{ fontWeight: 'bold', color: '#fff', fontSize: '13px' }}>Server Rendering Active</div>
                    <div style={{ fontSize: '11px', color: '#71717a', marginTop: '2px' }}>Running Remotion CLI + FFmpeg on the server...</div>
                  </div>
                </div>
              )}

              {exportResult && (
                <div style={{
                  padding: '16px',
                  backgroundColor: 'rgba(34, 197, 94, 0.05)',
                  border: '1px solid rgba(34, 197, 94, 0.2)',
                  borderRadius: '10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22c55e' }} />
                    <div style={{ fontWeight: 'bold', color: '#22c55e', fontSize: '13px' }}>Export Complete!</div>
                  </div>
                  <a
                    href={exportResult}
                    download
                    style={{
                      alignSelf: 'flex-start',
                      padding: '6px 14px',
                      borderRadius: '6px',
                      backgroundColor: '#7c3aed',
                      color: '#ffffff',
                      fontWeight: '700',
                      fontSize: '11px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      textDecoration: 'none'
                    }}
                  >
                    Download MP4 Video
                  </a>
                </div>
              )}

              {exportError && (
                <div style={{
                  padding: '16px',
                  backgroundColor: 'rgba(239, 68, 68, 0.04)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  borderRadius: '10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <AlertTriangle size={16} style={{ color: '#ef4444' }} />
                    <div style={{ fontWeight: 'bold', color: '#ef4444', fontSize: '13px' }}>Rendering Error</div>
                  </div>
                  <p style={{ fontSize: '11px', color: '#a1a1aa', margin: 0, lineHeight: '1.5' }}>
                    Rendering failed on server. You can copy the props JSON and render locally:
                  </p>
                  <button
                    onClick={copyPropsToClipboard}
                    style={{
                      alignSelf: 'flex-start',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      backgroundColor: 'transparent',
                      border: '1px solid #7c3aed',
                      color: '#a78bfa',
                      fontSize: '10px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    {copiedProps ? "Copied!" : "Copy Props JSON"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Customization Editor & Actions Sidebar */}
        <div className="flowchart-sidebar pitch-sidebar" style={{ width: '310px', background: 'rgba(10, 10, 12, 0.5)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', overflowY: 'auto' }}>
          
          <div className="sidebar-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0 }}>Pitch Customizer</h4>
              <button 
                onClick={resetToDefault} 
                style={{
                  padding: '2px 8px',
                  borderRadius: '4px',
                  backgroundColor: 'transparent',
                  border: '1px solid #7c3aed',
                  color: '#a78bfa',
                  fontSize: '10px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Reset
              </button>
            </div>

            {/* AI Generator Prominent tailoring controller */}
            <div style={{
              padding: '12px',
              borderRadius: '10px',
              backgroundColor: 'rgba(139, 92, 246, 0.03)',
              border: '1px solid rgba(139, 92, 246, 0.12)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              marginTop: '10px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700', color: '#a78bfa', fontSize: '11px' }}>
                <Wand2 size={12} />
                <span>AI Prompt Customization</span>
              </div>
              <textarea
                rows={2}
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder={readyDocs.length > 0 
                  ? "E.g., Focus on Chapter 3, target audience is investors..."
                  : "Type idea to generate custom slides..."}
                style={{
                  borderRadius: '6px',
                  backgroundColor: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  padding: '6px 8px',
                  color: '#fff',
                  fontSize: '0.75rem',
                  resize: 'none',
                  lineHeight: '1.4',
                  outline: 'none'
                }}
              />
              <button
                className="toolbar-btn primary"
                onClick={handleGenerateScript}
                disabled={isGenerating}
                style={{ width: '100%', fontSize: '0.75rem', padding: '6px' }}
              >
                Regenerate AI Slides
              </button>
            </div>
          </div>

          {/* Slide Editor Accordions */}
          <div className="sidebar-section">
            <h4 style={{ fontSize: '0.75rem', color: '#71717a' }}>Slide Content Editor</h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '6px' }}>
              
              {/* Section 1: Basic Metadata */}
              <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '10px' }}>
                <div 
                  onClick={() => toggleSection('metadata')}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', fontWeight: '700', color: '#fff', fontSize: '0.8rem' }}
                >
                  <span>1. Brand & Info</span>
                  {expandedSection === 'metadata' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </div>

                {expandedSection === 'metadata' && (
                  <div className="form-group" style={{ marginTop: '8px' }}>
                    <label style={{ fontSize: '0.65rem' }}>Product Name</label>
                    <input
                      type="text"
                      value={script.productName}
                      onChange={(e) => setScript(prev => ({ ...prev, productName: e.target.value }))}
                      style={{ fontSize: '0.75rem', padding: '6px', backgroundColor: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '4px', color: '#fff' }}
                    />
                  </div>
                )}
              </div>

              {/* Section 2: Narrative Scenes */}
              <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '10px' }}>
                <div 
                  onClick={() => toggleSection('scenes')}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', fontWeight: '700', color: '#fff', fontSize: '0.8rem' }}
                >
                  <span>2. Slide Text (Scenes 1-3, 6)</span>
                  {expandedSection === 'scenes' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </div>

                {expandedSection === 'scenes' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
                    <div className="form-group">
                      <label style={{ fontSize: '0.65rem' }}>Scene 1: Hook</label>
                      <textarea
                        rows={2}
                        value={script.hookText}
                        onChange={(e) => setScript(prev => ({ ...prev, hookText: e.target.value }))}
                        style={{ fontSize: '0.75rem', padding: '6px', backgroundColor: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '4px', color: '#fff' }}
                      />
                    </div>
                    <div className="form-group">
                      <label style={{ fontSize: '0.65rem' }}>Scene 2: Problem</label>
                      <textarea
                        rows={2}
                        value={script.problemText}
                        onChange={(e) => setScript(prev => ({ ...prev, problemText: e.target.value }))}
                        style={{ fontSize: '0.75rem', padding: '6px', backgroundColor: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '4px', color: '#fff' }}
                      />
                    </div>
                    <div className="form-group">
                      <label style={{ fontSize: '0.65rem' }}>Scene 3: Solution</label>
                      <textarea
                        rows={2}
                        value={script.solutionText}
                        onChange={(e) => setScript(prev => ({ ...prev, solutionText: e.target.value }))}
                        style={{ fontSize: '0.75rem', padding: '6px', backgroundColor: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '4px', color: '#fff' }}
                      />
                    </div>
                    <div className="form-group">
                      <label style={{ fontSize: '0.65rem' }}>Scene 6: CTA</label>
                      <textarea
                        rows={2}
                        value={script.ctaText}
                        onChange={(e) => setScript(prev => ({ ...prev, ctaText: e.target.value }))}
                        style={{ fontSize: '0.75rem', padding: '6px', backgroundColor: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '4px', color: '#fff' }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Section 3: Feature Animations */}
              <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '10px' }}>
                <div 
                  onClick={() => toggleSection('features')}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', fontWeight: '700', color: '#fff', fontSize: '0.8rem' }}
                >
                  <span>3. Capabilities (Scenes 4-5)</span>
                  {expandedSection === 'features' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </div>

                {expandedSection === 'features' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
                    {/* Feature 1 */}
                    <div style={{ borderBottom: '1px dashed rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                      <div style={{ fontSize: '10px', color: '#3b82f6', fontWeight: 'bold', marginBottom: '4px' }}>Feature 1: RAG Chat</div>
                      <input
                        type="text"
                        placeholder="Title"
                        value={script.features[0]?.title}
                        onChange={(e) => handleFeatureChange(0, 'title', e.target.value)}
                        style={{ fontSize: '0.75rem', padding: '6px', width: '100%', marginBottom: '4px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '4px', color: '#fff' }}
                      />
                      <textarea
                        rows={1}
                        placeholder="Description"
                        value={script.features[0]?.description}
                        onChange={(e) => handleFeatureChange(0, 'description', e.target.value)}
                        style={{ fontSize: '0.75rem', padding: '6px', width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '4px', color: '#fff', resize: 'none' }}
                      />
                    </div>
                    {/* Feature 2 */}
                    <div style={{ borderBottom: '1px dashed rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                      <div style={{ fontSize: '10px', color: '#f472b6', fontWeight: 'bold', marginBottom: '4px' }}>Feature 2: Flowcharts</div>
                      <input
                        type="text"
                        placeholder="Title"
                        value={script.features[1]?.title}
                        onChange={(e) => handleFeatureChange(1, 'title', e.target.value)}
                        style={{ fontSize: '0.75rem', padding: '6px', width: '100%', marginBottom: '4px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '4px', color: '#fff' }}
                      />
                      <textarea
                        rows={1}
                        placeholder="Description"
                        value={script.features[1]?.description}
                        onChange={(e) => handleFeatureChange(1, 'description', e.target.value)}
                        style={{ fontSize: '0.75rem', padding: '6px', width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '4px', color: '#fff', resize: 'none' }}
                      />
                    </div>
                    {/* Feature 3 */}
                    <div>
                      <div style={{ fontSize: '10px', color: '#22c55e', fontWeight: 'bold', marginBottom: '4px' }}>Feature 3: Quizzes</div>
                      <input
                        type="text"
                        placeholder="Title"
                        value={script.features[2]?.title}
                        onChange={(e) => handleFeatureChange(2, 'title', e.target.value)}
                        style={{ fontSize: '0.75rem', padding: '6px', width: '100%', marginBottom: '4px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '4px', color: '#fff' }}
                      />
                      <textarea
                        rows={1}
                        placeholder="Description"
                        value={script.features[2]?.description}
                        onChange={(e) => handleFeatureChange(2, 'description', e.target.value)}
                        style={{ fontSize: '0.75rem', padding: '6px', width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '4px', color: '#fff', resize: 'none' }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Export Actions */}
          <div className="sidebar-section" style={{ marginTop: 'auto' }}>
            <h4 style={{ fontSize: '0.75rem', color: '#71717a' }}>Export Options</h4>
            <div className="toolbar-buttons" style={{ marginTop: '8px', gap: '8px' }}>
              {activeTab === 'video' ? (
                <button
                  className="toolbar-btn primary"
                  onClick={handleExportVideo}
                  disabled={isExporting || isGenerating}
                  style={{ width: '100%' }}
                >
                  {isExporting ? "Rendering MP4..." : "Export MP4 Video"}
                </button>
              ) : (
                <button
                  className="toolbar-btn primary"
                  onClick={handleExportPPTX}
                  disabled={isGenerating}
                  style={{ width: '100%' }}
                >
                  Download PowerPoint (.pptx)
                </button>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}


