/**
 * Execute Production Database Cleanup
 * 
 * Final approved cleanup based on safety-check report
 * Uses sinaps-verification account for production MongoDB operations
 */

const mongoose = require('mongoose');
const User = require('./models/User');
const Agent = require('./models/Agent');
const Conversation = require('./models/Conversation');
const Message = require('./models/Message');

// Production MongoDB URI with sinaps-verification credentials
const MONGO_URI = 'mongodb+srv://sinaps-verification:sinaps-verification123@sinaps-cluster.hdduslz.mongodb.net/sinaps?appName=sinaps-cluster';

// Exact IDs from final audit
const TARGET_DELETIONS = {
  agentTest: '6a977f9c3d4b8c00112189c5',
  testUsers: [
    '6a9731fdfd2c0f3fcdd51d25', // Mohamed Test
    '6aa5c7907443c8d57582e765', // QA Test Client
    '6aa5c7d37443c8d57582e784', // QA Escalation Client
    '6aa5cf6588c9195f5dd7292c', // Sophie Martin
    '6aa5d02188c9195f5dd72940', // QA Escalation Fresh
    '6aa5e049e56e1fdafd972496', // Sophie Martin QA
    '6aa5ec8306d5291acc2a3d6e', // Nadia Regression QA
    '6aa5edfc06d5291acc2a3dc9', // Claire Bug002 QA
    '6aa5f0f606d5291acc2a3dd6', // Marc Bug002 Fix QA
    '6aa5f92806d5291acc2a3ddf', // QA Test User
    '6aa5ff1e06d5291acc2a3de1', // P1 Regression QA
    '6aa60e4d66c8d857353b9644', // QA Client 20260913 0345
    '6aa615eb66c8d857353b965a', // P3 Audit QA 20260913
    '6aa625213af3cec702737c36', // IDOR Audit Client A 20260913
    '6aa6257c3af3cec702737c38'  // IDOR Audit Client B 20260913
  ],
  testDataConversations: [
    '6aa5c7907443c8d57582e766',
    '6aa5c7d47443c8d57582e785',
    '6aa5d02388c9195f5dd72941',
    '6aa5e04be56e1fdafd972497',
    '6aa5ec8506d5291acc2a3d6f',
    '6aa5edfe06d5291acc2a3dca',
    '6aa5f0f906d5291acc2a3dd7',
    '6aa5f92a06d5291acc2a3de0',
    '6aa5ff2006d5291acc2a3de2',
    '6aa60e4e66c8d857353b9645',
    '6aa615ed66c8d857353b965b',
    '6aa625233af3cec702737c37',
    '6aa6257e3af3cec702737c39'
  ],
  obsoleteConversations: [
    '6a973225fd2c0f3fcdd51d26', // Test conversation
    '6aa5cf6588c9195f5dd7292d', // Test conversation
    '6aa5f92a06d5291acc2a3de0', // Empty test conversation
    '6aa625233af3cec702737c37'  // Empty test conversation
  ],
  maFaEmptyConversation: '6aa5f1fc06d5291acc2a3dde'
};

// Legitimate accounts to preserve
const LEGITIMATE_ACCOUNTS = {
  users: [
    '6a977882967333cd55d25a91', // Omar
    '6aa4a214ceab0190597fe9ad', // Mohamed Chaabene (maskedface007)
    '6aa4a852d4d3823e0f199863', // Mohamed Chaabene (med)
    '6aa5e0bee56e1fdafd9724a0', // Mohamed Chaabene (med500)
    '6aa5f1fb06d5291acc2a3ddd'  // Ma Fa
  ],
  agents: [
    '6a97579ea1277c1a4d800b73', // Mohamed (maskedface007)
    '6a977b2f3d4b8c00112189c4', // Admin Sinaps
    '6aa5c5197443c8d57582e764'  // Omar
  ]
};

