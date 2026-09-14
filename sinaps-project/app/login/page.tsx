"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Mail, Lock, ArrowLeft, ShieldCheck, Headphones, Loader2 } from "lucide-react"
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
    <div className="relative flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-background via-background/95 to-primary/10 p-4 sm:p-6 overflow-hidden">
      {/* Decorative background glow elements */}
      <div className="pointer-events-none absolute -top-40 -left-40 size-96 rounded-full bg-primary/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 size-96 rounded-full bg-blue-500/10 blur-3xl" />

      <div className="relative w-full max-w-md">
        {/* Return to client chat link */}
        <div className="mb-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-3.5" />
            <span>Retour au chat d&apos;assistance client</span>
          </Link>
        </div>

        <Card className="w-full border-border/80 bg-card/95 shadow-xl shadow-primary/5 backdrop-blur-md">
          <CardHeader className="gap-3 px-6 pb-4 pt-7 sm:px-8 sm:pt-8 text-center">
            <div className="mx-auto flex items-center justify-center mb-1">
              <img
                src="/sinaps-logo-light.png"
                alt="SINAPS"
                className="h-10 sm:h-12 w-auto object-contain dark:hidden"
              />
              <img
                src="/sinaps-logo-dark.png"
                alt="SINAPS"
                className="h-10 sm:h-12 w-auto object-contain hidden dark:block"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Portail Opérateur
              </h1>
              <CardDescription className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Connectez-vous pour accéder à votre console d&apos;agent de support ou d&apos;administration.
              </CardDescription>
            </div>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="flex flex-col gap-4 px-6 pb-4 sm:px-8 sm:pb-6">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email" className="text-xs font-semibold text-foreground">
                  Adresse e-mail professionnelle
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 size-4 text-muted-foreground/70" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="your@email.com"
                    className="pl-9 rounded-xl border-input/80 bg-background/80 text-sm focus-visible:ring-primary/20"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="password" className="text-xs font-semibold text-foreground">
                  Mot de passe
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 size-4 text-muted-foreground/70" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-9 rounded-xl border-input/80 bg-background/80 text-sm focus-visible:ring-primary/20"
                    required
                  />
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-3 px-6 pb-7 pt-1 sm:px-8">
              <Button
                type="submit"
                className="w-full rounded-xl bg-primary py-2.5 font-semibold text-primary-foreground shadow-md shadow-primary/20 transition-all hover:bg-primary/90 active:scale-[0.99]"
                disabled={loading}
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin" />
                    <span>Authentification...</span>
                  </span>
                ) : (
                  <span>Se connecter au portail</span>
                )}
              </Button>

              <p className="text-center text-xs leading-5 text-muted-foreground pt-1">
                Nouvel agent de support ?{" "}
                <Link
                  href="/agent/signup"
                  className="font-semibold text-primary underline-offset-4 hover:underline"
                >
                  Créer une demande d&apos;accès
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}