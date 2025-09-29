'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Home,
  LayoutDashboard,
  Settings,
  Users,
  BarChart3,
  Calendar,
  Mail,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Bookmark,
  Archive,
  Workflow,
  FileText,
  Share2,
  Monitor,
  Activity,
  CreditCard,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'

interface SidebarProps {
  isCollapsed?: boolean
  onToggleCollapse?: () => void
  className?: string
}

const navigationItems = [
  {
    title: 'Overview',
    items: [
      { title: 'Home', href: '/', icon: Home },
      { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { title: 'Analytics', href: '/analytics', icon: BarChart3 },
    ],
  },
  {
    title: 'Monitoring',
    items: [
      { title: 'Log Dashboard', href: '/logs/dashboard', icon: Monitor },
      { title: 'System Logs', href: '/logs', icon: Activity },
      { title: 'Audit Logs', href: '/audit-logs', icon: FileText },
      { title: 'Log Statistics', href: '/logs/statistics', icon: BarChart3 },
      { title: 'Log Testing', href: '/logs/test', icon: Settings },
    ],
  },
  {
    title: 'Content',
    items: [
      { title: 'Calendar', href: '/calendar', icon: Calendar },
      { title: 'Mail', href: '/mail', icon: Mail },
      { title: 'File Upload', href: '/files', icon: Upload },
      { title: 'Payments', href: '/payments', icon: CreditCard },
      { title: 'React Flow', href: '/reactflow', icon: Workflow },
      { title: 'Local Collaborative', href: '/reactflow/local-collaborative', icon: Monitor },
      { title: 'Remote Collaborative', href: '/reactflow/remote-collaborative', icon: Share2 },
      { title: 'Flow Rooms', href: '/flow', icon: Users },
      { title: 'Forms', href: '/forms', icon: FileText },
    ],
  },
  {
    title: 'Management',
    items: [
      { title: 'Users', href: '/users', icon: Users },
      { title: 'Settings', href: '/settings', icon: Settings },
      { title: 'Help', href: '/help', icon: HelpCircle },
    ],
  },
]

const quickActions = [
  { title: 'New Document', icon: Plus, action: 'create-doc' },
  { title: 'Search Files', icon: Search, action: 'search' },
  { title: 'Filter Data', icon: Filter, action: 'filter' },
  { title: 'Export Data', icon: Download, action: 'export' },
  { title: 'Import Data', icon: Upload, action: 'import' },
]

const bookmarks = [
  { title: 'User Reports', href: '/reports/users', icon: Bookmark },
  { title: 'Archive', href: '/archive', icon: Archive },
]

export function Sidebar({ isCollapsed = false, onToggleCollapse, className }: SidebarProps) {
  const pathname = usePathname()
  const [searchQuery, setSearchQuery] = useState('')

  const handleQuickAction = (action: string) => {
    // eslint-disable-next-line no-console
    console.log('Quick action:', action)
    // Implement quick actions here
  }

  return (
    <motion.div
      initial={false}
      animate={{ width: isCollapsed ? 80 : 280 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className={cn(
        'flex h-full flex-col border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
        className
      )}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b">
        {!isCollapsed && (
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-lg font-semibold"
          >
            Navigation
          </motion.h2>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleCollapse}
          className="h-8 w-8"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
          <span className="sr-only">Toggle sidebar</span>
        </Button>
      </div>

      {/* Search */}
      {!isCollapsed && (
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search navigation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        <nav className="space-y-6">
          {navigationItems.map((section) => (
            <div key={section.title}>
              {!isCollapsed && (
                <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {section.title}
                </h3>
              )}
              <ul className="space-y-1">
                {section.items.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent hover:text-accent-foreground',
                          isActive && 'bg-accent text-accent-foreground font-medium',
                          isCollapsed && 'justify-center px-2'
                        )}
                      >
                        <item.icon className="h-4 w-4 flex-shrink-0" />
                        {!isCollapsed && (
                          <span className="truncate">{item.title}</span>
                        )}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>

        {!isCollapsed && (
          <>
            <Separator className="my-6" />
            
            {/* Quick Actions */}
            <div className="space-y-2">
              <h3 className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Quick Actions
              </h3>
              <div className="space-y-1">
                {quickActions.map((action) => (
                  <Button
                    key={action.action}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start gap-3 px-3"
                    onClick={() => handleQuickAction(action.action)}
                  >
                    <action.icon className="h-4 w-4" />
                    <span className="truncate">{action.title}</span>
                  </Button>
                ))}
              </div>
            </div>

            <Separator className="my-6" />

            {/* Bookmarks */}
            <div className="space-y-2">
              <h3 className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Bookmarks
              </h3>
              <div className="space-y-1">
                {bookmarks.map((bookmark) => (
                  <Link
                    key={bookmark.href}
                    href={bookmark.href}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent hover:text-accent-foreground"
                  >
                    <bookmark.icon className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{bookmark.title}</span>
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      {!isCollapsed && (
        <div className="border-t p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span>All systems operational</span>
          </div>
        </div>
      )}
    </motion.div>
  )
}
