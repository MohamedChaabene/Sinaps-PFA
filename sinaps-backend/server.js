if (process.env.DNS_OVERRIDE === 'true') {
  const dns = require('dns');
  dns.setServers(['8.8.8.8', '8.8.4.4']);
}

require('dotenv').config();

if (!process.env.JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ ERREUR FATALE : JWT_SECRET doit être impérativement défini en production.');
    process.exit(1);
  }
  console.warn('⚠️ AVERTISSEMENT : JWT_SECRET non configuré dans .env, clé de test utilisée.');
  process.env.JWT_SECRET = 'sinaps-super-secret-key-pfa-2026';
}

const http = require('http');
const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const { setIO } = require('./socket');
const Conversation = require('./models/Conversation');
const Agent = require('./models/Agent');
const app = require('./app');

const server = http.createServer(app);

const allowedOrigins = [
  process.env.CLIENT_ORIGIN,
  process.env.CLIENT_URL,
  'http://localhost:3000',
  'http://127.0.0.1:3000',
].filter(Boolean);

const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' ? allowedOrigins : '*',
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    credentials: true,
  },
});

setIO(io);

// IMP-002: Authenticate Socket.io connection handshake via JWT token
io.use(async (socket, next) => {
  const token =
    socket.handshake.auth?.token ||
    (socket.handshake.headers?.authorization
      ? socket.handshake.headers.authorization.replace(/^Bearer\s+/i, '')
      : null);

  if (!token) return next(new Error('Authentification requise'));

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role === 'agent' || decoded.role === 'admin') {
      const agent = await Agent.findOne({
        _id: decoded.id,
        role: decoded.role,
        status: 'approved',
      }).select('_id');
      if (!agent) return next(new Error('Session agent invalide ou expirée'));
    } else if (decoded.role !== 'client') {
      return next(new Error('Token invalide'));
    }
    socket.user = decoded;
    next();
  } catch (err) {
    next(new Error('Token invalide'));
  }
});

io.on('connection', (socket) => {
  // Automatically subscribe authenticated support agents and admins to 'agents_room'
  if (socket.user && (socket.user.role === 'agent' || socket.user.role === 'admin')) {
    socket.join('agents_room');
  }

  // Join a specific conversation room with authorization check
  socket.on('join_conversation', async (conversationId) => {
    if (!conversationId) return;

    if (socket.user) {
      if (socket.user.role === 'agent' || socket.user.role === 'admin') {
        return socket.join(`conversation_${conversationId}`);
      }
      if (socket.user.role === 'client') {
        try {
          const conversation = await Conversation.findById(conversationId).select('client');
          if (conversation && conversation.client.toString() === socket.user.id) {
            return socket.join(`conversation_${conversationId}`);
          }
        } catch (error) {
          console.warn('Socket join_conversation error:', error.message);
        }
      }
    }
  });

  socket.on('leave_conversation', (conversationId) => {
    if (conversationId) {
      socket.leave(`conversation_${conversationId}`);
    }
  });

  // IMP-012: Real-time typing status event
  socket.on('typing_status', async ({ conversationId, isTyping, authorName } = {}) => {
    if (!conversationId || !socket.user) return;

    try {
      const conversation = await Conversation.findById(conversationId).select('client');
      if (!conversation) return;

      const isStaff = socket.user.role === 'agent' || socket.user.role === 'admin';
      const ownsConversation =
        socket.user.role === 'client' && conversation.client.toString() === socket.user.id;

      if (!isStaff && !ownsConversation) return;

      socket.to(`conversation_${conversationId}`).emit('typing_status', {
        conversationId,
        isTyping,
        sender: isStaff ? 'humain' : 'client',
        authorName,
      });
    } catch (error) {
      console.warn('Socket typing_status authorization error:', error.message);
    }
  });

  socket.on('disconnect', () => {});
});

connectDB();

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`✅ Serveur avec WebSockets sécurisés démarré sur http://localhost:${PORT}`);
});
