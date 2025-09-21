/**
 * Utility functions for managing node IDs in React Flow
 */

import { CustomNode } from '@/components/reactflow/node-types'

/**
 * Generate a unique node ID using timestamp and random string
 * This prevents collisions even in collaborative environments
 */
export function generateUniqueNodeId(existingNodes: CustomNode[] = []): string {
  const existingIds = new Set(existingNodes.map(node => node.id))
  
  const timestamp = Date.now()
  const randomSuffix = Math.random().toString(36).substring(2, 8)
  let newId = `node-${timestamp}-${randomSuffix}`
  
  // Ensure uniqueness (very unlikely to collide, but just in case)
  while (existingIds.has(newId)) {
    const newRandomSuffix = Math.random().toString(36).substring(2, 8)
    newId = `node-${timestamp}-${newRandomSuffix}`
  }
  
  return newId
}

/**
 * Validate that all nodes have unique IDs
 * Returns an array of duplicate IDs if any are found
 */
export function validateUniqueNodeIds(nodes: CustomNode[]): string[] {
  const seenIds = new Set<string>()
  const duplicates = new Set<string>()
  
  nodes.forEach(node => {
    if (seenIds.has(node.id)) {
      duplicates.add(node.id)
    } else {
      seenIds.add(node.id)
    }
  })
  
  return Array.from(duplicates)
}

/**
 * Fix duplicate node IDs in a nodes array
 * Returns a new array with unique IDs for all nodes
 */
export function fixDuplicateNodeIds(nodes: CustomNode[]): CustomNode[] {
  const seenIds = new Set<string>()
  
  return nodes.map(node => {
    if (seenIds.has(node.id)) {
      // Generate a new unique ID for this duplicate
      const newId = generateUniqueNodeId(nodes)
      seenIds.add(newId)
      // Fixed duplicate node ID
      return { ...node, id: newId }
    } else {
      seenIds.add(node.id)
      return node
    }
  })
}

/**
 * Get the next available numeric node ID (for backward compatibility)
 * This scans existing nodes and returns the next available number
 */
export function getNextNumericNodeId(existingNodes: CustomNode[]): number {
  let maxId = 0
  
  existingNodes.forEach(node => {
    // Try to extract numeric ID from various formats
    const patterns = [
      /^node-(\d+)$/,           // node-4
      /^node-(\d+)-/,           // node-4-abc123
      /^(\d+)$/                 // 4
    ]
    
    for (const pattern of patterns) {
      const match = node.id.match(pattern)
      if (match) {
        const nodeNum = parseInt(match[1], 10)
        if (nodeNum > maxId) {
          maxId = nodeNum
        }
        break
      }
    }
  })
  
  return maxId + 1
}

/**
 * Generate a simple numeric node ID (for backward compatibility)
 * Use this only when you're sure there won't be concurrent users
 */
export function generateNumericNodeId(existingNodes: CustomNode[]): string {
  const nextId = getNextNumericNodeId(existingNodes)
  return `node-${nextId}`
}
