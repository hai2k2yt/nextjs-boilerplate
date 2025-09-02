import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { useMemo } from 'react'
import { addEdge, Connection, NodeChange, EdgeChange, applyNodeChanges, applyEdgeChanges } from '@xyflow/react'
import { CustomNode, CustomEdge, CustomNodeData, NodeType, initialNodes, initialEdges } from '@/components/reactflow/node-types'

// Separate state interface (data only)
interface FlowState {
  nodes: CustomNode[]
  edges: CustomEdge[]
  selectedNodeId: string | null
  nodeIdCounter: number
}

// Separate actions interface
interface FlowActions {
  onNodesChange: (changes: NodeChange[]) => void
  onEdgesChange: (changes: EdgeChange[]) => void
  onConnect: (connection: Connection) => void
  addNode: (type: NodeType) => void
  updateNode: (nodeId: string, updates: Partial<CustomNodeData>) => void
  deleteSelectedNodes: () => void
  selectNode: (nodeId: string | null) => void
  clearAll: () => void
}

// Create the store with separated state and actions
export const useLocalFlowStore = create<FlowState & FlowActions>()(
  devtools(
    (set, get) => ({
      // Initial state only
      nodes: initialNodes,
      edges: initialEdges,
      selectedNodeId: null,
      nodeIdCounter: 4,



      // React Flow change handlers
      onNodesChange: (changes) => {
        const state = get()
        const newNodes = applyNodeChanges(changes, state.nodes) as CustomNode[]
        set({ nodes: newNodes }, false, 'onNodesChange')
      },

      onEdgesChange: (changes) => {
        const state = get()
        const newEdges = applyEdgeChanges(changes, state.edges) as CustomEdge[]
        set({ edges: newEdges }, false, 'onEdgesChange')
      },

      onConnect: (connection) => {
        const state = get()
        const newEdges = addEdge({ ...connection, type: 'deletable' }, state.edges)
        set({ edges: newEdges }, false, 'onConnect')
      },

      // Node management
      addNode: (type) => {
        set(
          (state) => {
            const newNode: CustomNode = {
              id: state.nodeIdCounter.toString(),
              type: type === 'default' ? undefined : type,
              position: {
                x: Math.random() * 400 + 100,
                y: Math.random() * 400 + 100,
              },
              data: {
                label: `${type.charAt(0).toUpperCase() + type.slice(1)} Node`,
                description: `New ${type} node`,
                backgroundColor: '#ffffff',
                textColor: '#000000',
              },
            }

            return {
              nodes: [...state.nodes, newNode],
              nodeIdCounter: state.nodeIdCounter + 1,
            }
          },
          false,
          'addNode'
        )
      },

      updateNode: (nodeId, updates) => {
        const state = get()
        const newNodes = state.nodes.map((node) =>
          node.id === nodeId
            ? { ...node, data: { ...node.data, ...updates } }
            : node
        )
        set({ nodes: newNodes }, false, 'updateNode')
      },

      deleteSelectedNodes: () => {
        const state = get()
        const selectedNodeIds = state.nodes
          .filter((node) => node.selected)
          .map((node) => node.id)

        set(
          {
            nodes: state.nodes.filter((node) => !node.selected),
            edges: state.edges.filter(
              (edge) =>
                !selectedNodeIds.includes(edge.source) &&
                !selectedNodeIds.includes(edge.target)
            ),
            selectedNodeId: selectedNodeIds.includes(state.selectedNodeId || '') 
              ? null 
              : state.selectedNodeId,
          },
          false,
          'deleteSelectedNodes'
        )
      },

      selectNode: (nodeId) => {
        set({ selectedNodeId: nodeId }, false, 'selectNode')
      },

      // Utility actions
      clearAll: () => {
        set(
          {
            nodes: [],
            edges: [],
            selectedNodeId: null,
            nodeIdCounter: 1,
          },
          false,
          'clearAll'
        )
      },


    }),
    {
      name: 'flow-store',
    }
  )
)

// Selectors for better performance
export const useLocalSelectedNode = () => {
  const selectedNodeId = useLocalFlowStore((state) => state.selectedNodeId)
  const nodes = useLocalFlowStore((state) => state.nodes)

  // Use useMemo to prevent recalculating on every render
  return useMemo(() => {
    return selectedNodeId ? nodes.find(n => n.id === selectedNodeId) || null : null
  }, [selectedNodeId, nodes])
}

export const useLocalSelectedNodes = () => {
  const nodes = useLocalFlowStore((state) => state.nodes)

  // Use useMemo to prevent creating new array on every render
  // Only recalculate when nodes array actually changes
  return useMemo(() => {
    return nodes.filter(node => node.selected)
  }, [nodes])
}

// Stable action creators (following React Flow pattern)
// These create stable references that don't change on re-renders
export const useLocalFlowActions = () => {
  // Use individual selectors to get stable references to actions
  const addNode = useLocalFlowStore((state) => state.addNode)
  const deleteSelectedNodes = useLocalFlowStore((state) => state.deleteSelectedNodes)
  const clearAll = useLocalFlowStore((state) => state.clearAll)
  const updateNode = useLocalFlowStore((state) => state.updateNode)
  const selectNode = useLocalFlowStore((state) => state.selectNode)
  const onNodesChange = useLocalFlowStore((state) => state.onNodesChange)
  const onEdgesChange = useLocalFlowStore((state) => state.onEdgesChange)
  const onConnect = useLocalFlowStore((state) => state.onConnect)

  // Use useMemo to ensure stable reference identity for the returned object
  return useMemo(() => ({
    addNode,
    deleteSelectedNodes,
    clearAll,
    updateNode,
    selectNode,
    onNodesChange,
    onEdgesChange,
    onConnect,
  }), [addNode, deleteSelectedNodes, clearAll, updateNode, selectNode, onNodesChange, onEdgesChange, onConnect])
}
