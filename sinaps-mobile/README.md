# Application Mobile Sinaps (React Native + TypeScript)

Application mobile officielle de support client assistée par IA (RAG & Gemini) pour la plateforme **Sinaps**, développée avec **React Native**, **TypeScript** et **Expo**.

---

## 📱 Fonctionnalités

- **Authentification & Session persistante** :
  - Connexion rapide par nom / e-mail.
  - Connexion Google OAuth avec JWT client sécurisé (`30 jours`) stocké via `AsyncStorage`.
  - Déconnexion propre et gestion des sessions expirées.
- **Chat Support en Temps Réel** :
  - Intégration complète **Socket.IO** (événements `message_received`, `conversation_updated`).
  - Échange fluide de messages client, IA et agent humain.
  - Indicateur de frappe ("Agent IA réfléchit...") lors des requêtes au modèle RAG.
  - Suggestions rapides de questions (Quick Prompts).
- **Assistance IA & Escalade Humaine** :
  - Réponses instantanées générées par le backend (RAG + Gemini).
  - Bascule en un clic vers un opérateur humain (`Agent demandé`).
  - Prise en charge par un agent en direct depuis le tableau de bord web.
  - Possibilité de repasser au mode IA à tout moment.
- **Messages Riches & Pièces Jointes** :
  - Sélection et téléversement de photos/images via `expo-image-picker`.
  - Sélection et téléversement de documents (PDF, Word) via `expo-document-picker`.
  - Aperçu plein écran des images et téléchargement/visualisation des fichiers.
  - Barre d'emojis rapides intégrée.
- **Clôture & Enquête de Satisfaction** :
  - Clôture de la demande avec évaluation par étoiles (1 à 5 étoiles) et commentaire facultatif.
  - Affichage de l'état résolu et bouton de démarrage d'une nouvelle demande.
- **Configuration Réseau Dynamique** :
  - Écran de paramètres réseau dédié permettant de basculer instantanément entre Émulateur Android (`10.0.2.2`), Simulateur iOS (`localhost`) ou IP locale Wi-Fi pour smartphone physique.
  - Bouton de test de connectivité en direct (`/api/health`).

---

## 📐 Architecture du Projet

```text
sinaps-mobile/
├── App.tsx                    # Racine de l'application & configuration des Providers
├── app.json                   # Configuration Expo (nom, package, icônes)
├── .env.example               # Exemple de variables d'environnement
├── src/
│   ├── api/
│   │   ├── client.ts          # Client HTTP fetch avec gestion de l'URL et token JWT
│   │   ├── auth.ts            # Authentification client (/api/users/find-or-create)
│   │   ├── conversations.ts   # Gestion des conversations (GET, POST, escalate, close)
│   │   ├── messages.ts        # Envoi de messages (/api/messages)
│   │   └── upload.ts          # Téléversement multipart de fichiers (/api/upload)
│   ├── socket/
│   │   └── socket.ts          # Client Socket.IO, gestion des salons et reconnexion
│   ├── context/
│   │   ├── ConfigContext.tsx  # Gestion dynamique de l'URL du serveur backend
│   │   ├── AuthContext.tsx    # État d'authentification et persistance du token
│   │   └── ChatContext.tsx    # État de la conversation, messages et événements temps réel
│   ├── components/
│   │   ├── ChatHeader.tsx     # En-tête avec statut, bascule IA/Humain et actions
│   │   ├── ChatThread.tsx     # Liste de messages avec défilement automatique
│   │   ├── MessageBubble.tsx  # Bulles de messages riches (client, IA, agent)
│   │   ├── MessageComposer.tsx# Zone de saisie, sélecteur de fichiers et emojis
│   │   ├── QuickPrompts.tsx   # Suggestions rapides de support
│   │   ├── SatisfactionModal.tsx # Dialogue d'évaluation à 5 étoiles
│   │   ├── AttachmentModal.tsx   # Visualiseur d'images plein écran
│   │   └── StatusBadge.tsx    # Badge visuel du statut (en cours, en attente, résolu)
│   ├── screens/
│   │   ├── LoginScreen.tsx    # Écran de connexion
│   │   ├── ChatScreen.tsx     # Écran principal de discussion
│   │   └── SettingsScreen.tsx # Configuration réseau et diagnostic
│   ├── constants/
│   │   ├── theme.ts           # Charte graphique Sinaps (violet #7c3aed, etc.)
│   │   └── config.ts          # Résolution intelligente de l'adresse par plateforme
│   ├── types/
│   │   ├── chat.ts            # Modèles de données de conversation et messages
│   │   └── api.ts             # Typages des réponses backend
│   └── utils/
│       ├── storage.ts         # Wrapper AsyncStorage
│       └── formatters.ts      # Formatage d'heures et URLs de pièces jointes
```

