let io = null;

function setIO(socketIOInstance) {
  io = socketIOInstance;
}

function getIO() {
  if (!io) {
    console.warn('Socket.io instance not initialized yet');
  }
  return io;
}

function emitToConversation(conversationId, event, data) {
  if (io) {
    io.to(`conversation_${conversationId}`).emit(event, data);
  }
}

// Emits only to authenticated support agents & admins in 'agents_room'
function emitToAgents(event, data) {
  if (io) {
    io.to('agents_room').emit(event, data);
  }
}

// Fallback global emitter for broadcast events
function emitGlobal(event, data) {
  if (io) {
    // For conversation lists, send to agents_room to avoid data leakage to public clients
    if (event === 'conversation_created' || event === 'conversation_updated') {
      io.to('agents_room').emit(event, data);
    } else {
      io.emit(event, data);
    }
  }
}

module.exports = {
  setIO,
  getIO,
  emitToConversation,
  emitToAgents,
  emitGlobal,
};
