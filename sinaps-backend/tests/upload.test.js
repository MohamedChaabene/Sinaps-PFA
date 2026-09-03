const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-for-ci';
// Keep the "file too large" test fast and cheap instead of uploading 15MB+.
process.env.MAX_UPLOAD_SIZE_MB = '1';

const uploadRoutes = require('../routes/uploadRoutes');

let app;
const uploadedFiles = [];

beforeAll(() => {
  app = express();
  app.use('/api/upload', uploadRoutes);
});

afterAll(() => {
  // Clean up anything actually written to disk by these tests.
  const uploadsDir = path.join(__dirname, '../uploads');
  for (const name of uploadedFiles) {
    const filePath = path.join(uploadsDir, name);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
});

function clientToken() {
  return jwt.sign({ id: 'client1', role: 'client' }, process.env.JWT_SECRET);
}

function agentToken() {
  return jwt.sign({ id: 'agent1', role: 'agent' }, process.env.JWT_SECRET);
}

function trackUploaded(res) {
  if (res.body?.url) uploadedFiles.push(path.basename(res.body.url));
}

describe('POST /api/upload', () => {
  test('rejects a request with no session at all', async () => {
    const res = await request(app)
      .post('/api/upload')
      .attach('file', Buffer.from('hello'), { filename: 'note.txt', contentType: 'text/plain' });

    expect(res.statusCode).toBe(401);
  });

  test('rejects a disallowed file type even with a valid client session', async () => {
    const res = await request(app)
      .post('/api/upload')
      .set('Authorization', `Bearer ${clientToken()}`)
      .attach('file', Buffer.from('#!/bin/sh\necho hi'), { filename: 'script.sh', contentType: 'application/x-sh' });

    trackUploaded(res);
    expect(res.statusCode).toBe(400);
  });

  test('accepts an allowed image type from a client session', async () => {
    const res = await request(app)
      .post('/api/upload')
      .set('Authorization', `Bearer ${clientToken()}`)
      .attach('file', Buffer.from([0xff, 0xd8, 0xff, 0xe0]), { filename: 'photo.jpg', contentType: 'image/jpeg' });

    trackUploaded(res);
    expect(res.statusCode).toBe(200);
    expect(res.body.type).toBe('image');
    expect(res.body.url).toMatch(/\.jpg$/);
  });

  test('accepts an allowed PDF document from an agent session', async () => {
    const res = await request(app)
      .post('/api/upload')
      .set('Authorization', `Bearer ${agentToken()}`)
      .attach('file', Buffer.from('%PDF-1.4 fake content'), { filename: 'invoice.pdf', contentType: 'application/pdf' });

    trackUploaded(res);
    expect(res.statusCode).toBe(200);
    expect(res.body.type).toBe('document');
    expect(res.body.url).toMatch(/\.pdf$/);
  });

  test('rejects a file larger than the configured limit', async () => {
    const big = Buffer.alloc(1.5 * 1024 * 1024, 'a'); // 1.5MB, over the 1MB test limit
    const res = await request(app)
      .post('/api/upload')
      .set('Authorization', `Bearer ${clientToken()}`)
      .attach('file', big, { filename: 'big.jpg', contentType: 'image/jpeg' });

    trackUploaded(res);
    expect(res.statusCode).toBe(413);
  });

  test('falls back to a safe extension for an unrecognized-but-allowed mime subtype', async () => {
    const res = await request(app)
      .post('/api/upload')
      .set('Authorization', `Bearer ${clientToken()}`)
      .attach('file', Buffer.from('fake bmp data'), { filename: 'weird pic!!.bmp', contentType: 'image/x-ms-bmp' });

    trackUploaded(res);
    expect(res.statusCode).toBe(200);
    expect(res.body.type).toBe('image');
    // Not in the MIME_EXTENSIONS table, but the original ".bmp" is short/alphanumeric so it's kept.
    expect(res.body.url).toMatch(/\.bmp$/);
  });
});
