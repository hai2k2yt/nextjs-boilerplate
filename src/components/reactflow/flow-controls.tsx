import { useCallback } from 'react'
import { useReactFlow } from '@xyflow/react'
import { Plus, Trash2, RotateCcw, ZoomIn, ZoomOut, Maximize } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { CustomNode, NodeType } from './node-types'

interface FlowControlsProps {
  onAddNode: (type: NodeType) => void
  onDeleteSelected: () => void
  onClearAll: () => void
  selectedNodes: CustomNode[]
}

export function FlowControls({ 
  onAddNode, 
  onDeleteSelected, 
  onClearAll, 
  selectedNodes 
}: FlowControlsProps) {
  const { zoomIn, zoomOut, fitView } = useReactFlow()

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
    <Card className="absolute top-4 left-4 z-10 min-w-[250px]">
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
              onClick={() => onAddNode('input')}
              className="text-xs"
            >
              <Plus className="w-3 h-3 mr-1" />
              Input
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onAddNode('default')}
              className="text-xs"
            >
              <Plus className="w-3 h-3 mr-1" />
              Process
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onAddNode('output')}
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
              onClick={onDeleteSelected}
              disabled={selectedNodes.length === 0}
              className="text-xs"
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Delete ({selectedNodes.length})
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onClearAll}
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
