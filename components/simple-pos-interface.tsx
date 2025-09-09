"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  getProducts,
  saveSale,
  saveOfflineSale,
  syncOfflineSales,
  getOfflineSales,
  isOnline,
  type Product,
} from "@/lib/simple-store"
import { getCurrentUser, logout } from "@/lib/simple-auth"
import { Minus, Plus, ShoppingCart, Trash2, LogOut, Search, Wifi, WifiOff, CloudUpload } from "lucide-react"

interface CartItem {
  product: Product
  quantity: number
}

export function SimplePOSInterface() {
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedProductId, setSelectedProductId] = useState<string>("")
  const [amountPaid, setAmountPaid] = useState<string>("")
  const [showChange, setShowChange] = useState(false)
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [isOffline, setIsOffline] = useState(false)
  const [offlineSalesCount, setOfflineSalesCount] = useState(0)
  const [showSyncSuccess, setShowSyncSuccess] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const allProducts = getProducts()
    setProducts(allProducts)
    setFilteredProducts(allProducts)

    setIsOffline(!isOnline())
    setOfflineSalesCount(getOfflineSales().length)
  }, [])

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false)
      // Auto-sync when coming back online
      if (getOfflineSales().length > 0) {
        handleSyncOfflineSales()
      }
    }

    const handleOffline = () => {
      setIsOffline(true)
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  useEffect(() => {
    const filtered = products.filter(
      (product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    setFilteredProducts(filtered)
  }, [searchTerm, products])

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  const handleSyncOfflineSales = () => {
    const syncedCount = syncOfflineSales()
    if (syncedCount > 0) {
      setOfflineSalesCount(0)
      setShowSyncSuccess(true)
      setTimeout(() => setShowSyncSuccess(false), 3000)
    }
  }

  const addToCart = (productId: string) => {
    const product = products.find((p) => p.id === Number.parseInt(productId))
    if (!product || product.stock <= 0) return

    const existingItem = cart.find((item) => item.product.id === product.id)
    if (existingItem) {
      if (existingItem.quantity < product.stock) {
        setCart(cart.map((item) => (item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)))
      }
    } else {
      setCart([...cart, { product, quantity: 1 }])
    }
    setSelectedProductId("")
  }

  const updateQuantity = (productId: number, change: number) => {
    setCart(
      cart
        .map((item) => {
          if (item.product.id === productId) {
            const newQuantity = item.quantity + change
            if (newQuantity <= 0) {
              return null
            }
            if (newQuantity > item.product.stock) {
              return item
            }
            return { ...item, quantity: newQuantity }
          }
          return item
        })
        .filter(Boolean) as CartItem[],
    )
  }

  const removeFromCart = (productId: number) => {
    setCart(cart.filter((item) => item.product.id !== productId))
  }

  const total = cart.reduce((sum, item) => sum + (item.product.sellingPrice || 0) * item.quantity, 0)
  const change = amountPaid ? Number.parseFloat(amountPaid) - total : 0

  const completeSale = () => {
    if (cart.length === 0) return
    if (!amountPaid || Number.parseFloat(amountPaid) < total) return

    const user = getCurrentUser()
    if (!user) return

    const sale = {
      items: cart.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
        price: item.product.sellingPrice,
        name: item.product.name,
        buyingPrice: item.product.buyingPrice,
      })),
      total,
      date: new Date().toISOString().split("T")[0],
      employeeName: user.username,
    }

    if (isOffline) {
      saveOfflineSale(sale)
      setOfflineSalesCount((prev) => prev + 1)
    } else {
      saveSale(sale)
    }

    setCart([])
    setAmountPaid("")
    setShowChange(true)
    setProducts(getProducts())

    setTimeout(() => setShowChange(false), 3000)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Employee POS Terminal</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {isOffline ? (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <WifiOff className="h-3 w-3" />
                  Offline
                </Badge>
              ) : (
                <Badge variant="default" className="flex items-center gap-1">
                  <Wifi className="h-3 w-3" />
                  Online
                </Badge>
              )}

              {offlineSalesCount > 0 && !isOffline && (
                <Button onClick={handleSyncOfflineSales} variant="outline" size="sm">
                  <CloudUpload className="h-4 w-4 mr-2" />
                  Sync {offlineSalesCount} Sales
                </Button>
              )}
            </div>

            <Button onClick={handleLogout} variant="outline" className="flex items-center gap-2 bg-transparent">
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>

        {isOffline && (
          <Alert className="mb-6 border-yellow-500 bg-yellow-50">
            <WifiOff className="h-4 w-4" />
            <AlertDescription>
              You're currently offline. Sales will be saved locally and synced when connection is restored.
              {offlineSalesCount > 0 && ` (${offlineSalesCount} offline sales pending)`}
            </AlertDescription>
          </Alert>
        )}

        {showSyncSuccess && (
          <Alert className="mb-6 border-green-500 bg-green-50">
            <CloudUpload className="h-4 w-4" />
            <AlertDescription className="text-green-700">
              Offline sales have been successfully synced to the database!
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Product Selection */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Select Products
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search products..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a product to add to cart" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredProducts.map((product) => (
                        <SelectItem key={product.id} value={product.id.toString()} disabled={product.stock <= 0}>
                          <div className="flex items-center justify-between w-full">
                            <span>{product.name}</span>
                            <div className="flex items-center gap-2 ml-4">
                              <span className="font-medium">${(product.sellingPrice || 0).toFixed(2)}</span>
                              <Badge
                                variant={
                                  product.stock > 10 ? "default" : product.stock > 0 ? "secondary" : "destructive"
                                }
                              >
                                Stock: {product.stock}
                              </Badge>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button onClick={() => addToCart(selectedProductId)} disabled={!selectedProductId} className="w-full">
                    Add to Cart
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Cart */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Cart ({cart.length} items)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cart.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">Cart is empty</p>
                ) : (
                  <>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {cart.map((item) => (
                        <div key={item.product.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{item.product.name}</p>
                            <p className="text-xs text-gray-600">${(item.product.sellingPrice || 0).toFixed(2)} each</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button size="sm" variant="outline" onClick={() => updateQuantity(item.product.id, -1)}>
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="mx-2 min-w-[2rem] text-center">{item.quantity}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateQuantity(item.product.id, 1)}
                              disabled={item.quantity >= item.product.stock}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => removeFromCart(item.product.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total:</span>
                        <span>${(total || 0).toFixed(2)}</span>
                      </div>

                      <Input
                        type="number"
                        placeholder="Amount paid"
                        value={amountPaid}
                        onChange={(e) => setAmountPaid(e.target.value)}
                        step="0.01"
                        min="0"
                      />

                      {amountPaid && Number.parseFloat(amountPaid) >= total && (
                        <div className="flex justify-between text-green-600 font-medium">
                          <span>Change:</span>
                          <span>${(change || 0).toFixed(2)}</span>
                        </div>
                      )}

                      <Button
                        onClick={completeSale}
                        disabled={cart.length === 0 || !amountPaid || Number.parseFloat(amountPaid) < total}
                        className="w-full"
                        size="lg"
                      >
                        {isOffline ? "Complete Sale (Offline)" : "Complete Sale"}
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {showChange && (
              <Card className="mt-4 border-green-500 bg-green-50">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-green-700 font-medium">Sale Completed!</p>
                    <p className="text-green-600">Change: ${(change || 0).toFixed(2)}</p>
                    {isOffline && (
                      <p className="text-sm text-yellow-600 mt-1">Sale saved offline - will sync when online</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
