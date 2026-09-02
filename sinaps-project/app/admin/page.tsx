import { AdminDashboard } from "@/components/admin/admin-dashboard"
import { AuthGuard } from "@/components/auth-guard"

export default function AdminPage() {
  return (
    <AuthGuard requiredRole="admin">
      <AdminDashboard />
    </AuthGuard>
  )
}