---

## ⚙️ Configuration Réseau

Le backend Sinaps s'exécute par défaut sur le port `5000`. Selon la plateforme de test :

| Environnement | Adresse à utiliser |
| :--- | :--- |
| **Simulateur iOS** | `http://localhost:5000` |
| **Navigateur Web (Expo Web)** | `http://localhost:5000` |
| **Émulateur Android (AVD)** | `http://10.0.2.2:5000` *(alias Android pour localhost de la machine hôte)* |
| **Smartphone Physique (Expo Go)** | `http://<IP_LOCALE_PC>:5000` (ex: `http://192.168.1.45:5000`) |

Vous pouvez :
1. Configurer la variable dans `.env` : `EXPO_PUBLIC_API_URL=http://localhost:5000/api`
2. **Ou directement dans l'application mobile** : appuyez sur l'icône ⚙️ (Paramètres) en haut à droite pour sélectionner un raccourci ou tester la connexion en direct !

---

## 🚀 Démarrage et Utilisation

### Configuration de Google Sign-In

Google Sign-In doit être testé dans une **build de développement ou publiée**, et non dans Expo Go. Dans Google Cloud Console, créez un client OAuth Android pour le package `com.sinaps.support` et le SHA-1 du certificat de signature, puis renseignez son identifiant dans `sinaps-mobile/.env` :

```bash
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=<client-id-android>.apps.googleusercontent.com
```

Ajoutez aussi les clients iOS et web si vous ciblez ces plateformes. Le backend doit accepter tous les identifiants qui peuvent signer un jeton :

```bash
GOOGLE_CLIENT_IDS=<client-id-android>.apps.googleusercontent.com,<client-id-ios>.apps.googleusercontent.com,<client-id-web>.apps.googleusercontent.com
```

Après une modification de ces variables ou du fichier `app.json`, reconstruisez l’application native.

### 1. Démarrer le Backend Sinaps
Dans un terminal :
```bash
cd sinaps-backend
npm run dev
```

### 2. Lancer l'Application Mobile
Dans un second terminal :
```bash
cd sinaps-mobile
npm start
```

### 3. Tester selon votre appareil

- **Sur Android (Émulateur ou appareil USB)** :
  Appuyez sur `a` dans le terminal ou lancez :
  ```bash
  npm run android
  ```

- **Sur iOS (Simulateur Mac)** :
  Appuyez sur `i` dans le terminal ou lancez :
  ```bash
  npm run ios
  ```

- **Sur Smartphone Physique (Android ou iPhone)** :
  1. Installez l'application **Expo Go** depuis le Google Play Store ou l'App Store.
  2. Scannez le QR Code affiché dans le terminal ou via l'interface web Expo.
  3. Dans l'application mobile Sinaps, ouvrez les **Paramètres (⚙️)** et renseignez l'adresse IP locale de votre ordinateur (ex: `http://192.168.1.50:5000`).

---

## 🧪 Vérification & Typecheck

Pour valider le typage TypeScript :
```bash
cd sinaps-mobile
npx tsc --noEmit
```
