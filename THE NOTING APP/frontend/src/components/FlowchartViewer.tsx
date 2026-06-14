import React, { useState, useEffect, useCallback } from 'react';
import ReactFlow, {
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    addEdge,
    MarkerType,
    Position,
    ReactFlowProvider,
    useReactFlow,
    Node,
    Edge,
    Connection,
    Handle
} from 'reactflow';
import dagre from 'dagre';
import { FiPlus, FiTrash2, FiRefreshCw, FiEdit3 } from 'react-icons/fi';
import 'reactflow/dist/style.css';
import './FlowchartViewer.css';

// Custom Node Component supporting start, process, decision, end types
const FlowchartNode = ({ data, selected }: any) => {
    const isDecision = data.type === 'decision';
    
    return (
        <div className={`custom-node ${data.type || 'process'} ${selected ? 'selected' : ''}`}>
            {/* Connection Handles on all 4 sides */}
            <Handle type="target" position={Position.Top} id="top-target" className="handle" />
            <Handle type="target" position={Position.Left} id="left-target" className="handle" />
            <Handle type="source" position={Position.Bottom} id="bottom-source" className="handle" />
            <Handle type="source" position={Position.Right} id="right-source" className="handle" />
            
            {isDecision && <div className="decision-diamond" />}
            
            <div className="node-content">
                <span className="node-type-label">{data.type || 'process'}</span>
                <span className="node-label-text">{data.label}</span>
            </div>
        </div>
    );
};

const nodeTypes = { custom: FlowchartNode };

// Layout configurations
const nodeWidth = 220;
const nodeHeight = 90;

const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'TB') => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    
    const isHorizontal = direction === 'LR';
    dagreGraph.setGraph({ rankdir: direction, ranksep: 60, nodesep: 40 });

    nodes.forEach((node) => {
        dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    const layoutedNodes = nodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        
        // Determine logical source/target handles depending on layout direction
        return {
            ...node,
            targetPosition: isHorizontal ? Position.Left : Position.Top,
            sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
            position: {
                x: nodeWithPosition.x - nodeWidth / 2,
                y: nodeWithPosition.y - nodeHeight / 2,
            },
        };
    });

    return { nodes: layoutedNodes, edges };
};

interface FlowchartViewerProps {
    flowchartData: {
        nodes: Array<{ id: string; label: string; type?: string }>;
        edges: Array<{ source: string; target: string; label?: string }>;
        markdown?: string;
    };
    isLoading?: boolean;
    onFlowchartUpdate?: (updatedData: any) => void;
    notebookId?: string;
    selectedDocIds?: string[];
}

