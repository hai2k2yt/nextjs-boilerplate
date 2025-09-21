import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { useShallow } from 'zustand/react/shallow'
import { useMemo } from 'react'
import { addEdge, Connection, NodeChange, EdgeChange, applyNodeChanges, applyEdgeChanges } from '@xyflow/react'
import { CustomNode, CustomEdge, CustomNodeData, NodeType, initialNodes, initialEdges } from '@/components/reactflow/node-types'
import { COLLABORATION_CONSTANTS, LOCAL_STORAGE_EVENTS } from '@/lib/constants/collaboration'

// Local collaborative state interface (data only)
interface LocalCollaborativeFlowState {
  nodes: CustomNode[]
  edges: CustomEdge[]
  selectedNodeId: string | null
  nodeIdCounter: number
  // Local collaboration state
  sessionId: string
  connectedTabs: string[]
  lastSyncTimestamp: number
}

// Local collaborative actions interface
interface LocalCollaborativeFlowActions {
  onNodesChange: (changes: NodeChange[]) => void
  onEdgesChange: (changes: EdgeChange[]) => void
  onConnect: (connection: Connection) => void
  addNode: (type: NodeType) => void
  updateNode: (nodeId: string, updates: Partial<CustomNodeData>) => void
  deleteSelectedNodes: () => void
  selectNode: (nodeId: string | null) => void
  clearAll: () => void
  // Local collaboration actions
  initializeSession: () => void
  syncWithLocalStorage: () => void
  broadcastToTabs: (data: any) => void
  handleTabMessage: (event: MessageEvent) => void
}

