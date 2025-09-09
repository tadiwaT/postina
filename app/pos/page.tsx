import { AuthGuard } from "@/components/auth-guard"
import { SimplePOSInterface } from "@/components/simple-pos-interface"

export default function POSPage() {
  return (
    <AuthGuard requiredRole="employee">
      <SimplePOSInterface />
    </AuthGuard>
  )
}
