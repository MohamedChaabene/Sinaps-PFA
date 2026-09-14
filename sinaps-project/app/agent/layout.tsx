import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Console Agent — SINAPS Support",
  description: "File d'attente et messagerie en direct pour les conseillers de support SINAPS.",
}

export default function AgentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
