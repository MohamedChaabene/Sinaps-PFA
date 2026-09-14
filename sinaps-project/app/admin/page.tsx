import type { Metadata } from "next"
import { AdminDashboard } from "@/components/admin/admin-dashboard"
import { AuthGuard } from "@/components/auth-guard"

export const metadata: Metadata = {
  title: "Console d'administration — SINAPS Support",
  description: "Supervision des flux de support, indicateurs SLA et gestion des conseillers.",
}

export default function AdminPage() {
  return (
    <AuthGuard requiredRole="admin">
      <AdminDashboard />
    </AuthGuard>
  )
}