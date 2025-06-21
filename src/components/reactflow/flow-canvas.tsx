'use client'

import { useCallback, useState } from 'react'
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  ReactFlowProvider,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import { nodeTypes } from './custom-nodes'
import { edgeTypes } from './custom-edges'
import { FlowControls } from './flow-controls'
import {
  initialNodes,
  initialEdges,
  CustomNode,
  CustomEdge,
  NodeType
} from './node-types'

function FlowCanvasInner() {
  const [nodes, setNodes, onNodesChange] = useNodesState<CustomNode>(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState<CustomEdge>(initialEdges)
  const [nodeId, setNodeId] = useState(4)

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, type: 'deletable' }, eds)),
    [setEdges]
  )

  const addNode = useCallback((type: NodeType) => {
    const newNode: CustomNode = {
      id: nodeId.toString(),
      type: type === 'default' ? undefined : type,
      position: {
        x: Math.random() * 400 + 100,
        y: Math.random() * 400 + 100,
      },
      data: {
        label: `${type.charAt(0).toUpperCase() + type.slice(1)} Node`,
        description: `New ${type} node`,
        type,
      },
    }
    
    setNodes((nds) => [...nds, newNode])
    setNodeId((id) => id + 1)
  }, [nodeId, setNodes])

  const deleteSelectedNodes = useCallback(() => {
    const selectedNodeIds = nodes.filter(node => node.selected).map(node => node.id)
    
    setNodes((nds) => nds.filter(node => !node.selected))
    setEdges((eds) => eds.filter(edge => 
      !selectedNodeIds.includes(edge.source) && !selectedNodeIds.includes(edge.target)
    ))
  }, [nodes, setNodes, setEdges])

  const clearAll = useCallback(() => {
    setNodes([])
    setEdges([])
    setNodeId(1)
  }, [setNodes, setEdges])

  const selectedNodes = nodes.filter(node => node.selected)

  return (
    <div className="w-full h-full relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        className="bg-background"
        defaultEdgeOptions={{
          animated: true,
          style: { strokeWidth: 2 },
        }}
        connectionLineStyle={{ strokeWidth: 2 }}
        snapToGrid
        snapGrid={[15, 15]}
      >
        <Background
          color="hsl(var(--muted-foreground))"
          gap={20}
          size={1}
          variant={BackgroundVariant.Dots}
        />
        <Controls 
          className="!bottom-4 !left-4 !top-auto"
          showZoom={false}
          showFitView={false}
          showInteractive={false}
        />
        <MiniMap 
          className="!bottom-4 !right-4"
          nodeColor="hsl(var(--primary))"
          maskColor="hsl(var(--background) / 0.8)"
          pannable
          zoomable
        />
      </ReactFlow>
      
      <FlowControls
        onAddNode={addNode}
        onDeleteSelected={deleteSelectedNodes}
        onClearAll={clearAll}
        selectedNodes={selectedNodes}
      />
    </div>
  )
}

export function FlowCanvas() {
  return (
    <ReactFlowProvider>
      <FlowCanvasInner />
    </ReactFlowProvider>
  )
}