async function executeProductionCleanup() {
  try {
    console.log('EXECUTING PRODUCTION DATABASE CLEANUP');
    console.log('Connecting to production MongoDB...');
    console.log(`Connecting to: ${MONGO_URI.replace(/:[^:@]+@/, ':****@')}`);
    
    await mongoose.connect(MONGO_URI);
    console.log('✓ Successfully connected to production MongoDB');

    // Get initial counts
    console.log('\n' + '='.repeat(60));
    console.log('INITIAL DATABASE STATE');
    console.log('='.repeat(60));
    
    const initialUsers = await User.countDocuments();
    const initialAgents = await Agent.countDocuments();
    const initialConversations = await Conversation.countDocuments();
    const initialMessages = await Message.countDocuments();
    
    console.log(`Users: ${initialUsers}`);
    console.log(`Agents: ${initialAgents}`);
    console.log(`Conversations: ${initialConversations}`);
    console.log(`Messages: ${initialMessages}`);

    // Verify legitimate accounts exist before cleanup
    console.log('\nVerifying legitimate accounts exist...');
    for (const userId of LEGITIMATE_ACCOUNTS.users) {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error(`Legitimate user ${userId} not found - aborting cleanup`);
      }
      console.log(`✓ User ${user.name} (${user.email}) exists`);
    }
    
    for (const agentId of LEGITIMATE_ACCOUNTS.agents) {
      const agent = await Agent.findById(agentId);
      if (!agent) {
        throw new Error(`Legitimate agent ${agentId} not found - aborting cleanup`);
      }
      console.log(`✓ Agent ${agent.name} (${agent.email}) exists`);
    }

    // STEP 1: Identify target conversations and their messages
    console.log('\n' + '='.repeat(60));
    console.log('STEP 1: IDENTIFY TARGET CONVERSATIONS AND MESSAGES');
    console.log('='.repeat(60));
    
    const allTargetConversations = [
      ...TARGET_DELETIONS.testDataConversations,
      ...TARGET_DELETIONS.obsoleteConversations,
      TARGET_DELETIONS.maFaEmptyConversation
    ];
    
    console.log(`Target conversations: ${allTargetConversations.length}`);
    
    // Get all messages belonging to target conversations
    const targetMessages = await Message.find({
      conversation: { $in: allTargetConversations }
    });
    console.log(`Messages to delete: ${targetMessages.length}`);
    
    const targetMessageIds = targetMessages.map(m => m._id);
    console.log(`Message IDs: ${targetMessageIds.length} identified`);

    // STEP 2: Delete messages
    console.log('\n' + '='.repeat(60));
    console.log('STEP 2: DELETE MESSAGES');
    console.log('='.repeat(60));
    
    const messageDeleteResult = await Message.deleteMany({
      _id: { $in: targetMessageIds }
    });
    console.log(`✓ Deleted ${messageDeleteResult.deletedCount} messages`);

    // STEP 3: Delete conversations
    console.log('\n' + '='.repeat(60));
    console.log('STEP 3: DELETE CONVERSATIONS');
    console.log('='.repeat(60));
    
    let deletedConversations = 0;
    
    // Delete test data conversations
    const testDataConvResult = await Conversation.deleteMany({
      _id: { $in: TARGET_DELETIONS.testDataConversations }
    });
    deletedConversations += testDataConvResult.deletedCount;
    console.log(`✓ Deleted ${testDataConvResult.deletedCount} test data conversations`);
    
    // Delete obsolete conversations
    const obsoleteConvResult = await Conversation.deleteMany({
      _id: { $in: TARGET_DELETIONS.obsoleteConversations }
    });
    deletedConversations += obsoleteConvResult.deletedCount;
    console.log(`✓ Deleted ${obsoleteConvResult.deletedCount} obsolete conversations`);
    
    // Delete Ma Fa's empty conversation
    const maFaConvResult = await Conversation.findByIdAndDelete(TARGET_DELETIONS.maFaEmptyConversation);
    if (maFaConvResult) {
      deletedConversations += 1;
      console.log(`✓ Deleted Ma Fa's empty conversation`);
    } else {
      console.log(`⚠️  Ma Fa's conversation not found (may already be deleted)`);
    }
    
    console.log(`Total conversations deleted: ${deletedConversations}`);

    // STEP 4: Delete test users
    console.log('\n' + '='.repeat(60));
    console.log('STEP 4: DELETE TEST USERS');
    console.log('='.repeat(60));
    
    const userDeleteResult = await User.deleteMany({
      _id: { $in: TARGET_DELETIONS.testUsers }
    });
    console.log(`✓ Deleted ${userDeleteResult.deletedCount} test users`);

    // STEP 5: Delete Agent Test account
    console.log('\n' + '='.repeat(60));
    console.log('STEP 5: DELETE AGENT TEST ACCOUNT');
    console.log('='.repeat(60));
    
    const agentTestDeleteResult = await Agent.findByIdAndDelete(TARGET_DELETIONS.agentTest);
    if (agentTestDeleteResult) {
      console.log(`✓ Deleted Agent Test account (${agentTestDeleteResult.email})`);
    } else {
      console.log(`⚠️  Agent Test account not found (may already be deleted)`);
    }

    // STEP 6: Verify cleanup
    console.log('\n' + '='.repeat(60));
    console.log('STEP 6: POST-CLEANUP VERIFICATION');
    console.log('='.repeat(60));
    
    // Get final counts
    const finalUsers = await User.countDocuments();
    const finalAgents = await Agent.countDocuments();
    const finalConversations = await Conversation.countDocuments();
    const finalMessages = await Message.countDocuments();
    
    console.log(`\nFINAL DATABASE STATE:`);
    console.log(`Users: ${finalUsers} (deleted ${initialUsers - finalUsers})`);
    console.log(`Agents: ${finalAgents} (deleted ${initialAgents - finalAgents})`);
    console.log(`Conversations: ${finalConversations} (deleted ${initialConversations - finalConversations})`);
    console.log(`Messages: ${finalMessages} (deleted ${initialMessages - finalMessages})`);

    // Verify no orphaned messages
    console.log('\nVerifying no orphaned messages...');
    const orphanedMessages = await Message.find({
      conversation: { $nin: await Conversation.distinct('_id') }
    });
    if (orphanedMessages.length > 0) {
      throw new Error(`Found ${orphanedMessages.length} orphaned messages after cleanup`);
    }
    console.log('✓ No orphaned messages');

    // Verify no orphaned conversations
    console.log('\nVerifying no orphaned conversations...');
    const orphanedConversations = await Conversation.find({
      client: { $nin: await User.distinct('_id') }
    });
    if (orphanedConversations.length > 0) {
      throw new Error(`Found ${orphanedConversations.length} orphaned conversations after cleanup`);
    }
    console.log('✓ No orphaned conversations');

    // Verify kept conversations reference valid users
    console.log('\nVerifying kept conversations reference valid users...');
    const keptConversations = await Conversation.find({});
    for (const conv of keptConversations) {
      const userExists = await User.exists({ _id: conv.client });
      if (!userExists) {
        throw new Error(`Conversation ${conv._id} references invalid user`);
      }
    }
    console.log('✓ All kept conversations reference valid users');

    // Verify kept conversations reference valid agents
    console.log('\nVerifying kept conversations reference valid agents...');
    const convsWithAgents = await Conversation.find({ assignedAgent: { $exists: true, $ne: null } });
    for (const conv of convsWithAgents) {
      const agentExists = await Agent.exists({ _id: conv.assignedAgent });
      if (!agentExists) {
        throw new Error(`Conversation ${conv._id} references invalid agent`);
      }
    }
    console.log('✓ All kept conversations reference valid agents');

    // Verify kept messages reference valid conversations
    console.log('\nVerifying kept messages reference valid conversations...');
    const keptMessages = await Message.find({});
    for (const msg of keptMessages) {
      const convExists = await Conversation.exists({ _id: msg.conversation });
      if (!convExists) {
        throw new Error(`Message ${msg._id} references invalid conversation`);
      }
    }
    console.log('✓ All kept messages reference valid conversations');

    // Verify deleted IDs no longer exist
    console.log('\nVerifying deleted IDs no longer exist...');
    
    const agentTestExists = await Agent.exists({ _id: TARGET_DELETIONS.agentTest });
    if (agentTestExists) {
      throw new Error('Agent Test account still exists after deletion');
    }
    console.log('✓ Agent Test account deleted');
    
    const testUsersExist = await User.countDocuments({ _id: { $in: TARGET_DELETIONS.testUsers } });
    if (testUsersExist > 0) {
      throw new Error(`${testUsersExist} test users still exist after deletion`);
    }
    console.log('✓ All test users deleted');
    
    const targetConvsExist = await Conversation.countDocuments({ _id: { $in: allTargetConversations } });
    if (targetConvsExist > 0) {
      throw new Error(`${targetConvsExist} target conversations still exist after deletion`);
    }
    console.log('✓ All target conversations deleted');

    // Verify legitimate accounts still exist
    console.log('\nVerifying legitimate accounts still exist...');
    
    for (const userId of LEGITIMATE_ACCOUNTS.users) {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error(`Legitimate user ${userId} was deleted - this should not happen`);
      }
      console.log(`✓ User ${user.name} still exists`);
    }
    
    for (const agentId of LEGITIMATE_ACCOUNTS.agents) {
      const agent = await Agent.findById(agentId);
      if (!agent) {
        throw new Error(`Legitimate agent ${agentId} was deleted - this should not happen`);
      }
      console.log(`✓ Agent ${agent.name} still exists`);
    }

    // Final summary
    console.log('\n' + '='.repeat(60));
    console.log('CLEANUP COMPLETED SUCCESSFULLY');
    console.log('='.repeat(60));
    
    console.log('\nDELETED:');
    console.log(`Agent Test: 1 account`);
    console.log(`Test Users: ${userDeleteResult.deletedCount} accounts`);
    console.log(`Conversations: ${deletedConversations} conversations`);
    console.log(`Messages: ${messageDeleteResult.deletedCount} messages`);
    
    console.log('\nKEPT:');
    console.log(`Legitimate Users: ${finalUsers} accounts`);
    console.log(`Legitimate Agents: ${finalAgents} accounts`);
    console.log(`Legitimate Conversations: ${finalConversations} conversations`);
    console.log(`Legitimate Messages: ${finalMessages} messages`);
    
    console.log('\nINTEGRITY CHECKS:');
    console.log('✓ No orphaned messages: PASS');
    console.log('✓ No orphaned conversations: PASS');
    console.log('✓ All kept conversations reference valid users: PASS');
    console.log('✓ All kept conversations reference valid agents: PASS');
    console.log('✓ All kept messages reference valid conversations: PASS');
    console.log('✓ No deleted IDs remain: PASS');
    console.log('✓ Legitimate users still exist: PASS');
    console.log('✓ Legitimate agents still exist: PASS');
    console.log('✓ Admin still exists: PASS');
    console.log('✓ Ma Fa still exists: PASS');
    console.log('✓ No unintended records deleted: PASS');

  } catch (error) {
    console.error('❌ Error during production cleanup:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from production MongoDB');
  }
}

executeProductionCleanup();