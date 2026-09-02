# Documentation Technique et Utilisateur - Projet Op Support IA (Sinaps)

Bienvenue dans la documentation complète de l'application **Op Support IA** développée pour Sinaps.
Cette application est une solution complète de support client assistée par Agent IA (RAG & Gemini) avec escalade vers des agents humains en temps réel (WebSockets) et tableau de bord d'administration.

---

## 📐 Architecture du Projet

Le projet est divisé en deux parties principales :

1. **`sinaps-backend`** (Backend REST API & WebSockets) :
   - **Framework** : Node.js / Express
   - **Base de données** : MongoDB (via Mongoose)
   - **Temps réel** : Socket.io
   - **Moteur IA / RAG** : Google Generative AI (Gemini) + Retriever Vectoriel TF-IDF/Cosine Similarity local (`ragService.js`)
   - **Authentification** : JWT, bcryptjs, google-auth-library
   - **Téléversement de fichiers** : Multer

2. **`sinaps-project`** (Frontend Web & Mobile Responsive) :
   - **Framework** : Next.js (App Router, React, TypeScript)
   - **UI & Styling** : Tailwind CSS, Shadcn UI / Radix UI, Lucide Icons
   - **Temps réel** : socket.io-client
   - **OAuth Client** : `@react-oauth/google`

---

## ⚙️ Configuration des Variables d'Environnement

### 1. Backend (`sinaps-backend/.env`)
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/sinaps
JWT_SECRET=votre_cle_secrete_jwt
GEMINI_API_KEY=votre_cle_api_gemini
GOOGLE_CLIENT_ID=votre_google_client_id.apps.googleusercontent.com
```

### 2. Frontend (`sinaps-project/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_GOOGLE_CLIENT_ID=votre_google_client_id.apps.googleusercontent.com
```

*Remarque : Si `GEMINI_API_KEY` ou `GOOGLE_CLIENT_ID` ne sont pas configurés, l'application bascule automatiquement en mode démonstration avec RAG local et connexion directe sans bloquer l'utilisateur.*

---

## 🚀 Démarrage et Installation

### Étape 1 : Démarrer MongoDB
S'assurer qu'un serveur MongoDB est en cours d'exécution sur le port `27017` ou indiquer une URI MongoDB Atlas dans `.env`.

### Étape 2 : Lancer le Backend
```bash
cd sinaps-backend
npm install
npm run seed  # Remplit la base avec des données de démo et des comptes d'exemple
npm run dev   # Lance le serveur sur http://localhost:5000
```

### Étape 3 : Lancer le Frontend
```bash
cd sinaps-project
npm install
npm run dev   # Lance l'interface Next.js sur http://localhost:3000
```

---

## 🧪 Tests Unitaires et d'Intégration

Les tests automatisés du backend sont développés avec **Jest**, **Supertest** et **MongoMemoryServer** (in-memory DB).

Pour exécuter la suite de tests :
```bash
cd sinaps-backend
npm test
```

---

## 👥 Comptes de Démonstration (Seed Data)

Après l'exécution de `npm run seed`, les comptes suivants sont prêts à l'emploi :

| Rôle | Adresse E-mail | Mot de passe | Description |
| :--- | :--- | :--- | :--- |
| **Administrateur** | `admin@sinaps.com` | `password123` | Accès au Dashboard Admin (`/admin`) |
| **Agent Validé 1** | `sarah.benali@sinaps.com` | `password123` | Espace Agent (`/agent`) - Compétences : Commandes, Retours |
| **Agent Validé 2** | `karim.mansouri@sinaps.com` | `password123` | Espace Agent (`/agent`) - Compétences : Technique, Mots de passe |
| **Agent en Attente**| `youssef.mehdi@sinaps.com` | `password123` | Compte nécessitant la validation de l'admin |

---

## 🔄 Flux Fonctionnel et Scénario de Démo

1. **Client Chat (`/`)** :
   - L'utilisateur se connecte via Google Sign-In ou en mode direct.
   - Il pose une question (ex: *"Comment suivre ma commande ?"*).
   - Le moteur **RAG** extrait les extraits pertinents de la base de connaissances et l'IA (ou le fallback local) répond immédiatement.
   - L'utilisateur peut joindre un document/image ou cliquer sur *"Basculer vers un agent humain"*.

2. **File d'Attente Agent (`/agent`)** :
   - L'agent se connecte avec son compte (`sarah.benali@sinaps.com`).
   - Il voit les conversations réclamant une intervention humaine en temps réel (Socket.io).
   - Il peut répondre, consulter les pièces jointes et marquer la demande comme **Résolue**.

3. **Tableau de Bord Administration (`/admin`)** :
   - L'admin se connecte avec `admin@sinaps.com`.
   - Visualisation des **Statistiques SLA** : Temps moyen de réponse, Taux de résolution IA vs Humain, Note de satisfaction globale.
   - Validation / Rejet des nouveaux comptes d'agents.
   - Recherche et filtrage complet dans l'**Historique des conversations**.
