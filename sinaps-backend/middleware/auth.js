const jwt = require('jsonwebtoken');
const Conversation = require('../models/Conversation');

function decodeBearerToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  const token = authHeader.split(' ')[1];
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return undefined; // present but invalid/expired, distinct from "absent"
  }
}

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Non authentifié' });

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.agent = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token invalide' });
  }
}

function requireAdmin(req, res, next) {
  if (req.agent.role !== 'admin') return res.status(403).json({ error: 'Accès réservé aux administrateurs' });
  next();
}

function requireAgentOrAdmin(req, res, next) {
  if (req.agent.role !== 'agent' && req.agent.role !== 'admin') {
    return res.status(403).json({ error: 'Accès réservé aux agents de support' });
  }
  next();
}

// Strict guard for the client's own session token (issued after Google
// verification or the interim direct name/email flow). Used on routes that
// only make sense as "act as the client I already identified as".
function requireClientAuth(req, res, next) {
  const decoded = decodeBearerToken(req);
  if (decoded === null) return res.status(401).json({ error: 'Session client requise' });
  if (decoded === undefined) return res.status(401).json({ error: 'Session client invalide ou expirée' });
  if (decoded.role !== 'client') return res.status(403).json({ error: 'Jeton invalide pour un client' });
  req.client = decoded;
  next();
}

// For routes with a conversation :id param: allow either an authenticated
// agent/admin, or the client who owns that specific conversation. Previously
// these routes had no auth at all, so anyone with (or guessing) a
// conversation ID could read or mutate someone else's support thread.
async function requireConversationAccess(req, res, next) {
  const decoded = decodeBearerToken(req);
  if (decoded === null) return res.status(401).json({ error: 'Authentification requise' });
  if (decoded === undefined) return res.status(401).json({ error: 'Session invalide ou expirée' });

  if (decoded.role === 'agent' || decoded.role === 'admin') {
    req.agent = decoded;
    return next();
  }

  if (decoded.role === 'client') {
    try {
      const conversation = await Conversation.findById(req.params.id).select('client');
      if (!conversation) return res.status(404).json({ error: 'Conversation introuvable' });
      if (conversation.client.toString() !== decoded.id) {
        return res.status(403).json({ error: "Cette conversation ne vous appartient pas" });
      }
      req.client = decoded;
      return next();
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(403).json({ error: 'Accès refusé' });
}

// POST /api/messages: sender: 'humain' must come from an authenticated
// agent/admin (see prior fix). sender: 'client' must now come from the
// client's own token, matched against the conversation it's posted into.
// sender: 'ia' is never accepted from an external request — it's only ever
// created internally by messageController after a client message.
async function requireSenderAuth(req, res, next) {
  const { sender, conversationId } = req.body || {};

  if (sender === 'humain') {
    return requireAuth(req, res, () => requireAgentOrAdmin(req, res, next));
  }

  if (sender === 'client') {
    const decoded = decodeBearerToken(req);
    if (decoded === null) return res.status(401).json({ error: 'Session client requise' });
    if (decoded === undefined) return res.status(401).json({ error: 'Session client invalide ou expirée' });
    if (decoded.role !== 'client') return res.status(403).json({ error: 'Jeton invalide pour un client' });

    try {
      const conversation = await Conversation.findById(conversationId).select('client');
      if (!conversation) return res.status(404).json({ error: 'Conversation introuvable' });
      if (conversation.client.toString() !== decoded.id) {
        return res.status(403).json({ error: "Cette conversation ne vous appartient pas" });
      }
      req.client = decoded;
      return next();
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(403).json({ error: "Type d'expéditeur non autorisé" });
}

// For routes that just need "someone we've identified" — not a specific
// role. Currently used by the upload endpoint: anyone with a client or
// agent/admin session can attach a file to their own conversation, but a
// completely anonymous request cannot use the server as a free file host.
function requireAnySession(req, res, next) {
  const decoded = decodeBearerToken(req);
  if (decoded === null) return res.status(401).json({ error: 'Authentification requise' });
  if (decoded === undefined) return res.status(401).json({ error: 'Session invalide ou expirée' });

  if (decoded.role === 'client') req.client = decoded;
  else req.agent = decoded;
  next();
}

module.exports = {
  requireAuth,
  requireAdmin,
  requireAgentOrAdmin,
  requireClientAuth,
  requireConversationAccess,
  requireSenderAuth,
  requireAnySession,
};