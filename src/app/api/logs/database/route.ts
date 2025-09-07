// API endpoint for direct database logging
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/server/db'

export async function POST(request: NextRequest) {
  try {
    const { event, action, userId, roomId, details } = await request.json()

    if (!event || !action) {
      return NextResponse.json({ error: 'Event and action are required' }, { status: 400 })
    }

    // Create audit log entry in database
    const auditLog = await db.auditLog.create({
      data: {
        message: event,        // event -> message
        category: action,      // action -> category
        level: 'INFO',         // default level
        userId,
        roomId,
        metadata: details || {},  // details -> metadata
        timestamp: new Date()
      }
    })

    return NextResponse.json({ 
      success: true, 
      id: auditLog.id,
      message: 'Log saved to database successfully'
    })

  } catch (error) {
    console.error('Database logging error:', error)
    return NextResponse.json(
      { error: 'Failed to save log to database' }, 
      { status: 500 }
    )
  }
}
