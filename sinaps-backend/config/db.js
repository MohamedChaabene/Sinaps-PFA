const mongoose = require('mongoose');

let memoryServerInstance = null;

async function connectDB() {
  const customUri = process.env.MONGO_URI;
  const isLocalhost = !customUri || customUri.includes('127.0.0.1') || customUri.includes('localhost');

  // If a remote URI is provided (e.g. MongoDB Atlas)
  if (customUri && !isLocalhost) {
    try {
      await mongoose.connect(customUri);
      console.log('✅ MongoDB distant connecté via MONGO_URI');
      return;
    } catch (error) {
      console.error('❌ Erreur de connexion MongoDB (MONGO_URI) :', error.message);
      process.exit(1);
    }
  }

  // Otherwise, attempt local MongoDB connection
  const localUri = customUri || 'mongodb://127.0.0.1:27017/sinaps';
  try {
    await mongoose.connect(localUri, { serverSelectionTimeoutMS: 2000 });
    console.log(`✅ MongoDB local connecté (${localUri})`);
    return;
  } catch (localError) {
    // If local MongoDB is not reachable, fall back to embedded MongoMemoryServer
    console.warn(`ℹ️ Serveur MongoDB local non disponible (${localUri}).`);
    console.log('🚀 Démarrage automatique d\'une base MongoDB en mémoire (MongoMemoryServer)...');

    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      memoryServerInstance = await MongoMemoryServer.create();
      const memoryUri = memoryServerInstance.getUri();
      await mongoose.connect(memoryUri);
      console.log('✅ Base MongoDB en mémoire connectée !');

      // Auto-populate demo data so all demo accounts and SLA metrics are immediately available
      const { populateDemoData } = require('../seed');
      await populateDemoData();
      console.log('🌱 Données de démo initialisées avec succès !');
      console.log('👉 Comptes prêts : admin@sinaps.com (password123), sarah.benali@sinaps.com (password123)');
    } catch (memError) {
      console.error('❌ Échec du démarrage de MongoDB en mémoire :', memError.message);
      process.exit(1);
    }
  }
}

// Clean shutdown handler for the embedded memory server
process.on('SIGINT', async () => {
  if (memoryServerInstance) {
    await memoryServerInstance.stop();
  }
  process.exit(0);
});

module.exports = connectDB;