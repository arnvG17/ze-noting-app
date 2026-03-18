import React, { useMemo, useState, useEffect } from 'react';
import ReactFlow, {
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    MarkerType,
    Handle,
    Position,
} from 'reactflow';
import { hierarchy, tree } from 'd3-hierarchy';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';
import 'reactflow/dist/style.css';
import './FlowchartViewer.css';

// Custom Node Component
const CustomNode = ({ data }) => {
    return (
        <div className={`custom-node ${data.type || 'default'} ${data.isExpanded ? 'expanded' : ''}`}>
            <Handle type="target" position={Position.Top} className="handle" />
            <div className="node-content">
                <span className="node-label">{data.label}</span>
                {data.hasChildren && (
                    <button 
                        className="expand-btn" 
                        onClick={(e) => {
                            e.stopPropagation();
                            if(data.onToggle) data.onToggle(data.id);
                        }}
                    >
                        {data.isExpanded ? <FiChevronUp /> : <FiChevronDown />}
                    </button>
                )}
            </div>
            <Handle type="source" position={Position.Bottom} className="handle" />
        </div>
    );
};

const nodeTypes = { custom: CustomNode };

const FlowchartViewer = ({ flowchartData, isLoading = false }) => {
    const [expandedIds, setExpandedIds] = useState(new Set());
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    // Reset expanded state if flowchartData changes
    useEffect(() => {
        setExpandedIds(new Set());
    }, [flowchartData]);

    useEffect(() => {
        if (!flowchartData?.nodes || flowchartData.nodes.length === 0) return;

        let currentExpanded = expandedIds;

        // Determine hierarchy maps
        const childMap = {};
        const parentMap = {};
        flowchartData.edges.forEach(edge => {
            if (!childMap[edge.source]) childMap[edge.source] = [];
            childMap[edge.source].push(edge.target);
            parentMap[edge.target] = edge.source;
        });

        // Initialize expandedIds correctly on first run
        if (currentExpanded.size === 0) {
            const initialSet = new Set();
            const rootNodes = flowchartData.nodes.filter(n => !parentMap[n.id]);
            
            rootNodes.forEach(root => {
                initialSet.add(root.id);
                // Expand immediate children
                if (childMap[root.id]) {
                    childMap[root.id].forEach(childId => {
                        initialSet.add(childId);
                    });
                }
            });
            
            if(initialSet.size > 0) {
                setExpandedIds(initialSet);
                currentExpanded = initialSet;
            }
        }

        const handleToggle = (id) => {
            setExpandedIds(prev => {
                const next = new Set(prev);
                if (next.has(id)) {
                    next.delete(id);
                } else {
                    next.add(id);
                }
                return next;
            });
        };

        const roots = flowchartData.nodes.filter(n => !parentMap[n.id]);
        let rootId = roots[0]?.id;

        if (rootId) {
            // Determine visible nodes using BFS
            const visibleNodeIds = new Set([rootId]);
            const queue = [rootId];
            
            while (queue.length > 0) {
                const curr = queue.shift();
                if (currentExpanded.has(curr) && childMap[curr]) {
                    childMap[curr].forEach(child => {
                        visibleNodeIds.add(child);
                        queue.push(child);
                    });
                }
            }

            // Build hierarchy payload for d3
            const buildHierarchy = (id) => {
                const node = flowchartData.nodes.find(n => n.id === id);
                if (!node) return null;
                
                const isVisible = visibleNodeIds.has(id);
                const childrenIds = childMap[id] || [];
                
                return {
                    id,
                    ...node,
                    children: (currentExpanded.has(id) && isVisible) 
                        ? childrenIds.map(buildHierarchy).filter(Boolean) 
                        : []
                };
            };

            const hierarchyData = buildHierarchy(rootId);
            const root = hierarchy(hierarchyData);
            
            // Adjust nodeSize [width padding, height padding] depending on text amount
            const treeLayout = tree().nodeSize([280, 160]); 
            treeLayout(root);

            const layoutedNodes = [];
            const layoutedEdges = [];
            
            root.each(d => {
                const origNode = flowchartData.nodes.find(n => n.id === d.data.id);
                const hasChildren = (childMap[d.data.id] && childMap[d.data.id].length > 0);
                
                layoutedNodes.push({
                    id: origNode.id,
                    position: { x: d.x, y: d.y },
                    type: 'custom',
                    data: { 
                        ...origNode.data, 
                        id: origNode.id,
                        type: origNode.type || 'default',
                        hasChildren: hasChildren,
                        isExpanded: currentExpanded.has(origNode.id),
                        onToggle: handleToggle
                    },
                });
            });

            flowchartData.edges.forEach(edge => {
                if (visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target)) {
                     layoutedEdges.push({
                        ...edge,
                        type: 'smoothstep',
                        animated: true,
                        style: { stroke: '#8b5cf6', strokeWidth: 2 },
                        markerEnd: { type: MarkerType.ArrowClosed, color: '#8b5cf6' },
                     });
                }
            });

            setNodes(layoutedNodes);
            setEdges(layoutedEdges);
        } else {
            // Fallback for non-tree structures
            setNodes(flowchartData.nodes.map(n => ({...n, type: 'custom', data: {...n.data, type: n.type}})));
            setEdges(flowchartData.edges);
        }

    }, [flowchartData, expandedIds, setNodes, setEdges]);

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
                <div className="flowchart-fallback-card">
                    <h3>{flowchartData.markdown.split('\n')[0].replace('# ', '')}</h3>
                    <div className="fallback-content">
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
        <div className="flowchart-wrapper">
            <div className="flowchart-header">
                <h3>Document Flowchart</h3>
                <p>Visual overview of your document structure. Click nodes to expand or collapse.</p>
            </div>
            <div className="flowchart-container reactflow-custom-wrapper">
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    nodeTypes={nodeTypes}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    fitView
                    fitViewOptions={{ padding: 0.3 }}
                    minZoom={0.2}
                    maxZoom={2}
                    attributionPosition="bottom-left"
                    nodesConnectable={false}
                    nodesDraggable={true}
                    elementsSelectable={true}
                >
                    <Controls showInteractive={false} />
                    <Background variant="dots" gap={24} size={1} color="#374151" />
                </ReactFlow>
            </div>
        </div>
    );
};

export default FlowchartViewer;