// Generate unique session ID for this tab (client-side only)
const generateSessionId = () => {
  if (typeof window === 'undefined') {
    return 'ssr_placeholder' // Placeholder for SSR
  }
  return `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Local storage keys for local collaboration (extending the imported STORAGE_KEYS)
const LOCAL_STORAGE_KEYS = {
  FLOW_DATA: 'local_collaborative_flow_data',
  ACTIVE_TABS: 'local_collaborative_active_tabs',
  LAST_UPDATE: 'local_collaborative_last_update'
}

// Create the store with separated state and actions
export const useLocalCollaborativeFlowStore = create<LocalCollaborativeFlowState & LocalCollaborativeFlowActions>()(
  devtools(
    (set, get) => {
      // Initialize session ID (will be properly set on client)
      let sessionId = typeof window !== 'undefined' ? generateSessionId() : 'ssr_placeholder'

      // Helper function to determine if changes should be immediate or debounced
      const shouldSyncImmediately = (changes: NodeChange[] | EdgeChange[]): boolean => {
        return changes.some(change =>
          change.type === 'add' ||
          change.type === 'remove'
        )
      }

      // Immediate sync function
      const immediateSync = (data: { nodes: CustomNode[]; edges: CustomEdge[] }) => {
        const state = get()
        const flowData = {
          nodes: data.nodes,
          edges: data.edges,
          selectedNodeId: state.selectedNodeId,
          nodeIdCounter: state.nodeIdCounter,
          lastUpdate: Date.now(),
          updatedBy: sessionId
        }
        localStorage.setItem(LOCAL_STORAGE_KEYS.FLOW_DATA, JSON.stringify(flowData))
        localStorage.setItem(LOCAL_STORAGE_KEYS.LAST_UPDATE, Date.now().toString())

        // Broadcast to other tabs
        state.broadcastToTabs({ type: LOCAL_STORAGE_EVENTS.FLOW_UPDATE, data: flowData })
      }

      // Debounced sync to localStorage for frequent changes like position/dimensions
      let syncTimeout: NodeJS.Timeout | null = null
      const debouncedSync = (data: { nodes: CustomNode[]; edges: CustomEdge[] }) => {
        if (syncTimeout) clearTimeout(syncTimeout)
        syncTimeout = setTimeout(() => {
          immediateSync(data)
        }, COLLABORATION_CONSTANTS.LOCAL_STORAGE_SYNC_DELAY)
      }

      return {
        // Initial state
        nodes: initialNodes,
        edges: initialEdges,
        selectedNodeId: null,
        nodeIdCounter: 4,
        sessionId,
        connectedTabs: [],
        lastSyncTimestamp: 0,

        // React Flow change handlers with local sync
        onNodesChange: (changes) => {
          const state = get()
          const newNodes = applyNodeChanges(changes, state.nodes) as CustomNode[]
          set({ nodes: newNodes, lastSyncTimestamp: Date.now() }, false, 'onNodesChange')

          // Use immediate sync for add/remove operations, debounced for position/dimension changes
          if (shouldSyncImmediately(changes)) {
            immediateSync({ nodes: newNodes, edges: state.edges })
          } else {
            debouncedSync({ nodes: newNodes, edges: state.edges })
          }
        },

        onEdgesChange: (changes) => {
          const state = get()
          const newEdges = applyEdgeChanges(changes, state.edges) as CustomEdge[]
          set({ edges: newEdges, lastSyncTimestamp: Date.now() }, false, 'onEdgesChange')

          // Use immediate sync for add/remove operations, debounced for other changes
          if (shouldSyncImmediately(changes)) {
            immediateSync({ nodes: state.nodes, edges: newEdges })
          } else {
            debouncedSync({ nodes: state.nodes, edges: newEdges })
          }
        },

        onConnect: (connection) => {
          const state = get()
          const newEdges = addEdge({ ...connection, type: 'deletable' }, state.edges)
          set({ edges: newEdges, lastSyncTimestamp: Date.now() }, false, 'onConnect')

          // Immediate sync for connections (adding new edge)
          immediateSync({ nodes: state.nodes, edges: newEdges })
        },

        addNode: (type) => {
          const state = get()
          const newNode: CustomNode = {
            id: `node-${state.nodeIdCounter}`,
            type: type === 'default' ? undefined : type,
            position: {
              x: Math.random() * 400 + 100,
              y: Math.random() * 400 + 100,
            },
            data: {
              label: `${type.charAt(0).toUpperCase() + type.slice(1)} Node`,
              description: `New ${type} node`,
              backgroundColor: type === 'input' ? '#e3f2fd' : type === 'output' ? '#ffebee' : '#f3e5f5',
              textColor: type === 'input' ? '#1565c0' : type === 'output' ? '#c62828' : '#7b1fa2',
            },
          }

          const newNodes = [...state.nodes, newNode]
          const newNodeIdCounter = state.nodeIdCounter + 1

          set({
            nodes: newNodes,
            nodeIdCounter: newNodeIdCounter,
            lastSyncTimestamp: Date.now()
          }, false, 'addNode')

          // Immediate sync for new nodes
          immediateSync({ nodes: newNodes, edges: state.edges })
        },

        updateNode: (nodeId, updates) => {
          const state = get()
          const newNodes = state.nodes.map(node =>
            node.id === nodeId
              ? { ...node, data: { ...node.data, ...updates } }
              : node
          ) as CustomNode[]

          set({ nodes: newNodes, lastSyncTimestamp: Date.now() }, false, 'updateNode')

          // Debounced sync for frequent updates like typing
          debouncedSync({ nodes: newNodes, edges: state.edges })
        },

        deleteSelectedNodes: () => {
          const state = get()
          if (!state.selectedNodeId) return

          const newNodes = state.nodes.filter(node => node.id !== state.selectedNodeId)
          const newEdges = state.edges.filter(edge =>
            edge.source !== state.selectedNodeId && edge.target !== state.selectedNodeId
          )

          set({
            nodes: newNodes,
            edges: newEdges,
            selectedNodeId: null,
            lastSyncTimestamp: Date.now()
          }, false, 'deleteSelectedNodes')

          // Immediate sync for deletions
          immediateSync({ nodes: newNodes, edges: newEdges })
        },

        selectNode: (nodeId) => {
          set({ selectedNodeId: nodeId }, false, 'selectNode')
          // Note: Selection is not synced across tabs to avoid conflicts
        },

        clearAll: () => {
          const clearedData = {
            nodes: [],
            edges: [],
            selectedNodeId: null,
            nodeIdCounter: 1
          }

          set({
            ...clearedData,
            lastSyncTimestamp: Date.now()
          }, false, 'clearAll')

          // Immediate sync for clear all
          immediateSync({ nodes: clearedData.nodes, edges: clearedData.edges })
        },

        // Local collaboration methods
        initializeSession: () => {
          const state = get()

          // Generate a proper client-side session ID if we're using the SSR placeholder
          if (state.sessionId === 'ssr_placeholder') {
            sessionId = `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            set({ sessionId }, false, 'initializeSessionId')
          }

          // Register this tab as active
          const activeTabs = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.ACTIVE_TABS) || '[]')
          const updatedTabs = [...activeTabs.filter((id: string) => id !== sessionId), sessionId]
          localStorage.setItem(LOCAL_STORAGE_KEYS.ACTIVE_TABS, JSON.stringify(updatedTabs))
          set({ connectedTabs: updatedTabs }, false, 'updateConnectedTabs')

          // Load existing data if available
          state.syncWithLocalStorage()

          // Set up BroadcastChannel listener for cross-tab communication
          try {
            const channel = new BroadcastChannel('local_collaborative_flow')
            channel.addEventListener('message', (event) => {
              state.handleTabMessage(event)
            })

            // Store channel reference for cleanup
            ;(window as any).__localCollabChannel = channel

            // Notify other tabs about this new connection
            state.broadcastToTabs({ type: LOCAL_STORAGE_EVENTS.TAB_CONNECTED, sessionId })
          } catch {
            // BroadcastChannel not supported, falling back to storage events
            // Fallback to storage events for older browsers
            window.addEventListener('storage', (event) => {
              if (event.key === 'local_collaborative_broadcast' && event.newValue) {
                try {
                  const data = JSON.parse(event.newValue)
                  state.handleTabMessage({ data } as MessageEvent)
                } catch {
                  console.error('Failed to parse storage event data')
                }
              }
            })
          }

          // Clean up on page unload
          window.addEventListener('beforeunload', () => {
            const currentTabs = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.ACTIVE_TABS) || '[]')
            const filteredTabs = currentTabs.filter((id: string) => id !== sessionId)
            localStorage.setItem(LOCAL_STORAGE_KEYS.ACTIVE_TABS, JSON.stringify(filteredTabs))

            // Close BroadcastChannel
            const channel = (window as any).__localCollabChannel
            if (channel) {
              channel.close()
            }
          })
        },

        syncWithLocalStorage: () => {
          const storedData = localStorage.getItem(LOCAL_STORAGE_KEYS.FLOW_DATA)
          if (storedData) {
            try {
              const flowData = JSON.parse(storedData)
              const state = get()

              // Only sync if the stored data is newer than our last sync
              if (flowData.lastUpdate > state.lastSyncTimestamp && flowData.updatedBy !== state.sessionId) {
                set({
                  nodes: flowData.nodes || [],
                  edges: flowData.edges || [],
                  nodeIdCounter: flowData.nodeIdCounter || 1,
                  lastSyncTimestamp: flowData.lastUpdate
                }, false, 'syncWithLocalStorage')
              }
            } catch {
              console.error('Failed to parse stored flow data')
            }
          }
        },

        broadcastToTabs: (data) => {
          // Use BroadcastChannel for better cross-tab communication
          try {
            const channel = new BroadcastChannel('local_collaborative_flow')
            channel.postMessage(data)
            channel.close()
          } catch {
            // Fallback to localStorage events for older browsers
            localStorage.setItem('local_collaborative_broadcast', JSON.stringify({
              ...data,
              timestamp: Date.now()
            }))
            localStorage.removeItem('local_collaborative_broadcast')
          }
        },

        handleTabMessage: (event) => {
          if (event.data?.type === LOCAL_STORAGE_EVENTS.FLOW_UPDATE) {
            const state = get()
            const flowData = event.data.data

            // Only apply updates from other tabs
            if (flowData.updatedBy !== state.sessionId && flowData.lastUpdate > state.lastSyncTimestamp) {
              set({
                nodes: flowData.nodes || [],
                edges: flowData.edges || [],
                nodeIdCounter: flowData.nodeIdCounter || 1,
                lastSyncTimestamp: flowData.lastUpdate
              }, false, 'handleTabMessage')
            }
          } else if (event.data?.type === LOCAL_STORAGE_EVENTS.TAB_CONNECTED) {
            // Update connected tabs list
            const activeTabs = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.ACTIVE_TABS) || '[]')
            set({ connectedTabs: activeTabs }, false, 'updateConnectedTabs')
          }
        }
      }
    },
    { name: 'local-collaborative-flow-store' }
  )
)

