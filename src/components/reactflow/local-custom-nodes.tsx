import { memo } from 'react'
import { Handle, Position, NodeProps } from '@xyflow/react'
import { Badge } from '@/components/ui/badge'
import { CustomNode } from './node-types'
import { useLocalFlowStore } from '@/stores/flow-store'

export const LocalInputNode = memo(({ data, id }: NodeProps<CustomNode>) => {
  const selectNode = useLocalFlowStore((state) => state.selectNode)

  const handleClick = (event: React.MouseEvent) => {
    event.stopPropagation()
    selectNode(id)
  }

  const nodeStyle: React.CSSProperties = {
    backgroundColor: data.backgroundColor || '#ffffff',
    color: data.textColor || '#000000',
    border: '1px solid #e2e8f0',
  }

  return (
    <div
      className="min-w-[200px] p-4 cursor-pointer hover:shadow-md transition-shadow rounded-lg"
      style={nodeStyle}
      onClick={handleClick}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold leading-none tracking-tight" style={{ color: data.textColor || '#000000' }}>
          {data.label}
        </h3>
        <Badge variant="secondary">Input</Badge>
      </div>
      {data.description && (
        <p className="text-xs mb-3" style={{ color: data.textColor || '#000000', opacity: 0.7 }}>
          {data.description}
        </p>
      )}
      <div className="text-xs" style={{ color: data.textColor || '#000000', opacity: 0.7 }}>
        Data source
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-primary"
      />
    </div>
  )
})

LocalInputNode.displayName = 'LocalInputNode'

export const LocalDefaultNode = memo(({ data, id }: NodeProps<CustomNode>) => {
  const selectNode = useLocalFlowStore((state) => state.selectNode)

  const handleClick = (event: React.MouseEvent) => {
    event.stopPropagation()
    selectNode(id)
  }

  const nodeStyle: React.CSSProperties = {
    backgroundColor: data.backgroundColor || '#ffffff',
    color: data.textColor || '#000000',
    border: '1px solid #e2e8f0',
  }

  return (
    <div
      className="min-w-[200px] p-4 cursor-pointer hover:shadow-md transition-shadow rounded-lg"
      style={nodeStyle}
      onClick={handleClick}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold leading-none tracking-tight" style={{ color: data.textColor || '#000000' }}>
          {data.label}
        </h3>
        <Badge variant="outline">Process</Badge>
      </div>
      {data.description && (
        <p className="text-xs mb-3" style={{ color: data.textColor || '#000000', opacity: 0.7 }}>
          {data.description}
        </p>
      )}
      <div className="text-xs" style={{ color: data.textColor || '#000000', opacity: 0.7 }}>
        Transform data
      </div>
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-primary"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-primary"
      />
    </div>
  )
})

LocalDefaultNode.displayName = 'LocalDefaultNode'

export const LocalOutputNode = memo(({ data, id }: NodeProps<CustomNode>) => {
  const selectNode = useLocalFlowStore((state) => state.selectNode)

  const handleClick = (event: React.MouseEvent) => {
    event.stopPropagation()
    selectNode(id)
  }

  const nodeStyle: React.CSSProperties = {
    backgroundColor: data.backgroundColor || '#ffffff',
    color: data.textColor || '#000000',
    border: '1px solid #e2e8f0',
  }

  return (
    <div
      className="min-w-[200px] p-4 cursor-pointer hover:shadow-md transition-shadow rounded-lg"
      style={nodeStyle}
      onClick={handleClick}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold leading-none tracking-tight" style={{ color: data.textColor || '#000000' }}>
          {data.label}
        </h3>
        <Badge variant="destructive">Output</Badge>
      </div>
      {data.description && (
        <p className="text-xs mb-3" style={{ color: data.textColor || '#000000', opacity: 0.7 }}>
          {data.description}
        </p>
      )}
      <div className="text-xs" style={{ color: data.textColor || '#000000', opacity: 0.7 }}>
        Final result
      </div>
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-primary"
      />
    </div>
  )
})

LocalOutputNode.displayName = 'LocalOutputNode'

export const localNodeTypes = {
  input: LocalInputNode,
  default: LocalDefaultNode,
  output: LocalOutputNode,
}
