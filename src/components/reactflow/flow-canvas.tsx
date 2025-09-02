'use client'

import {
  ReactFlow,
  Background,
  BackgroundVariant,
  MiniMap,
  ReactFlowProvider,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import { localNodeTypes } from './local-custom-nodes'
import { edgeTypes } from './custom-edges'
import { LocalFlowControls } from './local-flow-controls'
import { NodeSettingsPanel } from './node-settings-panel'
import { useLocalFlowStore, useLocalFlowActions, useLocalSelectedNode } from '@/stores/flow-store'

function FlowCanvasInner() {
  // Subscribe only to data (React Flow pattern)
  const nodes = useLocalFlowStore((state) => state.nodes)
  const edges = useLocalFlowStore((state) => state.edges)
  const selectedNodeId = useLocalFlowStore((state) => state.selectedNodeId)

  // Get stable action references (React Flow pattern)
  const { onNodesChange, onEdgesChange, onConnect, updateNode, selectNode } = useLocalFlowActions()

  const selectedNode = useLocalSelectedNode()

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
        nodeTypes={localNodeTypes}
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
        {/* Controls hidden since we use custom LocalFlowControls */}
        <MiniMap
          nodeColor="var(--color-primary)"
          maskColor="color-mix(in oklch, var(--color-background) 80%, transparent)"
          pannable
          zoomable
        />
      </ReactFlow>

      <LocalFlowControls className="absolute top-4 left-4" />

      {selectedNodeId && selectedNode && (
        <NodeSettingsPanel
          node={selectedNode}
          onUpdate={(updates) => updateNode(selectedNodeId, updates)}
          onClose={handleCloseSettings}
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
