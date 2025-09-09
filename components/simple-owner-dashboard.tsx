"use client"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProductsList } from "./products-list"
import { SalesList } from "./sales-list"
import { logout } from "@/lib/simple-auth"
import { useRouter } from "next/navigation"
import { Package, TrendingUp, LogOut } from "lucide-react"

export function SimpleOwnerDashboard() {
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b bg-white">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Owner Dashboard</h1>
          <Button onClick={handleLogout} variant="outline">
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <Tabs defaultValue="products" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="products" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Products
            </TabsTrigger>
            <TabsTrigger value="sales" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Sales & Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products">
            <ProductsList />
          </TabsContent>

          <TabsContent value="sales">
            <SalesList />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
