const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Some environments (fresh clones, CI) won't have JWT_SECRET set. Client and
// agent sessions both depend on it now, so default it here rather than
// letting every token-issuing test fail with an unrelated 500.
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-for-ci';

require('../models/User');
require('../models/Agent');
require('../models/Conversation');
require('../models/Message');

const Agent = require('../models/Agent');

const userRoutes = require('../routes/userRoutes');
const conversationRoutes = require('../routes/conversationRoutes');
const messageRoutes = require('../routes/messageRoutes');
const agentRoutes = require('../routes/agentRoutes');
const statsRoutes = require('../routes/statsRoutes');

let mongoServer;
let app;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  app = express();
  app.use(express.json());
  app.use('/api/users', userRoutes);
  app.use('/api/conversations', conversationRoutes);
  app.use('/api/messages', messageRoutes);
  app.use('/api/agents', agentRoutes);
  app.use('/api/stats', statsRoutes);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('User and Conversation API Integration Tests', () => {
  let userId;
  let clientToken;
  let conversationId;

  test('POST /api/users/find-or-create creates a user and issues a client session token', async () => {
    const res = await request(app)
      .post('/api/users/find-or-create')
      .send({ name: 'Test User', email: 'test@example.com' });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toHaveProperty('_id');
    expect(res.body.user.email).toBe('test@example.com');
    userId = res.body.user._id;
    clientToken = res.body.token;
  });

  test('POST /api/conversations/find-or-create rejects a request with no client session', async () => {
    const res = await request(app)
      .post('/api/conversations/find-or-create')
      .send({});

    expect(res.statusCode).toBe(401);
  });

  test('POST /api/conversations/find-or-create creates a conversation for the authenticated client', async () => {
    const res = await request(app)
      .post('/api/conversations/find-or-create')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({});

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('_id');
    expect(res.body.handledBy).toBe('ia');
    expect(res.body.client._id).toBe(userId);
    conversationId = res.body._id;
  });

  test('GET /api/conversations/:id rejects a request with no session at all', async () => {
    const res = await request(app).get(`/api/conversations/${conversationId}`);
    expect(res.statusCode).toBe(401);
  });

  test("GET /api/conversations/:id rejects a different client's session (ownership check)", async () => {
    const otherRes = await request(app)
      .post('/api/users/find-or-create')
      .send({ name: 'Someone Else', email: 'someone.else@example.com' });
    const otherToken = otherRes.body.token;

    const res = await request(app)
      .get(`/api/conversations/${conversationId}`)
      .set('Authorization', `Bearer ${otherToken}`);

    expect(res.statusCode).toBe(403);
  });

  test('GET /api/conversations/:id succeeds for the owning client', async () => {
    const res = await request(app)
      .get(`/api/conversations/${conversationId}`)
      .set('Authorization', `Bearer ${clientToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.conversation._id).toBe(conversationId);
  });

  test('PATCH /api/conversations/:id/escalate escalates conversation to human agent', async () => {
    const res = await request(app)
      .patch(`/api/conversations/${conversationId}/escalate`)
      .set('Authorization', `Bearer ${clientToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.handledBy).toBe('humain');
    expect(res.body.status).toBe('en_attente');
  });

  test('PATCH /api/conversations/:id/close closes conversation with a valid satisfaction rating', async () => {
    const res = await request(app)
      .patch(`/api/conversations/${conversationId}/close`)
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ rating: 5, comment: 'Excellent support !' });

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('resolu');
    expect(res.body.satisfaction.rating).toBe(5);
  });

  test('PATCH /api/conversations/:id/close ignores rating:0 instead of persisting a fake score', async () => {
    // The first conversation is now resolved, so find-or-create opens a fresh one.
    const secondConvRes = await request(app)
      .post('/api/conversations/find-or-create')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({});
    const secondConvId = secondConvRes.body._id;

    const res = await request(app)
      .patch(`/api/conversations/${secondConvId}/close`)
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ rating: 0, comment: '' });

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('resolu');
    expect(res.body.satisfaction).toBeUndefined();
  });
});

describe('Message sender authorization', () => {
  let clientToken;
  let conversationId;
  let agentToken;

  beforeAll(async () => {
    const userRes = await request(app)
      .post('/api/users/find-or-create')
      .send({ name: 'Msg Test User', email: 'msgtest@example.com' });
    clientToken = userRes.body.token;

    const convRes = await request(app)
      .post('/api/conversations/find-or-create')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({});
    conversationId = convRes.body._id;

    const hashedPassword = await bcrypt.hash('password123', 10);
    await Agent.create({
      name: 'Test Agent',
      email: 'agent.msgtest@example.com',
      password: hashedPassword,
      role: 'agent',
      status: 'approved',
    });

    const loginRes = await request(app)
      .post('/api/agents/login')
      .send({ email: 'agent.msgtest@example.com', password: 'password123' });
    agentToken = loginRes.body.token;
  });

  test('rejects sender:"humain" with no token (agent impersonation)', async () => {
    const res = await request(app)
      .post('/api/messages')
      .send({ conversationId, sender: 'humain', content: 'Bonjour' });

    expect(res.statusCode).toBe(401);
  });

  test('accepts sender:"humain" with a valid agent token', async () => {
    const res = await request(app)
      .post('/api/messages')
      .set('Authorization', `Bearer ${agentToken}`)
      .send({ conversationId, sender: 'humain', content: 'Bonjour, je suis là pour vous aider.' });

    expect(res.statusCode).toBe(201);
  });

  test('rejects sender:"client" with no token', async () => {
    const res = await request(app)
      .post('/api/messages')
      .send({ conversationId, sender: 'client', content: 'Salut' });

    expect(res.statusCode).toBe(401);
  });

  test("rejects sender:'client' into a conversation the token doesn't own", async () => {
    const otherRes = await request(app)
      .post('/api/users/find-or-create')
      .send({ name: 'Other Msg User', email: 'othermsg@example.com' });
    const otherToken = otherRes.body.token;

    const res = await request(app)
      .post('/api/messages')
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ conversationId, sender: 'client', content: 'Intrusion' });

    expect(res.statusCode).toBe(403);
  });

  test("accepts sender:'client' with the owning client's token", async () => {
    const res = await request(app)
      .post('/api/messages')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ conversationId, sender: 'client', content: 'Comment suivre ma commande ?' });

    expect(res.statusCode).toBe(201);
  });

  test("rejects sender:'ia' from an external request (no direct bot-message injection)", async () => {
    const res = await request(app)
      .post('/api/messages')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ conversationId, sender: 'ia', content: 'Fake bot message' });

    expect(res.statusCode).toBe(403);
  });
});
