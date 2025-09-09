"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  getProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  restockProduct,
  exportProductsToCSV,
  type Product,
} from "@/lib/simple-store"
import { Download, Plus, Edit, Trash2, Search, Package } from "lucide-react"

export function ProductsList() {
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [restockingProduct, setRestockingProduct] = useState<Product | null>(null)
  const [restockQuantity, setRestockQuantity] = useState("")
  const [newProduct, setNewProduct] = useState({
    name: "",
    buyingPrice: "",
    sellingPrice: "",
    stock: "",
    category: "",
  })

  useEffect(() => {
    const loadedProducts = getProducts()
    setProducts(loadedProducts)
    setFilteredProducts(loadedProducts)
  }, [])

  useEffect(() => {
    let filtered = products

    if (searchTerm) {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.category.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (selectedCategory !== "all") {
      filtered = filtered.filter((p) => p.category === selectedCategory)
    }

    setFilteredProducts(filtered)
  }, [products, searchTerm, selectedCategory])

  const categories = [...new Set(products.map((p) => p.category))]

  const handleAddProduct = () => {
    if (
      !newProduct.name ||
      !newProduct.buyingPrice ||
      !newProduct.sellingPrice ||
      !newProduct.stock ||
      !newProduct.category
    )
      return

    const product = {
      name: newProduct.name,
      buyingPrice: Number.parseFloat(newProduct.buyingPrice),
      sellingPrice: Number.parseFloat(newProduct.sellingPrice),
      stock: Number.parseInt(newProduct.stock),
      category: newProduct.category,
    }

    addProduct(product)
    setProducts(getProducts())
    setNewProduct({ name: "", buyingPrice: "", sellingPrice: "", stock: "", category: "" })
    setIsAddDialogOpen(false)
  }

  const handleEditProduct = () => {
    if (!editingProduct) return

    updateProduct(editingProduct.id, {
      name: editingProduct.name,
      buyingPrice: editingProduct.buyingPrice,
      sellingPrice: editingProduct.sellingPrice,
      stock: editingProduct.stock,
      category: editingProduct.category,
    })

    setProducts(getProducts())
    setEditingProduct(null)
  }

  const handleDeleteProduct = (id: number) => {
    if (confirm("Are you sure you want to delete this product?")) {
      deleteProduct(id)
      setProducts(getProducts())
    }
  }

  const handleRestockProduct = () => {
    if (!restockingProduct || !restockQuantity) return

    const quantity = Number.parseInt(restockQuantity)
    if (quantity > 0) {
      restockProduct(restockingProduct.id, quantity)
      setProducts(getProducts())
      setRestockingProduct(null)
      setRestockQuantity("")
    }
  }

  const handleExport = () => {
    const csv = exportProductsToCSV()
    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `products-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Products Management</CardTitle>
          <div className="flex gap-2">
            <Button onClick={handleExport} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Excel
            </Button>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Product
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Product</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Product name"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  />
                  <Input
                    type="number"
                    placeholder="Buying price"
                    value={newProduct.buyingPrice}
                    onChange={(e) => setNewProduct({ ...newProduct, buyingPrice: e.target.value })}
                    step="0.01"
                  />
                  <Input
                    type="number"
                    placeholder="Selling price"
                    value={newProduct.sellingPrice}
                    onChange={(e) => setNewProduct({ ...newProduct, sellingPrice: e.target.value })}
                    step="0.01"
                  />
                  <Input
                    type="number"
                    placeholder="Stock quantity"
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                  />
                  <Input
                    placeholder="Category"
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                  />
                  <Button onClick={handleAddProduct} className="w-full">
                    Add Product
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Products Table */}
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 grid grid-cols-8 gap-4 font-medium text-sm">
              <div>Name</div>
              <div>Category</div>
              <div>Buying Price</div>
              <div>Selling Price</div>
              <div>Profit Margin</div>
              <div>Stock</div>
              <div>Status</div>
              <div>Actions</div>
            </div>
            <div className="divide-y">
              {filteredProducts.map((product) => {
                const buyingPrice = product.buyingPrice || 0
                const sellingPrice = product.sellingPrice || 0
                const profitMargin = buyingPrice > 0 ? ((sellingPrice - buyingPrice) / buyingPrice) * 100 : 0

                return (
                  <div key={product.id} className="px-4 py-3 grid grid-cols-8 gap-4 items-center">
                    <div className="font-medium">{product.name}</div>
                    <div className="text-sm text-gray-600">{product.category}</div>
                    <div>${(buyingPrice || 0).toFixed(2)}</div>
                    <div>${(sellingPrice || 0).toFixed(2)}</div>
                    <div
                      className={
                        profitMargin > 50 ? "text-green-600" : profitMargin > 20 ? "text-yellow-600" : "text-red-600"
                      }
                    >
                      {isNaN(profitMargin) ? "0.0" : profitMargin.toFixed(1)}%
                    </div>
                    <div>{product.stock || 0}</div>
                    <div>
                      <Badge variant={product.stock > 10 ? "default" : product.stock > 0 ? "secondary" : "destructive"}>
                        {product.stock > 10 ? "In Stock" : product.stock > 0 ? "Low Stock" : "Out of Stock"}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" onClick={() => setRestockingProduct(product)}>
                            <Package className="h-3 w-3" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Restock Product</DialogTitle>
                          </DialogHeader>
                          {restockingProduct && (
                            <div className="space-y-4">
                              <div>
                                <p className="font-medium">{restockingProduct.name}</p>
                                <p className="text-sm text-gray-600">Current Stock: {restockingProduct.stock}</p>
                              </div>
                              <Input
                                type="number"
                                placeholder="Quantity to add"
                                value={restockQuantity}
                                onChange={(e) => setRestockQuantity(e.target.value)}
                                min="1"
                              />
                              <Button onClick={handleRestockProduct} className="w-full">
                                Restock Product
                              </Button>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" onClick={() => setEditingProduct(product)}>
                            <Edit className="h-3 w-3" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Product</DialogTitle>
                          </DialogHeader>
                          {editingProduct && (
                            <div className="space-y-4">
                              <Input
                                value={editingProduct.name}
                                onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                              />
                              <Input
                                type="number"
                                value={editingProduct.buyingPrice}
                                onChange={(e) =>
                                  setEditingProduct({
                                    ...editingProduct,
                                    buyingPrice: Number.parseFloat(e.target.value),
                                  })
                                }
                                step="0.01"
                              />
                              <Input
                                type="number"
                                value={editingProduct.sellingPrice}
                                onChange={(e) =>
                                  setEditingProduct({
                                    ...editingProduct,
                                    sellingPrice: Number.parseFloat(e.target.value),
                                  })
                                }
                                step="0.01"
                              />
                              <Input
                                type="number"
                                value={editingProduct.stock}
                                onChange={(e) =>
                                  setEditingProduct({ ...editingProduct, stock: Number.parseInt(e.target.value) })
                                }
                              />
                              <Input
                                value={editingProduct.category}
                                onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                              />
                              <Button onClick={handleEditProduct} className="w-full">
                                Update Product
                              </Button>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                      <Button size="sm" variant="destructive" onClick={() => handleDeleteProduct(product.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
