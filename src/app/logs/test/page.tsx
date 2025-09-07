'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
// Only using database logging - no in-memory logger needed
import { 
  Bug, 
  Info, 
  AlertTriangle, 
  AlertCircle, 
  Database, 
  Server, 
  Users, 
  Activity,
  Zap,
  Shield
} from 'lucide-react'

// Define log enums locally
enum LogLevel {
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
  DEBUG = 'DEBUG'
}

enum LogCategory {
  SYSTEM = 'system',
  WEBSOCKET = 'websocket',
  REDIS = 'redis',
  DATABASE = 'database',
  COLLABORATION = 'collaboration',
  PERFORMANCE = 'performance',
  SECURITY = 'security'
}

export default function LogTestPage() {
  const { toast } = useToast()
  const [selectedLevel, setSelectedLevel] = useState<LogLevel>(LogLevel.INFO)
  const [selectedCategory, setSelectedCategory] = useState<LogCategory>(LogCategory.SYSTEM)
  const [message, setMessage] = useState('')
  const [userId, setUserId] = useState('')
  const [roomId, setRoomId] = useState('')
  const [customMetadata, setCustomMetadata] = useState('')

  const handleGenerateLog = async () => {
    if (!message.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a log message',
        variant: 'destructive',
      })
      return
    }

    try {
      const metadata: Record<string, any> = {}
      
      if (userId) metadata.userId = userId
      if (roomId) metadata.roomId = roomId
      if (customMetadata) {
        try {
          const parsed = JSON.parse(customMetadata)
          Object.assign(metadata, parsed)
        } catch {
          metadata.customData = customMetadata
        }
      }

      // Add some test-specific metadata
      metadata.testGenerated = true
      metadata.timestamp = new Date().toISOString()

      // Save log directly to database
      await fetch('/api/logs/database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: message,
          action: selectedCategory,
          userId: userId || undefined,
          roomId: roomId || undefined,
          details: metadata
        })
      })

      toast({
        title: 'Success',
        description: 'Log entry generated successfully',
      })

      // Clear form
      setMessage('')
      setCustomMetadata('')
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to generate log entry',
        variant: 'destructive',
      })
    }
  }

  const handleGenerateTestScenario = async (scenario: string) => {
    try {
      switch (scenario) {
        case 'websocket_connection':
          await fetch('/api/logs/database', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              event: 'WebSocket client_connected',
              action: 'websocket',
              userId: 'test-user-123',
              roomId: 'test-room-456',
              details: { socketId: 'socket-' + Math.random().toString(36).substr(2, 9), userAgent: 'Test Browser', testScenario: true }
            })
          })
          break

        case 'redis_cache_hit':
          await fetch('/api/logs/database', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              event: 'Redis get: flow_room:test-room-123',
              action: 'redis',
              details: { operation: 'get', key: 'flow_room:test-room-123', cacheHit: true, duration: 15.5, testScenario: true }
            })
          })
          break

        case 'redis_cache_miss':
          await fetch('/api/logs/database', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              event: 'Redis get: flow_room:test-room-456',
              action: 'redis',
              details: { operation: 'get', key: 'flow_room:test-room-456', cacheHit: false, duration: 25.2, testScenario: true }
            })
          })
          break

      case 'database_sync':
        await fetch('/api/logs/database', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'Database update: flowRoom',
            action: 'database',
            details: { operation: 'update', table: 'flowRoom', recordCount: 1, duration: 145.8, testScenario: true }
          })
        })
        break

      case 'collaboration_conflict':
        await fetch('/api/logs/database', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'Collaboration conflict_resolved',
            action: 'collaboration',
            userId: 'user-123',
            roomId: 'room-456',
            details: { conflictType: 'node_edit', resolution: 'timestamp_based', testScenario: true }
          })
        })
        break

      case 'performance_slow':
        setTimeout(async () => {
          await fetch('/api/logs/database', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              event: 'Operation completed: slow_operation_test',
              action: 'performance',
              details: { operation: 'slow_operation_test', duration: 100, testScenario: true }
            })
          })
        }, 100) // Simulate 100ms operation
        break

      case 'error_scenario':
        await fetch('/api/logs/database', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'Test error scenario',
            action: 'system',
            details: {
              error: { name: 'TestError', message: 'This is a test error for demonstration' },
              testScenario: true
            }
          })
        })
        break

      case 'batch_logs':
        // Generate multiple logs quickly
        const batchId = 'batch-' + Date.now()
        for (let i = 0; i < 5; i++) {
          setTimeout(async () => {
            await fetch('/api/logs/database', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                event: `Batch test log ${i + 1}`,
                action: 'collaboration',
                details: { batchId, sequence: i + 1, testScenario: true }
              })
            })
          }, i * 100)
        }
        break
      }

      toast({
        title: 'Test Scenario Generated',
        description: `Generated ${scenario.replace('_', ' ')} test logs`,
      })
    } catch (error) {
      console.error('Error generating test scenario:', error)
      toast({
        title: 'Error',
        description: 'Failed to generate test scenario',
        variant: 'destructive',
      })
    }
  }

  const getLevelIcon = (level: LogLevel) => {
    switch (level) {
      case LogLevel.ERROR:
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case LogLevel.WARN:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case LogLevel.INFO:
        return <Info className="h-4 w-4 text-blue-500" />
      case LogLevel.DEBUG:
        return <Bug className="h-4 w-4 text-gray-500" />
    }
  }

  const getCategoryIcon = (category: LogCategory) => {
    switch (category) {
      case LogCategory.WEBSOCKET:
        return <Activity className="h-4 w-4" />
      case LogCategory.REDIS:
        return <Server className="h-4 w-4" />
      case LogCategory.DATABASE:
        return <Database className="h-4 w-4" />
      case LogCategory.COLLABORATION:
        return <Users className="h-4 w-4" />
      case LogCategory.PERFORMANCE:
        return <Zap className="h-4 w-4" />
      case LogCategory.SECURITY:
        return <Shield className="h-4 w-4" />
      default:
        return <Info className="h-4 w-4" />
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Log Testing</h1>
          <p className="text-muted-foreground mt-2">
            Generate test logs to verify the logging system functionality
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Custom Log Generator */}
          <Card>
            <CardHeader>
              <CardTitle>Generate Custom Log</CardTitle>
              <CardDescription>
                Create a custom log entry with specific parameters
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="level">Log Level</Label>
                  <Select value={selectedLevel} onValueChange={(value) => setSelectedLevel(value as LogLevel)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={LogLevel.ERROR}>
                        <div className="flex items-center gap-2">
                          {getLevelIcon(LogLevel.ERROR)}
                          Error
                        </div>
                      </SelectItem>
                      <SelectItem value={LogLevel.WARN}>
                        <div className="flex items-center gap-2">
                          {getLevelIcon(LogLevel.WARN)}
                          Warning
                        </div>
                      </SelectItem>
                      <SelectItem value={LogLevel.INFO}>
                        <div className="flex items-center gap-2">
                          {getLevelIcon(LogLevel.INFO)}
                          Info
                        </div>
                      </SelectItem>
                      <SelectItem value={LogLevel.DEBUG}>
                        <div className="flex items-center gap-2">
                          {getLevelIcon(LogLevel.DEBUG)}
                          Debug
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as LogCategory)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(LogCategory).map((category) => (
                        <SelectItem key={category} value={category}>
                          <div className="flex items-center gap-2">
                            {getCategoryIcon(category)}
                            {category.charAt(0).toUpperCase() + category.slice(1)}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="message">Message</Label>
                <Input
                  id="message"
                  placeholder="Enter log message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="userId">User ID (optional)</Label>
                  <Input
                    id="userId"
                    placeholder="user-123"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="roomId">Room ID (optional)</Label>
                  <Input
                    id="roomId"
                    placeholder="room-456"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="metadata">Custom Metadata (JSON, optional)</Label>
                <Textarea
                  id="metadata"
                  placeholder='{"key": "value", "number": 123}'
                  value={customMetadata}
                  onChange={(e) => setCustomMetadata(e.target.value)}
                  rows={3}
                />
              </div>

              <Button onClick={handleGenerateLog} className="w-full">
                Generate Log Entry
              </Button>
            </CardContent>
          </Card>

          {/* Test Scenarios */}
          <Card>
            <CardHeader>
              <CardTitle>Test Scenarios</CardTitle>
              <CardDescription>
                Generate predefined test scenarios to simulate real system events
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                onClick={() => handleGenerateTestScenario('websocket_connection')}
                className="w-full justify-start"
              >
                <Activity className="h-4 w-4 mr-2" />
                WebSocket Connection
              </Button>

              <Button
                variant="outline"
                onClick={() => handleGenerateTestScenario('redis_cache_hit')}
                className="w-full justify-start"
              >
                <Server className="h-4 w-4 mr-2 text-green-500" />
                Redis Cache Hit
              </Button>

              <Button
                variant="outline"
                onClick={() => handleGenerateTestScenario('redis_cache_miss')}
                className="w-full justify-start"
              >
                <Server className="h-4 w-4 mr-2 text-red-500" />
                Redis Cache Miss
              </Button>

              <Button
                variant="outline"
                onClick={() => handleGenerateTestScenario('database_sync')}
                className="w-full justify-start"
              >
                <Database className="h-4 w-4 mr-2" />
                Database Sync
              </Button>

              <Button
                variant="outline"
                onClick={() => handleGenerateTestScenario('collaboration_conflict')}
                className="w-full justify-start"
              >
                <Users className="h-4 w-4 mr-2" />
                Collaboration Conflict
              </Button>

              <Button
                variant="outline"
                onClick={() => handleGenerateTestScenario('performance_slow')}
                className="w-full justify-start"
              >
                <Zap className="h-4 w-4 mr-2" />
                Slow Performance
              </Button>

              <Button
                variant="outline"
                onClick={() => handleGenerateTestScenario('error_scenario')}
                className="w-full justify-start"
              >
                <AlertTriangle className="h-4 w-4 mr-2 text-red-500" />
                Error Scenario
              </Button>

              <Button
                variant="outline"
                onClick={() => handleGenerateTestScenario('batch_logs')}
                className="w-full justify-start"
              >
                <Activity className="h-4 w-4 mr-2" />
                Batch Logs (5x)
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Testing Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p>1. <strong>Generate Custom Logs:</strong> Use the form on the left to create logs with specific parameters.</p>
              <p>2. <strong>Test Scenarios:</strong> Click the buttons on the right to simulate real system events.</p>
              <p>3. <strong>View Results:</strong> Navigate to the Log Dashboard or System Logs pages to see the generated logs in real-time.</p>
              <p>4. <strong>Monitor Statistics:</strong> Check the Log Statistics page to see how the metrics update.</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
