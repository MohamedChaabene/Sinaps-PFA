const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

require('dotenv').config();
process.env.JWT_SECRET = process.env.JWT_SECRET || 'sinaps-super-secret-key-pfa-2026';
const http = require('http');
const express = require('express');
const cors = require('cors');
const path = require('path');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const { setIO } = require('./socket');

require('./models/User');
require('./models/Agent');
require('./models/Conversation');
require('./models/Message');

const conversationRoutes = require('./routes/conversationRoutes');
const messageRoutes = require('./routes/messageRoutes');
const userRoutes = require('./routes/userRoutes');
const agentRoutes = require('./routes/agentRoutes');
const statsRoutes = require('./routes/statsRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  },
});

setIO(io);

io.on('connection', (socket) => {
  socket.on('join_conversation', (conversationId) => {
    if (conversationId) {
      socket.join(`conversation_${conversationId}`);
    }
  });

  socket.on('leave_conversation', (conversationId) => {
    if (conversationId) {
      socket.leave(`conversation_${conversationId}`);
    }
  });

  socket.on('disconnect', () => {});
});

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

connectDB();

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend Sinaps opérationnel 🚀' });
});

app.use('/api/conversations', conversationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/users', userRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/upload', uploadRoutes);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`✅ Serveur avec WebSockets démarré sur http://localhost:${PORT}`);
});
