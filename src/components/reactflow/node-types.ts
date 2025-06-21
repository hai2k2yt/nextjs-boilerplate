import { Node, Edge } from '@xyflow/react'

export interface CustomNodeData {
  label: string
  description?: string
  type?: 'input' | 'default' | 'output'
  [key: string]: unknown // Index signature to satisfy Record<string, unknown>
}

export type CustomNode = Node<CustomNodeData>

export interface CustomEdgeData {
  label?: string
  [key: string]: unknown
}

export type CustomEdge = Edge<CustomEdgeData>

export interface FlowState {
  nodes: CustomNode[]
  edges: CustomEdge[]
}

export const initialNodes: CustomNode[] = [
  {
    id: '1',
    type: 'input',
    position: { x: 250, y: 25 },
    data: { 
      label: 'Input Node',
      description: 'This is where data enters the flow',
      type: 'input'
    },
  },
  {
    id: '2',
    position: { x: 100, y: 125 },
    data: { 
      label: 'Default Node',
      description: 'Process data here',
      type: 'default'
    },
  },
  {
    id: '3',
    type: 'output',
    position: { x: 250, y: 250 },
    data: { 
      label: 'Output Node',
      description: 'Final result goes here',
      type: 'output'
    },
  },
]

export const initialEdges: CustomEdge[] = [
  { id: 'e1-2', source: '1', target: '2', type: 'deletable' },
  { id: 'e2-3', source: '2', target: '3', type: 'deletable' },
]

export type NodeType = 'input' | 'default' | 'output'