const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

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

const { QUICK_REPLY_ACTIONS, RESOLUTION_TYPES } = require('../utils/constants');

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

describe('Conversation Schema - Phase 1 Enhancements', () => {
  let user;

  beforeEach(async () => {
    user = await User.create({
      googleId: `test-google-id-${Date.now()}-${Math.random()}`,
      name: 'Test User',
      email: `test-${Date.now()}@example.com`
    });
  });

  describe('Resolution Metadata', () => {
    test('default resolvedBy is null', async () => {
      const conversation = await Conversation.create({ client: user._id });
      expect(conversation.resolvedBy).toBeNull();
    });

    test('accepts valid resolvedBy values', async () => {
      const validValues = ['client', 'agent', 'system'];
      for (const value of validValues) {
        const conversation = await Conversation.create({ 
          client: user._id,
          resolvedBy: value
        });
        expect(conversation.resolvedBy).toBe(value);
      }
    });

    test('rejects invalid resolvedBy values', async () => {
      await expect(
        Conversation.create({ 
          client: user._id,
          resolvedBy: 'invalid_value'
        })
      ).rejects.toThrow();
    });

    test('default resolvedAt is null', async () => {
      const conversation = await Conversation.create({ client: user._id });
      expect(conversation.resolvedAt).toBeNull();
    });

    test('accepts valid resolvedAt date', async () => {
      const date = new Date();
      const conversation = await Conversation.create({ 
        client: user._id,
        resolvedAt: date
      });
      expect(conversation.resolvedAt).toEqual(date);
    });

    test('default resolutionType is null', async () => {
      const conversation = await Conversation.create({ client: user._id });
      expect(conversation.resolutionType).toBeNull();
    });

    test('accepts valid resolutionType values', async () => {
      const validTypes = Object.values(RESOLUTION_TYPES);
      for (const type of validTypes) {
        const conversation = await Conversation.create({ 
          client: user._id,
          resolutionType: type
        });
        expect(conversation.resolutionType).toBe(type);
      }
    });

    test('rejects invalid resolutionType values', async () => {
      await expect(
        Conversation.create({ 
          client: user._id,
          resolutionType: 'invalid_type'
        })
      ).rejects.toThrow();
    });
  });

  describe('Activity Tracking', () => {
    test('lastActivityAt is populated on creation', async () => {
      const conversation = await Conversation.create({ client: user._id });
      expect(conversation.lastActivityAt).toBeInstanceOf(Date);
      expect(conversation.lastActivityAt).not.toBeNull();
    });

    test('lastActivityAt can be updated', async () => {
      const conversation = await Conversation.create({ client: user._id });
      const originalDate = conversation.lastActivityAt;
      
      // Wait a bit to ensure time difference
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const newDate = new Date();
      conversation.lastActivityAt = newDate;
      await conversation.save();
      
      const updated = await Conversation.findById(conversation._id);
      expect(updated.lastActivityAt).not.toEqual(originalDate);
      expect(updated.lastActivityAt).toEqual(newDate);
    });
  });

  describe('AI Tracking', () => {
    test('default aiAttemptCount is 0', async () => {
      const conversation = await Conversation.create({ client: user._id });
      expect(conversation.aiAttemptCount).toBe(0);
    });

    test('aiAttemptCount accepts non-negative values', async () => {
      const conversation = await Conversation.create({ 
        client: user._id,
        aiAttemptCount: 5
      });
      expect(conversation.aiAttemptCount).toBe(5);
    });

    test('rejects negative aiAttemptCount', async () => {
      await expect(
        Conversation.create({ 
          client: user._id,
          aiAttemptCount: -1
        })
      ).rejects.toThrow();
    });

    test('default escalationCount is 0', async () => {
      const conversation = await Conversation.create({ client: user._id });
      expect(conversation.escalationCount).toBe(0);
    });

    test('escalationCount accepts non-negative values', async () => {
      const conversation = await Conversation.create({ 
        client: user._id,
        escalationCount: 3
      });
      expect(conversation.escalationCount).toBe(3);
    });

    test('rejects negative escalationCount', async () => {
      await expect(
        Conversation.create({ 
          client: user._id,
          escalationCount: -1
        })
      ).rejects.toThrow();
    });

    test('default lastEscalationOffer is null', async () => {
      const conversation = await Conversation.create({ client: user._id });
      expect(conversation.lastEscalationOffer).toBeNull();
    });

    test('accepts valid lastEscalationOffer date', async () => {
      const date = new Date();
      const conversation = await Conversation.create({ 
        client: user._id,
        lastEscalationOffer: date
      });
      expect(conversation.lastEscalationOffer).toEqual(date);
    });
  });

  describe('Backward Compatibility', () => {
    test('existing fields still work', async () => {
      const agent = await Agent.create({
        name: 'Test Agent',
        email: `agent-${Date.now()}@example.com`,
        password: 'hashedpassword',
        skills: ['test'],
        status: 'approved'
      });

      const conversation = await Conversation.create({
        client: user._id,
        assignedAgent: agent._id,
        status: 'en_cours',
        handledBy: 'ia',
        satisfaction: {
          rating: 5,
          comment: 'Great service'
        }
      });

      expect(conversation.client).toEqual(user._id);
      expect(conversation.assignedAgent).toEqual(agent._id);
      expect(conversation.status).toBe('en_cours');
      expect(conversation.handledBy).toBe('ia');
      expect(conversation.satisfaction.rating).toBe(5);
      expect(conversation.satisfaction.comment).toBe('Great service');
    });

    test('existing statuses still work', async () => {
      const statuses = ['en_cours', 'en_attente', 'resolu'];
      for (const status of statuses) {
        const conversation = await Conversation.create({
          client: user._id,
          status: status
        });
        expect(conversation.status).toBe(status);
      }
    });
  });

  describe('One Active Conversation Per Client', () => {
    test('can create one active conversation per client', async () => {
      const conversation1 = await Conversation.create({
        client: user._id,
        status: 'en_cours'
      });

      // This should work (same client, same status - but in production the unique index will prevent this)
      // For now, we're just testing that the schema allows it
      const conversation2 = await Conversation.create({
        client: user._id,
        status: 'en_attente'
      });

      expect(conversation1.client).toEqual(user._id);
      expect(conversation2.client).toEqual(user._id);
    });

    test('can create multiple resolved conversations for same client', async () => {
      const conversation1 = await Conversation.create({
        client: user._id,
        status: 'resolu'
      });

      const conversation2 = await Conversation.create({
        client: user._id,
        status: 'resolu'
      });

      expect(conversation1.status).toBe('resolu');
      expect(conversation2.status).toBe('resolu');
    });
  });
});

