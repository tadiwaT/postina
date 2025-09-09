"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getSales, exportSalesToCSV, type Sale } from "@/lib/simple-store"
import { Download, Search } from "lucide-react"

export function SalesList() {
  const [sales, setSales] = useState<Sale[]>([])
  const [filteredSales, setFilteredSales] = useState<Sale[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedMonth, setSelectedMonth] = useState("all")

  useEffect(() => {
    const loadedSales = getSales()
    setSales(loadedSales)
    setFilteredSales(loadedSales)
  }, [])

  useEffect(() => {
    let filtered = sales

    if (searchTerm) {
      filtered = filtered.filter(
        (s) => s.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) || s.id.toString().includes(searchTerm),
      )
    }

    if (selectedMonth !== "all") {
      filtered = filtered.filter((s) => s.date.startsWith(selectedMonth))
    }

    setFilteredSales(filtered)
  }, [sales, searchTerm, selectedMonth])

  const months = [...new Set(sales.map((s) => s.date.substring(0, 7)))].sort().reverse()

  const totalSales = filteredSales.reduce((sum, sale) => sum + sale.total, 0)
  const totalProfit = filteredSales.reduce((sum, sale) => sum + (sale.totalProfit || 0), 0)

  const handleExport = () => {
    const csv = exportSalesToCSV(selectedMonth !== "all" ? selectedMonth : undefined)
    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `sales-${selectedMonth !== "all" ? selectedMonth : "all"}-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Sales Management</CardTitle>
          <Button onClick={handleExport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Excel
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{filteredSales.length}</div>
                <p className="text-xs text-muted-foreground">Total Sales</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">${totalSales.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">Total Revenue</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-green-600">${totalProfit.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">Total Profit</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by employee or sale ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by month" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Months</SelectItem>
                {months.map((month) => (
                  <SelectItem key={month} value={month}>
                    {new Date(month + "-01").toLocaleDateString("en-US", { year: "numeric", month: "long" })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sales Table */}
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 grid grid-cols-6 gap-4 font-medium text-sm">
              <div>Sale ID</div>
              <div>Date</div>
              <div>Employee</div>
              <div>Items</div>
              <div>Total</div>
              <div>Profit</div>
            </div>
            <div className="divide-y">
              {filteredSales.map((sale) => (
                <div key={sale.id} className="px-4 py-3 grid grid-cols-6 gap-4 items-center">
                  <div className="font-mono text-sm">#{sale.id}</div>
                  <div className="text-sm">{new Date(sale.date).toLocaleDateString()}</div>
                  <div>{sale.employeeName}</div>
                  <div className="text-sm">
                    <div className="space-y-1">
                      {sale.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between">
                          <span>
                            {item.name} x{item.quantity}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="font-medium">${sale.total.toFixed(2)}</div>
                  <div className="font-medium text-green-600">${(sale.totalProfit || 0).toFixed(2)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
