"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function ClientEntryForm({ onSubmit }: { onSubmit: (name: string, email: string) => void }) {
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const formData = new FormData(form)
    const name = formData.get("name") as string
    const email = formData.get("email") as string
    setLoading(true)
    await onSubmit(name, email)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-primary/15 shadow-xl shadow-primary/5">
        <CardHeader className="gap-3 px-6 pb-5 pt-7 sm:px-10 sm:pt-9">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-primary text-lg font-extrabold text-primary-foreground">S</div>
          <div className="flex flex-col gap-1">
            <CardTitle className="font-heading text-2xl font-bold">Bienvenue 👋</CardTitle>
            <CardDescription>Entrez vos coordonnées pour démarrer une conversation avec notre support.</CardDescription>
          </div>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="flex flex-col gap-5 px-6 sm:px-10">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Nom complet</Label>
              <Input id="name" name="name" placeholder="Ex. Sophie Martin" required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Adresse e-mail</Label>
              <Input id="email" name="email" type="email" placeholder="vous@exemple.com" required />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3 px-6 pb-7 pt-6 sm:px-10">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Connexion..." : "Démarrer la conversation"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}