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
    io.emit(event, data); // broadcast globally for list updates if needed
  }
}

function emitGlobal(event, data) {
  if (io) {
    io.emit(event, data);
  }
}

module.exports = {
  setIO,
  getIO,
  emitToConversation,
  emitGlobal,
};
