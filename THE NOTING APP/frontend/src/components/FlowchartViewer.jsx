import React, { useCallback, useMemo } from 'react';
import ReactFlow, {
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import './FlowchartViewer.css';

// Custom node styles for dark theme
const nodeStyles = {
    input: {
        background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
        color: '#ffffff',
        border: 'none',
        borderRadius: '16px',
        padding: '14px 24px',
        fontSize: '15px',
        fontWeight: '700',
        boxShadow: '0 8px 30px rgba(139, 92, 246, 0.4)',
        textAlign: 'center',
        minWidth: '180px',
    },
    default: {
        background: 'rgba(30, 41, 59, 0.8)',
        color: '#f8fafc',
        border: '1px solid rgba(148, 163, 184, 0.2)',
        borderRadius: '12px',
        padding: '12px 20px',
        fontSize: '14px',
        fontWeight: '500',
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
        backdropFilter: 'blur(8px)',
        textAlign: 'center',
        minWidth: '160px',
    },
    output: {
        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        color: '#ffffff',
        border: 'none',
        borderRadius: '16px',
        padding: '14px 24px',
        fontSize: '15px',
        fontWeight: '700',
        boxShadow: '0 8px 30px rgba(16, 185, 129, 0.4)',
        textAlign: 'center',
        minWidth: '180px',
    },
};

const FlowchartViewer = ({ flowchartData, isLoading = false }) => {
    // Process nodes with custom styling
    const initialNodes = useMemo(() => {
        if (!flowchartData?.nodes) return [];

        return flowchartData.nodes.map((node) => ({
            ...node,
            style: nodeStyles[node.type] || nodeStyles.default,
        }));
    }, [flowchartData]);

    // Process edges with styling
    const initialEdges = useMemo(() => {
        if (!flowchartData?.edges) return [];

        return flowchartData.edges.map((edge) => ({
            ...edge,
            style: { stroke: '#8b5cf6', strokeWidth: 2 },
            markerEnd: {
                type: MarkerType.ArrowClosed,
                color: '#8b5cf6',
            },
        }));
    }, [flowchartData]);

    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    // Update nodes/edges when flowchartData changes
    React.useEffect(() => {
        console.log('[DEBUG] FlowchartViewer received data:', flowchartData);
        if (flowchartData?.nodes) {
            console.log('[DEBUG] Setting nodes:', flowchartData.nodes.length);
            setNodes(flowchartData.nodes.map((node) => ({
                ...node,
                style: nodeStyles[node.type] || nodeStyles.default,
            })));
        }
        if (flowchartData?.edges) {
            setEdges(flowchartData.edges.map((edge) => ({
                ...edge,
                style: { stroke: '#8b5cf6', strokeWidth: 2 },
                markerEnd: {
                    type: MarkerType.ArrowClosed,
                    color: '#8b5cf6',
                },
            })));
        }
    }, [flowchartData, setNodes, setEdges]);

    if (isLoading) {
        return (
            <div className="flowchart-container flowchart-loading">
                <div className="flowchart-spinner"></div>
                <p>Generating flowchart...</p>
            </div>
        );
    }

    if ((!flowchartData?.nodes || flowchartData.nodes.length === 0) && flowchartData?.markdown) {
        return (
            <div className="flowchart-wrapper">
                <div className="flowchart-fallback-card" style={{ 
                    background: 'rgba(30, 41, 59, 0.4)', 
                    padding: '2rem', 
                    borderRadius: '16px', 
                    border: '1px solid rgba(139, 92, 246, 0.2)',
                    color: '#f8fafc',
                    textAlign: 'center'
                }}>
                    <h3>{flowchartData.markdown.split('\n')[0].replace('# ', '')}</h3>
                    <div className="fallback-content" style={{ marginTop: '1rem', opacity: 0.8 }}>
                        {flowchartData.markdown.split('\n').slice(1, 5).map((line, i) => (
                            <p key={i}>{line.replace(/^-\s+/, '')}</p>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (!flowchartData || !flowchartData.nodes || flowchartData.nodes.length === 0) {
        return null;
    }

    return (
        <div className="flowchart-wrapper" style={{ width: '100%', marginBottom: '2rem' }}>
            <div className="flowchart-header">
                <h3>Document Flowchart</h3>
                <p>Visual overview of your document structure</p>
            </div>
            <div className="flowchart-container" style={{ width: '100%', height: '500px', background: '#1a1a1e', border: '1px solid #333', borderRadius: '12px' }}>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    fitView
                    fitViewOptions={{ padding: 0.3 }}
                    minZoom={0.3}
                    maxZoom={1.5}
                    attributionPosition="bottom-left"
                >
                    <Controls
                        showZoom={true}
                        showFitView={true}
                        showInteractive={false}
                    />
                    <Background
                        variant="dots"
                        gap={20}
                        size={1}
                        color="#374151"
                    />
                </ReactFlow>
            </div>
        </div>
    );
};

export default FlowchartViewer;
