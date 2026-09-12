const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Agent = require('./models/Agent');

// Remote MongoDB URI from parent project
const MONGO_URI = 'mongodb+srv://chbnmed1_db_user:Sj9bNfJPfqiL5znP@sinaps-cluster.hdduslz.mongodb.net/sinaps?retryWrites=true&w=majority';

const accounts = [
  {
    email: 'admin@sinaps.com',
    name: 'Admin Sinaps',
    role: 'admin',
    status: 'approved',
    password: 'password123'
  },
  {
    email: 'sarah.benali@sinaps.com',
    name: 'Sarah Benali',
    role: 'agent',
    status: 'approved',
    skills: ['Commandes', 'Facturation', 'Retours'],
    password: 'password123'
  },
  {
    email: 'karim.mansouri@sinaps.com',
    name: 'Karim Mansouri',
    role: 'agent',
    status: 'approved',
    skills: ['Technique', 'Mots de passe', 'Intégration'],
    password: 'password123'
  }
];

async function createTestAccounts() {
  try {
    console.log('Connecting to remote MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected successfully');

    for (const account of accounts) {
      const hashedPassword = await bcrypt.hash(account.password, 10);
      
      const result = await Agent.findOneAndUpdate(
        { email: account.email },
        {
          name: account.name,
          email: account.email,
          password: hashedPassword,
          role: account.role,
          status: account.status,
          skills: account.skills || []
        },
        { upsert: true, new: true }
      );

      console.log(`✓ Account upserted: ${account.email} (${account.role})`);
    }

    console.log('\nVerifying accounts...');
    const agents = await Agent.find({
      email: { $in: accounts.map(a => a.email) }
    }).select('email name role status skills -_id');

    console.log('\nCurrent accounts in database:');
    agents.forEach(agent => {
      console.log(`- ${agent.email}: ${agent.name}, role: ${agent.role}, status: ${agent.status}, skills: ${agent.skills?.join(', ') || 'none'}`);
    });

    console.log('\n✓ All 3 test accounts are ready');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

createTestAccounts();
