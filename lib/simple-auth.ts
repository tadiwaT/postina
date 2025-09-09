export interface User {
  username: string
  name: string
  role: "owner" | "employee"
}

export const users = [
  { username: "Sir Mariko", password: "tina001", name: "Sir Mariko", role: "owner" as const },
  { username: "employee", password: "sales25", name: "Sales Employee", role: "employee" as const },
]

export function login(username: string, password: string): User | null {
  const user = users.find((u) => u.username === username && u.password === password)
  if (user) {
    const { password: _, ...userWithoutPassword } = user
    localStorage.setItem("pos_user", JSON.stringify(userWithoutPassword))
    return userWithoutPassword
  }
  return null
}

export function logout() {
  localStorage.removeItem("pos_user")
}

export function getCurrentUser(): User | null {
  if (typeof window === "undefined") return null
  const user = localStorage.getItem("pos_user")
  return user ? JSON.parse(user) : null
}