// Selectors for better performance
export const useLocalCollaborativeSelectedNode = () => {
  const selectedNodeId = useLocalCollaborativeFlowStore((state) => state.selectedNodeId)
  const nodes = useLocalCollaborativeFlowStore((state) => state.nodes)

  // Use useMemo to prevent recalculating on every render
  return useMemo(() => {
    return selectedNodeId ? nodes.find(n => n.id === selectedNodeId) || null : null
  }, [selectedNodeId, nodes])
}

export const useLocalCollaborativeSelectedNodes = () => {
  const nodes = useLocalCollaborativeFlowStore((state) => state.nodes)

  // Use useMemo to prevent creating new array on every render
  return useMemo(() => {
    return nodes.filter(node => node.selected)
  }, [nodes])
}

// Stable action creators (following React Flow pattern)
export const useLocalCollaborativeFlowActions = () => {
  // Use individual selectors to get stable references to actions
  const addNode = useLocalCollaborativeFlowStore((state) => state.addNode)
  const deleteSelectedNodes = useLocalCollaborativeFlowStore((state) => state.deleteSelectedNodes)
  const clearAll = useLocalCollaborativeFlowStore((state) => state.clearAll)
  const updateNode = useLocalCollaborativeFlowStore((state) => state.updateNode)
  const selectNode = useLocalCollaborativeFlowStore((state) => state.selectNode)
  const onNodesChange = useLocalCollaborativeFlowStore((state) => state.onNodesChange)
  const onEdgesChange = useLocalCollaborativeFlowStore((state) => state.onEdgesChange)
  const onConnect = useLocalCollaborativeFlowStore((state) => state.onConnect)
  const initializeSession = useLocalCollaborativeFlowStore((state) => state.initializeSession)
  const syncWithLocalStorage = useLocalCollaborativeFlowStore((state) => state.syncWithLocalStorage)

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
    initializeSession,
    syncWithLocalStorage,
  }), [addNode, deleteSelectedNodes, clearAll, updateNode, selectNode, onNodesChange, onEdgesChange, onConnect, initializeSession, syncWithLocalStorage])
}

// Hook for collaboration state
export const useLocalCollaborationState = () => {
  return useLocalCollaborativeFlowStore(
    useShallow(state => ({
      sessionId: state.sessionId,
      connectedTabs: state.connectedTabs,
      lastSyncTimestamp: state.lastSyncTimestamp
    }))
  )
}
