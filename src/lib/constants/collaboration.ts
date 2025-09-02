/**
 * Constants for collaborative features including timers, delays, and event names
 */

// Timer and delay constants (in milliseconds)
export const COLLABORATION_CONSTANTS = {
  // Cursor update batching
  CURSOR_BATCH_DELAY: 200, // 200ms batch duration for cursor updates
  CURSOR_THROTTLE_DELAY: 50, // 50ms throttle for mouse movement events
  
  // Flow change debouncing
  FLOW_CHANGE_DEBOUNCE_DELAY: 100, // 100ms debounce for flow changes
  
  // Local storage sync delays
  LOCAL_STORAGE_SYNC_DELAY: 500, // 500ms delay for localStorage sync
  
  // WebSocket broadcast and database sync delays
  BROADCAST_DELAY: 500, // 500ms delay for broadcasting events to other clients
  DATABASE_SYNC_DELAY: 30000, // 30 seconds delay for database sync
  
  // Search debounce delays
  USER_SEARCH_DEBOUNCE_DELAY: 300, // 300ms debounce for user search
  
  // Redis TTL values (in seconds)
  REDIS_TTL: {
    FLOW_ROOM: 60 * 60 * 24, // 24 hours
    FLOW_PARTICIPANTS: 60 * 60, // 1 hour
    FLOW_CHANGES: 60 * 30, // 30 minutes
  }
} as const

// WebSocket event names
export const WEBSOCKET_EVENTS = {
  // Connection events
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  ERROR: 'error',
  
  // Room events
  JOIN_ROOM: 'join_room',
  ROOM_JOINED: 'room_joined',
  LEAVE_ROOM: 'leave_room',
  
  // Flow events
  FLOW_CHANGE: 'flow_change',
  
  // Participant events
  PARTICIPANT_JOINED: 'participant_joined',
  PARTICIPANT_LEFT: 'participant_left',
  
  // Cursor events
  CURSOR_MOVE: 'cursor_move',
} as const

// Flow change event types
export const FLOW_CHANGE_TYPES = {
  BULK_NODES: 'bulk_nodes', // For bulk node operations (load, clear, replace all)
  GRANULAR_NODES: 'granular_nodes', // For individual node changes (move, edit, add one, remove one)
  BULK_EDGES: 'bulk_edges', // For bulk edge operations (replace all edges)
  GRANULAR_EDGES: 'granular_edges', // For individual edge changes (add one, remove one)
  CURSOR_MOVE: 'cursor_move',
} as const

// Local storage event types
export const LOCAL_STORAGE_EVENTS = {
  FLOW_UPDATE: 'flow_update',
  TAB_CONNECTED: 'tab_connected',
} as const

// Storage keys for local collaboration
export const STORAGE_KEYS = {
  FLOW_DATA: 'flow-data',
  ACTIVE_TABS: 'active-tabs',
  SESSION_ID: 'session-id',
} as const
