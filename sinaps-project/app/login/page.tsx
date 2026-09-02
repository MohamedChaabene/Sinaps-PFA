"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { loginAgent } from "@/lib/api"

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const formData = new FormData(form)
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    setLoading(true)
    try {
      const data = await loginAgent(email, password)
      localStorage.setItem("sinaps_token", data.token)
      localStorage.setItem("sinaps_agent", JSON.stringify(data.agent))
      toast.success(`Bienvenue ${data.agent.name}`)
      router.push(data.agent.role === "admin" ? "/admin" : "/agent")
    } catch (error: any) {
      toast.error(error.message || "Erreur de connexion")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-primary/15 shadow-xl shadow-primary/5">
        <CardHeader className="gap-3 px-6 pb-5 pt-7 sm:px-10 sm:pt-9">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-primary text-lg font-extrabold text-primary-foreground">S</div>
          <div className="flex flex-col gap-1">
            <CardTitle className="font-heading text-2xl font-bold">Connexion</CardTitle>
            <CardDescription>Accédez à votre espace agent ou administrateur.</CardDescription>
          </div>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="flex flex-col gap-5 px-6 sm:px-10">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Adresse e-mail</Label>
              <Input id="email" name="email" type="email" placeholder="vous@entreprise.com" required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input id="password" name="password" type="password" required />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3 px-6 pb-7 pt-6 sm:px-10">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Connexion..." : "Se connecter"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}