import React from 'react';
import { Composition } from 'remotion';
import { MainVideo } from './MainVideo';

const defaultPitchScript = {
  productName: "NotebookAI",
  hookText: "What if your documents could think?",
  problemText: "Documents are messy, scattered, and overwhelm researchers and students alike.",
  solutionText: "Introducing NotebookAI. A sleek, unified 3-panel workspace that makes your documents interactive.",
  features: [
    {
      title: "RAG Chat",
      description: "Chat with multiple documents simultaneously, backed by instant citations."
    },
    {
      title: "Interactive Flowcharts",
      description: "Automatically visualize connections and structural hierarchies in documents."
    },
    {
      title: "Smart Quizzes",
      description: "Generate quizzes dynamically from document text to test your knowledge."
    }
  ],
  demoSteps: [
    { action: "Analyzing lecture_notes.pdf...", detail: "Vectorless RAG search running..." },
    { action: "Query expanded: 'fiscal policy'...", detail: "Merging PostgreSQL FTS + LLM re-ranking" },
    { action: "Generating answer with citations...", detail: "Instant references located on Page 4" }
  ],
  ctaText: "Build knowledge faster. Start using NotebookAI today."
};

export const Root = () => {
  return (
    <>
      <Composition
        id="NotebookAIPitch"
        component={MainVideo}
        durationInFrames={1800} // 60 seconds at 30 fps
        fps={30}
        width={1920}
        height={1080}
        defaultProps={defaultPitchScript}
      />
    </>
  );
};
