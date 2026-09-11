# sinaps-project — Frontend

Next.js frontend for the SINAPS support platform.

See the [root README](../README.md) for the full project overview.

---

## Structure

```
app/
  page.tsx             → Root route "/" — renders the client chat widget
  layout.tsx           → HTML shell, font, global providers (Toaster, TooltipProvider)
  globals.css          → Tailwind base styles + CSS variables
  login/page.tsx       → Agent / admin login form
  agent/
    page.tsx           → Agent inbox (support console)
    signup/page.tsx    → Agent registration request page
  admin/page.tsx       → Admin dashboard (protected by AuthGuard)

components/
  auth-guard.tsx       → Client-side auth check + logout helper
  admin/
    admin-dashboard.tsx      → Dashboard layout + data orchestrator
    stats-panel.tsx          → KPI cards and AI/human breakdown chart
    agent-table.tsx          → Pending agents + validated agents tables
    conversation-history.tsx → Filterable conversation history table
  agent/
    agent-signup-form.tsx    → New agent registration form
  chat/
    support-chat-app.tsx     → Client chat orchestrator component
    chat-header.tsx          → Header with escalation button
    chat-thread.tsx          → Message list renderer
    client-entry-form.tsx    → Google OAuth / email entry form
    conversation-sidebar.tsx → Conversation list sidebar (agent view)
    markdown-content.tsx     → Markdown renderer for AI messages
    message-composer.tsx     → Text input + file attachment sender
    quick-prompts.tsx        → Quick-reply suggestion chips
    satisfaction-dialog.tsx  → Post-conversation rating dialog
    status-badge.tsx         → Colored status label (en_cours, en_attente, resolu)
  ui/                  → 24 reusable shadcn-style primitives

lib/
  api.ts       → All fetch-based API call functions
  session.ts   → Token storage helpers (sinaps_token, sinaps_client)
  mappers.ts   → Backend JSON → frontend typed object transformations
  socket.ts    → socket.io-client singleton + room helpers
  types.ts     → Shared TypeScript interfaces (Conversation, ChatMessage, Agent…)
  utils.ts     → cn() (Tailwind class merger), getInitials()
  chat-data.ts → statusLabels map + type re-exports
```

---

## Local setup

```bash
cp .env.example .env.local
npm install
npm run dev     # http://localhost:3000
```

## Build

```bash
npm run build
npm run start
```

---

## Key environment variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend API URL, e.g. `http://localhost:5000/api` |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google OAuth web client ID for the One Tap sign-in button |
