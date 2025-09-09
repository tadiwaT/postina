"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Search, Plus, MoreHorizontal, FileDown } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { exportToCSV, getFormattedDate } from "@/utils/export-utils"

interface Sale {
  id: number
  date: string
  products: {
    id: number
    name: string
    quantity: number
    price: number
    total: number
  }[]
  payment_method: string
  total_price: number
}

export const dynamic = "force-dynamic"

export default function SalesPage() {
  const { toast } = useToast()
  const [sales, setSales] = useState<Sale[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Load sales from localStorage
    const loadSales = () => {
      try {
        const storedSales = localStorage.getItem("pos_sales")
        if (storedSales) {
          setSales(JSON.parse(storedSales))
        } else {
          // Initialize with empty array if no sales exist
          localStorage.setItem("pos_sales", JSON.stringify([]))
          setSales([])
        }
      } catch (error) {
        console.error("Error loading sales:", error)
        toast({
          title: "Error",
          description: "Failed to load sales data",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadSales()
  }, [toast])

  const filteredSales = sales.filter((sale) => {
    const searchLower = searchQuery.toLowerCase()

    // Search by sale ID
    if (sale.id.toString().includes(searchLower)) return true

    // Search by product name
    const hasMatchingProduct = sale.products.some((product) => product.name.toLowerCase().includes(searchLower))

    if (hasMatchingProduct) return true

    // Search by payment method
    if (sale.payment_method.toLowerCase().includes(searchLower)) return true

    // Search by date
    const saleDate = new Date(sale.date).toLocaleDateString()
    if (saleDate.toLowerCase().includes(searchLower)) return true

    return false
  })

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  const getPaymentMethodBadge = (method: string) => {
    switch (method) {
      case "cash":
        return (
          <Badge variant="outline" className="text-green-500 border-green-500">
            Cash
          </Badge>
        )
      case "credit":
        return (
          <Badge variant="outline" className="text-blue-500 border-blue-500">
            Credit Card
          </Badge>
        )
      case "debit":
        return (
          <Badge variant="outline" className="text-purple-500 border-purple-500">
            Debit Card
          </Badge>
        )
      default:
        return <Badge variant="outline">{method}</Badge>
    }
  }

  const handleDeleteSale = (saleId: number) => {
    try {
      // Filter out the sale to delete
      const updatedSales = sales.filter((sale) => sale.id !== saleId)

      // Update localStorage
      localStorage.setItem("pos_sales", JSON.stringify(updatedSales))

      // Update state
      setSales(updatedSales)

      toast({
        title: "Sale Deleted",
        description: "The sale has been removed from your records.",
      })
    } catch (error) {
      console.error("Error deleting sale:", error)
      toast({
        title: "Error",
        description: "Failed to delete sale",
        variant: "destructive",
      })
    }
  }

  const handleExportSales = () => {
    try {
      // Format sales for export
      const exportData = sales.map((sale) => {
        // Get a list of product names for this sale
        const productsList = sale.products.map((p) => p.name).join(", ")

        return {
          "Sale ID": sale.id,
          Date: formatDate(sale.date),
          Products: productsList,
          "Payment Method": sale.payment_method,
          Total: `$${sale.total_price.toFixed(2)}`,
          "Items Count": sale.products.reduce((sum, product) => sum + product.quantity, 0),
        }
      })

      // Export to CSV
      exportToCSV(exportData, `sales-${getFormattedDate()}`)

      toast({
        title: "Export Successful",
        description: "Sales have been exported to CSV.",
      })
    } catch (error) {
      console.error("Error exporting sales:", error)
      toast({
        title: "Export Failed",
        description: "Failed to export sales. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <DashboardLayout userType="admin" userName="Admin User">
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Sales</h1>
            <p className="text-muted-foreground">View and manage all sales transactions</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button asChild>
              <Link href="/sales/new">
                <Plus className="mr-2 h-4 w-4" /> New Sale
              </Link>
            </Button>
            <Button variant="outline" onClick={handleExportSales}>
              <FileDown className="mr-2 h-4 w-4" /> Export
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sales History</CardTitle>
            <CardDescription>View all sales transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <div className="flex w-full max-w-sm items-center space-x-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search sales..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {isLoading ? (
                <div className="flex justify-center py-6">Loading sales...</div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Sale ID</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Products</TableHead>
                        <TableHead>Payment</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSales.length > 0 ? (
                        filteredSales.map((sale) => (
                          <TableRow key={sale.id}>
                            <TableCell className="font-medium">#{sale.id}</TableCell>
                            <TableCell>{formatDate(sale.date)}</TableCell>
                            <TableCell>
                              {sale.products.length === 1
                                ? sale.products[0].name
                                : `${sale.products[0].name} +${sale.products.length - 1} more`}
                            </TableCell>
                            <TableCell>{getPaymentMethodBadge(sale.payment_method)}</TableCell>
                            <TableCell>${sale.total_price.toFixed(2)}</TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">Open menu</span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem asChild>
                                    <Link href={`/sales/${sale.id}`}>View Details</Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem asChild>
                                    <Link href={`/sales/${sale.id}/receipt`}>Print Receipt</Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-red-500" onClick={() => handleDeleteSale(sale.id)}>
                                    Delete Sale
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="h-24 text-center">
                            {searchQuery
                              ? "No sales found matching your search."
                              : "No sales recorded yet. Process your first sale!"}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
