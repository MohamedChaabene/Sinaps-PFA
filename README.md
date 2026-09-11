# SINAPS Support

**Sinaps** is an AI-powered customer support platform built as a final-year engineering project (PFA) at ISIMS.

Clients chat with an AI assistant (powered by Google Gemini + a local RAG knowledge base). When the AI cannot resolve the issue, the client can escalate to a human support agent who takes over in real time via WebSockets.

---

## Architecture

```
Client (browser / mobile)
        │
        ▼
 Next.js frontend  ──── REST API calls ────►  Express backend
 (sinaps-project)                             (sinaps-backend)
        │                                             │
        │  Socket.io (WebSocket)                      │
        └─────────────────────────────────────────────┘
                                                      │
                                              MongoDB Atlas
```

**Where the pieces fit:**

| Technology | Role |
|---|---|
| **Next.js** | Frontend — client chat UI, agent inbox, admin dashboard |
| **Express** | Backend — REST API, authentication, business logic |
| **Socket.io** | Real-time messaging, typing indicators, live conversation updates |
| **MongoDB Atlas** | Persistent storage for users, agents, conversations, messages |
| **Google Gemini API** | Generative AI responses to client messages |
| **RAG (TF-IDF)** | Local knowledge-base retrieval used to ground Gemini answers |
| **Google OAuth** | Client sign-in via Google One Tap |
| **JWT** | Stateless auth for both client sessions and agent/admin sessions |

---

## Repository structure

```
Sinaps-PFA/
├── sinaps-project/        # Next.js frontend
│   ├── app/               # Page routes (Next.js App Router)
│   │   ├── page.tsx       # Root — client chat widget
│   │   ├── login/         # Agent / admin login page
│   │   ├── agent/         # Agent inbox (support dashboard)
│   │   └── admin/         # Admin dashboard
│   ├── components/
│   │   ├── admin/         # Admin dashboard sub-components
│   │   │   ├── admin-dashboard.tsx       # Layout orchestrator
│   │   │   ├── stats-panel.tsx           # KPI cards & AI/human breakdown
│   │   │   ├── agent-table.tsx           # Pending & validated agent tables
│   │   │   └── conversation-history.tsx  # Filterable conversation history
│   │   ├── agent/         # Agent signup form
│   │   ├── chat/          # Client chat UI components
│   │   └── ui/            # Reusable shadcn-style primitives
│   └── lib/
│       ├── api.ts         # All HTTP API call functions
│       ├── session.ts     # Token storage helpers (client & agent sessions)
│       ├── mappers.ts     # Backend → frontend data transformation
│       ├── socket.ts      # Socket.io-client singleton
│       ├── types.ts       # TypeScript interfaces
│       └── utils.ts       # cn(), getInitials()
│
├── sinaps-backend/        # Node.js + Express backend
│   ├── server.js          # Entry point: HTTP server + Socket.io setup
│   ├── app.js             # Express app: middleware, routes, error handler
│   ├── socket.js          # Socket.io emit helpers (emitToConversation, etc.)
│   ├── config/
│   │   └── db.js          # MongoDB connection (Atlas / local / in-memory)
│   ├── middleware/
│   │   ├── auth.js        # JWT auth guards (requireAuth, requireClientAuth, etc.)
│   │   └── upload.js      # Multer file upload configuration
│   ├── models/            # Mongoose schemas (User, Agent, Conversation, Message)
│   ├── routes/            # Express routers
│   ├── controllers/       # Request handlers
│   ├── services/
│   │   ├── geminiService.js  # Gemini API integration
│   │   └── ragService.js     # TF-IDF knowledge-base retriever
│   ├── data/
│   │   └── knowledgeBase.js  # Q&A pairs used by RAG
│   └── utils/
│       └── queryHelpers.js   # Shared Mongoose populate helper
│
├── sinaps-mobile/         # React Native mobile client (Expo)
├── rapport-pfa/           # Project report (PDF / LaTeX)
├── docker-compose.yml     # Local development with Docker
└── README.md              # This file
```

