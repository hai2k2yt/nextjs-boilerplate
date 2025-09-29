import { createTRPCRouter } from '@/server/api/trpc'
import { authRouter } from '@/server/api/routers/auth'
import { flowRoomRouter } from '@/server/api/routers/flow-room'
import { logsRouter } from '@/server/api/routers/logs'
import { filesRouter } from '@/server/api/routers/files'
import { calendarRouter } from '@/server/api/routers/calendar'

export const appRouter = createTRPCRouter({
  auth: authRouter,
  flowRoom: flowRoomRouter,
  logs: logsRouter,
  files: filesRouter,
  calendar: calendarRouter,
})

export type AppRouter = typeof appRouter
