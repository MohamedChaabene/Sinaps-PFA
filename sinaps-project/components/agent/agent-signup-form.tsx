"use client"

import { useState } from "react"
import Link from "next/link"
import {
    ArrowLeft,
    Check,
    FileText,
    Headphones,
    Info,
    Network,
    Smartphone,
    Truck,
    Wrench,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { signupAgent } from "@/lib/api"

const skills = [
    { name: "Facturation", icon: FileText },
    { name: "Technique", icon: Wrench },
    { name: "Livraison", icon: Truck },
    { name: "Réseau", icon: Network },
    { name: "Application mobile", icon: Smartphone },
    { name: "Service après-vente", icon: Headphones },
]

export function AgentSignupForm() {
    const [selectedSkills, setSelectedSkills] = useState<string[]>([])
    const [submitted, setSubmitted] = useState(false)
    const [loading, setLoading] = useState(false)

    function toggleSkill(skill: string) {
        setSelectedSkills((current) => current.includes(skill) ? current.filter((item) => item !== skill) : [...current, skill])
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        const form = event.currentTarget
        const formData = new FormData(form)
        const name = formData.get("name") as string
        const email = formData.get("email") as string
        const password = formData.get("password") as string

        setLoading(true)
        try {
            await signupAgent(name, email, password, selectedSkills)
            setSubmitted(true)
            toast.success("Demande envoyée", { description: "Votre profil est en attente de validation." })
        } catch (error) {
            toast.error("Erreur lors de l'inscription")
        } finally {
            setLoading(false)
        }
    }

    if (submitted) {
        return (
            <main className="grid min-h-screen place-items-center bg-background px-4 py-10 sm:px-6">
                <section className="w-full max-w-[440px] animate-enter">
                    <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
                        <div className="px-6 pb-6 pt-7 sm:px-8">
                            <div className="mb-7 flex justify-center">
                                <div className="flex size-16 items-center justify-center rounded-full bg-mint/15 text-mint-foreground">
                                    <Check className="size-8" aria-hidden="true" />
                                </div>
                            </div>
                            <div className="mb-7 text-center">
                                <h1 className="text-2xl font-bold">Demande envoyée</h1>
                                <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">Votre compte a été créé et est en attente de validation par un administrateur.</p>
                            </div>
                            <div className="flex flex-col gap-3">
                                <Link href="/" className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90">Retour au support</Link>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        )
    }

    return (
        <main className="grid min-h-screen place-items-center bg-background px-4 py-10 sm:px-6">
            <div className="w-full max-w-[440px] animate-enter">
                <Link
                    href="/login"
                    className="mb-5 inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
                >
                    <ArrowLeft className="size-3.5" /> Retour à la connexion
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
                        <h1 className="text-2xl font-bold">Rejoindre l'équipe support</h1>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">Créez votre profil pour demander un accès agent.</p>
                        <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
                            <div className="space-y-1.5">
                                <Label htmlFor="full-name" className="text-xs font-semibold">Nom complet</Label>
                                <Input id="full-name" name="name" className="h-10 bg-background" placeholder="Votre nom" required />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="signup-email" className="text-xs font-semibold">Adresse e-mail</Label>
                                <Input id="signup-email" name="email" type="email" className="h-10 bg-background" placeholder="nom@entreprise.fr" required />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="signup-password" className="text-xs font-semibold">Mot de passe</Label>
                                <Input id="signup-password" name="password" type="password" className="h-10 bg-background" placeholder="8 caractères minimum" required />
                            </div>
                            <div className="space-y-2 pb-2">
                                <Label id="skills-label">Vos compétences</Label>
                                <div
                                    className="flex flex-wrap gap-2"
                                    role="group"
                                    aria-labelledby="skills-label"
                                >
                                    {skills.map(({ name, icon: Icon }) => {
                                        const isSelected = selectedSkills.includes(name)

                                        return (
                                            <button
                                                key={name}
                                                type="button"
                                                aria-pressed={isSelected}
                                                onClick={() => toggleSkill(name)}
                                                className={`inline-flex min-h-8 items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                                                    isSelected
                                                        ? "border-primary bg-primary text-primary-foreground shadow-sm"
                                                        : "border-transparent bg-primary/5 text-foreground hover:bg-primary/10"
                                                }`}
                                            >
                                                <Icon className="size-3 shrink-0" aria-hidden="true" />
                                                {name}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                            <Button type="submit" className="h-10 w-full" disabled={loading}>
                                {loading ? "Envoi..." : "Envoyer la demande"}
                            </Button>
                            <div className="flex items-start gap-2 rounded-md border border-border bg-muted/60 px-3 py-2 text-xs leading-5 text-muted-foreground" role="status">
                                <Info className="mt-0.5 size-3.5 shrink-0 text-primary" />
                                <span>L'envoi et la validation nécessitent une connexion au service d'accès existant.</span>
                            </div>
                        </form>
                        <p className="mt-5 text-center text-xs text-muted-foreground">Déjà un compte ? <Link href="/login" className="font-bold text-primary hover:underline">Se connecter</Link></p>
                    </div>
                </section>
            </div>
        </main>
    )
}
