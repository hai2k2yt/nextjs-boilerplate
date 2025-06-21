import { memo } from 'react'
import { Handle, Position, NodeProps } from '@xyflow/react'
import { Badge } from '@/components/ui/badge'
import { CustomNode } from './node-types'

export const InputNode = memo(({ data, selected }: NodeProps<CustomNode>) => {
  return (
    <div className={`min-w-[200px] rounded-lg border bg-card text-card-foreground shadow-sm ${selected ? 'ring-2 ring-primary' : ''}`}>
      <div className="flex flex-col space-y-1.5 p-6 pb-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold leading-none tracking-tight">{data.label}</h3>
          <Badge variant="secondary">Input</Badge>
        </div>
        {data.description && (
          <p className="text-xs text-muted-foreground">{data.description}</p>
        )}
      </div>
      <div className="p-6 pt-0">
        <div className="text-xs text-muted-foreground">
          Data source
        </div>
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

export const DefaultNode = memo(({ data, selected }: NodeProps<CustomNode>) => {
  return (
    <div className={`min-w-[200px] rounded-lg border bg-card text-card-foreground shadow-sm ${selected ? 'ring-2 ring-primary' : ''}`}>
      <div className="flex flex-col space-y-1.5 p-6 pb-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold leading-none tracking-tight">{data.label}</h3>
          <Badge variant="outline">Process</Badge>
        </div>
        {data.description && (
          <p className="text-xs text-muted-foreground">{data.description}</p>
        )}
      </div>
      <div className="p-6 pt-0">
        <div className="text-xs text-muted-foreground">
          Transform data
        </div>
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

export const OutputNode = memo(({ data, selected }: NodeProps<CustomNode>) => {
  return (
    <div className={`min-w-[200px] rounded-lg border bg-card text-card-foreground shadow-sm ${selected ? 'ring-2 ring-primary' : ''}`}>
      <div className="flex flex-col space-y-1.5 p-6 pb-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold leading-none tracking-tight">{data.label}</h3>
          <Badge variant="destructive">Output</Badge>
        </div>
        {data.description && (
          <p className="text-xs text-muted-foreground">{data.description}</p>
        )}
      </div>
      <div className="p-6 pt-0">
        <div className="text-xs text-muted-foreground">
          Final result
        </div>
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
