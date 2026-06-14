import React from 'react';
import { Sequence } from 'remotion';
import { HookScene } from './scenes/HookScene';
import { ProblemScene } from './scenes/ProblemScene';
import { SolutionScene } from './scenes/SolutionScene';
import { FeaturesScene } from './scenes/FeaturesScene';
import { DemoScene } from './scenes/DemoScene';
import { CtaScene } from './scenes/CtaScene';
import './remotion.css';

export const MainVideo = (props) => {
  return (
    <div style={{ flex: 1, backgroundColor: '#09090b', width: '100%', height: '100%', position: 'relative' }}>
      {/* Background grids and ambient glows */}
      <div className="remotion-grid" />
      <div className="remotion-glow-purple" style={{ top: -100, left: -100 }} />
      <div className="remotion-glow-indigo" style={{ bottom: -100, right: -100 }} />

      {/* Scene 1 — Hook (0 - 10 sec / Frame 0 - 300) */}
      <Sequence from={0} durationInFrames={300}>
        <HookScene 
          productName={props.productName} 
          hookText={props.hookText} 
        />
      </Sequence>

      {/* Scene 2 — Problem (10 - 20 sec / Frame 300 - 600) */}
      <Sequence from={300} durationInFrames={300}>
        <ProblemScene 
          problemText={props.problemText} 
        />
      </Sequence>

      {/* Scene 3 — Solution (20 - 30 sec / Frame 600 - 900) */}
      <Sequence from={600} durationInFrames={300}>
        <SolutionScene 
          productName={props.productName} 
          solutionText={props.solutionText} 
        />
      </Sequence>

      {/* Scene 4 — Features (30 - 45 sec / Frame 900 - 1350) */}
      <Sequence from={900} durationInFrames={450}>
        <FeaturesScene 
          features={props.features} 
          productName={props.productName}
        />
      </Sequence>

      {/* Scene 5 — Demo (45 - 55 sec / Frame 1350 - 1650) */}
      <Sequence from={1350} durationInFrames={300}>
        <DemoScene 
          demoSteps={props.demoSteps} 
        />
      </Sequence>

      {/* Scene 6 — CTA (55 - 60 sec / Frame 1650 - 1800) */}
      <Sequence from={1650} durationInFrames={150}>
        <CtaScene 
          productName={props.productName} 
          ctaText={props.ctaText} 
        />
      </Sequence>
    </div>
  );
};
