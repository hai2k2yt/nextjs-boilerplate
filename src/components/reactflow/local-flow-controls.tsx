import { useCallback } from 'react'
import { useReactFlow } from '@xyflow/react'
import { Plus, Trash2, RotateCcw, ZoomIn, ZoomOut, Maximize } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

import { useLocalFlowActions, useLocalFlowStore } from '@/stores/flow-store'

interface LocalFlowControlsProps {
  className?: string
}

export function LocalFlowControls({ className }: LocalFlowControlsProps) {
  // Subscribe only to data (React Flow pattern)
  const selectedNodeId = useLocalFlowStore((state) => state.selectedNodeId)
  const { zoomIn, zoomOut, fitView } = useReactFlow()

  // Get stable action references (React Flow pattern)
  const { addNode, deleteSelectedNodes, clearAll } = useLocalFlowActions()

  const handleZoomIn = useCallback(() => {
    zoomIn({ duration: 300 })
  }, [zoomIn])

  const handleZoomOut = useCallback(() => {
    zoomOut({ duration: 300 })
  }, [zoomOut])

  const handleFitView = useCallback(() => {
    fitView({ duration: 300, padding: 0.2 })
  }, [fitView])

  return (
    <Card className={`z-20 min-w-[250px] ${className || ''}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Flow Controls</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Nodes */}
        <div>
          <h4 className="text-xs font-medium mb-2 text-muted-foreground">Add Nodes</h4>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => addNode('input')}
              className="text-xs"
            >
              <Plus className="w-3 h-3 mr-1" />
              Input
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => addNode('default')}
              className="text-xs"
            >
              <Plus className="w-3 h-3 mr-1" />
              Process
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => addNode('output')}
              className="text-xs"
            >
              <Plus className="w-3 h-3 mr-1" />
              Output
            </Button>
          </div>
        </div>

        <Separator />

        {/* Node Actions */}
        <div>
          <h4 className="text-xs font-medium mb-2 text-muted-foreground">Actions</h4>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="destructive"
              onClick={deleteSelectedNodes}
              disabled={!selectedNodeId}
              className="text-xs"
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Delete {selectedNodeId ? '(1)' : '(0)'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={clearAll}
              className="text-xs"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              Clear All
            </Button>
          </div>
        </div>

        <Separator />

        {/* View Controls */}
        <div>
          <h4 className="text-xs font-medium mb-2 text-muted-foreground">View</h4>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleZoomIn}
              className="text-xs"
            >
              <ZoomIn className="w-3 h-3 mr-1" />
              Zoom In
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleZoomOut}
              className="text-xs"
            >
              <ZoomOut className="w-3 h-3 mr-1" />
              Zoom Out
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleFitView}
              className="text-xs"
            >
              <Maximize className="w-3 h-3 mr-1" />
              Fit View
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