// Inner component to access the ReactFlow instance context
const FlowchartInner = ({ 
    nodes, 
    edges, 
    onNodesChange, 
    onEdgesChange, 
    onConnect,
    onSelectNode,
    onSelectEdge
}: any) => {
    const { fitView } = useReactFlow();

    // Automatically fit view when nodes change initially
    useEffect(() => {
        if (nodes && nodes.length > 0) {
            const timer = setTimeout(() => {
                fitView({ duration: 400, padding: 0.05 });
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [nodes.length, fitView]);

    const onNodeClick = (_: any, node: Node) => {
        onSelectNode(node);
        onSelectEdge(null);
    };

    const onEdgeClick = (_: any, edge: Edge) => {
        onSelectEdge(edge);
        onSelectNode(null);
    };

    const onPaneClick = () => {
        onSelectNode(null);
        onSelectEdge(null);
    };

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={onNodeClick}
                onEdgeClick={onEdgeClick}
                onPaneClick={onPaneClick}
                fitView
                minZoom={0.1}
                maxZoom={1.5}
                nodesConnectable={true}
                nodesDraggable={true}
                elementsSelectable={true}
            >
                <Controls />
                <Background variant="dots" gap={20} size={1} color="#374151" />
            </ReactFlow>
        </div>
    );
};

const FlowchartViewer: React.FC<FlowchartViewerProps> = ({ 
    flowchartData, 
    isLoading = false,
    onFlowchartUpdate,
    notebookId,
    selectedDocIds
}) => {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [selectedNode, setSelectedNode] = useState<Node | null>(null);
    const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
    const [layoutDirection, setLayoutDirection] = useState<'TB' | 'LR'>('TB');
    const [localLoading, setLocalLoading] = useState(false);

    // Parse incoming raw flowchartData and layout
    useEffect(() => {
        if (!flowchartData || !flowchartData.nodes || flowchartData.nodes.length === 0) {
            setNodes([]);
            setEdges([]);
            return;
        }

        const initialNodes = flowchartData.nodes.map(n => ({
            id: String(n.id),
            type: 'custom',
            data: { label: n.label, type: n.type || 'process' },
            position: { x: 0, y: 0 }
        }));

        const initialEdges = flowchartData.edges.map((e, idx) => ({
            id: `edge-${e.source}-${e.target}-${idx}`,
            source: String(e.source),
            target: String(e.target),
            label: e.label || '',
            type: 'smoothstep',
            animated: true,
            style: { stroke: '#8b5cf6', strokeWidth: 2 },
            markerEnd: { type: MarkerType.ArrowClosed, color: '#8b5cf6' }
        }));

        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
            initialNodes,
            initialEdges,
            layoutDirection
        );

        setNodes(layoutedNodes);
        setEdges(layoutedEdges);
        setSelectedNode(null);
        setSelectedEdge(null);
    }, [flowchartData, layoutDirection, setNodes, setEdges]);

    // Handle connection logic between nodes
    const onConnect = useCallback((connection: Connection) => {
        if (!connection.source || !connection.target) return;
        
        const newEdge: Edge = {
            id: `edge-${connection.source}-${connection.target}-${Date.now()}`,
            source: connection.source,
            target: connection.target,
            label: '',
            type: 'smoothstep',
            animated: true,
            style: { stroke: '#8b5cf6', strokeWidth: 2 },
            markerEnd: { type: MarkerType.ArrowClosed, color: '#8b5cf6' }
        };

        setEdges((eds) => {
            const updated = addEdge(newEdge, eds);
            triggerUpdate(nodes, updated);
            return updated;
        });
    }, [nodes, setEdges]);

    // Propagate updates up to the parent
    const triggerUpdate = (updatedNodes: Node[], updatedEdges: Edge[]) => {
        if (!onFlowchartUpdate) return;
        
        const formattedNodes = updatedNodes.map(n => ({
            id: n.id,
            label: n.data.label,
            type: n.data.type || 'process'
        }));
        
        const formattedEdges = updatedEdges.map(e => ({
            source: e.source,
            target: e.target,
            label: e.label ? String(e.label) : ''
        }));
        
        onFlowchartUpdate({
            nodes: formattedNodes,
            edges: formattedEdges
        });
    };

    // Recalculate layout
    const handleRecalculateLayout = () => {
        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
            nodes,
            edges,
            layoutDirection
        );
        setNodes(layoutedNodes);
        setEdges(layoutedEdges);
        triggerUpdate(layoutedNodes, layoutedEdges);
    };

    // Change layout direction
    const toggleLayoutDirection = () => {
        const nextDir = layoutDirection === 'TB' ? 'LR' : 'TB';
        setLayoutDirection(nextDir);
    };

    // Add a new node
    const handleAddNode = () => {
        const newId = `node-${Date.now()}`;
        const newNode: Node = {
            id: newId,
            type: 'custom',
            data: { label: 'New Step', type: 'process' },
            position: { x: 100, y: 150 }
        };

        const updatedNodes = [...nodes, newNode];
        setNodes(updatedNodes);
        
        // Set as selected immediately for easy editing
        setSelectedNode(newNode);
        setSelectedEdge(null);
        
        triggerUpdate(updatedNodes, edges);
    };

    // Update node details
    const handleUpdateNodeLabel = (newLabel: string) => {
        if (!selectedNode) return;
        
        const updatedNodes = nodes.map(n => {
            if (n.id === selectedNode.id) {
                return {
                    ...n,
                    data: { ...n.data, label: newLabel }
                };
            }
            return n;
        });

        setNodes(updatedNodes);
        setSelectedNode(prev => prev ? { ...prev, data: { ...prev.data, label: newLabel } } : null);
        triggerUpdate(updatedNodes, edges);
    };

    const handleUpdateNodeType = (newType: string) => {
        if (!selectedNode) return;
        
        const updatedNodes = nodes.map(n => {
            if (n.id === selectedNode.id) {
                return {
                    ...n,
                    data: { ...n.data, type: newType }
                };
            }
            return n;
        });

        setNodes(updatedNodes);
        setSelectedNode(prev => prev ? { ...prev, data: { ...prev.data, type: newType } } : null);
        triggerUpdate(updatedNodes, edges);
    };

    const handleDeleteNode = () => {
        if (!selectedNode) return;
        
        const updatedNodes = nodes.filter(n => n.id !== selectedNode.id);
        const updatedEdges = edges.filter(e => e.source !== selectedNode.id && e.target !== selectedNode.id);
        
        setNodes(updatedNodes);
        setEdges(updatedEdges);
        setSelectedNode(null);
        triggerUpdate(updatedNodes, updatedEdges);
    };

    // Update edge details
    const handleUpdateEdgeLabel = (newLabel: string) => {
        if (!selectedEdge) return;

        const updatedEdges = edges.map(e => {
            if (e.id === selectedEdge.id) {
                return { ...e, label: newLabel };
            }
            return e;
        });

        setEdges(updatedEdges);
        setSelectedEdge(prev => prev ? { ...prev, label: newLabel } : null);
        triggerUpdate(nodes, updatedEdges);
    };

    const handleDeleteEdge = () => {
        if (!selectedEdge) return;

        const updatedEdges = edges.filter(e => e.id !== selectedEdge.id);
        setEdges(updatedEdges);
        setSelectedEdge(null);
        triggerUpdate(nodes, updatedEdges);
    };

    const handleInlineGenerate = async () => {
        if (!notebookId || !selectedDocIds || selectedDocIds.length === 0) return;
        
        setLocalLoading(true);
        try {
            const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            const response = await fetch(`${API_BASE}/api/generate-flowchart`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    notebookId,
                    selectedDocIds
                })
            });

            if (!response.ok) throw new Error('Failed to generate flowchart');
            const data = await response.json();
            
            if (onFlowchartUpdate) {
                onFlowchartUpdate(data);
            }
        } catch (error) {
            console.error('Flowchart inline generation failed:', error);
            alert('Failed to generate flowchart. Please check that your server is running and try again.');
        } finally {
            setLocalLoading(false);
        }
    };

    const isCurrentlyLoading = isLoading || localLoading;

    // Loading indicator
    if (isCurrentlyLoading) {
        return (
            <div className="flowchart-container flowchart-loading" style={{ height: '100%' }}>
                <div className="flowchart-spinner"></div>
                <p>Generating process flowchart...</p>
            </div>
        );
    }

    const noData = !flowchartData || !flowchartData.nodes || flowchartData.nodes.length === 0;

    return (
        <div className="flowchart-wrapper">
            <div className="flowchart-header">
                <h3>Process Flowchart</h3>
                <p>Interactive process mapping. Drag to connect handles, drag nodes, or select to edit.</p>
            </div>
            
            <div className="flowchart-layout-container">
                {/* Main ReactFlow Canvas */}
                <div className="flowchart-container reactflow-custom-wrapper">
                    {noData ? (
                        <div className="flowchart-fallback-card">
                            <h3>No Flowchart Generated</h3>
                            <p style={{ marginBottom: '1.25rem' }}>Generate a process flowchart to visualize the step-by-step logic in your documents.</p>
                            
                            {selectedDocIds && selectedDocIds.length > 0 ? (
                                <button 
                                    className="toolbar-btn primary"
                                    onClick={handleInlineGenerate}
                                    style={{ 
                                        width: 'auto', 
                                        padding: '10px 20px', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '8px', 
                                        margin: '0 auto' 
                                    }}
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ transform: 'rotate(90deg)' }}>
                                        <path d="M9 18H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h5" />
                                        <path d="M15 18h5a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-5" />
                                        <line x1="12" y1="4" x2="12" y2="20" />
                                        <polyline points="8 12 12 12 16 12" />
                                    </svg>
                                    Generate Flowchart
                                </button>
                            ) : (
                                <p style={{ color: '#71717a', fontSize: '0.8rem', fontStyle: 'italic' }}>
                                    ⚠️ Select one or more documents in the Sources panel first to enable generation.
                                </p>
                            )}
                        </div>
                    ) : (
                        <ReactFlowProvider>
                            <FlowchartInner
                                nodes={nodes}
                                edges={edges}
                                onNodesChange={(changes: any) => {
                                    onNodesChange(changes);
                                    // Trigger update on drag end or layout changes
                                    if (changes.some((c: any) => c.type === 'position' && c.dragging === false)) {
                                        triggerUpdate(nodes, edges);
                                    }
                                }}
                                onEdgesChange={onEdgesChange}
                                onConnect={onConnect}
                                selectedNode={selectedNode}
                                selectedEdge={selectedEdge}
                                onSelectNode={setSelectedNode}
                                onSelectEdge={setSelectedEdge}
                            />
                        </ReactFlowProvider>
                    )}
                </div>

                {/* Flowchart Control / Edit Sidebar */}
                <div className="flowchart-sidebar">
                    <div className="sidebar-section">
                        <h4>Global Toolbar</h4>
                        <div className="toolbar-buttons">
                            <button className="toolbar-btn primary" onClick={handleAddNode} title="Add Node">
                                <FiPlus /> Add Step
                            </button>
                            <button className="toolbar-btn secondary" onClick={toggleLayoutDirection} title="Toggle Orientation">
                                <FiRefreshCw /> Orientation: {layoutDirection === 'TB' ? 'Vertical' : 'Horizontal'}
                            </button>
                            <button className="toolbar-btn secondary" onClick={handleRecalculateLayout} title="Clean Layout">
                                Auto-Layout
                            </button>
                        </div>
                    </div>

                    {selectedNode && (
                        <div className="sidebar-section edit-section animate-slide-in">
                            <div className="section-header">
                                <h4>Edit Node</h4>
                                <button className="delete-btn" onClick={handleDeleteNode} title="Delete Node">
                                    <FiTrash2 />
                                </button>
                            </div>
                            <div className="form-group">
                                <label>Step Text</label>
                                <textarea
                                    value={selectedNode.data.label}
                                    onChange={(e) => handleUpdateNodeLabel(e.target.value)}
                                    rows={2}
                                />
                            </div>
                            <div className="form-group">
                                <label>Node Type</label>
                                <select
                                    value={selectedNode.data.type || 'process'}
                                    onChange={(e) => handleUpdateNodeType(e.target.value)}
                                >
                                    <option value="start">Start (Green)</option>
                                    <option value="process">Process (Indigo)</option>
                                    <option value="decision">Decision / Condition (Yellow)</option>
                                    <option value="end">End (Red)</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {selectedEdge && (
                        <div className="sidebar-section edit-section animate-slide-in">
                            <div className="section-header">
                                <h4>Edit Connection</h4>
                                <button className="delete-btn" onClick={handleDeleteEdge} title="Delete Edge">
                                    <FiTrash2 />
                                </button>
                            </div>
                            <div className="form-group">
                                <label>Branch Label (e.g. Yes/No)</label>
                                <input
                                    type="text"
                                    value={String(selectedEdge.label || '')}
                                    onChange={(e) => handleUpdateEdgeLabel(e.target.value)}
                                    placeholder="e.g. Yes"
                                />
                            </div>
                        </div>
                    )}

                    {!selectedNode && !selectedEdge && (
                        <div className="sidebar-help">
                            <FiEdit3 className="help-icon" />
                            <p><strong>Editing Tips:</strong></p>
                            <ul>
                                <li>Click a step or arrow to edit text or delete.</li>
                                <li>Drag from a step's edge circle to another step to create links.</li>
                                <li>Drag steps to arrange manually.</li>
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FlowchartViewer;
