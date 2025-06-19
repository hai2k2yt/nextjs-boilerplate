import { memo } from 'react'
import { Handle, Position, NodeProps } from '@xyflow/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CustomNode } from './node-types'

export const InputNode = memo(({ data, selected }: NodeProps<CustomNode>) => {
  return (
    <Card className={`min-w-[200px] ${selected ? 'ring-2 ring-primary' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">{data.label}</CardTitle>
          <Badge variant="secondary">Input</Badge>
        </div>
        {data.description && (
          <CardDescription className="text-xs">{data.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-xs text-muted-foreground">
          Data source
        </div>
      </CardContent>
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-primary"
      />
    </Card>
  )
})

InputNode.displayName = 'InputNode'

export const DefaultNode = memo(({ data, selected }: NodeProps<CustomNode>) => {
  return (
    <Card className={`min-w-[200px] ${selected ? 'ring-2 ring-primary' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">{data.label}</CardTitle>
          <Badge variant="outline">Process</Badge>
        </div>
        {data.description && (
          <CardDescription className="text-xs">{data.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-xs text-muted-foreground">
          Transform data
        </div>
      </CardContent>
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
    </Card>
  )
})

DefaultNode.displayName = 'DefaultNode'

export const OutputNode = memo(({ data, selected }: NodeProps<CustomNode>) => {
  return (
    <Card className={`min-w-[200px] ${selected ? 'ring-2 ring-primary' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">{data.label}</CardTitle>
          <Badge variant="destructive">Output</Badge>
        </div>
        {data.description && (
          <CardDescription className="text-xs">{data.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-xs text-muted-foreground">
          Final result
        </div>
      </CardContent>
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-primary"
      />
    </Card>
  )
})

OutputNode.displayName = 'OutputNode'

export const nodeTypes = {
  input: InputNode,
  default: DefaultNode,
  output: OutputNode,
}
