export async function saveSale(sale: any) {
  try {
    const existingSales = JSON.parse(localStorage.getItem("pos_sales") || "[]")
    const updatedSales = [...existingSales, sale]
    localStorage.setItem("pos_sales", JSON.stringify(updatedSales))
    return true
  } catch (error) {
    console.error("Failed to save sale:", error)
    throw error
  }
}

export async function updateProductInventory(updates: { id: number; quantity: number }[]) {
  try {
    const products = JSON.parse(localStorage.getItem("pos_products") || "[]")
    const updatedProducts = products.map((product: any) => {
      const update = updates.find((u) => u.id === product.id)
      return update ? { ...product, quantity: update.quantity } : product
    })
    localStorage.setItem("pos_products", JSON.stringify(updatedProducts))
    return true
  } catch (error) {
    console.error("Failed to update inventory:", error)
    throw error
  }
}
