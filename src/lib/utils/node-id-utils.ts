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


