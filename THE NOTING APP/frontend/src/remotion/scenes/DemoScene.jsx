import React from 'react';
import { useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';
import { BrowserMockup } from '../components/BrowserMockup';

export const DemoScene = ({ demoSteps }) => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();

  // Scene level opacity transition
  const sceneOpacity = interpolate(
    frame,
    [0, 15, durationInFrames - 15, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-start',
      alignItems: 'center',
      opacity: sceneOpacity,
      paddingTop: '60px',
      boxSizing: 'border-box',
      backgroundColor: '#050407'
    }}>
      {/* Scene Title */}
      <div style={{ textAlign: 'center', marginBottom: '25px', zIndex: 10 }}>
        <h2 style={{
          fontSize: '44px',
          fontWeight: '800',
          margin: 0,
          background: 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '10px'
        }}>
          Intelligent Ingestion Pipeline
        </h2>
        <p style={{
          fontSize: '20px',
          color: '#a1a1aa',
          margin: 0,
          fontWeight: '500'
        }}>
          Watch raw documents compile into vectorless RAG nodes
        </p>
      </div>

      {/* Browser Mockup */}
      <BrowserMockup 
        title="workspace.notebook-ai.app/upload"
        style={{
          height: '640px',
          marginTop: '10px'
        }}
      >
        <div style={{
          flex: 1,
          backgroundColor: '#08080c',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '40px'
        }}>
          {frame < 120 ? renderUploadStep(frame, fps) : renderRAGPipelineStep(frame - 120, fps, demoSteps)}
        </div>
      </BrowserMockup>
    </div>
  );
};

// ==========================================
// STAGE 1: UPLOAD & INGESTION SIMULATION
// ==========================================
function renderUploadStep(f, fps) {
  // Ingest progress from 0% to 100%
  const progress = interpolate(f, [15, 90], [0, 100], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  });

  // Checklist items
  const check1 = f >= 40;
  const check2 = f >= 70;
  const check3 = f >= 95;

  return (
    <div style={{
      width: '560px',
      backgroundColor: 'rgba(15, 15, 20, 0.8)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      borderRadius: '16px',
      padding: '30px',
      display: 'flex',
      flexDirection: 'column',
      gap: '24px'
    }}>
      {/* File row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '8px',
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ef4444',
            fontWeight: 'bold',
            fontSize: '11px'
          }}>PDF</div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#fff' }}>lecture_notes.pdf</div>
            <div style={{ fontSize: '12px', color: '#71717a' }}>1.4 MB • Processing</div>
          </div>
        </div>
        <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#a78bfa' }}>{Math.floor(progress)}%</div>
      </div>

      {/* Progress Bar */}
      <div style={{
        width: '100%',
        height: '8px',
        borderRadius: '4px',
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        overflow: 'hidden'
      }}>
        <div style={{
          width: `${progress}%`,
          height: '100%',
          backgroundColor: '#a78bfa',
          boxShadow: '0 0 10px rgba(167, 139, 250, 0.5)'
        }} />
      </div>

      {/* Ingestion Steps Checklist */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: check1 ? '#fff' : '#52525b' }}>
          <div style={{
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            backgroundColor: check1 ? '#22c55e' : 'rgba(255, 255, 255, 0.02)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '11px',
            color: check1 ? '#000' : 'transparent',
            fontWeight: 'bold'
          }}>✓</div>
          <span>Parsing document content and extracting text...</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: check2 ? '#fff' : '#52525b' }}>
          <div style={{
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            backgroundColor: check2 ? '#22c55e' : 'rgba(255, 255, 255, 0.02)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '11px',
            color: check2 ? '#000' : 'transparent',
            fontWeight: 'bold'
          }}>✓</div>
          <span>Splitting text into overlapping 300-word chunks...</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: check3 ? '#fff' : '#52525b' }}>
          <div style={{
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            backgroundColor: check3 ? '#22c55e' : 'rgba(255, 255, 255, 0.02)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '11px',
            color: check3 ? '#000' : 'transparent',
            fontWeight: 'bold'
          }}>✓</div>
          <span>Configuring tsvector search indexes...</span>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// STAGE 2: RAG PIPELINE VISUALIZATION
// ==========================================
function renderRAGPipelineStep(f, fps, steps) {
  // Step 1: Query expand (f >= 10)
  const step1Spr = spring({ frame: f - 10, fps, config: { damping: 12 } });
  
  // Step 2: Search merging (f >= 60)
  const step2Spr = spring({ frame: f - 60, fps, config: { damping: 12 } });

  // Step 3: References found (f >= 110)
  const step3Spr = spring({ frame: f - 110, fps, config: { damping: 12 } });

  return (
    <div style={{
      width: '640px',
      backgroundColor: 'rgba(15, 15, 20, 0.8)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      borderRadius: '16px',
      padding: '30px',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px'
    }}>
      <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#60a5fa', letterSpacing: '1.5px', textTransform: 'uppercase' }}>RAG Pipeline Execution</div>
      
      {/* Pipeline visual steps */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        
        {/* Step 1 */}
        {f >= 10 && (
          <div style={{
            padding: '12px 18px',
            borderRadius: '10px',
            backgroundColor: 'rgba(96, 165, 250, 0.06)',
            border: '1px solid rgba(96, 165, 250, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            opacity: step1Spr,
            transform: `translateY(${interpolate(step1Spr, [0, 1], [15, 0])}px)`
          }}>
            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#60a5fa' }}>{steps[0]?.action || "Rewriting query..."}</div>
            <div style={{ fontSize: '13px', color: '#a1a1aa' }}>{steps[0]?.detail || "Generating search keyword expansions"}</div>
          </div>
        )}

        {/* Step 2 */}
        {f >= 60 && (
          <div style={{
            padding: '12px 18px',
            borderRadius: '10px',
            backgroundColor: 'rgba(167, 139, 250, 0.06)',
            border: '1px solid rgba(167, 139, 250, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            opacity: step2Spr,
            transform: `translateY(${interpolate(step2Spr, [0, 1], [15, 0])}px)`
          }}>
            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#a78bfa' }}>{steps[1]?.action || "FTS Retrieval + Re-ranking..."}</div>
            <div style={{ fontSize: '13px', color: '#a1a1aa' }}>{steps[1]?.detail || "Running PostgreSQL full text queries"}</div>
          </div>
        )}

        {/* Step 3 */}
        {f >= 110 && (
          <div style={{
            padding: '12px 18px',
            borderRadius: '10px',
            backgroundColor: 'rgba(34, 197, 94, 0.06)',
            border: '1px solid rgba(34, 197, 94, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            opacity: step3Spr,
            transform: `translateY(${interpolate(step3Spr, [0, 1], [15, 0])}px)`
          }}>
            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#22c55e' }}>{steps[2]?.action || "Context Filtered & Attributed..."}</div>
            <div style={{ fontSize: '13px', color: '#a1a1aa' }}>{steps[2]?.detail || "Ready for synthesis"}</div>
          </div>
        )}

      </div>
    </div>
  );
}
