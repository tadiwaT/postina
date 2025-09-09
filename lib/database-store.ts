import { createClient } from "./supabase/client"

export interface Product {
  id: string
  name: string
  category: string
  buying_price: number
  selling_price: number
  stock: number
  created_at?: string
  updated_at?: string
}

export interface Sale {
  id: string
  employee_name: string
  total_amount: number
  payment_received: number
  change_given: number
  items: Array<{
    product: Product
    quantity: number
  }>
  created_at?: string
}

export interface POSUser {
  id: string
  username: string
  role: "employee" | "owner"
}

class DatabaseStore {
  private supabase = createClient()

  // Authentication
  async authenticateUser(username: string, password: string): Promise<POSUser | null> {
    const { data, error } = await this.supabase
      .from("pos_users")
      .select("id, username, role")
      .eq("username", username)
      .eq("password_hash", password)
      .single()

    if (error || !data) return null
    return data
  }

  // Products
  async getProducts(): Promise<Product[]> {
    const { data, error } = await this.supabase.from("products").select("*").order("name")

    if (error) {
      console.error("Error fetching products:", error)
      return []
    }
    return data || []
  }

  async addProduct(product: Omit<Product, "id" | "created_at" | "updated_at">): Promise<Product | null> {
    const { data, error } = await this.supabase.from("products").insert([product]).select().single()

    if (error) {
      console.error("Error adding product:", error)
      return null
    }
    return data
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product | null> {
    const { data, error } = await this.supabase
      .from("products")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error updating product:", error)
      return null
    }
    return data
  }

  async deleteProduct(id: string): Promise<boolean> {
    const { error } = await this.supabase.from("products").delete().eq("id", id)

    if (error) {
      console.error("Error deleting product:", error)
      return false
    }
    return true
  }

  async restockProduct(id: string, quantity: number): Promise<boolean> {
    const { data: product } = await this.supabase.from("products").select("stock").eq("id", id).single()

    if (!product) return false

    const { error } = await this.supabase
      .from("products")
      .update({
        stock: product.stock + quantity,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)

    return !error
  }

  // Sales
  async getSales(): Promise<Sale[]> {
    const { data, error } = await this.supabase.from("sales").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching sales:", error)
      return []
    }
    return data || []
  }

  async addSale(sale: Omit<Sale, "id" | "created_at">): Promise<Sale | null> {
    const { data, error } = await this.supabase.from("sales").insert([sale]).select().single()

    if (error) {
      console.error("Error adding sale:", error)
      return null
    }

    // Update product stock
    for (const item of sale.items) {
      await this.supabase
        .from("products")
        .update({
          stock: Math.max(0, item.product.stock - item.quantity),
          updated_at: new Date().toISOString(),
        })
        .eq("id", item.product.id)
    }

    return data
  }

  // Offline sales management
  async syncOfflineSales(): Promise<void> {
    const offlineSales = JSON.parse(localStorage.getItem("offlineSales") || "[]")

    for (const sale of offlineSales) {
      await this.addSale(sale)
    }

    localStorage.removeItem("offlineSales")
  }

  // Analytics
  async getMonthlyStats(year: number, month: number) {
    const startDate = new Date(year, month - 1, 1).toISOString()
    const endDate = new Date(year, month, 0, 23, 59, 59).toISOString()

    const { data: sales, error } = await this.supabase
      .from("sales")
      .select("*")
      .gte("created_at", startDate)
      .lte("created_at", endDate)

    if (error) return null

    const totalSales = sales?.reduce((sum, sale) => sum + sale.total_amount, 0) || 0
    const totalTransactions = sales?.length || 0

    // Calculate profit (need to get product costs from items)
    let totalProfit = 0
    for (const sale of sales || []) {
      for (const item of sale.items) {
        const profit = (item.product.selling_price - item.product.buying_price) * item.quantity
        totalProfit += profit
      }
    }

    return {
      totalSales,
      totalTransactions,
      totalProfit,
      averageTransaction: totalTransactions > 0 ? totalSales / totalTransactions : 0,
    }
  }
}

export const databaseStore = new DatabaseStore()
