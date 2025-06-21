import { useCallback } from 'react'
import {
  useReactFlow,
  getBezierPath,
  BaseEdge,
  EdgeLabelRenderer,
  type EdgeProps,
} from '@xyflow/react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CustomEdge } from './node-types'

export function DeletableEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
}: EdgeProps<CustomEdge>) {
  const { setEdges } = useReactFlow()

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  const onEdgeClick = useCallback(() => {
    setEdges((edges) => edges.filter((edge) => edge.id !== id))
  }, [id, setEdges])

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            fontSize: 12,
            // everything inside EdgeLabelRenderer has no pointer events by default
            // if you have an interactive element, set pointer-events: all
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          <Button
            onClick={onEdgeClick}
            size="icon"
            variant="destructive"
            className="h-6 w-6 rounded-full shadow-lg hover:scale-110 transition-all duration-200"
            title="Delete edge"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </EdgeLabelRenderer>
    </>
  )
}

export const edgeTypes = {
  deletable: DeletableEdge,
}
