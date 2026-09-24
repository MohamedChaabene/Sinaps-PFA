/**
 * Test for Admin test data filtering (P1-2)
 * Verifies that the backend properly filters out test data by default
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

describe('Admin Test Data Filtering (P1-2)', () => {
  let testUser, testAgent, adminAgent, prodConversation, testConversation, adminToken;

  beforeEach(async () => {
    // Create production user
    testUser = await User.create({
      googleId: 'prod-google-id',
      name: 'Production Client',
      email: 'prod@example.com',
      avatar: '/prod-avatar.png',
    });

    // Create test user (QA)
    const testUserQA = await User.create({
      googleId: 'qa-google-id',
      name: 'QA Test User',
      email: 'qa@example.com',
      avatar: '/qa-avatar.png',
      isTestData: true,
    });

    // Create admin agent
    adminAgent = await Agent.create({
      name: 'Admin Agent',
      email: 'admin@example.com',
      password: 'password123',
      role: 'admin',
      status: 'approved',
    });

    // Generate admin token
    adminToken = jwt.sign(
      { id: adminAgent._id, email: adminAgent.email, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Create production conversation
    prodConversation = await Conversation.create({
      client: testUser._id,
      status: 'en_cours',
      handledBy: 'ia',
      isTestData: false,
    });

    // Create test conversation
    testConversation = await Conversation.create({
      client: testUserQA._id,
      status: 'en_cours',
      handledBy: 'ia',
      isTestData: true,
    });

    // Add messages to both conversations
    await Message.create([
      {
        conversation: prodConversation._id,
        sender: 'client',
        content: 'Production message',
      },
      {
        conversation: testConversation._id,
        sender: 'client',
        content: 'QA test message',
      },
    ]);
  });

  afterEach(async () => {
    await Message.deleteMany({});
    await Conversation.deleteMany({});
    await User.deleteMany({});
    await Agent.deleteMany({});
  });

  test('Default API request should exclude test data (isTestData: true)', async () => {
    const response = await request(app)
      .get('/api/conversations')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(1);
    
    // Should only return the production conversation
    const convIds = response.body.map(c => c._id);
    expect(convIds).toContain(prodConversation._id.toString());
    expect(convIds).not.toContain(testConversation._id.toString());
  });

  test('API request with includeTestData=true should return all conversations', async () => {
    const response = await request(app)
      .get('/api/conversations?includeTestData=true')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(2);
    
    // Should return both conversations
    const convIds = response.body.map(c => c._id);
    expect(convIds).toContain(prodConversation._id.toString());
    expect(convIds).toContain(testConversation._id.toString());
  });

  test('Conversations with isTestData=false should always be returned', async () => {
    // Create another production conversation
    const prodUser2 = await User.create({
      googleId: 'prod-google-id-2',
      name: 'Production Client 2',
      email: 'prod2@example.com',
    });

    const prodConversation2 = await Conversation.create({
      client: prodUser2._id,
      status: 'resolu',
      handledBy: 'humain',
      isTestData: false,
    });

    const response = await request(app)
      .get('/api/conversations')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(2); // Both production conversations
    
    const convIds = response.body.map(c => c._id);
    expect(convIds).toContain(prodConversation._id.toString());
    expect(convIds).toContain(prodConversation2._id.toString());
    expect(convIds).not.toContain(testConversation._id.toString());
  });

  test('Statistics do not count an open escalated conversation as resolved by human', async () => {
    await Conversation.create({
      client: testUser._id,
      status: 'en_attente',
      handledBy: 'humain',
      assignedAgent: adminAgent._id,
      escalationCount: 1,
      isTestData: false,
    });

    const response = await request(app)
      .get('/api/stats')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(response.body.resolvedByHuman).toBe(0);
  });
});