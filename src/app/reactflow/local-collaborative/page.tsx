'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LocalCollaborativeFlowCanvas } from '@/components/reactflow/local-collaborative-flow-canvas'
import { Monitor, Users, Wifi, ArrowLeft } from 'lucide-react'

export default function LocalCollaborativeFlowPage() {
  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/reactflow">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to React Flow
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Local Collaborative Flow</h1>
              <p className="text-muted-foreground">Multi-tab synchronization on the same machine</p>
            </div>
          </div>
        </div>

        {/* Flow Canvas */}
        <Card className="h-[600px] overflow-hidden">
          <CardContent className="h-full p-0">
            <LocalCollaborativeFlowCanvas />
          </CardContent>
        </Card>

        {/* Info Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Monitor className="h-5 w-5" />
                Multi-Tab Sync
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Open this page in multiple browser tabs or windows to see real-time 
                synchronization. Changes made in one tab instantly appear in others.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Wifi className="h-5 w-5" />
                Local Storage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Uses browser&apos;s localStorage and BroadcastChannel API for fast,
                local synchronization without requiring a server connection.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5" />
                Session Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Each tab gets a unique session ID. Changes are debounced and 
                synchronized efficiently to prevent conflicts.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>How to Test Local Collaboration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">1. Open Multiple Tabs</h4>
              <p className="text-sm text-muted-foreground">
                Right-click this page and select &quot;Duplicate Tab&quot; or open this URL in a new tab/window.
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">2. Make Changes</h4>
              <p className="text-sm text-muted-foreground">
                Add nodes, move them around, create connections, or modify node properties in one tab.
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">3. Watch Synchronization</h4>
              <p className="text-sm text-muted-foreground">
                Switch to other tabs to see your changes appear automatically. The green indicator 
                shows when local sync is active.
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Note:</strong> This local collaboration only works between tabs/windows
                on the same browser and machine. For remote collaboration with other users,
                try the Remote Collaborative Flow feature.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-center gap-4">
          <Link href="/reactflow">
            <Button variant="outline">
              Simple React Flow
            </Button>
          </Link>
          <Link href="/reactflow/remote-collaborative">
            <Button variant="outline">
              Remote Collaborative Flow
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
