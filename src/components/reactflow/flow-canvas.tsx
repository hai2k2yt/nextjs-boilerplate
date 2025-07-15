'use client'

import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlowProvider,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import { nodeTypes } from './custom-nodes'
import { edgeTypes } from './custom-edges'
import { FlowControls } from './flow-controls'
import { NodeSettingsPanel } from './node-settings-panel'
import { useFlowStore, useFlowActions, useSelectedNode } from '@/stores/flow-store'

function FlowCanvasInner() {
  // Subscribe only to data (React Flow pattern)
  const nodes = useFlowStore((state) => state.nodes)
  const edges = useFlowStore((state) => state.edges)
  const selectedNodeId = useFlowStore((state) => state.selectedNodeId)

  // Get stable action references (React Flow pattern)
  const { onNodesChange, onEdgesChange, onConnect, updateNode, selectNode } = useFlowActions()

  const selectedNode = useSelectedNode()

  const handleCloseSettings = () => {
    selectNode(null)
  }

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
        className="bg-background react-flow"
        defaultEdgeOptions={{
          animated: true,
          style: { strokeWidth: 2 },
        }}
        connectionLineStyle={{ strokeWidth: 2 }}
        snapToGrid
        snapGrid={[15, 15]}
        onPaneClick={handleCloseSettings}
      >
        <Background
          color="var(--color-muted-foreground)"
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
          nodeColor="var(--color-primary)"
          maskColor="color-mix(in oklch, var(--color-background) 80%, transparent)"
          pannable
          zoomable
        />
      </ReactFlow>

      <FlowControls />

      {selectedNodeId && selectedNode && (
        <NodeSettingsPanel
          nodeData={selectedNode.data}
          nodeId={selectedNodeId}
          onClose={handleCloseSettings}
          onUpdateNode={updateNode}
        />
      )}
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
