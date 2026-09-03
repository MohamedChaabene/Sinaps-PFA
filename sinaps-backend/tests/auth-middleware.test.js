// Unit tests for the auth middleware itself (client sessions, conversation
// ownership, and message sender authorization), mocking the Conversation
// model so these run without a real MongoDB instance.
jest.mock('../models/Conversation');

const jwt = require('jsonwebtoken');
const Conversation = require('../models/Conversation');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-for-ci';

const {
  requireClientAuth,
  requireConversationAccess,
  requireSenderAuth,
} = require('../middleware/auth');

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

function signToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET);
}

afterEach(() => {
  jest.clearAllMocks();
});

describe('requireClientAuth', () => {
  test('rejects a request with no Authorization header', () => {
    const req = { headers: {} };
    const res = mockRes();
    const next = jest.fn();

    requireClientAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('rejects a malformed/invalid token', () => {
    const req = { headers: { authorization: 'Bearer not-a-real-jwt' } };
    const res = mockRes();
    const next = jest.fn();

    requireClientAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('rejects a valid token with the wrong role (e.g. an agent token)', () => {
    const token = signToken({ id: 'agent1', role: 'agent' });
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = mockRes();
    const next = jest.fn();

    requireClientAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  test('accepts a valid client token and sets req.client', () => {
    const token = signToken({ id: 'client1', role: 'client' });
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = mockRes();
    const next = jest.fn();

    requireClientAuth(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.client.id).toBe('client1');
  });
});

describe('requireConversationAccess', () => {
  test('rejects a request with no session', async () => {
    const req = { headers: {}, params: { id: 'conv1' } };
    const res = mockRes();
    const next = jest.fn();

    await requireConversationAccess(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('allows any agent/admin token through without an ownership lookup', async () => {
    const token = signToken({ id: 'agent1', role: 'agent' });
    const req = { headers: { authorization: `Bearer ${token}` }, params: { id: 'conv1' } };
    const res = mockRes();
    const next = jest.fn();

    await requireConversationAccess(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(Conversation.findById).not.toHaveBeenCalled();
  });

  test('allows the client who owns the conversation', async () => {
    Conversation.findById.mockReturnValue({ select: jest.fn().mockResolvedValue({ client: 'client1' }) });
    const token = signToken({ id: 'client1', role: 'client' });
    const req = { headers: { authorization: `Bearer ${token}` }, params: { id: 'conv1' } };
    const res = mockRes();
    const next = jest.fn();

    await requireConversationAccess(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.client.id).toBe('client1');
  });

  test("rejects a client who does not own the conversation", async () => {
    Conversation.findById.mockReturnValue({ select: jest.fn().mockResolvedValue({ client: 'client1' }) });
    const token = signToken({ id: 'client2', role: 'client' });
    const req = { headers: { authorization: `Bearer ${token}` }, params: { id: 'conv1' } };
    const res = mockRes();
    const next = jest.fn();

    await requireConversationAccess(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 404 when the conversation does not exist', async () => {
    Conversation.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });
    const token = signToken({ id: 'client1', role: 'client' });
    const req = { headers: { authorization: `Bearer ${token}` }, params: { id: 'missing' } };
    const res = mockRes();
    const next = jest.fn();

    await requireConversationAccess(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});

describe('requireSenderAuth (POST /api/messages)', () => {
  test('rejects sender:"ia" from an external request outright', async () => {
    const req = { headers: {}, body: { sender: 'ia', conversationId: 'conv1' } };
    const res = mockRes();
    const next = jest.fn();

    await requireSenderAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  test('rejects sender:"humain" with no agent token', async () => {
    const req = { headers: {}, body: { sender: 'humain', conversationId: 'conv1' } };
    const res = mockRes();
    const next = jest.fn();

    await requireSenderAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('accepts sender:"humain" with a valid agent token', async () => {
    const token = signToken({ id: 'agent1', role: 'agent' });
    const req = {
      headers: { authorization: `Bearer ${token}` },
      body: { sender: 'humain', conversationId: 'conv1' },
    };
    const res = mockRes();
    const next = jest.fn();

    await requireSenderAuth(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  test('rejects sender:"client" with no token', async () => {
    const req = { headers: {}, body: { sender: 'client', conversationId: 'conv1' } };
    const res = mockRes();
    const next = jest.fn();

    await requireSenderAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test("rejects sender:'client' into a conversation the token doesn't own", async () => {
    Conversation.findById.mockReturnValue({ select: jest.fn().mockResolvedValue({ client: 'someone-else' }) });
    const token = signToken({ id: 'client9', role: 'client' });
    const req = {
      headers: { authorization: `Bearer ${token}` },
      body: { sender: 'client', conversationId: 'conv1' },
    };
    const res = mockRes();
    const next = jest.fn();

    await requireSenderAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  test("accepts sender:'client' with the owning client's token", async () => {
    Conversation.findById.mockReturnValue({ select: jest.fn().mockResolvedValue({ client: 'client9' }) });
    const token = signToken({ id: 'client9', role: 'client' });
    const req = {
      headers: { authorization: `Bearer ${token}` },
      body: { sender: 'client', conversationId: 'conv1' },
    };
    const res = mockRes();
    const next = jest.fn();

    await requireSenderAuth(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.client.id).toBe('client9');
  });
});
