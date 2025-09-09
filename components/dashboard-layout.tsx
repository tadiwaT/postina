"use client"

import type { ReactNode } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { LogOut, Package } from "lucide-react"
import Link from "next/link"

interface DashboardLayoutProps {
  children: ReactNode
  userType?: string
  userName?: string
}

export default function DashboardLayout({ children, userType, userName }: DashboardLayoutProps) {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-6">
              <Link href="/" className="flex items-center gap-2">
                <Package className="h-8 w-8 text-primary" />
                <span className="text-xl font-semibold">POS System</span>
              </Link>

              {user?.userType === "owner" && (
                <nav className="hidden md:flex items-center gap-4">
                  <Link href="/owner-dashboard" className="text-sm font-medium hover:text-primary">
                    Dashboard
                  </Link>
                  <Link href="/products" className="text-sm font-medium hover:text-primary">
                    Products
                  </Link>
                  <Link href="/sales" className="text-sm font-medium hover:text-primary">
                    Sales
                  </Link>
                </nav>
              )}
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">Welcome, {user?.name || userName}</span>
              <Button variant="outline" size="sm" onClick={logout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
    </div>
  )
}
