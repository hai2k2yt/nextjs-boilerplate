'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSession, signIn, signOut } from 'next-auth/react'
import { motion } from 'framer-motion'
import { Menu, X, Bell, Search, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ThemeToggle } from '@/components/theme-toggle'

interface NavigationProps {
  onSidebarToggle?: () => void
  showSidebarToggle?: boolean
}

export function Navigation({ onSidebarToggle, showSidebarToggle = false }: NavigationProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const { data: session } = useSession()

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center px-4 lg:px-6">
        {/* Left section */}
        <div className="flex items-center space-x-4">
          {showSidebarToggle && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onSidebarToggle}
              className="lg:hidden"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle sidebar</span>
            </Button>
          )}

          <Link href="/" className="flex-shrink-0">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="text-xl font-bold text-primary lg:text-2xl"
            >
              Next.js App
            </motion.div>
          </Link>
        </div>

        {/* Center section - Search */}
        <div className="flex-1 flex justify-center px-4">
          <div className="w-full max-w-md">
            {showSearch ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative"
              >
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  className="pl-10 pr-10"
                  autoFocus
                  onBlur={() => setShowSearch(false)}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2"
                  onClick={() => setShowSearch(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </motion.div>
            ) : (
              <Button
                variant="ghost"
                className="w-full justify-start text-muted-foreground hidden md:flex"
                onClick={() => setShowSearch(true)}
              >
                <Search className="mr-2 h-4 w-4" />
                Search...
                <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                  <span className="text-xs">⌘</span>K
                </kbd>
              </Button>
            )}
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center space-x-2">
          {/* Search button for mobile */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setShowSearch(true)}
          >
            <Search className="h-5 w-5" />
            <span className="sr-only">Search</span>
          </Button>

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-red-500 text-[10px] font-medium text-white flex items-center justify-center">
              3
            </span>
            <span className="sr-only">Notifications</span>
          </Button>

          {/* Theme toggle */}
          <ThemeToggle />

          {/* User menu */}
          {session ? (
            <div className="hidden md:flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm font-medium">{session.user?.name}</p>
                <p className="text-xs text-muted-foreground">{session.user?.email}</p>
              </div>
              <Button variant="ghost" size="icon" className="relative">
                <User className="h-5 w-5" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => signOut()}>
                Sign Out
              </Button>
            </div>
          ) : (
            <Button onClick={() => signIn()} className="hidden md:flex">
              Sign In
            </Button>
          )}

          {/* Mobile menu toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="md:hidden border-t"
        >
          <div className="px-4 py-3 space-y-3">
            <div className="space-y-2">
              <Link
                href="/dashboard"
                className="block px-3 py-2 text-base font-medium text-foreground hover:text-primary rounded-md hover:bg-accent"
                onClick={() => setIsOpen(false)}
              >
                Dashboard
              </Link>
              <Link
                href="/analytics"
                className="block px-3 py-2 text-base font-medium text-foreground hover:text-primary rounded-md hover:bg-accent"
                onClick={() => setIsOpen(false)}
              >
                Analytics
              </Link>

            </div>

            {/* Theme toggle for mobile */}
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-base font-medium">Theme</span>
              <ThemeToggle />
            </div>

            {session ? (
              <div className="border-t pt-3 space-y-2">
                <div className="px-3 py-2">
                  <p className="text-sm font-medium">{session.user?.name}</p>
                  <p className="text-xs text-muted-foreground">{session.user?.email}</p>
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    signOut()
                    setIsOpen(false)
                  }}
                >
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="border-t pt-3">
                <Button
                  className="w-full"
                  onClick={() => {
                    signIn()
                    setIsOpen(false)
                  }}
                >
                  Sign In
                </Button>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </nav>
  )
}
