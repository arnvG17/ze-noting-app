import React, { useEffect, useRef } from 'react';
import { Transformer } from 'markmap-lib';
import { Markmap } from 'markmap-view';
import './MindMapViewer.css';

const transformer = new Transformer();

const MindMapViewer = ({ flowchartData, isLoading = false }) => {
    const svgRef = useRef(null);
    const mmRef = useRef(null);

    useEffect(() => {
        if (!isLoading && flowchartData?.markdown && svgRef.current) {
            // Clear previous markmap if it exists
            if (mmRef.current) {
                mmRef.current.destroy();
            }

            const { root } = transformer.transform(flowchartData.markdown);
            mmRef.current = Markmap.create(svgRef.current, {
                autoFit: true,
                paddingX: 32,
                color: (node) => {
                    const colors = ['#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe'];
                    return colors[node.depth % colors.length];
                },
                nodeMinHeight: 16,
                spacingVertical: 10,
                spacingHorizontal: 80,
                // Custom style for boxed look
                embedGlobalCSS: false,
            }, root);

            // Set initial state - expand to level 1
            if (mmRef.current) {
                mmRef.current.fit();
            }
        }
    }, [flowchartData, isLoading]);

    if (isLoading) {
        return (
            <div className="mindmap-wrapper loading">
                <div className="flowchart-spinner"></div>
                <p>Generating interactive mind map...</p>
            </div>
        );
    }

    if (!flowchartData || !flowchartData.markdown) {
        return null;
    }

    return (
        <div className="mindmap-section">
            <div className="mindmap-header">
                <h3>Interactive Mind Map</h3>
                <div className="mindmap-controls-hint">
                    <span>Scroll to Zoom</span>
                    <span className="separator">•</span>
                    <span>Drag to Pan</span>
                    <span className="separator">•</span>
                    <span>Click nodes to Toggle</span>
                </div>
            </div>
            <div className="mindmap-container">
                <svg ref={svgRef} className="markmap-svg" />
            </div>
        </div>
    );
};

export default MindMapViewer;
