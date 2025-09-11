/* eslint-disable no-console */
import { NextApiRequest, NextApiResponse } from 'next'
import { initializeWebSocketManager } from '@/lib/websocket'

export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  // Type assertion to handle the socket server
  const resWithSocket = res as any

  if (resWithSocket.socket?.server?.io) {
    console.log('WebSocket server already running')
    res.end()
    return
  }

  if (!resWithSocket.socket?.server) {
    console.log('No socket server available')
    res.status(500).json({ error: 'Socket server not available' })
    return
  }

  console.log('Starting WebSocket server...')

  try {
    // Initialize WebSocket manager
    const httpServer = resWithSocket.socket.server
    const io = initializeWebSocketManager(httpServer)

    resWithSocket.socket.server.io = io

    console.log('WebSocket server started successfully')
    res.end()
  } catch (error) {
    console.error('Failed to start WebSocket server:', error)
    res.status(500).json({ error: 'Failed to start WebSocket server' })
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
}
