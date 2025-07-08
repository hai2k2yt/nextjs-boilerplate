import { memo } from 'react'
import { Handle, Position, NodeProps } from '@xyflow/react'
import { Badge } from '@/components/ui/badge'
import { CustomNode } from './node-types'

export const InputNode = memo(({ data, selected: _selected }: NodeProps<CustomNode>) => {
  return (
    <div className="min-w-[200px] p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold leading-none tracking-tight">{data.label}</h3>
        <Badge variant="secondary">Input</Badge>
      </div>
      {data.description && (
        <p className="text-xs text-muted-foreground mb-3">{data.description}</p>
      )}
      <div className="text-xs text-muted-foreground">
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

InputNode.displayName = 'InputNode'

export const DefaultNode = memo(({ data, selected: _selected }: NodeProps<CustomNode>) => {
  return (
    <div className="min-w-[200px] p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold leading-none tracking-tight">{data.label}</h3>
        <Badge variant="outline">Process</Badge>
      </div>
      {data.description && (
        <p className="text-xs text-muted-foreground mb-3">{data.description}</p>
      )}
      <div className="text-xs text-muted-foreground">
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

DefaultNode.displayName = 'DefaultNode'

export const OutputNode = memo(({ data, selected: _selected }: NodeProps<CustomNode>) => {
  return (
    <div className="min-w-[200px] p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold leading-none tracking-tight">{data.label}</h3>
        <Badge variant="destructive">Output</Badge>
      </div>
      {data.description && (
        <p className="text-xs text-muted-foreground mb-3">{data.description}</p>
      )}
      <div className="text-xs text-muted-foreground">
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

OutputNode.displayName = 'OutputNode'

export const nodeTypes = {
  input: InputNode,
  default: DefaultNode,
  output: OutputNode,
}
