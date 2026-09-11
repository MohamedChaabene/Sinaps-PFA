# sinaps-backend — Backend

Express + Socket.io backend for the SINAPS support platform.

See the [root README](../README.md) for the full project overview.

---

## Structure

```
server.js       Entry point. Creates the HTTP server, initializes Socket.io,
                registers JWT socket auth middleware, and handles WS events.
app.js          Express app setup: CORS, Helmet, rate limiters, route mounting,
                centralized error handler.
socket.js       Socket.io singleton + emit helpers used across controllers.

config/
  db.js         MongoDB connection logic:
                  1. Uses MONGO_URI if set (MongoDB Atlas or remote)
                  2. Falls back to local MongoDB (127.0.0.1:27017)
                  3. Falls back to MongoMemoryServer + demo seed data

middleware/
  auth.js       JWT authentication and authorization guards:
                  requireAuth         — any valid agent/admin JWT
                  requireAdmin        — admin role only
                  requireAgentOrAdmin — agent or admin role
                  requireClientAuth   — valid client JWT
                  requireConversationAccess — agent/admin OR the conversation's own client
                  requireSenderAuth   — validates sender field on POST /messages
                  requireAnySession   — any valid JWT (client or agent/admin)
  upload.js     Multer configuration for file uploads (storage, fileFilter,
                size limits, error-handling wrapper).

models/
  User.js         Client users (googleId, name, email, avatar)
  Agent.js        Support agents/admins (name, email, password, role, skills, status)
  Conversation.js Client support threads (client ref, assignedAgent, status, handledBy,
                  satisfaction rating)
  Message.js      Messages within a conversation (sender, content, attachments)

routes/           Thin Express routers — only wire middleware + controller
controllers/      Request handlers — validate input, call services/models, emit events
services/
  geminiService.js  Calls Google Gemini API with RAG-grounded prompts.
                    Falls back to RAG-only answers if the API key is missing.
  ragService.js     TF-IDF + cosine similarity retriever over knowledgeBase.js.
data/
  knowledgeBase.js  Q&A pairs used as the RAG knowledge source.
utils/
  queryHelpers.js   populateConversation() — shared Mongoose populate chain.
seed.js           Populates the database with demo agents, users, and conversations.
tests/            Jest test suite (API, auth middleware, RAG, uploads).
uploads/          Runtime file storage directory (git-ignored).
```

---

## API endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/health` | None | Health check |
| POST | `/api/users/find-or-create` | None | Find or create a client user (Google or email) |
| GET | `/api/users` | Admin | List all users |
| POST | `/api/agents/signup` | None | Request agent account |
| POST | `/api/agents/login` | None | Agent login → JWT |
| GET | `/api/agents/me` | Agent/Admin | Get own profile |
| GET | `/api/agents` | Admin | List all agents |
| PATCH | `/api/agents/:id/approve` | Admin | Approve pending agent |
| DELETE | `/api/agents/:id` | Admin | Reject/delete agent |
| POST | `/api/conversations/find-or-create` | Client | Get or create client's active conversation |
| GET | `/api/conversations` | Agent/Admin | List all conversations |
| GET | `/api/conversations/:id` | Agent/Admin or own Client | Get conversation + messages |
| PATCH | `/api/conversations/:id/escalate` | Conversation access | Switch to human handling |
| PATCH | `/api/conversations/:id/de-escalate` | Conversation access | Switch back to AI |
| PATCH | `/api/conversations/:id/assign` | Agent/Admin | Assign agent to conversation |
| PATCH | `/api/conversations/:id/close` | Conversation access | Close with satisfaction rating |
| POST | `/api/messages` | Client or Agent/Admin | Send a message |
| GET | `/api/stats` | Admin | Aggregate KPI stats |
| POST | `/api/upload` | Any session | Upload a file attachment |

---

## Socket.io events

### Client → Server

| Event | Payload | Description |
|---|---|---|
| `join_conversation` | `conversationId: string` | Join a conversation room (auth checked server-side) |
| `leave_conversation` | `conversationId: string` | Leave a conversation room |
| `typing_status` | `{ conversationId, isTyping, sender, authorName }` | Broadcast typing indicator |

### Server → Client

| Event | Room | Description |
|---|---|---|
| `message_received` | `conversation_<id>` | New message (client or agent) |
| `typing_status` | `conversation_<id>` | Typing indicator update |
| `conversation_updated` | `conversation_<id>` + `agents_room` | Status/assignment changed |
| `conversation_created` | `agents_room` | New conversation opened |

---

## Local setup

```bash
cp .env.example .env
npm install
npm run dev     # nodemon — hot reload on http://localhost:5000
```

## Tests

```bash
npm test        # Jest with --detectOpenHandles
```

## Seed demo data

```bash
npm run seed    # requires MONGO_URI to be set
```

---

## Environment variables

See [`.env.example`](.env.example) for the full list with descriptions.

> **Important**: In production, `JWT_SECRET` must be set to a cryptographically random string. The process will refuse to start without it.
