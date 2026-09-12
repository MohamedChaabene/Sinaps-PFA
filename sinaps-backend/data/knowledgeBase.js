const knowledgeBase = [
  {
    id: "order-tracking",
    category: "orders",
    question: "Comment suivre ma commande ?",
    answer: "Vous pouvez suivre votre commande depuis votre espace client, section 'Mes commandes'. Un numéro de suivi est envoyé par email dès l'expédition.",
    keywords: ["commande", "suivi", "colis", "livraison", "tracking", "où", "est", "mon", "paquet"],
    source: "FAQ Commandes"
  },
  {
    id: "order-delay",
    category: "orders",
    question: "Ma commande est en retard, que faire ?",
    answer: "Si votre commande dépasse le délai annoncé, nous pouvons ouvrir une réclamation auprès du transporteur et vérifier son statut en temps réel.",
    keywords: ["retard", "délai", "en retard", "tard", "longtemps", "attendre", "transporteur", "réclamation"],
    source: "FAQ Commandes"
  },
  {
    id: "refund",
    category: "returns",
    question: "Comment obtenir un remboursement ?",
    answer: "Un remboursement peut être demandé dans les 14 jours suivant la réception, via la section 'Retours' de votre compte, ou en le demandant directement ici.",
    keywords: ["remboursement", "rembourser", "remboursé", "argent", "retour", "14 jours", "satisfait", "rembours"],
    source: "FAQ Retours"
  },
  {
    id: "password-reset",
    category: "account",
    question: "Comment réinitialiser mon mot de passe ?",
    answer: "Allez sur la page de connexion, cliquez sur 'Mot de passe oublié', puis suivez les instructions envoyées par email.",
    keywords: ["mot de passe", "réinitialiser", "oublié", "perdu", "changer", "nouveau", "connexion", "email"],
    source: "FAQ Compte"
  },
  {
    id: "promo-code",
    category: "billing",
    question: "Un code promo ne fonctionne pas",
    answer: "Vérifiez que le code est bien orthographié, qu'il n'est pas expiré, et qu'il correspond aux conditions (ex: réservé aux nouveaux comptes).",
    keywords: ["code promo", "réduction", "promo", "coupon", "fonctionne", "marche", "expiré", "conditions", "nouveau"],
    source: "FAQ Facturation"
  }
];

module.exports = knowledgeBase;