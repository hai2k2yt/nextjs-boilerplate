'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FlowCanvas } from '@/components/reactflow/flow-canvas'
import { Share2, Users } from 'lucide-react'

export default function ReactFlowPage() {
  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold">React Flow Examples</h1>
          <p className="text-muted-foreground">Interactive node-based editor with different collaboration modes</p>
        </div>

        {/* Simple React Flow */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              Simple React Flow
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Basic React Flow with local state management. Perfect for single-user applications
              or when you don&#39;t need collaboration features.
            </p>
            <Card className="h-[400px] overflow-hidden">
              <CardContent className="h-full p-0">
                <FlowCanvas />
              </CardContent>
            </Card>
          </CardContent>
        </Card>

        {/* Collaboration Options */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                Local Collaborative Flow
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Multi-tab synchronization on the same machine. Changes sync instantly
                between browser tabs using localStorage and BroadcastChannel API.
              </p>
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Features:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Real-time sync between browser tabs</li>
                  <li>• No server required</li>
                  <li>• Automatic conflict resolution</li>
                  <li>• Session management</li>
                </ul>
              </div>
              <Link href="/reactflow/local-collaborative">
                <Button className="w-full gap-2">
                  <Users className="h-4 w-4" />
                  Try Local Collaboration
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-500" />
                Remote Collaborative Flow
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Full multi-user collaboration with WebSocket connections, live cursors,
                and role-based permissions. Perfect for team collaboration.
              </p>
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Features:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Multi-user real-time editing</li>
                  <li>• Live cursor tracking</li>
                  <li>• Room-based collaboration</li>
                  <li>• Role-based permissions</li>
                </ul>
              </div>
              <Link href="/reactflow/remote-collaborative">
                <Button className="w-full gap-2">
                  <Share2 className="h-4 w-4" />
                  Try Remote Collaboration
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  )
}
