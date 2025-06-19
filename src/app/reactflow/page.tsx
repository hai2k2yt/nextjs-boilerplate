'use client'

import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { FlowCanvas } from '@/components/reactflow/flow-canvas'

export default function ReactFlowPage() {
  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Flow Canvas */}
        <Card className="h-[600px] overflow-hidden">
          <CardContent className="h-full p-0">
            <FlowCanvas />
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