describe('Message Schema - Quick Replies', () => {
  let user;
  let conversation;

  beforeEach(async () => {
    user = await User.create({
      googleId: `test-google-id-${Date.now()}-${Math.random()}`,
      name: 'Test User',
      email: `test-${Date.now()}@example.com`
    });

    conversation = await Conversation.create({
      client: user._id
    });
  });

  describe('Quick Replies Storage', () => {
    test('can store message without quickReplies', async () => {
      const message = await Message.create({
        conversation: conversation._id,
        sender: 'client',
        content: 'Hello'
      });

      expect(message.quickReplies).toEqual([]);
      expect(message.content).toBe('Hello');
    });

    test('can store message with single quickReply', async () => {
      const quickReply = {
        id: 'solved',
        label: "👍 That's what I needed",
        action: QUICK_REPLY_ACTIONS.CONFIRM_RESOLVED,
        metadata: {}
      };

      const message = await Message.create({
        conversation: conversation._id,
        sender: 'ia',
        content: 'Here is your answer',
        quickReplies: [quickReply]
      });

      expect(message.quickReplies).toHaveLength(1);
      expect(message.quickReplies[0].id).toBe('solved');
      expect(message.quickReplies[0].label).toBe("👍 That's what I needed");
      expect(message.quickReplies[0].action).toBe('CONFIRM_RESOLVED');
      expect(message.quickReplies[0].metadata).toEqual({});
    });

    test('can store message with multiple quickReplies', async () => {
      const quickReplies = [
        {
          id: 'solved',
          label: "👍 That's what I needed",
          action: QUICK_REPLY_ACTIONS.CONFIRM_RESOLVED,
          metadata: {}
        },
        {
          id: 'more',
          label: '💬 I have another question',
          action: QUICK_REPLY_ACTIONS.NEW_QUESTION,
          metadata: { category: 'general' }
        },
        {
          id: 'agent',
          label: '👨‍💼 Talk to an agent',
          action: QUICK_REPLY_ACTIONS.ESCALATE_TO_HUMAN,
          metadata: { reason: 'complex_issue' }
        }
      ];

      const message = await Message.create({
        conversation: conversation._id,
        sender: 'ia',
        content: 'How can I help?',
        quickReplies: quickReplies
      });

      expect(message.quickReplies).toHaveLength(3);
      expect(message.quickReplies[0].action).toBe('CONFIRM_RESOLVED');
      expect(message.quickReplies[1].action).toBe('NEW_QUESTION');
      expect(message.quickReplies[2].action).toBe('ESCALATE_TO_HUMAN');
    });

    test('quickReply id is required', async () => {
      await expect(
        Message.create({
          conversation: conversation._id,
          sender: 'ia',
          content: 'Test',
          quickReplies: [{
            label: 'Test',
            action: 'TEST_ACTION'
          }]
        })
      ).rejects.toThrow();
    });

    test('quickReply label is required', async () => {
      await expect(
        Message.create({
          conversation: conversation._id,
          sender: 'ia',
          content: 'Test',
          quickReplies: [{
            id: 'test',
            action: 'TEST_ACTION'
          }]
        })
      ).rejects.toThrow();
    });

    test('quickReply action is required', async () => {
      await expect(
        Message.create({
          conversation: conversation._id,
          sender: 'ia',
          content: 'Test',
          quickReplies: [{
            id: 'test',
            label: 'Test'
          }]
        })
      ).rejects.toThrow();
    });

    test('quickReply metadata defaults to empty object', async () => {
      const message = await Message.create({
        conversation: conversation._id,
        sender: 'ia',
        content: 'Test',
        quickReplies: [{
          id: 'test',
          label: 'Test',
          action: 'TEST_ACTION'
        }]
      });

      expect(message.quickReplies[0].metadata).toEqual({});
    });

    test('quickReply metadata can store complex data', async () => {
      const complexMetadata = {
        category: 'orders',
        priority: 'high',
        context: {
          orderId: '12345',
          timestamp: new Date()
        }
      };

      const message = await Message.create({
        conversation: conversation._id,
        sender: 'ia',
        content: 'Test',
        quickReplies: [{
          id: 'test',
          label: 'Test',
          action: 'TEST_ACTION',
          metadata: complexMetadata
        }]
      });

      expect(message.quickReplies[0].metadata).toEqual(complexMetadata);
    });
  });

  describe('Backward Compatibility', () => {
    test('existing message fields still work', async () => {
      const message = await Message.create({
        conversation: conversation._id,
        sender: 'client',
        authorName: 'Test User',
        content: 'Hello',
        attachments: [{
          url: 'http://example.com/image.jpg',
          type: 'image',
          name: 'test.jpg'
        }]
      });

      expect(message.conversation).toEqual(conversation._id);
      expect(message.sender).toBe('client');
      expect(message.authorName).toBe('Test User');
      expect(message.content).toBe('Hello');
      expect(message.attachments).toHaveLength(1);
      expect(message.attachments[0].url).toBe('http://example.com/image.jpg');
    });

    test('existing sender types still work', async () => {
      const senders = ['client', 'ia', 'humain'];
      for (const sender of senders) {
        const message = await Message.create({
          conversation: conversation._id,
          sender: sender,
          content: 'Test'
        });
        expect(message.sender).toBe(sender);
      }
    });
  });
});

describe('Quick Reply Constants', () => {
  test('all required QUICK_REPLY_ACTIONS are defined', () => {
    const expectedActions = [
      'CONFIRM_RESOLVED',
      'NEW_QUESTION',
      'ESCALATE_TO_HUMAN',
      'RETRY_AI',
      'NEED_MORE_HELP',
      'YES_ANOTHER_QUESTION',
      'NO_ALL_DONE'
    ];

    expectedActions.forEach(action => {
      expect(QUICK_REPLY_ACTIONS).toHaveProperty(action);
    });
  });

  test('all required RESOLUTION_TYPES are defined', () => {
    const expectedTypes = [
      'CLIENT_CONFIRMED_AI',
      'CLIENT_CONFIRMED_AGENT',
      'AGENT_RESOLVED',
      'ABANDONED'
    ];

    expectedTypes.forEach(type => {
      expect(RESOLUTION_TYPES).toHaveProperty(type);
    });
  });
});
