"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { API_URL } from "@/lib/api"

export function logout(router: ReturnType<typeof useRouter>) {
  if (typeof window !== "undefined") {
    localStorage.removeItem("sinaps_token")
    localStorage.removeItem("sinaps_agent")
  }
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
    let isMounted = true

    async function verifySession() {
      const token = localStorage.getItem("sinaps_token")
      const agentRaw = localStorage.getItem("sinaps_agent")

      if (!token || !agentRaw) {
        router.replace("/login")
        return
      }

      let agent: any
      try {
        agent = JSON.parse(agentRaw)
      } catch {
        localStorage.removeItem("sinaps_token")
        localStorage.removeItem("sinaps_agent")
        router.replace("/login")
        return
      }

      if (requiredRole && agent?.role !== requiredRole) {
        router.replace("/login")
        return
      }

      // Proactively verify token validity with backend
      // Use AbortController to prevent indefinite hanging if backend is unreachable
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout

        const res = await fetch(`${API_URL}/agents/me`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (!res.ok) {
          localStorage.removeItem("sinaps_token")
          localStorage.removeItem("sinaps_agent")
          router.replace("/login")
          return
        }
      } catch (err) {
        // In case of transient network offline or timeout, allow cached session to prevent lock-out
        console.warn("Could not verify session with backend:", err)
      }

      if (isMounted) {
        setChecked(true)
      }
    }

    verifySession()

    return () => {
      isMounted = false
    }
  }, [router, requiredRole])

  if (!checked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Vérification de la session...</p>
      </div>
    )
  }

  return <>{children}</>
}