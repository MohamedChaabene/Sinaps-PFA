const { retrieveRelevantContext } = require('../services/ragService');
const { getAIResponse } = require('../services/geminiService');

describe('RAG Service & Knowledge Base Retrieval', () => {
  test('retrieves correct knowledge snippet for tracking orders', () => {
    const results = retrieveRelevantContext('Comment suivre ma commande ?');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].question).toContain('suivre ma commande');
  });

  test('retrieves correct knowledge snippet for refunds', () => {
    const results = retrieveRelevantContext('Je veux un remboursement pour ma commande');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].question).toContain('remboursement');
  });

  test('returns empty array for unrelated queries', () => {
    const results = retrieveRelevantContext('xyz123abc45632145');
    expect(results.length).toBe(0);
  });

  test('getAIResponse generates RAG answer with local fallback when GEMINI_API_KEY is empty', async () => {
    const response = await getAIResponse('Comment réinitialiser mon mot de passe ?');
    expect(response).toContain('Mot de passe oublié');
  });
});
