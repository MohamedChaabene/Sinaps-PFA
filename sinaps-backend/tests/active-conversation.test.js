const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');

// Set JWT_SECRET for tests
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-for-ci';

require('../models/User');
require('../models/Agent');
require('../models/Conversation');
require('../models/Message');

const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const Agent = require('../models/Agent');

const jwt = require('jsonwebtoken');

// Import the app after models are loaded
const app = require('../app');

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

beforeEach(async () => {
  await mongoose.connection.dropDatabase();
});

// Helper function to sign client token
function signClientToken(userId) {
  return jwt.sign({ id: userId.toString(), role: 'client' }, process.env.JWT_SECRET, { expiresIn: '30d' });
}

describe('Active Conversation Lifecycle - Phase 3', () => {
  let user;
  let clientToken;

  beforeEach(async () => {
    user = await User.create({
      googleId: `test-google-id-${Date.now()}-${Math.random()}`,
      name: 'Test User',
      email: `test-${Date.now()}@example.com`
    });
    clientToken = signClientToken(user._id);
  });

  describe('Test 1: User without active conversation', () => {
    test('creates a new conversation', async () => {
      const res = await request(app)
        .post('/api/conversations/find-or-create')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({});

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('_id');
      expect(res.body.client._id).toBe(user._id.toString());
      expect(res.body.status).toBe('en_cours');
      expect(res.body.lastActivityAt).not.toBeNull();
    });
  });

  describe('Test 2: User with active en_cours conversation', () => {
    test('returns the same conversation', async () => {
      // Create first conversation
      const firstRes = await request(app)
        .post('/api/conversations/find-or-create')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({});

      const firstConversationId = firstRes.body._id;

      // Request again - should return same conversation
      const secondRes = await request(app)
        .post('/api/conversations/find-or-create')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({});

      expect(secondRes.statusCode).toBe(200);
      expect(secondRes.body._id).toBe(firstConversationId);
      expect(secondRes.body.status).toBe('en_cours');
    });
  });

  describe('Test 3: User with active en_attente conversation', () => {
    test('returns the same conversation', async () => {
      // Create conversation and escalate it
      const firstRes = await request(app)
        .post('/api/conversations/find-or-create')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({});

      const conversationId = firstRes.body._id;

      await request(app)
        .patch(`/api/conversations/${conversationId}/escalate`)
        .set('Authorization', `Bearer ${clientToken}`);

      // Request again - should return same escalated conversation
      const secondRes = await request(app)
        .post('/api/conversations/find-or-create')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({});

      expect(secondRes.statusCode).toBe(200);
      expect(secondRes.body._id).toBe(conversationId);
      expect(secondRes.body.status).toBe('en_attente');
    });
  });

  describe('Test 4: User with only resolved conversation', () => {
    test('creates a new conversation (does not reuse resolved)', async () => {
      // Create and resolve conversation
      const firstRes = await request(app)
        .post('/api/conversations/find-or-create')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({});

      const firstConversationId = firstRes.body._id;

      await request(app)
        .patch(`/api/conversations/${firstConversationId}/close`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ rating: 5, comment: 'Good' });

      // Request again - should create NEW conversation
      const secondRes = await request(app)
        .post('/api/conversations/find-or-create')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({});

      expect(secondRes.statusCode).toBe(200);
      expect(secondRes.body._id).not.toBe(firstConversationId);
      expect(secondRes.body.status).toBe('en_cours');
    });
  });

  describe('Test 5: User with resolved + active conversation', () => {
    test('returns the active conversation (not the resolved one)', async () => {
      // Create first conversation and resolve it
      const firstRes = await request(app)
        .post('/api/conversations/find-or-create')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({});

      const firstConversationId = firstRes.body._id;

      await request(app)
        .patch(`/api/conversations/${firstConversationId}/close`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ rating: 5, comment: 'Good' });

      // Create second active conversation
      const secondRes = await request(app)
        .post('/api/conversations/find-or-create')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({});

      const secondConversationId = secondRes.body._id;

      // Request again - should return the active one
      const thirdRes = await request(app)
        .post('/api/conversations/find-or-create')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({});

      expect(thirdRes.statusCode).toBe(200);
      expect(thirdRes.body._id).toBe(secondConversationId);
      expect(thirdRes.body._id).not.toBe(firstConversationId);
      expect(thirdRes.body.status).toBe('en_cours');
    });
  });

  describe('Test 6: Multiple non-resolved conversations (legacy data)', () => {
    test('chooses the one with most recent lastActivityAt', async () => {
      // Create first conversation
      const conv1 = await Conversation.create({
        client: user._id,
        status: 'en_cours',
        lastActivityAt: new Date('2024-01-01')
      });

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 10));

      // Create second conversation with more recent activity
      const conv2 = await Conversation.create({
        client: user._id,
        status: 'en_attente',
        lastActivityAt: new Date()
      });

      // Request should return the most recently active one
      const res = await request(app)
        .post('/api/conversations/find-or-create')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({});

      expect(res.statusCode).toBe(200);
      expect(res.body._id).toBe(conv2._id.toString());
      expect(res.body.status).toBe('en_attente');
    });
  });

  describe('Test 7: User A cannot access User B\'s active conversation', () => {
    test('respects conversation ownership', async () => {
      // Create user B
      const userB = await User.create({
        googleId: `user-b-${Date.now()}`,
        name: 'User B',
        email: `user-b-${Date.now()}@example.com`
      });
      const tokenB = signClientToken(userB._id);

      // User B creates conversation
      const convB = await request(app)
        .post('/api/conversations/find-or-create')
        .set('Authorization', `Bearer ${tokenB}`)
        .send({});

      // User A tries to get conversation - should get their own (or create new)
      const resA = await request(app)
        .post('/api/conversations/find-or-create')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({});

      expect(resA.statusCode).toBe(200);
      expect(resA.body._id).not.toBe(convB.body._id);
      expect(resA.body.client._id).toBe(user._id.toString());
    });
  });

  describe('Test 8: Repeated refresh does not create new conversations', () => {
    test('returns same conversation on multiple requests', async () => {
      const conversationIds = [];

      // Make 5 requests
      for (let i = 0; i < 5; i++) {
        const res = await request(app)
          .post('/api/conversations/find-or-create')
          .set('Authorization', `Bearer ${clientToken}`)
          .send({});
        
        conversationIds.push(res.body._id);
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 5));
      }

      // All should return the same conversation ID
      conversationIds.forEach(id => {
        expect(id).toBe(conversationIds[0]);
      });

      // Verify only one conversation exists in DB
      const conversations = await Conversation.find({ client: user._id });
      expect(conversations).toHaveLength(1);
    });
  });

  describe('Test 9: Newly created conversation has lastActivityAt', () => {
    test('populates lastActivityAt on creation', async () => {
      const res = await request(app)
        .post('/api/conversations/find-or-create')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({});

      expect(res.statusCode).toBe(200);
      expect(res.body.lastActivityAt).not.toBeNull();
      expect(new Date(res.body.lastActivityAt)).toBeInstanceOf(Date);
    });
  });

  describe('Test 10: Resolved conversation in history but not active', () => {
    test('resolved conversation stays in history but is not returned as active', async () => {
      // Create and resolve first conversation
      const firstRes = await request(app)
        .post('/api/conversations/find-or-create')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({});

      const firstConversationId = firstRes.body._id;

      // Add a message to it
      await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          conversationId: firstConversationId,
          sender: 'client',
          content: 'Hello'
        });

      // Resolve it
      await request(app)
        .patch(`/api/conversations/${firstConversationId}/close`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ rating: 5, comment: 'Good' });

      // Create new active conversation
      const secondRes = await request(app)
        .post('/api/conversations/find-or-create')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({});

      // Verify resolved conversation still exists with messages
      const resolvedConv = await Conversation.findById(firstConversationId);
      expect(resolvedConv).not.toBeNull();
      expect(resolvedConv.status).toBe('resolu');

      const messages = await Message.find({ conversation: firstConversationId });
      expect(messages.length).toBeGreaterThan(0);

      // Verify active conversation is different
      expect(secondRes.body._id).not.toBe(firstConversationId);
      expect(secondRes.body.status).toBe('en_cours');
    });
  });
});
