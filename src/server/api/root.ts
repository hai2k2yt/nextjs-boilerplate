import { createTRPCRouter } from '@/server/api/trpc'
import { exampleRouter } from '@/server/api/routers/example'
import { authRouter } from '@/server/api/routers/auth'
import { flowRoomRouter } from '@/server/api/routers/flow-room'
import { logsRouter } from '@/server/api/routers/logs'

export const appRouter = createTRPCRouter({
  example: exampleRouter,
  auth: authRouter,
  flowRoom: flowRoomRouter,
  logs: logsRouter,
})

export type AppRouter = typeof appRouter
