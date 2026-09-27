"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Mail, LockKeyhole, ArrowLeft, Info } from "lucide-react"
import { toast } from "sonner"
import { loginAgent } from "@/lib/api"

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const formData = new FormData(form)
    const email = (formData.get("email") as string)?.trim()
    const password = formData.get("password") as string

    if (!email || !password) {
      toast.error("Veuillez renseigner tous les champs")
      return
    }

    setLoading(true)
    try {
      const data = await loginAgent(email, password)
      localStorage.setItem("sinaps_token", data.token)
      localStorage.setItem("sinaps_agent", JSON.stringify(data.agent))
      toast.success(`Bienvenue ${data.agent.name}`)
      router.push(data.agent.role === "admin" ? "/admin" : "/agent")
    } catch (error: any) {
      toast.error(error.message || "Identifiants invalides")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-background px-4 py-10 sm:px-6">
      <div className="w-full max-w-[440px] animate-enter">
        <Link
          href="/"
          className="mb-5 inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" /> Retour à l'assistance client
        </Link>
        <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
          <div className="px-6 pb-6 pt-7 sm:px-8">
            <div className="mb-7 flex justify-center">
              <img
                src="/sinaps-logo-light.png"
                alt="SINAPS"
                className="h-7 w-auto object-contain dark:hidden"
              />
              <img
                src="/sinaps-logo-dark.png"
                alt="SINAPS"
                className="h-7 w-auto object-contain hidden dark:block"
              />
            </div>
            <h1 className="text-2xl font-bold">Portail opérateur</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Connectez-vous pour accéder à votre espace agent ou administrateur.</p>
            <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-1.5">
                <Label htmlFor="staff-email" className="text-xs font-semibold">Adresse e-mail professionnelle</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 size-4 text-muted-foreground"/>
                  <Input id="staff-email" name="email" type="email" className="h-10 bg-background pl-9" placeholder="nom@entreprise.fr" required />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="staff-password" className="text-xs font-semibold">Mot de passe</Label>
                <div className="relative">
                  <LockKeyhole className="absolute left-3 top-2.5 size-4 text-muted-foreground"/>
                  <Input id="staff-password" name="password" type="password" className="h-10 bg-background pl-9" placeholder="••••••••" required />
                </div>
              </div>
              <Button type="submit" className="h-10 w-full" disabled={loading}>
                {loading ? "Authentification..." : "Se connecter au portail"}
              </Button>
              <div className="flex items-start gap-2 rounded-md border border-border bg-muted/60 px-3 py-2 text-xs leading-5 text-muted-foreground" role="status">
                <Info className="mt-0.5 size-3.5 shrink-0 text-primary" />
                <span>Connexion reliée au backend SINAPS existant.</span>
              </div>
            </form>
            <p className="mt-5 text-center text-xs text-muted-foreground">Nouvel agent ? <Link href="/agent/signup" className="font-bold text-primary hover:underline">Demander un accès</Link></p>
          </div>
        </section>
      </div>
    </main>
  )
}