---

## How the application works

### Google authentication (client)

1. Client visits `/` and sees the `ClientEntryForm`.
2. They click **Sign in with Google** → the `@react-oauth/google` library returns a credential JWT.
3. The credential is sent to `POST /api/users/find-or-create` where the backend verifies it using Google's `OAuth2Client.verifyIdToken()`.
4. The backend finds or creates a `User` document and returns a client-scoped JWT (30-day expiry).
5. The frontend stores this token under `sinaps_client` in localStorage and uses it for all subsequent conversation/message requests.

### Agent authentication

1. An agent visits `/login` and submits their email + password.
2. `POST /api/agents/login` verifies the bcrypt-hashed password and returns a 7-day JWT.
3. The frontend stores the token under `sinaps_token` and redirects to `/agent` (or `/admin` for admins).

### Frontend → Backend API communication

All HTTP calls go through `lib/api.ts`. The correct Authorization header (`Bearer <token>`) is automatically attached by the helpers in `lib/session.ts`:

- Agent routes → `getAuthHeaders()` (reads `sinaps_token`)
- Client routes → `getClientAuthHeaders()` (reads `sinaps_client`)
- Shared routes → `getAnyAuthHeaders()` (picks the right token based on URL path)

### Real-time communication (Socket.io)

The backend emits events to specific Socket.io rooms:
- `conversation_<id>` — messages and updates for a single conversation
- `agents_room` — new conversation notifications for all logged-in agents/admins

The frontend connects via `lib/socket.ts` (singleton) and joins the relevant rooms. Events used:

| Event | Direction | Meaning |
|---|---|---|
| `join_conversation` | client → server | Join a conversation room |
| `leave_conversation` | client → server | Leave a conversation room |
| `typing_status` | bidirectional | Show/hide typing indicator |
| `message_received` | server → client | New message in a conversation |
| `conversation_created` | server → agents_room | A new conversation was opened |
| `conversation_updated` | server → client | Conversation status/assignment changed |

### AI / Gemini functionality

When a client sends a message and the conversation is handled by `ia`:

1. `messageController.js` calls `geminiService.getAIResponse(userMessage)`.
2. `ragService.js` retrieves the most relevant Q&A pairs from `knowledgeBase.js` using TF-IDF + cosine similarity.
3. The retrieved context is injected into the Gemini prompt as grounding information.
4. Gemini generates a response (with a local RAG fallback if the API is unavailable).
5. The AI reply is saved as a new `Message` and emitted to the conversation room.

---

## Local development

### Prerequisites

- Node.js ≥ 18
- npm ≥ 9

> **No local MongoDB required** — the backend automatically starts an in-memory MongoDB instance if no `MONGO_URI` is configured.

### Backend

```bash
cd sinaps-backend
cp .env.example .env     # fill in secrets
npm install
npm run dev              # nodemon — hot reload
```

### Frontend

```bash
cd sinaps-project
cp .env.example .env.local  # fill in API URL and Google Client ID
npm install
npm run dev              # Next.js dev server at http://localhost:3000
```

### Docker (optional — runs everything at once)

```bash
# From the repo root
npm run docker:up        # docker compose up -d
npm run docker:down      # docker compose down
```

### Seed demo data

If using a real MongoDB (not the in-memory fallback):

```bash
npm run seed             # from repo root, or:
cd sinaps-backend && npm run seed
```

Demo accounts created: `admin@sinaps.com` / `password123`, `sarah.benali@sinaps.com` / `password123`

---

## Environment variables

