"use client"

import { useState } from "react"
import Link from "next/link"
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Sparkles, Bot, ShieldCheck, Mail, User, Headphones, ArrowRight } from "lucide-react"
import { toast } from "sonner"

const rawClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() || ""
const isGoogleConfigured = rawClientId !== "" && !rawClientId.includes("demo-google-client-id")

function decodeJwtPayload(token: string) {
  try {
    const base64Url = token.split(".")[1]
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    )
    return JSON.parse(jsonPayload)
  } catch {
    return null
  }
}

export function ClientEntryForm({
  onSubmit,
}: {
  onSubmit: (name: string, email: string, credential?: string, avatar?: string) => void
}) {
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const formData = new FormData(form)
    const name = (formData.get("name") as string)?.trim()
    const email = (formData.get("email") as string)?.trim()
    if (!email) {
      toast.error("Veuillez saisir votre adresse e-mail")
      return
    }
    setLoading(true)
    try {
      await onSubmit(name || email.split("@")[0], email)
    } catch (e: any) {
      toast.error(e.message || "Erreur de connexion")
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setLoading(true)
    try {
      const token = credentialResponse.credential
      const decoded = decodeJwtPayload(token)
      const name = decoded?.name || "Utilisateur Google"
      const email = decoded?.email || "google@user.com"
      const avatar = decoded?.picture || ""
      await onSubmit(name, email, token, avatar)
    } catch {
      toast.error("Erreur lors de la connexion Google")
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleDemoClick = async () => {
    setLoading(true)
    try {
      await onSubmit(
        "Utilisateur Google (Démo)",
        "google.client@sinaps.com",
        undefined,
        "https://api.dicebear.com/7.x/avataaars/svg?seed=GoogleUser"
      )
    } catch (e: any) {
      toast.error(e.message || "Erreur de connexion")
    } finally {
      setLoading(false)
    }
  }

  const content = (
    <div className="relative flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-background via-background/95 to-primary/10 p-4 sm:p-6 overflow-hidden">
      {/* Decorative background glow elements */}
      <div className="pointer-events-none absolute -top-40 -right-40 size-96 rounded-full bg-primary/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-40 size-96 rounded-full bg-emerald-500/10 blur-3xl" />

      <div className="relative w-full max-w-md">
        {/* Header brand pill */}
        <div className="mb-4 flex items-center justify-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary backdrop-blur-md shadow-xs">
            <Sparkles className="size-3.5 text-primary" />
            <span>SINAPS Support • Assistance IA & Humaine</span>
          </div>
        </div>

        <Card className="w-full border-border/80 bg-card/95 shadow-xl shadow-primary/5 backdrop-blur-md">
          <CardHeader className="gap-3 px-6 pb-4 pt-7 sm:px-8 sm:pt-8 text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-xl font-black text-primary-foreground shadow-md shadow-primary/20 ring-4 ring-primary/15">
              S
            </div>
            <div className="flex flex-col gap-1.5">
              <CardTitle className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Bienvenue sur Sinaps
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Connectez-vous pour échanger avec notre agent IA ou être mis en relation avec notre équipe d&apos;assistance.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="flex flex-col gap-4 px-6 pb-4 sm:px-8 sm:pb-6">
            {/* Value proposition badges */}
            <div className="grid grid-cols-3 gap-2 rounded-xl border border-border/60 bg-muted/30 p-2.5 text-center text-[11px] font-medium text-muted-foreground">
              <div className="flex flex-col items-center gap-1">
                <Bot className="size-4 text-primary" />
                <span>IA 24/7</span>
              </div>
              <div className="flex flex-col items-center gap-1 border-x border-border/60">
                <ShieldCheck className="size-4 text-emerald-500" />
                <span>Sécurisé</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <Headphones className="size-4 text-blue-500" />
                <span>Agent humain</span>
              </div>
            </div>

            {/* Google Authentication */}
            <div className="flex flex-col items-center justify-center w-full gap-2 my-0.5">
              {isGoogleConfigured ? (
                <div className="w-full flex justify-center">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => toast.error("Échec de la connexion Google")}
                    shape="rectangular"
                    text="signin_with"
                    width="100%"
                  />
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full rounded-xl border-border bg-card hover:bg-muted/60 py-5 font-medium shadow-2xs transition-all"
                  onClick={handleGoogleDemoClick}
                  disabled={loading}
                >
                  <svg className="mr-2.5 h-4 w-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      fill="#EA4335"
                    />
                  </svg>
                  <span>Continuer avec Google (Mode Démo)</span>
                </Button>
              )}
            </div>

            <div className="relative flex items-center justify-center my-1">
              <Separator />
              <span className="absolute bg-card px-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                ou saisie manuelle
              </span>
            </div>

            <form id="direct-form" onSubmit={handleSubmit} className="flex flex-col gap-3.5">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="name" className="text-xs font-semibold text-foreground">
                  Nom complet
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 size-4 text-muted-foreground/70" />
                  <Input
                    id="name"
                    name="name"
                    placeholder="Ex. Sophie Martin"
                    className="pl-9 rounded-xl border-input/80 bg-background/80 text-sm focus-visible:ring-primary/20"
                    required
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email" className="text-xs font-semibold text-foreground">
                  Adresse e-mail
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 size-4 text-muted-foreground/70" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="vous@exemple.com"
                    className="pl-9 rounded-xl border-input/80 bg-background/80 text-sm focus-visible:ring-primary/20"
                    required
                  />
                </div>
              </div>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col gap-3 px-6 pb-6 pt-1 sm:px-8">
            <Button
              type="submit"
              form="direct-form"
              className="w-full rounded-xl bg-primary py-2.5 font-semibold text-primary-foreground shadow-md shadow-primary/20 transition-all hover:bg-primary/90 active:scale-[0.99]"
              disabled={loading}
            >
              {loading ? (
                "Connexion en cours..."
              ) : (
                <span className="inline-flex items-center gap-2">
                  <span>Démarrer la conversation</span>
                  <ArrowRight className="size-4" />
                </span>
              )}
            </Button>

            <div className="pt-2 text-center text-xs text-muted-foreground">
              <span>Vous êtes un opérateur de support ? </span>
              <Link
                href="/login"
                className="font-semibold text-primary hover:underline underline-offset-4"
              >
                Espace Agent / Admin
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )

  if (isGoogleConfigured) {
    return <GoogleOAuthProvider clientId={rawClientId}>{content}</GoogleOAuthProvider>
  }

  return content
}
