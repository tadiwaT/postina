export interface Product {
  id: number
  name: string
  buyingPrice: number // Added buying price for profit analysis
  sellingPrice: number // Added selling price separate from buying price
  stock: number
  category: string
}

export interface Sale {
  id: number
  items: { productId: number; quantity: number; price: number; name: string; buyingPrice: number }[] // Added buying price to track profit per item
  total: number
  totalProfit: number // Added total profit calculation
  date: string
  employeeName: string
  isOffline?: boolean // Added to distinguish offline sales
}

const defaultProducts: Product[] = [
  { id: 1, name: "Coffee", buyingPrice: 1.0, sellingPrice: 2.5, stock: 100, category: "Beverages" },
  { id: 2, name: "Sandwich", buyingPrice: 3.0, sellingPrice: 5.99, stock: 50, category: "Food" },
  { id: 3, name: "Chips", buyingPrice: 0.8, sellingPrice: 1.99, stock: 75, category: "Snacks" },
  { id: 4, name: "Soda", buyingPrice: 0.6, sellingPrice: 1.5, stock: 80, category: "Beverages" },
]

export function getProducts(): Product[] {
  const products = localStorage.getItem("pos_products")
  return products ? JSON.parse(products) : defaultProducts
}

export function saveProducts(products: Product[]) {
  localStorage.setItem("pos_products", JSON.stringify(products))
}

export function getSales(): Sale[] {
  const sales = localStorage.getItem("pos_sales")
  return sales ? JSON.parse(sales) : []
}

export function saveSale(sale: Omit<Sale, "id" | "totalProfit">) {
  const sales = getSales()
  const products = getProducts()

  // Calculate total profit
  const totalProfit = sale.items.reduce((profit, item) => {
    const product = products.find((p) => p.id === item.productId)
    if (product) {
      return profit + (product.sellingPrice - product.buyingPrice) * item.quantity
    }
    return profit
  }, 0)

  const newSale = { ...sale, id: Date.now(), totalProfit }
  sales.push(newSale)
  localStorage.setItem("pos_sales", JSON.stringify(sales))

  // Update stock
  sale.items.forEach((item) => {
    updateProductStock(item.productId, -item.quantity)
  })

  return newSale
}

export function addProduct(product: Omit<Product, "id">) {
  const products = getProducts()
  const newProduct = { ...product, id: Date.now() }
  products.push(newProduct)
  saveProducts(products)
  return newProduct
}

export function updateProduct(id: number, updates: Partial<Product>) {
  const products = getProducts()
  const index = products.findIndex((p) => p.id === id)
  if (index !== -1) {
    products[index] = { ...products[index], ...updates }
    saveProducts(products)
  }
}

export function deleteProduct(id: number) {
  const products = getProducts().filter((p) => p.id !== id)
  saveProducts(products)
}

function updateProductStock(productId: number, stockChange: number) {
  const products = getProducts()
  const index = products.findIndex((p) => p.id === productId)
  if (index !== -1) {
    products[index].stock += stockChange
    saveProducts(products)
  }
}

export function restockProduct(id: number, quantity: number) {
  const products = getProducts()
  const index = products.findIndex((p) => p.id === id)
  if (index !== -1) {
    products[index].stock += quantity
    saveProducts(products)
  }
}

export function exportProductsToCSV(): string {
  const products = getProducts()
  const headers = ["ID", "Name", "Category", "Buying Price", "Selling Price", "Stock", "Profit Margin"]
  const rows = products.map((p) => [
    p.id,
    p.name,
    p.category,
    p.buyingPrice.toFixed(2),
    p.sellingPrice.toFixed(2),
    p.stock,
    (((p.sellingPrice - p.buyingPrice) / p.buyingPrice) * 100).toFixed(2) + "%",
  ])

  return [headers, ...rows].map((row) => row.join(",")).join("\n")
}

export function exportSalesToCSV(month?: string): string {
  const sales = getSales()
  const offlineSales = getOfflineSales()
  const allSales = [...sales, ...offlineSales]
  const filteredSales = month ? allSales.filter((s) => s.date.startsWith(month)) : allSales

  const headers = ["Sale ID", "Date", "Employee", "Total", "Profit", "Items"]
  const rows = filteredSales.map((s) => [
    s.id,
    s.date,
    s.employeeName,
    s.total.toFixed(2),
    s.totalProfit?.toFixed(2) || "0.00",
    s.items.map((i) => `${i.name} x${i.quantity}`).join("; "),
  ])

  return [headers, ...rows].map((row) => row.join(",")).join("\n")
}

export function saveOfflineSale(sale: Omit<Sale, "id" | "totalProfit">) {
  const offlineSales = getOfflineSales()
  const products = getProducts()

  // Calculate total profit
  const totalProfit = sale.items.reduce((profit, item) => {
    const product = products.find((p) => p.id === item.productId)
    if (product) {
      return profit + (product.sellingPrice - product.buyingPrice) * item.quantity
    }
    return profit
  }, 0)

  const newSale = { ...sale, id: Date.now(), totalProfit, isOffline: true }
  offlineSales.push(newSale)
  localStorage.setItem("pos_offline_sales", JSON.stringify(offlineSales))

  // Update stock locally for offline sales
  sale.items.forEach((item) => {
    updateProductStock(item.productId, -item.quantity)
  })

  return newSale
}

export function getOfflineSales(): (Sale & { isOffline: boolean })[] {
  const offlineSales = localStorage.getItem("pos_offline_sales")
  return offlineSales ? JSON.parse(offlineSales) : []
}

export function syncOfflineSales() {
  const offlineSales = getOfflineSales()
  const regularSales = getSales()

  // Move offline sales to regular sales
  offlineSales.forEach((sale) => {
    const { isOffline, ...regularSale } = sale
    regularSales.push(regularSale)
  })

  localStorage.setItem("pos_sales", JSON.stringify(regularSales))
  localStorage.removeItem("pos_offline_sales")

  return offlineSales.length
}

export function isOnline(): boolean {
  return navigator.onLine
}
