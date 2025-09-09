export interface Product {
  id: number
  name: string
  price: number
  cost_price: number
  quantity: number
  reorder_point: number
  supplier: string
  category: string
  created_at: string
}

export interface Sale {
  id: number
  created_at: string
  user_name: string
  total: number
  payment_method: string
  products: {
    id: number
    name: string
    quantity: number
    price: number
    total: number
  }[]
}

class DataService {
  private listeners: (() => void)[] = []

  addListener(callback: () => void) {
    this.listeners.push(callback)
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback)
    }
  }

  private notifyListeners() {
    this.listeners.forEach((callback) => callback())
  }

  getAllProducts(): Product[] {
    const stored = localStorage.getItem("pos_products")
    if (!stored) {
      const defaultProducts: Product[] = [
        {
          id: 1,
          name: "Coffee",
          price: 4.99,
          cost_price: 2.5,
          quantity: 100,
          reorder_point: 20,
          supplier: "Coffee Co.",
          category: "Beverages",
          created_at: new Date().toISOString(),
        },
        {
          id: 2,
          name: "Sandwich",
          price: 8.99,
          cost_price: 4.0,
          quantity: 50,
          reorder_point: 10,
          supplier: "Food Supply",
          category: "Food",
          created_at: new Date().toISOString(),
        },
      ]
      localStorage.setItem("pos_products", JSON.stringify(defaultProducts))
      return defaultProducts
    }
    return JSON.parse(stored)
  }

  getAllSales(): Sale[] {
    const stored = localStorage.getItem("pos_sales")
    return stored ? JSON.parse(stored) : []
  }

  searchProducts(query: string): Product[] {
    const products = this.getAllProducts()
    const searchTerm = query.toLowerCase()
    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(searchTerm) ||
        product.supplier.toLowerCase().includes(searchTerm) ||
        product.category.toLowerCase().includes(searchTerm),
    )
  }

  deleteProduct(id: number): boolean {
    try {
      const products = this.getAllProducts()
      const filtered = products.filter((p) => p.id !== id)
      localStorage.setItem("pos_products", JSON.stringify(filtered))
      this.notifyListeners()
      return true
    } catch {
      return false
    }
  }

  exportProductsToCSV(): string {
    const products = this.getAllProducts()
    const headers = ["ID", "Name", "Price", "Cost Price", "Quantity", "Supplier", "Category"]
    const rows = products.map((p) => [p.id, p.name, p.price, p.cost_price, p.quantity, p.supplier, p.category])

    const csvContent = [headers, ...rows].map((row) => row.map((field) => `"${field}"`).join(",")).join("\n")

    return csvContent
  }

  getDashboardStats() {
    const products = this.getAllProducts()
    const sales = this.getAllSales()
    const today = new Date().toDateString()

    return {
      totalProducts: products.length,
      lowStockProducts: products.filter((p) => p.quantity <= p.reorder_point).length,
      totalSales: sales.reduce((sum, sale) => sum + sale.total, 0),
      todaySales: sales
        .filter((sale) => new Date(sale.created_at).toDateString() === today)
        .reduce((sum, sale) => sum + sale.total, 0),
      totalInventoryValue: products.reduce((sum, p) => sum + p.price * p.quantity, 0),
    }
  }
}

export const dataService = new DataService()

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount)
}
