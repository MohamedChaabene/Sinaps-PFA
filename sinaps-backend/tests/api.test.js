const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

require('../models/User');
require('../models/Agent');
require('../models/Conversation');
require('../models/Message');

const userRoutes = require('../routes/userRoutes');
const conversationRoutes = require('../routes/conversationRoutes');
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
  app.use('/api/stats', statsRoutes);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('User and Conversation API Integration Tests', () => {
  let userId;
  let conversationId;

  test('POST /api/users/find-or-create creates or finds a user', async () => {
    const res = await request(app)
      .post('/api/users/find-or-create')
      .send({ name: 'Test User', email: 'test@example.com' });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('_id');
    expect(res.body.email).toBe('test@example.com');
    userId = res.body._id;
  });

  test('POST /api/conversations/find-or-create creates a new conversation for user', async () => {
    const res = await request(app)
      .post('/api/conversations/find-or-create')
      .send({ clientId: userId });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('_id');
    expect(res.body.handledBy).toBe('ia');
    conversationId = res.body._id;
  });

  test('PATCH /api/conversations/:id/escalate escalates conversation to human agent', async () => {
    const res = await request(app)
      .patch(`/api/conversations/${conversationId}/escalate`);

    expect(res.statusCode).toBe(200);
    expect(res.body.handledBy).toBe('humain');
    expect(res.body.status).toBe('en_attente');
  });

  test('PATCH /api/conversations/:id/close closes conversation with satisfaction rating', async () => {
    const res = await request(app)
      .patch(`/api/conversations/${conversationId}/close`)
      .send({ rating: 5, comment: 'Excellent support !' });

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('resolu');
    expect(res.body.satisfaction.rating).toBe(5);
  });
});
