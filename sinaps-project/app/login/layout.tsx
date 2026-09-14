import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Connexion Opérateur — SINAPS Support",
  description: "Portail de connexion pour les agents et administrateurs du support SINAPS.",
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
