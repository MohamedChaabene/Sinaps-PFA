"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export function logout(router: ReturnType<typeof useRouter>) {
  localStorage.removeItem("sinaps_token")
  localStorage.removeItem("sinaps_agent")
  router.push("/login")
}

export function AuthGuard({
  children,
  requiredRole,
}: {
  children: React.ReactNode
  requiredRole?: "admin" | "agent"
}) {
  const router = useRouter()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem("sinaps_token")
    const agentRaw = localStorage.getItem("sinaps_agent")

    if (!token || !agentRaw) {
      router.replace("/login")
      return
    }

    const agent = JSON.parse(agentRaw)
    if (requiredRole && agent.role !== requiredRole) {
      router.replace("/login")
      return
    }

    setChecked(true)
  }, [router, requiredRole])

  if (!checked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Vérification...</p>
      </div>
    )
  }

  return <>{children}</>
}