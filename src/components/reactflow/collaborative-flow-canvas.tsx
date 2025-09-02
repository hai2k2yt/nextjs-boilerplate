'use client'

import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlowProvider,
  useReactFlow,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'

import { collaborativeNodeTypes } from './custom-nodes'
import { edgeTypes } from './custom-edges'
import { CollaborativeFlowControls } from './flow-controls'
import { NodeSettingsPanel } from './node-settings-panel'
import { useRemoteCollaborativeFlowStore, useRemoteCollaborativeFlowActions, useRemoteCollaborativeSelectedNode, useRemoteCollaborationState } from '@/stores/collaborative-flow-store'
import { CollaborationPanel } from './collaboration-panel'
import { ParticipantCursors } from './participant-cursors'
import { COLLABORATION_CONSTANTS } from '@/lib/constants/collaboration'

interface CollaborativeFlowCanvasProps {
  roomId: string
  className?: string
}

function CollaborativeFlowCanvasInner({ roomId, className }: CollaborativeFlowCanvasProps) {
  const { data: session } = useSession()
  const reactFlowInstance = useReactFlow()
  const [isInitialized, setIsInitialized] = useState(false)

  // Subscribe to flow data
  const nodes = useRemoteCollaborativeFlowStore((state) => state.nodes)
  const edges = useRemoteCollaborativeFlowStore((state) => state.edges)

  // Get stable action references
  const { onNodesChange, onEdgesChange, onConnect, updateNode, selectNode, connectToRoom, updateCursor } = useRemoteCollaborativeFlowActions()

  // Get collaboration state
  const { isConnected, participants, canEdit } = useRemoteCollaborationState()

  const selectedNode = useRemoteCollaborativeSelectedNode()
  const canvasRef = useRef<HTMLDivElement>(null)

  // Connect to room on mount
  useEffect(() => {
    if (session?.user?.id && roomId && !isInitialized) {
      console.log('Connecting to room:', roomId)
      connectToRoom(roomId, session.user.id)
        .then(() => {
          setIsInitialized(true)
          console.log('Successfully connected to room')
        })
        .catch((error) => {
          console.error('Failed to connect to room:', error)
        })
    }
  }, [session?.user?.id, roomId, connectToRoom, isInitialized])

  // Handle mouse movement for cursor tracking
  useEffect(() => {
    if (!isConnected || !canEdit) return

    const handleMouseMove = (event: MouseEvent) => {
      if (reactFlowInstance && canvasRef.current) {
        const bounds = canvasRef.current.getBoundingClientRect()
        const position = reactFlowInstance.screenToFlowPosition({
          x: event.clientX - bounds.left,
          y: event.clientY - bounds.top,
        })

        // Throttle cursor updates to avoid too many events
        updateCursor(position.x, position.y)
      }
    }

    const throttledMouseMove = throttle(handleMouseMove, COLLABORATION_CONSTANTS.CURSOR_THROTTLE_DELAY)
    const currentCanvas = canvasRef.current

    if (currentCanvas) {
      currentCanvas.addEventListener('mousemove', throttledMouseMove)
    }

    return () => {
      if (currentCanvas) {
        currentCanvas.removeEventListener('mousemove', throttledMouseMove)
      }
    }
  }, [isConnected, canEdit, reactFlowInstance, updateCursor])

  const handleCloseSettings = () => {
    selectNode(null)
  }

  if (!session) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <p>Please sign in to access collaborative features</p>
      </div>
    )
  }

  return (
    <div className={`w-full h-full relative ${className}`} ref={canvasRef}>
      {/* Connection Status */}
      <div className="absolute top-4 left-4 z-10">
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
          isConnected 
            ? 'bg-green-100 text-green-800 border border-green-200' 
            : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
        }`}>
          {isConnected ? 'Connected' : 'Connecting...'}
        </div>
      </div>

      {/* Collaboration Panel */}
      <CollaborationPanel
        participants={participants}
        roomId={roomId}
        className="absolute top-4 right-4 z-10"
      />

      {/* React Flow Canvas */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={canEdit ? onNodesChange : undefined}
        onEdgesChange={canEdit ? onEdgesChange : undefined}
        onConnect={canEdit ? onConnect : undefined}
        nodeTypes={collaborativeNodeTypes}
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
        deleteKeyCode={canEdit ? 'Delete' : null}
        multiSelectionKeyCode={canEdit ? 'Shift' : null}
        nodesDraggable={canEdit}
        nodesConnectable={canEdit}
        elementsSelectable={canEdit}
      >
        <Background variant={BackgroundVariant.Dots} gap={15} size={1} />
        <Controls showInteractive={false} />
        <MiniMap
          nodeStrokeColor="#374151"
          nodeColor="#f3f4f6"
          nodeBorderRadius={2}
          maskColor="rgba(0, 0, 0, 0.2)"
        />

        {/* Participant Cursors */}
        <ParticipantCursors participants={participants} />
      </ReactFlow>

      {/* Flow Controls - only show if user can edit */}
      {canEdit && (
        <CollaborativeFlowControls className="absolute top-4 left-4" />
      )}

      {/* Node Settings Panel */}
      {selectedNode && canEdit && (
        <NodeSettingsPanel
          node={selectedNode}
          onUpdate={(updates) => updateNode(selectedNode.id, updates)}
          onClose={handleCloseSettings}
        />
      )}

      {/* Read-only indicator */}
      {!canEdit && (
        <div className="absolute top-4 left-4 z-10">
          <div className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200">
            Read-only mode
          </div>
        </div>
      )}
    </div>
  )
}

export function CollaborativeFlowCanvas({ roomId, className }: CollaborativeFlowCanvasProps) {
  return (
    <ReactFlowProvider>
      <CollaborativeFlowCanvasInner roomId={roomId} className={className} />
    </ReactFlowProvider>
  )
}

// Simple throttle utility
function throttle<T extends (...args: any[]) => any>(func: T, limit: number): T {
  let inThrottle: boolean
  return function(this: any, ...args: any[]) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  } as T
}
