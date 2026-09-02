"use client"

import { useState } from "react"
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "demo-google-client-id.apps.googleusercontent.com"

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

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
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
            <div className="flex justify-center w-full my-1">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => toast.error("Échec de la connexion Google")}
                useOneTap
                shape="pill"
                locale="fr"
                text="signin_with"
                width="100%"
              />
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
    </GoogleOAuthProvider>
  )
}
