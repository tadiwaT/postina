"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  AlertCircle,
  WifiOff,
  LogOut,
  Package,
  Search,
  ArrowUpDown,
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { saveSale, updateProductInventory } from "@/services/sync-service"
import { useSync } from "@/contexts/sync-context"
import { useAuth } from "@/contexts/auth-context"
import { authService } from "@/services/auth-service"

interface Product {
  id: number
  name: string
  price: number
  quantity: number
  cost_price: number
}

interface CartItem {
  product: Product
  quantity: number
}

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

type SortField = "name" | "price" | "quantity"
type SortDirection = "asc" | "desc"

export const dynamic = "force-dynamic"

export default function EmployeeSalesPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { isOnline } = useSync()
  const { user, logout, isLoggedIn } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [sortField, setSortField] = useState<SortField>("name")
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")
  const [paymentMethod, setPaymentMethod] = useState<string>("cash")
  const [paymentAmount, setPaymentAmount] = useState<string>("")
  const [error, setError] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [change, setChange] = useState<number>(0)

  // Handle auto-login for offline mode
  useEffect(() => {
    const handleOfflineAccess = async () => {
      // If we're offline and not logged in, auto-login as employee
      if (!isOnline && !isLoggedIn) {
        try {
          // Initialize demo users to ensure they exist
          authService.initializeDemoUsers()

          // Set the current user to employee without password verification
          const employeeUser = {
            id: 2,
            username: "employee",
            name: "Sales Employee",
            userType: "employee" as const,
            email: "employee@shop.com",
          }

          // Manually set the current user
          authService.setCurrentUserForOffline(employeeUser)

          // Force a page refresh to update auth context
          if (sessionStorage.getItem("offline_redirect") === "true") {
            sessionStorage.removeItem("offline_redirect")
            window.location.reload()
          }
        } catch (error) {
          console.error("Auto-login failed:", error)
        }
      }
    }

    handleOfflineAccess()
  }, [isOnline, isLoggedIn])

  // Redirect non-employees
  useEffect(() => {
    if (user && user.userType !== "employee") {
      router.push("/owner-dashboard")
    }
  }, [user, router])

  useEffect(() => {
    // Load products from localStorage
    const loadProducts = () => {
      try {
        const storedProducts = localStorage.getItem("pos_products")
        if (storedProducts) {
          setProducts(JSON.parse(storedProducts))
        } else {
          // Initialize with sample products if none exist
          const sampleProducts = [
            { id: 1, name: "Sample Product 1", price: 10.99, quantity: 50, cost_price: 5.5 },
            { id: 2, name: "Sample Product 2", price: 25.99, quantity: 30, cost_price: 12.0 },
          ]
          localStorage.setItem("pos_products", JSON.stringify(sampleProducts))
          setProducts(sampleProducts)
        }
      } catch (error) {
        console.error("Error loading products:", error)
        toast({
          title: "Error",
          description: "Failed to load products",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadProducts()
  }, [toast])

  const filteredAndSortedProducts = products
    .filter((product) => product.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      let aValue = a[sortField]
      let bValue = b[sortField]

      if (typeof aValue === "string") {
        aValue = aValue.toLowerCase()
        bValue = (bValue as string).toLowerCase()
      }

      if (sortDirection === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const addToCart = (product: Product) => {
    const existingCartItem = cart.find((item) => item.product.id === product.id)

    if (existingCartItem) {
      if (existingCartItem.quantity >= product.quantity) {
        setError(`Cannot add more ${product.name}. Maximum stock reached.`)
        return
      }

      setCart((prevCart) =>
        prevCart.map((item) => (item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)),
      )
    } else {
      setCart((prevCart) => [...prevCart, { product, quantity: 1 }])
    }

    setError("")
    toast({
      title: "Product Added",
      description: `${product.name} added to cart`,
    })
  }

  const removeFromCart = (productId: number) => {
    setCart((prevCart) => prevCart.filter((item) => item.product.id !== productId))
  }

  const updateQuantity = (productId: number, newQuantity: number) => {
    const product = products.find((p) => p.id === productId)

    if (!product) return

    if (newQuantity <= 0) {
      removeFromCart(productId)
      return
    }

    if (newQuantity > product.quantity) {
      setError(`Cannot add more ${product.name}. Maximum stock reached.`)
      return
    }

    setCart((prevCart) =>
      prevCart.map((item) => (item.product.id === productId ? { ...item, quantity: newQuantity } : item)),
    )
    setError("")
  }

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + item.product.price * item.quantity, 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (cart.length === 0) {
      setError("Your cart is empty. Please add products before checking out.")
      return
    }

    const total = calculateTotal()

    if (paymentMethod === "cash" && (!paymentAmount || Number.parseFloat(paymentAmount) < total)) {
      setError("Payment amount must be greater than or equal to the total.")
      return
    }

    setIsProcessing(true)

    try {
      // 1. Prepare product updates for inventory
      const productUpdates = cart.map((item) => ({
        id: item.product.id,
        quantity: item.product.quantity - item.quantity,
      }))

      // 2. Prepare the sale data
      const existingSalesJSON = localStorage.getItem("pos_sales")
      const existingSales: Sale[] = existingSalesJSON ? JSON.parse(existingSalesJSON) : []

      // Generate a new ID
      const maxId = existingSales.length > 0 ? Math.max(...existingSales.map((s) => s.id)) : 0
      const newId = maxId + 1

      const newSale: Sale = {
        id: newId,
        date: new Date().toISOString(),
        products: cart.map((item) => ({
          id: item.product.id,
          name: item.product.name,
          quantity: item.quantity,
          price: item.product.price,
          total: item.product.price * item.quantity,
        })),
        payment_method: paymentMethod,
        total_price: total,
      }

      // 3. Update inventory
      await updateProductInventory(productUpdates)

      // 4. Save the sale
      await saveSale(newSale)

      if (paymentMethod === "cash") {
        setChange(Number.parseFloat(paymentAmount) - total)
      }

      // Show success dialog
      setShowSuccessDialog(true)
    } catch (error) {
      console.error("Error processing sale:", error)
      setError("Failed to process sale. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSuccessClose = () => {
    setShowSuccessDialog(false)
    setCart([])
    setPaymentMethod("cash")
    setPaymentAmount("")
    setChange(0)
  }

  const handleLogout = () => {
    logout()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Package className="h-12 w-12 mx-auto mb-4 animate-spin" />
          <p>Loading sales terminal...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <Package className="h-8 w-8 text-primary" />
              <h1 className="text-xl font-semibold">Sales Terminal</h1>
            </div>
            <div className="flex items-center gap-4">
              {!isOnline && (
                <div className="flex items-center gap-2 text-amber-600">
                  <WifiOff className="h-4 w-4" />
                  <span className="text-sm">Offline</span>
                </div>
              )}
              <div className="text-sm text-muted-foreground">Welcome, {user?.name || "Employee"}</div>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit}>
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Products Section */}
            <Card>
              <CardHeader>
                <CardTitle>Products</CardTitle>
                <CardDescription>Browse and add products to the current sale</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {!isOnline && (
                  <Alert className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
                    <WifiOff className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-600">
                      You are currently offline. This sale will be synced when you reconnect.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="search">Search Products</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Search by product name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>
                          <Button
                            variant="ghost"
                            onClick={() => handleSort("name")}
                            className="h-auto p-0 font-semibold hover:bg-transparent"
                          >
                            Product Name
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button
                            variant="ghost"
                            onClick={() => handleSort("price")}
                            className="h-auto p-0 font-semibold hover:bg-transparent"
                          >
                            Price
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button
                            variant="ghost"
                            onClick={() => handleSort("quantity")}
                            className="h-auto p-0 font-semibold hover:bg-transparent"
                          >
                            Stock
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                          </Button>
                        </TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAndSortedProducts.length > 0 ? (
                        filteredAndSortedProducts.map((product) => (
                          <TableRow key={product.id} className={product.quantity === 0 ? "opacity-50" : ""}>
                            <TableCell className="font-medium">{product.name}</TableCell>
                            <TableCell>${product.price.toFixed(2)}</TableCell>
                            <TableCell>
                              <span
                                className={`font-medium ${product.quantity <= 5 ? "text-red-500" : product.quantity <= 10 ? "text-amber-500" : "text-green-500"}`}
                              >
                                {product.quantity}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => addToCart(product)}
                                disabled={product.quantity === 0}
                                className="w-full"
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Add to Cart
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                            {searchTerm ? "No products found matching your search." : "No products available."}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Cart Section */}
            <Card>
              <CardHeader>
                <CardTitle>Shopping Cart</CardTitle>
                <CardDescription>Review items and complete the transaction</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cart.length > 0 ? (
                        cart.map((item) => (
                          <TableRow key={item.product.id}>
                            <TableCell className="font-medium">{item.product.name}</TableCell>
                            <TableCell>${item.product.price.toFixed(2)}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8 bg-transparent"
                                  onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
                                <span className="w-12 text-center font-medium">{item.quantity}</span>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8 bg-transparent"
                                  onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">
                              ${(item.product.price * item.quantity).toFixed(2)}
                            </TableCell>
                            <TableCell>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-500 hover:text-red-700"
                                onClick={() => removeFromCart(item.product.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                            No products added to cart.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paymentMethod">Payment Method</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger id="paymentMethod">
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="credit">Credit Card</SelectItem>
                      <SelectItem value="debit">Debit Card</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {paymentMethod === "cash" && (
                  <div className="space-y-2">
                    <Label htmlFor="paymentAmount">Payment Amount</Label>
                    <Input
                      id="paymentAmount"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Enter amount received"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className="text-lg"
                    />
                  </div>
                )}

                <div className="rounded-lg border bg-muted/50 p-6 space-y-3">
                  <div className="flex justify-between text-base">
                    <span>Subtotal:</span>
                    <span className="font-medium">${calculateTotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-base">
                    <span>Tax:</span>
                    <span className="font-medium">$0.00</span>
                  </div>
                  <div className="flex justify-between font-bold text-xl pt-3 border-t">
                    <span>Total:</span>
                    <span>${calculateTotal().toFixed(2)}</span>
                  </div>

                  {paymentMethod === "cash" && paymentAmount && (
                    <>
                      <div className="flex justify-between text-base pt-3 border-t">
                        <span>Amount Received:</span>
                        <span className="font-medium">${Number.parseFloat(paymentAmount).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-lg font-semibold text-green-600">
                        <span>Change:</span>
                        <span>${Math.max(0, Number.parseFloat(paymentAmount) - calculateTotal()).toFixed(2)}</span>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  type="submit"
                  className="w-full text-lg py-6"
                  disabled={isProcessing || cart.length === 0}
                  size="lg"
                >
                  {isProcessing ? (
                    "Processing..."
                  ) : (
                    <>
                      <ShoppingCart className="mr-2 h-5 w-5" /> Complete Sale
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </form>

        <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Sale Completed Successfully!</AlertDialogTitle>
              <AlertDialogDescription>
                The sale has been processed and recorded in the system.
                {!isOnline && (
                  <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-md">
                    <div className="flex items-center gap-2 text-amber-600">
                      <WifiOff className="h-4 w-4" />
                      <span className="text-sm">You are offline. This sale will be synced when you reconnect.</span>
                    </div>
                  </div>
                )}
              </AlertDialogDescription>
              {paymentMethod === "cash" && change > 0 && (
                <div className="mt-4 p-4 bg-green-50 dark:bg-green-950/30 rounded-md border border-green-200 dark:border-green-800">
                  <div className="text-lg font-semibold text-green-700 dark:text-green-400">
                    Change due: ${change.toFixed(2)}
                  </div>
                </div>
              )}
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction onClick={handleSuccessClose}>Continue</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  )
}
