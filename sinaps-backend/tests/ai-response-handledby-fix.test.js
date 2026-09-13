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

describe('AI Response handledBy Fix - Production Issue', () => {
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

  describe('Test 1: findOrCreateConversation sets handledBy to ia', () => {
    test('New conversation via API has handledBy set to ia', async () => {
      const res = await request(app)
        .post('/api/conversations/find-or-create')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({});

      expect(res.statusCode).toBe(200);
      expect(res.body.handledBy).toBe('ia');
      expect(res.body.status).toBe('en_cours');
    });
  });

  describe('Test 2: createConversation sets handledBy to ia', () => {
    test('Agent-created conversation has handledBy set to ia', async () => {
      const agent = await User.create({
        googleId: `agent-google-id-${Date.now()}`,
        name: 'Test Agent',
        email: `agent-${Date.now()}@example.com`
      });
      const agentToken = jwt.sign({ id: agent._id.toString(), role: 'agent' }, process.env.JWT_SECRET);

      const res = await request(app)
        .post('/api/conversations')
        .set('Authorization', `Bearer ${agentToken}`)
        .send({ clientId: user._id });

      expect(res.statusCode).toBe(201);
      expect(res.body.handledBy).toBe('ia');
    });
  });

  describe('Test 3: AI response triggers correctly with handledBy set', () => {
    test('Client message triggers AI response when handledBy is ia', async () => {
      // Create conversation via API
      const convRes = await request(app)
        .post('/api/conversations/find-or-create')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({});

      const conversationId = convRes.body._id;

      // Send client message
      const msgRes = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          conversationId,
          sender: 'client',
          content: 'Comment suivre ma commande ?'
        });

      expect(msgRes.statusCode).toBe(201);
      expect(msgRes.body.aiMessage).not.toBeNull();
      expect(msgRes.body.aiMessage.sender).toBe('ia');
    });
  });

  describe('Test 4: Conversation state ensures AI response flow', () => {
    test('Complete flow: create conversation -> send message -> receive AI response', async () => {
      // Step 1: Create conversation
      const convRes = await request(app)
        .post('/api/conversations/find-or-create')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({});

      expect(convRes.statusCode).toBe(200);
      expect(convRes.body.handledBy).toBe('ia');

      const conversationId = convRes.body._id;

      // Step 2: Send client message
      const msgRes = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          conversationId,
          sender: 'client',
          content: 'Test question'
        });

      expect(msgRes.statusCode).toBe(201);
      expect(msgRes.body.message).not.toBeNull();
      expect(msgRes.body.message.sender).toBe('client');
      expect(msgRes.body.aiMessage).not.toBeNull();
      expect(msgRes.body.aiMessage.sender).toBe('ia');

      // Step 3: Verify messages in database
      const messages = await Message.find({ conversation: conversationId });
      expect(messages.length).toBe(2);
      expect(messages[0].sender).toBe('client');
      expect(messages[1].sender).toBe('ia');
    });
  });

  describe('Test 5: Existing conversation without handledBy still works', () => {
    test('Legacy conversation without explicit handledBy uses schema default', async () => {
      // Create conversation without explicit handledBy (legacy scenario)
      const legacyConv = await Conversation.create({
        client: user._id,
        status: 'en_cours'
        // Note: No explicit handledBy - should use schema default
      });

      // Send message to legacy conversation
      const msgRes = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          conversationId: legacyConv._id,
          sender: 'client',
          content: 'Test question'
        });

      // Should still get AI response due to schema default
      expect(msgRes.statusCode).toBe(201);
      expect(msgRes.body.aiMessage).not.toBeNull();
    });
  });
});
