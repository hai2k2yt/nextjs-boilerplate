'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { CustomNodeData } from './node-types'

interface NodeSettingsPanelProps {
  nodeData: CustomNodeData
  nodeId: string
  onClose: () => void
  onUpdateNode: (nodeId: string, updates: Partial<CustomNodeData>) => void
}

export function NodeSettingsPanel({
  nodeData,
  nodeId,
  onClose,
  onUpdateNode
}: NodeSettingsPanelProps) {
  const [backgroundColor, setBackgroundColor] = useState(nodeData.backgroundColor || '#ffffff')
  const [textColor, setTextColor] = useState(nodeData.textColor || '#000000')

  // Update colors when nodeData changes (when switching between nodes)
  useEffect(() => {
    setBackgroundColor(nodeData.backgroundColor || '#ffffff')
    setTextColor(nodeData.textColor || '#000000')
  }, [nodeData.backgroundColor, nodeData.textColor, nodeId])

  const handleBackgroundColorChange = (color: string) => {
    setBackgroundColor(color)
    onUpdateNode(nodeId, {
      backgroundColor: color,
      textColor
    })
  }

  const handleTextColorChange = (color: string) => {
    setTextColor(color)
    onUpdateNode(nodeId, {
      backgroundColor,
      textColor: color
    })
  }

  const handleReset = () => {
    const defaultBg = '#ffffff'
    const defaultText = '#000000'
    setBackgroundColor(defaultBg)
    setTextColor(defaultText)
    onUpdateNode(nodeId, {
      backgroundColor: defaultBg,
      textColor: defaultText
    })
  }

  return (
    <Card className="absolute top-4 left-4 z-30 w-64 shadow-xl border-2 bg-background" style={{ marginTop: '320px' }}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm">Node Settings</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">{nodeData.label}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="backgroundColor" className="text-xs">
              Background Color
            </Label>
            <div className="flex items-center space-x-2">
              <input
                id="backgroundColor"
                type="color"
                value={backgroundColor}
                onChange={(e) => handleBackgroundColorChange(e.target.value)}
                className="w-8 h-8 rounded border cursor-pointer"
              />
              <span className="text-xs text-muted-foreground font-mono">
                {backgroundColor}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="textColor" className="text-xs">
              Text Color
            </Label>
            <div className="flex items-center space-x-2">
              <input
                id="textColor"
                type="color"
                value={textColor}
                onChange={(e) => handleTextColorChange(e.target.value)}
                className="w-8 h-8 rounded border cursor-pointer"
              />
              <span className="text-xs text-muted-foreground font-mono">
                {textColor}
              </span>
            </div>
          </div>

          <div className="flex justify-center pt-2">
            <Button
              onClick={handleReset}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              Reset to Default
            </Button>
          </div>
        </CardContent>
      </Card>
  )
}
