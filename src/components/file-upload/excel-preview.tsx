'use client'

import { useState, useEffect } from 'react'
import * as XLSX from 'xlsx'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, AlertCircle, Loader2 } from 'lucide-react'

interface ExcelPreviewProps {
  fileUrl: string
  fileName: string
}

interface SheetData {
  name: string
  data: any[][]
  headers: string[]
}

export function ExcelPreview({ fileUrl, fileName: _fileName }: ExcelPreviewProps) {
  const [sheets, setSheets] = useState<SheetData[]>([])
  const [currentSheetIndex, setCurrentSheetIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadExcelFile = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Fetch the Excel file
        const response = await fetch(fileUrl)
        if (!response.ok) {
          throw new Error('Failed to fetch Excel file')
        }

        const arrayBuffer = await response.arrayBuffer()
        const workbook = XLSX.read(arrayBuffer, { type: 'array' })

        const sheetsData: SheetData[] = []

        // Process each sheet
        workbook.SheetNames.forEach((sheetName) => {
          const worksheet = workbook.Sheets[sheetName]
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
            header: 1,
            defval: '',
            raw: false
          }) as any[][]

          if (jsonData.length > 0) {
            // Extract headers (first row)
            const headers = jsonData[0]?.map(cell => String(cell || '')) || []
            
            // Extract data rows (skip first row if it contains headers)
            const dataRows = jsonData.slice(1)

            sheetsData.push({
              name: sheetName,
              data: dataRows,
              headers: headers
            })
          }
        })

        setSheets(sheetsData)
        setCurrentSheetIndex(0)
      } catch (err) {
        console.error('Failed to load Excel file:', err)
        setError('Failed to load Excel file. The file might be corrupted or in an unsupported format.')
      } finally {
        setIsLoading(false)
      }
    }

    if (fileUrl) {
      loadExcelFile()
    }
  }, [fileUrl])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading Excel file...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      </div>
    )
  }

  if (sheets.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No data found in Excel file
          </p>
        </div>
      </div>
    )
  }

  const currentSheet = sheets[currentSheetIndex]

  return (
    <div className="space-y-4">
      {/* Sheet Navigation */}
      {sheets.length > 1 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Sheet:</span>
            <Badge variant="outline">
              {currentSheet.name}
            </Badge>
            <span className="text-xs text-muted-foreground">
              ({currentSheetIndex + 1} of {sheets.length})
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentSheetIndex(Math.max(0, currentSheetIndex - 1))}
              disabled={currentSheetIndex === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentSheetIndex(Math.min(sheets.length - 1, currentSheetIndex + 1))}
              disabled={currentSheetIndex === sheets.length - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <ScrollArea className="h-96 w-full rounded-md border">
        <div className="p-4">
          {currentSheet.data.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">
                No data in this sheet
              </p>
            </div>
          ) : (
            <table className="w-full border-collapse">
              {/* Headers */}
              {currentSheet.headers.length > 0 && (
                <thead>
                  <tr>
                    {currentSheet.headers.map((header, index) => (
                      <th
                        key={index}
                        className="border border-border bg-muted/50 px-3 py-2 text-left text-sm font-medium"
                      >
                        {header || `Column ${index + 1}`}
                      </th>
                    ))}
                  </tr>
                </thead>
              )}
              
              {/* Data Rows */}
              <tbody>
                {currentSheet.data.slice(0, 100).map((row, rowIndex) => (
                  <tr key={rowIndex} className="hover:bg-muted/30">
                    {currentSheet.headers.map((_, colIndex) => (
                      <td
                        key={colIndex}
                        className="border border-border px-3 py-2 text-sm"
                      >
                        {row[colIndex] || ''}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          
          {/* Show truncation notice if there are more than 100 rows */}
          {currentSheet.data.length > 100 && (
            <div className="mt-4 p-3 bg-muted/50 rounded-md">
              <p className="text-sm text-muted-foreground">
                Showing first 100 rows of {currentSheet.data.length} total rows. 
                Download the file to view all data.
              </p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Sheet Summary */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span>Rows: {currentSheet.data.length}</span>
        <span>Columns: {currentSheet.headers.length}</span>
        {sheets.length > 1 && <span>Sheets: {sheets.length}</span>}
      </div>
    </div>
  )
}
