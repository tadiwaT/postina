"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

interface User {
  id: number
  username: string
  name: string
  userType: "owner" | "employee"
  email: string
  role?: "owner" | "employee"
}

interface AuthContextType {
  user: User | null
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  isLoggedIn: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    // Check for existing session
    const savedUser = localStorage.getItem("pos_user")
    if (savedUser) {
      const userData = JSON.parse(savedUser)
      setUser(userData)
      setIsLoggedIn(true)
    }
  }, [])

  const login = async (username: string, password: string): Promise<boolean> => {
    // Hardcoded credentials as requested
    const users = [
      {
        id: 1,
        username: "Sir Mariko",
        password: "tina001",
        name: "Sir Mariko",
        userType: "owner" as const,
        email: "mariko@shop.com",
        role: "owner" as const,
      },
      {
        id: 2,
        username: "employee",
        password: "sales25",
        name: "Sales Employee",
        userType: "employee" as const,
        email: "employee@shop.com",
        role: "employee" as const,
      },
    ]

    const foundUser = users.find((u) => u.username === username && u.password === password)

    if (foundUser) {
      const { password: _, ...userWithoutPassword } = foundUser
      setUser(userWithoutPassword)
      setIsLoggedIn(true)
      localStorage.setItem("pos_user", JSON.stringify(userWithoutPassword))
      return true
    }

    return false
  }

  const logout = () => {
    setUser(null)
    setIsLoggedIn(false)
    localStorage.removeItem("pos_user")
  }

  return <AuthContext.Provider value={{ user, login, logout, isLoggedIn }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
