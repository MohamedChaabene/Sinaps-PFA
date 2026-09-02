"use client"

import { useState } from "react"
import Link from "next/link"
import { Check, ChevronDown, X } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { signupAgent } from "@/lib/api"

const skills = ["Réseau", "Facturation", "Application mobile", "Livraison", "Technique"]

export function AgentSignupForm() {
    const [selectedSkills, setSelectedSkills] = useState<string[]>([])
    const [open, setOpen] = useState(false)
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
            <Card className="w-full max-w-lg border-primary/15 shadow-xl shadow-primary/5">
                <CardContent className="flex flex-col items-center gap-5 px-6 py-14 text-center sm:px-10">
                    <div className="flex size-16 items-center justify-center rounded-full bg-success/15 text-success">
                        <Check className="size-8" aria-hidden="true" />
                    </div>
                    <div className="flex flex-col gap-2">
                        <h1 className="font-heading text-2xl font-bold text-foreground">Demande envoyée</h1>
                        <p className="text-sm leading-6 text-muted-foreground">Votre compte a été créé et est en attente de validation par un administrateur.</p>
                    </div>
                    <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                        <Link href="/" className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90">Retour au support</Link>
                        <Link href="/admin" className="inline-flex h-9 items-center justify-center rounded-lg border border-input bg-background px-4 text-sm font-semibold transition-colors hover:bg-accent hover:text-accent-foreground">Voir l&apos;administration</Link>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="w-full max-w-lg border-primary/15 shadow-xl shadow-primary/5">
            <CardHeader className="gap-3 px-6 pb-5 pt-7 sm:px-10 sm:pt-9">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-primary text-lg font-extrabold text-primary-foreground">S</div>
                <div className="flex flex-col gap-1">
                    <CardTitle className="font-heading text-2xl font-bold">Rejoindre l&apos;équipe support</CardTitle>
                    <CardDescription>Créez votre profil d&apos;agent pour aider nos clients.</CardDescription>
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
                        <Input id="email" name="email" type="email" placeholder="vous@entreprise.com" required />
                    </div>
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="password">Mot de passe</Label>
                        <Input id="password" name="password" type="password" minLength={8} placeholder="8 caractères minimum" required />
                    </div>
                    <div className="flex flex-col gap-2">
                        <Label id="skills-label">Vos compétences</Label>
                        <Popover open={open} onOpenChange={setOpen}>
                            <PopoverTrigger
                                render={
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-full justify-between font-normal text-muted-foreground"
                                    />
                                }
                            >
                                <span>
                                    {selectedSkills.length
                                        ? `${selectedSkills.length} compétence${selectedSkills.length > 1 ? "s" : ""} sélectionnée${selectedSkills.length > 1 ? "s" : ""}`
                                        : "Sélectionnez vos domaines"}
                                </span>
                                <ChevronDown className="size-4" />
                            </PopoverTrigger>
                            <PopoverContent
                                align="start"
                                sideOffset={8}
                                className="w-[var(--anchor-width)] p-0"
                            >
                                <div
                                    id="skills-list"
                                    className="flex max-h-56 w-full flex-col gap-1 overflow-y-auto p-2"
                                    role="group"
                                    aria-labelledby="skills-label"
                                >
                                    {skills.map((skill) => (
                                        <label
                                            key={skill}
                                            className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-accent"
                                        >
                                            <Checkbox
                                                checked={selectedSkills.includes(skill)}
                                                onCheckedChange={() => toggleSkill(skill)}
                                            />
                                            {skill}
                                        </label>
                                    ))}
                                </div>
                            </PopoverContent>
                        </Popover>
                        {selectedSkills.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {selectedSkills.map((skill) => (
                                    <Badge key={skill} variant="secondary" className="gap-1">
                                        {skill}
                                        <button type="button" aria-label={`Retirer ${skill}`} onClick={() => toggleSkill(skill)}>
                                            <X className="size-3" />
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-3 px-6 pb-7 pt-6 sm:px-10">
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? "Envoi..." : "S'inscrire"}
                    </Button>
                    <p className="text-center text-xs leading-5 text-muted-foreground">Votre compte sera vérifié par un administrateur avant activation.</p>
                </CardFooter>
            </form>
        </Card>
    )
}