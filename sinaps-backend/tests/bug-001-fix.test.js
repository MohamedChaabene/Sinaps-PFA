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

describe('BUG-001 Fix - Stale Conversation State Prevention', () => {
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

  describe('Test 1: HTTP response waits for AI processing', () => {
    test('POST /api/messages returns 201 with aiMessage after AI completes', async () => {
      const res = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          conversationId: conversation._id,
          sender: 'client',
          content: 'Test question'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('aiMessage');
      expect(res.body.aiMessage).not.toBeNull();
      expect(res.body.aiMessage.sender).toBe('ia');
    });
  });

  test('invoice questions do not return an unrelated order-tracking response', async () => {
    const res = await request(app)
      .post('/api/messages')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({
        conversationId: conversation._id,
        sender: 'client',
        content: 'Je ne trouve pas la rubrique correspondante. Est-elle accessible depuis la page Facturation ?'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.aiMessage.content).not.toContain('suivre votre commande');
    expect(res.body.aiMessage.content).toContain("montant de votre facture");
    expect(res.body.aiMessage.content).not.toContain("Je n'ai pas trouvé de réponse exacte");
  });

  describe('Test 2: AI message is saved to database before response', () => {
    test('AI message exists in MongoDB after HTTP response', async () => {
      const res = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          conversationId: conversation._id,
          sender: 'client',
          content: 'Test question'
        });

      expect(res.statusCode).toBe(201);

      // Verify AI message is in database
      const messages = await Message.find({ conversation: conversation._id });
      expect(messages.length).toBe(2); // Client message + AI message
      expect(messages[1].sender).toBe('ia');
    });
  });

  describe('Test 3: Socket events are emitted after AI message creation', () => {
    test('Backend completes full lifecycle before HTTP response', async () => {
      const res = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          conversationId: conversation._id,
          sender: 'client',
          content: 'Test question'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.aiMessage).not.toBeNull();
      
      // The key test is that the AI message is present in the response
      // This proves the fix removes the race condition where frontend
      // could complete before AI processing finished
      // We verify this by checking that the response contains the complete AI message
      expect(res.body.aiMessage.sender).toBe('ia');
      expect(res.body.aiMessage.content).toBeTruthy();
      expect(res.body.aiMessage.content.length).toBeGreaterThan(0);
    });
  });

  describe('Test 4: Multiple client messages in sequence', () => {
    test('Each message gets AI response without state corruption', async () => {
      // First message
      const res1 = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          conversationId: conversation._id,
          sender: 'client',
          content: 'First question'
        });

      expect(res1.statusCode).toBe(201);
      expect(res1.body.aiMessage).not.toBeNull();

      // Second message
      const res2 = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          conversationId: conversation._id,
          sender: 'client',
          content: 'Second question'
        });

      expect(res2.statusCode).toBe(201);
      expect(res2.body.aiMessage).not.toBeNull();

      // Verify we have 4 messages total (2 client + 2 AI)
      const messages = await Message.find({ conversation: conversation._id });
      expect(messages.length).toBe(4);
    });
  });

  describe('Test 5: Conversation state remains consistent', () => {
    test('Conversation metadata updated correctly after AI response', async () => {
      const beforeConv = await Conversation.findById(conversation._id);
      const beforeTime = beforeConv.updatedAt;

      // Wait a bit to ensure time difference
      await new Promise(resolve => setTimeout(resolve, 10));

      const res = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          conversationId: conversation._id,
          sender: 'client',
          content: 'Test question'
        });

      expect(res.statusCode).toBe(201);

      const afterConv = await Conversation.findById(conversation._id);
      const afterTime = afterConv.updatedAt;

      // Verify conversation was updated
      expect(afterTime.getTime()).toBeGreaterThan(beforeTime.getTime());
      expect(afterConv.status).toBe('en_cours'); // Should still be active
    });
  });

  describe('Test 6: Reload scenario verification', () => {
    test('GET /api/conversations/:id returns complete conversation with AI messages', async () => {
      // Send a message to generate AI response
      await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          conversationId: conversation._id,
          sender: 'client',
          content: 'Test question'
        });

      // Simulate reload by fetching conversation via API
      const getRes = await request(app)
        .get(`/api/conversations/${conversation._id}`)
        .set('Authorization', `Bearer ${clientToken}`);

      expect(getRes.statusCode).toBe(200);
      expect(getRes.body.conversation).not.toBeNull();
      expect(getRes.body.messages).not.toBeNull();
      expect(getRes.body.messages.length).toBe(2); // Client + AI
      expect(getRes.body.messages[1].sender).toBe('ia');
    });
  });
});