### Backend (`sinaps-backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | HTTP port (default: 5000) |
| `NODE_ENV` | No | `development` or `production` |
| `MONGO_URI` | No | MongoDB Atlas connection string. Falls back to local then in-memory. |
| `JWT_SECRET` | **Yes (prod)** | Secret for signing JWTs — must be a long random string in production |
| `GEMINI_API_KEY` | No | Google Gemini API key. Falls back to RAG-only responses. |
| `GOOGLE_CLIENT_IDS` | No | Comma-separated OAuth client IDs for Google sign-in verification |
| `CLIENT_ORIGIN` | No | Allowed CORS origin (e.g. `https://sinaps.vercel.app`) |
| `CLIENT_URL` | No | Alias for `CLIENT_ORIGIN` |
| `MAX_UPLOAD_SIZE_MB` | No | Max file upload size in MB (default: 15) |

### Frontend (`sinaps-project/.env.local`)

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | **Yes** | Backend API base URL (e.g. `http://localhost:5000/api`) |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | No | Google OAuth client ID for the One Tap sign-in button |

---

## Deployment

### Frontend → Vercel

1. Connect the `sinaps-project/` directory to a Vercel project.
2. Set the environment variables in Vercel's dashboard:
   - `NEXT_PUBLIC_API_URL` → your Render backend URL + `/api`
   - `NEXT_PUBLIC_GOOGLE_CLIENT_ID` → your Google OAuth web client ID

### Backend → Render

1. Connect the `sinaps-backend/` directory to a Render Web Service.
2. Set the start command: `node server.js`
3. Set all required environment variables in Render's dashboard (see table above).
4. Set `NODE_ENV=production`.

### Database → MongoDB Atlas

1. Create a free cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas).
2. Add your Render service's outbound IP to the Atlas network access list.
3. Copy the connection string to `MONGO_URI` in Render's env vars.

### Google OAuth

1. Create credentials at [console.cloud.google.com](https://console.cloud.google.com).
2. Add both the Vercel frontend URL and `localhost:3000` as authorized JavaScript origins.
3. Copy the client ID to both `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (frontend) and `GOOGLE_CLIENT_IDS` (backend).

---

## Development guidelines

| What | Where to put it |
|---|---|
| New page/route | `sinaps-project/app/<route>/page.tsx` |
| Reusable UI component | `sinaps-project/components/ui/` |
| Feature-specific component | `sinaps-project/components/<feature>/` |
| API call (fetch) | `sinaps-project/lib/api.ts` |
| Auth/token helper | `sinaps-project/lib/session.ts` |
| Backend-to-frontend data mapping | `sinaps-project/lib/mappers.ts` |
| New API endpoint | `sinaps-backend/routes/` → `controllers/` → `services/` |
| Database model | `sinaps-backend/models/` |
| Authentication / authorization logic | `sinaps-backend/middleware/auth.js` |
| File upload middleware | `sinaps-backend/middleware/upload.js` |
| AI / RAG logic | `sinaps-backend/services/geminiService.js` or `ragService.js` |
| Real-time emit helpers | `sinaps-backend/socket.js` |
| Socket.io event handlers | `sinaps-backend/server.js` (inside `io.on('connection', ...)`) |
| Knowledge base Q&A pairs | `sinaps-backend/data/knowledgeBase.js` |

---

## Troubleshooting

### Backend won't start — `JWT_SECRET` missing

In development, a fallback secret is used automatically (with a warning). In production, `JWT_SECRET` **must** be set or the process exits immediately.

### Google login fails — "Jeton Google invalide"

- Ensure `GOOGLE_CLIENT_IDS` on the backend matches the client ID used by the frontend.
- Check that your Google Cloud project has the frontend URL in the list of authorized origins.

### Socket.io connection refused / CORS error

- Verify `CLIENT_ORIGIN` (or `CLIENT_URL`) on the backend matches the frontend URL exactly (including `https://`).

### In-memory MongoDB resets on every restart

This is expected — the in-memory database is ephemeral and is seeded with demo data on each start. Set `MONGO_URI` to a real MongoDB instance to persist data.

### Frontend build fails with TypeScript errors

Run `cd sinaps-project && npx tsc --noEmit` to see all errors. Do not re-enable `ignoreBuildErrors` in `next.config.mjs` to hide them.
