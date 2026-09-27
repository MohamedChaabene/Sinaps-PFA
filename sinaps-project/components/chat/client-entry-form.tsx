"use client"

import { useState } from "react"
import Link from "next/link"
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Mail, User, Headphones, ArrowRight } from "lucide-react"
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
    <main className="grid min-h-screen place-items-center bg-background px-4 py-10 sm:px-6">
      <section className="w-full max-w-[450px] animate-enter">
        <div className="mb-7 flex justify-center">
          <img
            src="/sinaps-logo-light.png"
            alt="SINAPS"
            className="h-9 w-auto object-contain dark:hidden"
          />
          <img
            src="/sinaps-logo-dark.png"
            alt="SINAPS"
            className="h-9 w-auto object-contain hidden dark:block"
          />
        </div>
        <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
          <div className="px-6 pb-7 pt-8 sm:px-8">
            <div className="mb-7 text-center">
              <p className="mb-2 text-xs font-bold uppercase text-primary">Assistance client</p>
              <h1 className="text-2xl font-bold">Bienvenue sur SINAPS</h1>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">Identifiez-vous pour ouvrir votre espace de conversation.</p>
            </div>
            <div className="mb-7 grid grid-cols-3 divide-x divide-border rounded-md border border-border bg-muted/50 py-3 text-center text-xs text-muted-foreground">
              <span>Simple</span><span>Direct</span><span>Avec un agent</span>
            </div>

            {/* Google Authentication */}
            <div className="flex flex-col items-center justify-center w-full gap-2 mb-4">
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
                  className="w-full h-10 rounded-md border-border bg-card hover:bg-muted/60 font-medium shadow-2xs transition-all text-sm"
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

            <div className="relative flex items-center justify-center my-4">
              <Separator />
              <span className="absolute bg-card px-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                ou saisie manuelle
              </span>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs font-semibold">Nom complet</Label>
                <div className="relative"><User className="absolute left-3 top-2.5 size-4 text-muted-foreground" /><Input id="name" name="name" required placeholder="Votre nom" className="h-10 bg-background pl-9" /></div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold">Adresse e-mail</Label>
                <div className="relative"><Mail className="absolute left-3 top-2.5 size-4 text-muted-foreground" /><Input id="email" name="email" required type="email" placeholder="nom@exemple.fr" className="h-10 bg-background pl-9" /></div>
              </div>
              <Button type="submit" className="h-10 w-full" disabled={loading}>
                {loading ? "Chargement..." : "Démarrer la conversation"} <ArrowRight className="ml-2" />
              </Button>
            </form>
          </div>
          <div className="border-t border-border bg-muted/40 px-6 py-4 text-center text-xs text-muted-foreground">
            <Headphones className="mr-1.5 inline size-3.5" /> Vous êtes opérateur ? <Link href="/login" className="font-bold text-primary hover:underline">Espace Agent / Admin</Link>
          </div>
        </div>
      </section>
    </main>
  )

  if (isGoogleConfigured) {
    return <GoogleOAuthProvider clientId={rawClientId}>{content}</GoogleOAuthProvider>
  }

  return content
}
