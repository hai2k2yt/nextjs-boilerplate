'use client'

import {
  ReactFlow,
  Background,
  BackgroundVariant,
  MiniMap,
  ReactFlowProvider,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useEffect, useState } from 'react'

import { localNodeTypes } from './local-custom-nodes'
import { edgeTypes } from './custom-edges'
import { LocalCollaborativeFlowControls } from './local-collaborative-flow-controls'
import { NodeSettingsPanel } from './node-settings-panel'
import { 
  useLocalCollaborativeFlowStore, 
  useLocalCollaborativeFlowActions, 
  useLocalCollaborativeSelectedNode,
  useLocalCollaborationState 
} from '@/stores/local-collaborative-flow-store'
import { Badge } from '@/components/ui/badge'

interface LocalCollaborativeFlowCanvasProps {
  className?: string
}

function LocalCollaborativeFlowCanvasInner({ className }: LocalCollaborativeFlowCanvasProps) {
  // Client-side only state to prevent hydration mismatch
  const [isClient, setIsClient] = useState(false)

  // Subscribe to flow data
  const nodes = useLocalCollaborativeFlowStore((state) => state.nodes)
  const edges = useLocalCollaborativeFlowStore((state) => state.edges)

  // Get stable action references
  const { onNodesChange, onEdgesChange, onConnect, updateNode, selectNode, initializeSession } = useLocalCollaborativeFlowActions()

  // Get collaboration state
  const { sessionId, connectedTabs } = useLocalCollaborationState()

  const selectedNode = useLocalCollaborativeSelectedNode()

  // Set client-side flag and initialize session on mount
  useEffect(() => {
    setIsClient(true)
    initializeSession()
  }, [initializeSession])

  const handleCloseSettings = () => {
    selectNode(null)
  }

  return (
    <div className={`w-full h-full relative ${className || ''}`}>
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
        <MiniMap
          nodeColor="var(--color-primary)"
          maskColor="color-mix(in oklch, var(--color-background) 80%, transparent)"
          pannable
          zoomable
        />
      </ReactFlow>

      {/* Flow Controls */}
      <LocalCollaborativeFlowControls className="absolute top-4 left-4" />

      {/* Node Settings Panel */}
      {selectedNode && (
        <NodeSettingsPanel
          node={selectedNode}
          onUpdate={(updates) => updateNode(selectedNode.id, updates)}
          onClose={handleCloseSettings}
        />
      )}

      {/* Local Collaboration Status */}
      <div className="absolute top-4 right-4 z-10">
        <Badge variant="secondary" className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          Local Sync Active
        </Badge>
      </div>

      {/* Session Info - Client-side only to prevent hydration mismatch */}
      {isClient && (
        <div className="absolute top-4 left-4 z-10">
          <div className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border rounded-lg p-2">
            <div className="text-xs text-muted-foreground">
              Session: {sessionId.slice(-8)}
            </div>
            <div className="text-xs text-muted-foreground">
              Connected Tabs: {connectedTabs.length}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function LocalCollaborativeFlowCanvas({ className }: LocalCollaborativeFlowCanvasProps) {
  return (
    <ReactFlowProvider>
      <LocalCollaborativeFlowCanvasInner className={className} />
    </ReactFlowProvider>
  )
}
