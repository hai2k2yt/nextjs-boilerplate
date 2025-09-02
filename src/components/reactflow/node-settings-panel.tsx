'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { CustomNode, CustomNodeData } from './node-types'

interface NodeSettingsPanelProps {
  node: CustomNode
  onUpdate: (updates: Partial<CustomNodeData>) => void
  onClose: () => void
}

export function NodeSettingsPanel({
  node,
  onUpdate,
  onClose
}: NodeSettingsPanelProps) {
  const [backgroundColor, setBackgroundColor] = useState(node.data.backgroundColor || '#ffffff')
  const [textColor, setTextColor] = useState(node.data.textColor || '#000000')

  // Update colors when node data changes (when switching between nodes)
  useEffect(() => {
    setBackgroundColor(node.data.backgroundColor || '#ffffff')
    setTextColor(node.data.textColor || '#000000')
  }, [node.data.backgroundColor, node.data.textColor, node.id])

  const handleBackgroundColorChange = (color: string) => {
    setBackgroundColor(color)
    onUpdate({
      backgroundColor: color,
      textColor
    })
  }

  const handleTextColorChange = (color: string) => {
    setTextColor(color)
    onUpdate({
      backgroundColor,
      textColor: color
    })
  }

  const handleReset = () => {
    const defaultBg = '#ffffff'
    const defaultText = '#000000'
    setBackgroundColor(defaultBg)
    setTextColor(defaultText)
    onUpdate({
      backgroundColor: defaultBg,
      textColor: defaultText
    })
  }

  return (
    <Card className="absolute left-4 z-30 w-64 shadow-xl border-2 bg-background" style={{ top: '340px' }}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm">Node Settings</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">{node.data.label}</p>
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
