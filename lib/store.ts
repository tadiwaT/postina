export interface Product {
  id: string
  name: string
  price: number
  stock: number
  category: string
  barcode?: string
}

export interface Sale {
  id: string
  items: SaleItem[]
  total: number
  timestamp: Date
  employeeName: string
}

export interface SaleItem {
  productId: string
  productName: string
  quantity: number
  price: number
  total: number
}

// Sample products
const initialProducts: Product[] = [
  { id: "1", name: "Coffee", price: 2.5, stock: 100, category: "Beverages" },
  { id: "2", name: "Sandwich", price: 5.99, stock: 50, category: "Food" },
  { id: "3", name: "Water Bottle", price: 1.25, stock: 200, category: "Beverages" },
  { id: "4", name: "Chips", price: 1.99, stock: 75, category: "Snacks" },
  { id: "5", name: "Energy Drink", price: 3.49, stock: 60, category: "Beverages" },
]

class POSStore {
  private products: Product[] = [...initialProducts]
  private sales: Sale[] = []

  getProducts(): Product[] {
    return this.products
  }

  getProduct(id: string): Product | undefined {
    return this.products.find((p) => p.id === id)
  }

  addProduct(product: Omit<Product, "id">): Product {
    const newProduct: Product = {
      ...product,
      id: Date.now().toString(),
    }
    this.products.push(newProduct)
    return newProduct
  }

  updateProduct(id: string, updates: Partial<Product>): Product | null {
    const index = this.products.findIndex((p) => p.id === id)
    if (index === -1) return null

    this.products[index] = { ...this.products[index], ...updates }
    return this.products[index]
  }

  deleteProduct(id: string): boolean {
    const index = this.products.findIndex((p) => p.id === id)
    if (index === -1) return false

    this.products.splice(index, 1)
    return true
  }

  addSale(sale: Omit<Sale, "id">): Sale {
    const newSale: Sale = {
      ...sale,
      id: Date.now().toString(),
    }

    // Update stock
    sale.items.forEach((item) => {
      const product = this.getProduct(item.productId)
      if (product) {
        product.stock -= item.quantity
      }
    })

    this.sales.push(newSale)
    return newSale
  }

  getSales(): Sale[] {
    return this.sales
  }

  getTotalRevenue(): number {
    return this.sales.reduce((total, sale) => total + sale.total, 0)
  }

  getSalesForPeriod(startDate: Date, endDate: Date): Sale[] {
    return this.sales.filter((sale) => sale.timestamp >= startDate && sale.timestamp <= endDate)
  }
}

export const posStore = new POSStore()
