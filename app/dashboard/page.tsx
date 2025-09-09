import { AuthGuard } from "@/components/auth-guard"
import { SimpleOwnerDashboard } from "@/components/simple-owner-dashboard"

export default function DashboardPage() {
  return (
    <AuthGuard requiredRole="owner">
      <SimpleOwnerDashboard />
    </AuthGuard>
  )
}
