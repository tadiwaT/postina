interface User {
  id: number
  username: string
  name: string
  userType: "owner" | "employee"
  email: string
}

class AuthService {
  initializeDemoUsers() {
    // Initialize demo users for offline access
    const users = [
      {
        id: 1,
        username: "Sir Mariko",
        name: "Sir Mariko",
        userType: "owner" as const,
        email: "mariko@shop.com",
      },
      {
        id: 2,
        username: "employee",
        name: "Sales Employee",
        userType: "employee" as const,
        email: "employee@shop.com",
      },
    ]
    localStorage.setItem("demo_users", JSON.stringify(users))
  }

  setCurrentUserForOffline(user: User) {
    localStorage.setItem("pos_user", JSON.stringify(user))
  }
}

export const authService = new AuthService()
