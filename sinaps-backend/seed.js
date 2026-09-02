require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('./models/User');
const Agent = require('./models/Agent');
const Conversation = require('./models/Conversation');
const Message = require('./models/Message');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/sinaps';

async function seed() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected!');

    // Clear existing data
    console.log('Clearing existing data...');
    await User.deleteMany({});
    await Agent.deleteMany({});
    await Conversation.deleteMany({});
    await Message.deleteMany({});

    // 1. Create Admin and Agents
    console.log('Creating Admin & Support Agents...');
    const defaultPassword = await bcrypt.hash('password123', 10);

    const admin = await Agent.create({
      name: 'Admin Sinaps',
      email: 'admin@sinaps.com',
      password: defaultPassword,
      role: 'admin',
      status: 'approved',
      skills: ['Gestion', 'Supervision', 'SLA'],
    });

    const agent1 = await Agent.create({
      name: 'Sarah Benali',
      email: 'sarah.benali@sinaps.com',
      password: defaultPassword,
      role: 'agent',
      status: 'approved',
      skills: ['Commandes', 'Facturation', 'Retours'],
    });

    const agent2 = await Agent.create({
      name: 'Karim Mansouri',
      email: 'karim.mansouri@sinaps.com',
      password: defaultPassword,
      role: 'agent',
      status: 'approved',
      skills: ['Technique', 'Mots de passe', 'Intégration'],
    });

    const pendingAgent = await Agent.create({
      name: 'Youssef Mehdi',
      email: 'youssef.mehdi@sinaps.com',
      password: defaultPassword,
      role: 'agent',
      status: 'pending',
      skills: ['Support N1', 'Français', 'Anglais'],
    });

    // 2. Create Users
    console.log('Creating Users...');
    const user1 = await User.create({
      googleId: 'google-user-1',
      name: 'Amine Trabelsi',
      email: 'amine.trabelsi@example.com',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Amine',
    });

    const user2 = await User.create({
      googleId: 'google-user-2',
      name: 'Sonia Gharbi',
      email: 'sonia.gharbi@example.com',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sonia',
    });

    const user3 = await User.create({
      googleId: 'google-user-3',
      name: 'Omar Farouk',
      email: 'omar.farouk@example.com',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Omar',
    });

    // 3. Create Conversations & Messages
    console.log('Creating Conversations & Messages for SLA metrics...');

    const now = Date.now();

    // Conversation 1: Resolved by IA
    const conv1 = await Conversation.create({
      client: user1._id,
      handledBy: 'ia',
      status: 'resolu',
      satisfaction: {
        rating: 5,
        comment: 'Réponse rapide et parfaite par l\'IA !',
      },
      createdAt: new Date(now - 3600000 * 24),
      updatedAt: new Date(now - 3600000 * 23.8),
    });

    const c1_m1 = new Date(now - 3600000 * 24);
    const c1_m2 = new Date(c1_m1.getTime() + 12000); // 12 seconds SLA

    await Message.create({
      conversation: conv1._id,
      sender: 'client',
      content: 'Comment suivre ma commande ?',
      authorName: user1.name,
      createdAt: c1_m1,
    });

    await Message.create({
      conversation: conv1._id,
      sender: 'ia',
      content: 'Vous pouvez suivre votre commande depuis votre espace client, section "Mes commandes". Un numéro de suivi est envoyé par email dès l\'expédition. 🤖',
      authorName: 'Agent IA',
      createdAt: c1_m2,
    });

    // Conversation 2: Escalated & Resolved by Human Agent (Sarah)
    const conv2 = await Conversation.create({
      client: user2._id,
      handledBy: 'humain',
      assignedAgent: agent1._id,
      status: 'resolu',
      satisfaction: {
        rating: 4,
        comment: 'Sarah m\'a beaucoup aidé avec ma facture, merci !',
      },
      createdAt: new Date(now - 3600000 * 12),
      updatedAt: new Date(now - 3600000 * 11),
    });

    const c2_m1 = new Date(now - 3600000 * 12);
    const c2_m2 = new Date(c2_m1.getTime() + 15000); // 15 seconds IA
    const c2_m3 = new Date(c2_m1.getTime() + 45000); // 45 seconds human reply

    await Message.create({
      conversation: conv2._id,
      sender: 'client',
      content: 'J\'ai un problème de double facturation sur mon dernier paiement.',
      authorName: user2.name,
      createdAt: c2_m1,
    });

    await Message.create({
      conversation: conv2._id,
      sender: 'ia',
      content: 'Je vais vous mettre en relation avec un agent de support humain. 🤖',
      authorName: 'Agent IA',
      createdAt: c2_m2,
    });

    await Message.create({
      conversation: conv2._id,
      sender: 'humain',
      content: 'Bonjour Sonia, je suis Sarah du support Sinaps. Je viens de vérifier votre dossier et le remboursement du deuxième prélèvement a été initié.',
      authorName: agent1.name,
      createdAt: c2_m3,
    });

    await Message.create({
      conversation: conv2._id,
      sender: 'client',
      content: 'Merci infiniment Sarah, super service !',
      authorName: user2.name,
      createdAt: new Date(c2_m3.getTime() + 60000),
    });

    // Conversation 3: Pending in Agent Queue
    const conv3 = await Conversation.create({
      client: user3._id,
      handledBy: 'humain',
      status: 'en_attente',
      createdAt: new Date(now - 600000),
      updatedAt: new Date(now - 300000),
    });

    const c3_m1 = new Date(now - 600000);
    const c3_m2 = new Date(c3_m1.getTime() + 8000); // 8 seconds SLA

    await Message.create({
      conversation: conv3._id,
      sender: 'client',
      content: 'Bonjour, je n\'arrive pas à réinitialiser mon mot de passe via l\'email.',
      authorName: user3.name,
      createdAt: c3_m1,
    });

    await Message.create({
      conversation: conv3._id,
      sender: 'ia',
      content: 'Demande transmise à l\'équipe de support. Un agent humain va prendre le relais très rapidement. 🤖',
      authorName: 'Agent IA',
      createdAt: c3_m2,
    });

    console.log('✅ Seeding completed successfully!');
    console.log('--- Summary ---');
    console.log(`Admin account: admin@sinaps.com / password123`);
    console.log(`Approved Agent 1: sarah.benali@sinaps.com / password123`);
    console.log(`Approved Agent 2: karim.mansouri@sinaps.com / password123`);
    console.log(`Pending Agent: youssef.mehdi@sinaps.com / password123`);
    console.log(`Sample users created: ${[user1.name, user2.name, user3.name].join(', ')}`);
    console.log('Conversations seeded: 3 (1 IA resolved, 1 Human resolved, 1 Pending in agent queue)');

    process.exit(0);
  } catch (error) {
    console.error('Error during seeding:', error);
    process.exit(1);
  }
}

seed();
