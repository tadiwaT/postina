export interface User {
  username: string
  role: "employee" | "owner"
  name: string
}

const USERS: Record<string, { password: string; role: "employee" | "owner"; name: string }> = {
  employee: { password: "sales25", role: "employee", name: "Employee" },
  "Sir Mariko": { password: "tina001", role: "owner", name: "Sir Mariko" },
}

export function authenticateUser(username: string, password: string): User | null {
  const user = USERS[username]
  if (user && user.password === password) {
    return {
      username,
      role: user.role,
      name: user.name,
    }
  }
  return null
}

export function getCurrentUser(): User | null {
  if (typeof window === "undefined") return null

  const userData = localStorage.getItem("pos_user")
  return userData ? JSON.parse(userData) : null
}

export function setCurrentUser(user: User): void {
  localStorage.setItem("pos_user", JSON.stringify(user))
}

export function logout(): void {
  localStorage.removeItem("pos_user")
}
