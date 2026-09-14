/**
 * Migration: Classify existing QA/audit conversations as test data
 * 
 * This migration safely marks specific known QA/audit conversations as test data
 * to prevent them from appearing in the default Admin history.
 * 
 * IMPORTANT SAFETY FEATURES:
 * - Dry-run mode: Check what would be changed without actually changing it
 * - Exact name matching: Only matches specific, known test client names
 * - Idempotent: Can be run multiple times safely
 * - Reversible: Can unclassify data if needed
 * - Detailed logging: Logs every action for audit trail
 * 
 * DO NOT RUN THIS IN PRODUCTION WITHOUT EXPLICIT APPROVAL
 * This is a targeted migration for specific conversation IDs or client names.
 */

const mongoose = require('mongoose');
const Conversation = require('../models/Conversation');
const User = require('../models/User');

// Specific client names that are known QA/audit records
// These are based on Manus's production audit findings
// Using EXACT name matching to avoid false positives on legitimate users
const TEST_CLIENT_NAMES = [
  'IDOR Audit Client B 20260913',
  'IDOR Audit Client A 20260913', 
  'P3 Audit QA 20260913',
  'QA Escalation Fresh',
  'QA Client 20260913 0345',
  'P1 Regression QA',
  'QA Test User',
  'Marc Bug002 Fix QA',
  'Claire Bug002 QA',
  'Nadia Regression QA',
  'Sophie Martin QA',
  'QA Escalation Client',
  'QA Test Client'
];

async function classifyTestData({ dryRun = false, reverse = false } = {}) {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sinaps');
    
    console.log(`Mode: ${dryRun ? 'DRY RUN (no changes will be made)' : 'LIVE (changes will be applied)'}`);
    console.log(`Operation: ${reverse ? 'REVERSE (unclassify test data)' : 'FORWARD (classify test data)'}`);
    
    console.log('Finding users with test client names...');
    
    // First, find User IDs that match the test client names (exact match only)
    const testUsers = await User.find({
      name: { $in: TEST_CLIENT_NAMES }
    });
    
    console.log(`Found ${testUsers.length} test users with exact name matches`);
    
    if (testUsers.length === 0) {
      console.log('No test users found. Migration complete.');
      return;
    }
    
    // Log each user found for verification
    testUsers.forEach(user => {
      console.log(`  - User: ${user.name} (ID: ${user._id})`);
    });
    
    const testUserIds = testUsers.map(u => u._id);
    
    console.log('Finding conversations associated with test users...');
    
    // Find conversations that belong to these test users
    const conversations = await Conversation.find({
      client: { $in: testUserIds }
    });
    
    console.log(`Found ${conversations.length} conversations to ${reverse ? 'unclassify' : 'classify'} as test data`);
    
    if (conversations.length === 0) {
      console.log('No conversations found. Migration complete.');
      return;
    }
    
    // Log each conversation for verification
    conversations.forEach(conv => {
      console.log(`  - Conversation ID: ${conv._id}, Current isTestData: ${conv.isTestData}`);
    });
    
    if (dryRun) {
      console.log('DRY RUN COMPLETE - No changes were made to the database');
      return;
    }
    
    // Update each conversation to mark/unmark as test data
    const updatePromises = conversations.map(conv => 
      Conversation.findByIdAndUpdate(conv._id, { isTestData: !reverse })
    );
    
    await Promise.all(updatePromises);
    
    console.log(`Successfully ${reverse ? 'unclassified' : 'classified'} ${conversations.length} conversations as test data`);
    
    // Log the updated conversation IDs for verification
    const updatedIds = conversations.map(c => c._id);
    console.log('Updated conversation IDs:', updatedIds);
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the migration if executed directly
if (require.main === module) {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const reverse = args.includes('--reverse');
  
  if (dryRun) {
    console.log('⚠️  DRY RUN MODE - No changes will be made to the database');
  }
  
  if (reverse) {
    console.log('⚠️  REVERSE MODE - Will UNCLASSIFY test data (set isTestData: false)');
  }
  
  classifyTestData({ dryRun, reverse })
    .then(() => {
      console.log('Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { classifyTestData, TEST_CLIENT_NAMES };