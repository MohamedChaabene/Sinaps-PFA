/**
 * Integration test for Agent timestamp rendering
 * Tests the actual backend message shape used by Agent to diagnose P1-1
 */

const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const app = require('../app');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const Agent = require('../models/Agent');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-for-ci';

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
}, 10000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Agent Timestamp Integration Test', () => {
  let testUser, testAgent, testConversation, testMessages;
  let agentToken;

  beforeEach(async () => {
    // Create test user
    testUser = await User.create({
      googleId: 'test-google-id-timestamp',
      name: 'Test Client for Timestamp',
      email: 'timestamp-test@example.com',
      avatar: '/test-avatar.png',
    });

    // Create test agent
    testAgent = await Agent.create({
      name: 'Test Agent',
      email: 'agent-timestamp@example.com',
      password: 'password123',
      role: 'agent',
      status: 'approved',
    });

    // Generate agent token
    agentToken = jwt.sign(
      { id: testAgent._id, email: testAgent.email, role: 'agent' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Create test conversation
    testConversation = await Conversation.create({
      client: testUser._id,
      status: 'en_cours',
      handledBy: 'humain',
      assignedAgent: testAgent._id,
    });

    // Create test messages with specific timestamps
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

    testMessages = await Message.create([
      {
        conversation: testConversation._id,
        sender: 'client',
        content: 'Client message 1',
        createdAt: twoHoursAgo,
      },
      {
        conversation: testConversation._id,
        sender: 'ia',
        content: 'AI response',
        createdAt: oneHourAgo,
      },
      {
        conversation: testConversation._id,
        sender: 'humain',
        content: 'Agent message',
        authorName: 'Test Agent',
        createdAt: now,
      },
    ]);
  });

  afterEach(async () => {
    // Cleanup
    await Message.deleteMany({});
    await Conversation.deleteMany({});
    await User.deleteMany({});
    await Agent.deleteMany({});
  });

  test('Backend should return messages with proper createdAt field', async () => {
    const response = await request(app)
      .get(`/api/conversations/${testConversation._id}`)
      .set('Authorization', `Bearer ${agentToken}`)
      .expect(200);

    expect(response.body).toHaveProperty('messages');
    expect(Array.isArray(response.body.messages)).toBe(true);
    expect(response.body.messages.length).toBe(3);

    // Check that each message has createdAt field
    response.body.messages.forEach((msg, index) => {
      expect(msg).toHaveProperty('createdAt');
      expect(msg.createdAt).not.toBeNull();
      expect(msg.createdAt).not.toBeUndefined();
      
      // Verify createdAt is a valid ISO date string
      const date = new Date(msg.createdAt);
      expect(date.getTime()).not.toBeNaN();
      
      console.log(`Message ${index} createdAt:`, msg.createdAt);
      console.log(`Message ${index} createdAt type:`, typeof msg.createdAt);
    });
  });

  test('Backend messages should be plain objects (not Mongoose documents)', async () => {
    const response = await request(app)
      .get(`/api/conversations/${testConversation._id}`)
      .set('Authorization', `Bearer ${agentToken}`)
      .expect(200);

    const msg = response.body.messages[0];
    
    // Should not have Mongoose document properties
    expect(msg).not.toHaveProperty('$__');
    expect(msg).not.toHaveProperty('isNew');
    expect(msg).not.toHaveProperty('save');
    
    // Should be a plain object
    expect(typeof msg).toBe('object');
    expect(msg.constructor.name).toBe('Object');
  });

  test('createdAt field should be serializable to valid Date', async () => {
    const response = await request(app)
      .get(`/api/conversations/${testConversation._id}`)
      .set('Authorization', `Bearer ${agentToken}`)
      .expect(200);

    response.body.messages.forEach((msg) => {
      const createdAt = msg.createdAt;
      
      // Test various ways the frontend might parse this
      const date1 = new Date(createdAt);
      const date2 = new Date(String(createdAt));
      const date3 = new Date(Number(createdAt));
      
      // At least one should be valid
      const validDate = date1.getTime() || date2.getTime() || date3.getTime();
      expect(validDate).not.toBeNaN();
      expect(validDate).toBeGreaterThan(0);
    });
  });

  test('Message response should match the shape expected by mapBackendMessage', async () => {
    const response = await request(app)
      .get(`/api/conversations/${testConversation._id}`)
      .set('Authorization', `Bearer ${agentToken}`)
      .expect(200);

    const msg = response.body.messages[0];
    
    // These are the fields that mapBackendMessage expects
    expect(msg).toHaveProperty('_id');
    expect(msg).toHaveProperty('sender');
    expect(msg).toHaveProperty('content');
    expect(msg).toHaveProperty('createdAt');
    // authorName is optional (only for human/IA messages)
    expect(msg).toHaveProperty('attachments'); // may be empty array
    expect(msg).toHaveProperty('quickReplies'); // may be empty array
  });
});