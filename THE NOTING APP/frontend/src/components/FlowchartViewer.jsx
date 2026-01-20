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
        background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)',
        color: '#fff',
        border: '2px solid #8b5cf6',
        borderRadius: '12px',
        padding: '12px 20px',
        fontSize: '14px',
        fontWeight: '600',
        boxShadow: '0 4px 20px rgba(124, 58, 237, 0.3)',
    },
    default: {
        background: 'linear-gradient(135deg, #374151 0%, #1f2937 100%)',
        color: '#f3f4f6',
        border: '2px solid #4b5563',
        borderRadius: '10px',
        padding: '10px 16px',
        fontSize: '13px',
        fontWeight: '500',
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
    },
    output: {
        background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
        color: '#fff',
        border: '2px solid #10b981',
        borderRadius: '12px',
        padding: '12px 20px',
        fontSize: '14px',
        fontWeight: '600',
        boxShadow: '0 4px 20px rgba(16, 185, 129, 0.3)',
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
