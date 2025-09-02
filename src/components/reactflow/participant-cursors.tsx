'use client'

import { memo } from 'react'
interface Participant {
  userId: string
  name: string
  role: 'OWNER' | 'EDITOR' | 'VIEWER'
  isActive: boolean
  cursor?: { x: number; y: number }
}

interface ParticipantCursorsProps {
  participants: Participant[]
}

export const ParticipantCursors = memo(({ participants }: ParticipantCursorsProps) => {
  return (
    <>
      {participants
        .filter(p => p.cursor && p.isActive)
        .map(participant => (
          <div
            key={participant.userId}
            className="absolute pointer-events-none z-50"
            style={{
              left: participant.cursor!.x,
              top: participant.cursor!.y,
              transform: 'translate(-2px, -2px)',
            }}
          >
            {/* Cursor pointer */}
            <div className="relative">
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                className="drop-shadow-sm"
              >
                <path
                  d="M2 2L18 8L8 12L2 18V2Z"
                  fill="#3B82F6"
                  stroke="white"
                  strokeWidth="1"
                />
              </svg>

              {/* User name label */}
              <div className="absolute top-5 left-2 whitespace-nowrap">
                <div className="px-2 py-1 bg-blue-500 text-white text-xs rounded shadow-lg">
                  {participant.name}
                </div>
              </div>
            </div>
          </div>
        ))}
    </>
  )
})

ParticipantCursors.displayName = 'ParticipantCursors'