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

const { QUICK_REPLY_ACTIONS } = require('../utils/constants');
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

describe('AI Quick Replies - Phase 4', () => {
  let user;
  let conversation;
  let clientToken;

  beforeEach(async () => {
    user = await User.create({
      googleId: `test-google-id-${Date.now()}-${Math.random()}`,
      name: 'Test User',
      email: `test-${Date.now()}@example.com`
    });

    conversation = await Conversation.create({
      client: user._id,
      status: 'en_cours',
      handledBy: 'ia'
    });

    clientToken = signClientToken(user._id);
  });

  describe('Test 1: AI response receives appropriate Quick Replies', () => {
    test('AI message has Quick Replies for conversation flow', async () => {
      const res = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          conversationId: conversation._id,
          sender: 'client',
          content: 'Comment suivre ma commande ?'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.aiMessage).not.toBeNull();
      expect(res.body.aiMessage.sender).toBe('ia');
      expect(res.body.aiMessage.quickReplies.length).toBeGreaterThan(0);

      const actions = res.body.aiMessage.quickReplies.map(qr => qr.action);
      expect(actions).toContain(QUICK_REPLY_ACTIONS.NEW_QUESTION);
      expect(actions).toContain(QUICK_REPLY_ACTIONS.ESCALATE_TO_HUMAN);
      // CONFIRM_RESOLVED may or may not be present depending on response content
    });
  });

  describe('Test 2: Quick Replies have correct structure', () => {
    test('Each quickReply has id, label, action, metadata', async () => {
      const res = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          conversationId: conversation._id,
          sender: 'client',
          content: 'Test question'
        });

      expect(res.statusCode).toBe(201);
      const quickReplies = res.body.aiMessage.quickReplies;

      quickReplies.forEach(qr => {
        expect(qr).toHaveProperty('id');
        expect(qr).toHaveProperty('label');
        expect(qr).toHaveProperty('action');
        // metadata may be omitted if empty (Mongoose behavior)
        if (qr.metadata !== undefined) {
          expect(typeof qr.metadata).toBe('object');
        }
        expect(typeof qr.id).toBe('string');
        expect(typeof qr.label).toBe('string');
        expect(typeof qr.action).toBe('string');
      });
    });
  });

  describe('Test 3: NEW_QUESTION keeps conversation active', () => {
    test('Conversation remains active after NEW_QUESTION action', async () => {
      // First send a message to get AI response
      await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          conversationId: conversation._id,
          sender: 'client',
          content: 'Test question'
        });

      // Apply NEW_QUESTION action
      const actionRes = await request(app)
        .post(`/api/conversations/${conversation._id}/quick-reply`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ action: QUICK_REPLY_ACTIONS.NEW_QUESTION });

      expect(actionRes.statusCode).toBe(200);
      expect(actionRes.body.conversation.status).toBe('en_cours');
      expect(actionRes.body.conversation.resolvedBy).toBeNull();
      expect(actionRes.body.conversation.resolvedAt).toBeNull();
    });
  });

  describe('Test 4: YES_ANOTHER_QUESTION keeps conversation active', () => {
    test('Conversation remains active after YES_ANOTHER_QUESTION action', async () => {
      const actionRes = await request(app)
        .post(`/api/conversations/${conversation._id}/quick-reply`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ action: QUICK_REPLY_ACTIONS.YES_ANOTHER_QUESTION });

      expect(actionRes.statusCode).toBe(200);
      expect(actionRes.body.conversation.status).toBe('en_cours');
      expect(actionRes.body.conversation.resolvedBy).toBeNull();
    });
  });

  describe('Test 5: CONFIRM_RESOLVED resolves conversation correctly', () => {
    test('Sets status, resolvedBy, resolvedAt, resolutionType correctly', async () => {
      const actionRes = await request(app)
        .post(`/api/conversations/${conversation._id}/quick-reply`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ action: QUICK_REPLY_ACTIONS.CONFIRM_RESOLVED });

      expect(actionRes.statusCode).toBe(200);
      expect(actionRes.body.conversation.status).toBe('resolu');
      expect(actionRes.body.conversation.resolvedBy).toBe('client');
      expect(actionRes.body.conversation.resolvedAt).not.toBeNull();
      expect(actionRes.body.conversation.resolutionType).toBe('client_confirmed_ai');
    });
  });

  describe('Test 6: ESCALATE_TO_HUMAN preserves Phase 2 behavior', () => {
    test('Sets handledBy, status, escalationCount, lastEscalationOffer', async () => {
      const actionRes = await request(app)
        .post(`/api/conversations/${conversation._id}/quick-reply`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ action: QUICK_REPLY_ACTIONS.ESCALATE_TO_HUMAN });

      expect(actionRes.statusCode).toBe(200);
      expect(actionRes.body.conversation.handledBy).toBe('humain');
      expect(actionRes.body.conversation.status).toBe('en_attente');
      expect(actionRes.body.conversation.escalationCount).toBe(1);
      expect(actionRes.body.conversation.lastEscalationOffer).not.toBeNull();
      expect(actionRes.body.conversation.assignedAgent).toBeNull();
    });
  });

  describe('Test 7: RETRY_AI preserves Phase 2 behavior', () => {
    test('Increments aiAttemptCount and keeps AI handling', async () => {
      const actionRes = await request(app)
        .post(`/api/conversations/${conversation._id}/quick-reply`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ action: QUICK_REPLY_ACTIONS.RETRY_AI });

      expect(actionRes.statusCode).toBe(200);
      expect(actionRes.body.conversation.aiAttemptCount).toBe(1);
      expect(actionRes.body.conversation.handledBy).toBe('ia');
      expect(actionRes.body.conversation.status).toBe('en_cours');
    });
  });

  describe('Test 8: AI response does NOT auto-resolve conversation', () => {
    test('Conversation stays active after AI response', async () => {
      const res = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          conversationId: conversation._id,
          sender: 'client',
          content: 'Test question'
        });

      expect(res.statusCode).toBe(201);

      // Check conversation status after AI response
      const updatedConv = await Conversation.findById(conversation._id);
      expect(updatedConv.status).toBe('en_cours');
      expect(updatedConv.resolvedBy).toBeNull();
      expect(updatedConv.resolvedAt).toBeNull();
    });
  });

  describe('Test 9: NEW_QUESTION does not create new conversation', () => {
    test('Same conversation ID after NEW_QUESTION action', async () => {
      const originalConvId = conversation._id;

      // Send message to get AI response
      await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          conversationId: conversation._id,
          sender: 'client',
          content: 'Test question'
        });

      // Apply NEW_QUESTION action
      await request(app)
        .post(`/api/conversations/${conversation._id}/quick-reply`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ action: QUICK_REPLY_ACTIONS.NEW_QUESTION });

      // Check only one conversation exists
      const conversations = await Conversation.find({ client: user._id });
      expect(conversations).toHaveLength(1);
      expect(conversations[0]._id.toString()).toBe(originalConvId.toString());
    });
  });

  describe('Test 10: Quick Replies preserved in returned AI message', () => {
    test('API response includes quickReplies in aiMessage', async () => {
      const res = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          conversationId: conversation._id,
          sender: 'client',
          content: 'Test question'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.aiMessage).toHaveProperty('quickReplies');
      expect(Array.isArray(res.body.aiMessage.quickReplies)).toBe(true);
      expect(res.body.aiMessage.quickReplies.length).toBeGreaterThan(0);
    });
  });

  describe('Test 11: Resolved conversations protected from Quick Replies', () => {
    test('Quick Reply actions rejected on resolved conversations', async () => {
      // Resolve the conversation first
      await Conversation.findByIdAndUpdate(conversation._id, {
        status: 'resolu'
      });

      const res = await request(app)
        .post(`/api/conversations/${conversation._id}/quick-reply`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ action: QUICK_REPLY_ACTIONS.NEW_QUESTION });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('Cette conversation est déjà résolue');
    });
  });

  describe('Test 12: Backward compatibility with messages without quickReplies', () => {
    test('Old messages without quickReplies remain readable', async () => {
      // Create a message without quickReplies (old format)
      const oldMessage = await Message.create({
        conversation: conversation._id,
        sender: 'ia',
        content: 'Old AI response without quickReplies'
      });

      // Retrieve and verify it's readable
      const retrievedMessage = await Message.findById(oldMessage._id);
      expect(retrievedMessage).not.toBeNull();
      expect(retrievedMessage.content).toBe('Old AI response without quickReplies');
      expect(retrievedMessage.quickReplies).toEqual([]);
    });
  });

  describe('Test 13: Multiple questions in same conversation', () => {
    test('Conversation can handle multiple question-answer cycles', async () => {
      // First question (realistic Sinaps question)
      const res1 = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          conversationId: conversation._id,
          sender: 'client',
          content: 'comment suivre ma commande'
        });

      expect(res1.statusCode).toBe(201);
      expect(res1.body.aiMessage.quickReplies.length).toBeGreaterThan(0);

      // Apply NEW_QUESTION to continue
      await request(app)
        .post(`/api/conversations/${conversation._id}/quick-reply`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ action: QUICK_REPLY_ACTIONS.NEW_QUESTION });

      // Second question (realistic Sinaps question)
      const res2 = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          conversationId: conversation._id,
          sender: 'client',
          content: 'comment retourner un produit'
        });

      expect(res2.statusCode).toBe(201);
      expect(res2.body.aiMessage.quickReplies.length).toBeGreaterThan(0);

      // Verify conversation is still active
      const conv = await Conversation.findById(conversation._id);
      expect(conv.status).toBe('en_cours');

      // Verify we have multiple messages
      const messages = await Message.find({ conversation: conversation._id });
      expect(messages.length).toBe(4); // 2 client + 2 AI
    });
  });

  describe('Test 14: Quick Reply IDs are stable', () => {
    test('Quick Reply IDs remain consistent across responses', async () => {
      const res = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          conversationId: conversation._id,
          sender: 'client',
          content: 'comment suivre ma commande'
        });

      const quickReplies = res.body.aiMessage.quickReplies;
      const ids = quickReplies.map(qr => qr.id);

      expect(ids).toContain('confirm-resolved');
      expect(ids).toContain('new-question');
      expect(ids).toContain('escalate-human');
    });
  });

  describe('Test 15: Out of scope response gets escalation Quick Replies', () => {
    test('Questions outside Sinaps scope show only ESCALATE_TO_HUMAN and NEW_QUESTION', async () => {
      // This question is likely to trigger "out of scope" response
      const res = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          conversationId: conversation._id,
          sender: 'client',
          content: 'météo demain à Tunis'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.aiMessage).not.toBeNull();
      
      const quickReplies = res.body.aiMessage.quickReplies;
      const actions = quickReplies.map(qr => qr.action);
      
      // Should have ESCALATE_TO_HUMAN and NEW_QUESTION, but NOT CONFIRM_RESOLVED
      expect(actions).toContain(QUICK_REPLY_ACTIONS.ESCALATE_TO_HUMAN);
      expect(actions).toContain(QUICK_REPLY_ACTIONS.NEW_QUESTION);
      expect(actions).not.toContain(QUICK_REPLY_ACTIONS.CONFIRM_RESOLVED);
      expect(actions).not.toContain(QUICK_REPLY_ACTIONS.RETRY_AI);
    });
  });

  describe('Test 16: Response indicating human help needed gets escalation Quick Replies', () => {
    test('When AI response indicates need for human help, Quick Replies are adapted', async () => {
      // This might trigger a response about needing human help
      const res = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          conversationId: conversation._id,
          sender: 'client',
          content: 'question très complexe hors base'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.aiMessage).not.toBeNull();
      
      const quickReplies = res.body.aiMessage.quickReplies;
      const actions = quickReplies.map(qr => qr.action);
      
      // Should NOT include CONFIRM_RESOLVED if response indicates inability to answer
      if (res.body.aiMessage.content.toLowerCase().includes('je ne peux pas') ||
          res.body.aiMessage.content.toLowerCase().includes('je n\'ai pas') ||
          res.body.aiMessage.content.toLowerCase().includes('agent humain')) {
        expect(actions).not.toContain(QUICK_REPLY_ACTIONS.CONFIRM_RESOLVED);
        expect(actions).toContain(QUICK_REPLY_ACTIONS.ESCALATE_TO_HUMAN);
      }
    });
  });

  describe('Test 17: Normal successful response gets standard Quick Replies', () => {
    test('Questions within Sinaps scope get standard Quick Replies including CONFIRM_RESOLVED', async () => {
      const res = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          conversationId: conversation._id,
          sender: 'client',
          content: 'comment suivre ma commande'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.aiMessage).not.toBeNull();
      
      const quickReplies = res.body.aiMessage.quickReplies;
      const actions = quickReplies.map(qr => qr.action);
      
      // Should have standard Quick Replies for successful responses
      expect(actions).toContain(QUICK_REPLY_ACTIONS.CONFIRM_RESOLVED);
      expect(actions).toContain(QUICK_REPLY_ACTIONS.NEW_QUESTION);
      expect(actions).toContain(QUICK_REPLY_ACTIONS.ESCALATE_TO_HUMAN);
      expect(quickReplies.length).toBeGreaterThanOrEqual(2);
    });
  });
});
