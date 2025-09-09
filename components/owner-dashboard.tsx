"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ProductManagement } from "@/components/product-management"
import { SalesAnalytics } from "@/components/sales-analytics"
import { InventoryTracking } from "@/components/inventory-tracking"
import { posStore, type Product, type Sale } from "@/lib/store"
import { getCurrentUser, logout } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { DollarSign, Package, ShoppingCart, TrendingUp, AlertTriangle, LogOut, BarChart3, Boxes } from "lucide-react"

export function OwnerDashboard() {
  const [products, setProducts] = useState<Product[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [activeTab, setActiveTab] = useState("overview")
  const router = useRouter()
  const user = getCurrentUser()

  useEffect(() => {
    refreshData()
  }, [])

  const refreshData = () => {
    setProducts(posStore.getProducts())
    setSales(posStore.getSales())
  }

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  // Calculate metrics
  const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0)
  const totalProducts = products.length
  const totalSales = sales.length
  const lowStockProducts = products.filter((p) => p.stock < 10)
  const outOfStockProducts = products.filter((p) => p.stock === 0)

  // Today's sales
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todaysSales = sales.filter((sale) => {
    const saleDate = new Date(sale.timestamp)
    saleDate.setHours(0, 0, 0, 0)
    return saleDate.getTime() === today.getTime()
  })
  const todaysRevenue = todaysSales.reduce((sum, sale) => sum + sale.total, 0)

  // This month's sales
  const thisMonth = new Date()
  thisMonth.setDate(1)
  thisMonth.setHours(0, 0, 0, 0)
  const monthSales = sales.filter((sale) => new Date(sale.timestamp) >= thisMonth)
  const monthRevenue = monthSales.reduce((sum, sale) => sum + sale.total, 0)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground p-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Owner Dashboard</h1>
          <p className="text-sm opacity-90">Welcome back, {user?.name}</p>
        </div>
        <Button
          variant="outline"
          onClick={handleLogout}
          className="text-primary-foreground border-primary-foreground hover:bg-primary-foreground hover:text-primary bg-transparent"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </header>

      <div className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground">All time sales</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Today's Sales</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${todaysRevenue.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground">{todaysSales.length} transactions</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalProducts}</div>
                  <p className="text-xs text-muted-foreground">Active products</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalSales}</div>
                  <p className="text-xs text-muted-foreground">All time transactions</p>
                </CardContent>
              </Card>
            </div>

            {/* Monthly Progress */}
            <Card>
              <CardHeader>
                <CardTitle>This Month's Performance</CardTitle>
                <CardDescription>Revenue and sales for the current month</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-secondary">${monthRevenue.toFixed(2)}</div>
                    <p className="text-sm text-muted-foreground">Monthly Revenue</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-secondary">{monthSales.length}</div>
                    <p className="text-sm text-muted-foreground">Monthly Sales</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-secondary">
                      {monthSales.length > 0 ? (monthRevenue / monthSales.length).toFixed(2) : "0.00"}
                    </div>
                    <p className="text-sm text-muted-foreground">Avg. Sale Value</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Inventory Alerts */}
            {(lowStockProducts.length > 0 || outOfStockProducts.length > 0) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-2 text-destructive" />
                    Inventory Alerts
                  </CardTitle>
                  <CardDescription>Products that need attention</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {outOfStockProducts.length > 0 && (
                    <div>
                      <h4 className="font-medium text-destructive mb-2">Out of Stock ({outOfStockProducts.length})</h4>
                      <div className="flex flex-wrap gap-2">
                        {outOfStockProducts.slice(0, 5).map((product) => (
                          <Badge key={product.id} variant="destructive">
                            {product.name}
                          </Badge>
                        ))}
                        {outOfStockProducts.length > 5 && (
                          <Badge variant="outline">+{outOfStockProducts.length - 5} more</Badge>
                        )}
                      </div>
                    </div>
                  )}
                  {lowStockProducts.length > 0 && (
                    <div>
                      <h4 className="font-medium text-secondary mb-2">Low Stock ({lowStockProducts.length})</h4>
                      <div className="flex flex-wrap gap-2">
                        {lowStockProducts.slice(0, 5).map((product) => (
                          <Badge key={product.id} variant="secondary">
                            {product.name} ({product.stock})
                          </Badge>
                        ))}
                        {lowStockProducts.length > 5 && (
                          <Badge variant="outline">+{lowStockProducts.length - 5} more</Badge>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common tasks and shortcuts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button onClick={() => setActiveTab("products")} className="h-20 flex-col">
                    <Package className="w-6 h-6 mb-2" />
                    Manage Products
                  </Button>
                  <Button onClick={() => setActiveTab("analytics")} variant="outline" className="h-20 flex-col">
                    <BarChart3 className="w-6 h-6 mb-2" />
                    View Analytics
                  </Button>
                  <Button onClick={() => setActiveTab("inventory")} variant="outline" className="h-20 flex-col">
                    <Boxes className="w-6 h-6 mb-2" />
                    Check Inventory
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products">
            <ProductManagement />
          </TabsContent>

          <TabsContent value="analytics">
            <SalesAnalytics />
          </TabsContent>

          <TabsContent value="inventory">
            <InventoryTracking />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
