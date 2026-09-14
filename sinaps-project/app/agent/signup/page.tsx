import type { Metadata } from "next"
import { AgentSignupForm } from "@/components/agent/agent-signup-form"

export const metadata: Metadata = {
  title: "Demande d'accès Agent — SINAPS Support",
  description: "Formulaire d'inscription et de demande d'accès pour les conseillers SINAPS.",
}

export default function AgentSignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center overflow-y-auto bg-background p-4 py-10">
      <AgentSignupForm />
    </div>
  )
}