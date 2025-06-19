import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { type NextRequest } from 'next/server'

import { env } from '@/env'
import { appRouter } from '@/server/api/root'
import { getServerAuthSession } from '@/server/auth'
import { db } from '@/server/db'

const createContext = async (_req: NextRequest) => {
  const session = await getServerAuthSession()
  
  return {
    session,
    db,
  }
}

const handler = (req: NextRequest) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: () => createContext(req),
    onError:
      env.NODE_ENV === 'development'
        ? ({ path, error }) => {
            console.error(
              `❌ tRPC failed on ${path ?? '<no-path>'}: ${error.message}`
            )
          }
        : undefined,
  })

export { handler as GET, handler as POST }
