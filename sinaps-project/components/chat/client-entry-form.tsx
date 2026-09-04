"use client"

import { useState } from "react"
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
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
  } catch (e) {
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
    const name = formData.get("name") as string
    const email = formData.get("email") as string
    setLoading(true)
    try {
      await onSubmit(name, email)
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
    } catch (e: any) {
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
      toast.error("Erreur de connexion")
    } finally {
      setLoading(false)
    }
  }

  const content = (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-primary/15 shadow-xl shadow-primary/5">
        <CardHeader className="gap-3 px-6 pb-5 pt-7 sm:px-10 sm:pt-9">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-primary text-lg font-extrabold text-primary-foreground">
            S
          </div>
          <div className="flex flex-col gap-1">
            <CardTitle className="font-heading text-2xl font-bold">Bienvenue 👋</CardTitle>
            <CardDescription>Connectez-vous via Google ou entrez vos coordonnées pour démarrer le chat support.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-5 px-6 sm:px-10">
          <div className="flex flex-col items-center justify-center w-full gap-2 my-1">
            {isGoogleConfigured ? (
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => toast.error("Échec de la connexion Google")}
                shape="pill"
                text="signin_with"
                width="100%"
              />
            ) : (
              <Button
                type="button"
                variant="outline"
                className="w-full rounded-full border-muted-foreground/30 py-5 font-medium shadow-sm hover:bg-muted"
                onClick={handleGoogleDemoClick}
                disabled={loading}
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
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
                Continuer avec Google (Mode Démo)
              </Button>
            )}
          </div>

          <div className="relative flex items-center justify-center">
            <Separator />
            <span className="absolute bg-card px-2 text-xs text-muted-foreground uppercase tracking-wider">
              ou mode direct (test)
            </span>
          </div>

          <form id="direct-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Nom complet</Label>
              <Input id="name" name="name" placeholder="Ex. Sophie Martin" required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Adresse e-mail</Label>
              <Input id="email" name="email" type="email" placeholder="vous@exemple.com" required />
            </div>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col gap-3 px-6 pb-7 pt-2 sm:px-10">
          <Button type="submit" form="direct-form" className="w-full" disabled={loading}>
            {loading ? "Connexion..." : "Démarrer la conversation (Direct)"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )

  if (isGoogleConfigured) {
    return <GoogleOAuthProvider clientId={rawClientId}>{content}</GoogleOAuthProvider>
  }

  return content
}
