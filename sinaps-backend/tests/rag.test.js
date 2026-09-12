const { retrieveRelevantContext } = require('../services/ragService');
const { getAIResponse } = require('../services/geminiService');

describe('RAG Service & Knowledge Base Retrieval', () => {
  describe('Direct Questions', () => {
    test('retrieves correct knowledge snippet for tracking orders', () => {
      const results = retrieveRelevantContext('Comment suivre ma commande ?');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].id).toBe('order-tracking');
      expect(results[0].source).toBe('FAQ Commandes');
    });

    test('retrieves correct knowledge snippet for refunds', () => {
      const results = retrieveRelevantContext('Comment obtenir un remboursement ?');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].id).toBe('refund');
      expect(results[0].source).toBe('FAQ Retours');
    });

    test('retrieves correct knowledge snippet for password reset', () => {
      const results = retrieveRelevantContext('Comment réinitialiser mon mot de passe ?');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].id).toBe('password-reset');
      expect(results[0].source).toBe('FAQ Compte');
    });

    test('retrieves correct knowledge snippet for promo codes', () => {
      const results = retrieveRelevantContext('Un code promo ne fonctionne pas');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].id).toBe('promo-code');
      expect(results[0].source).toBe('FAQ Facturation');
    });

    test('retrieves correct knowledge snippet for delayed orders', () => {
      const results = retrieveRelevantContext('Ma commande est en retard, que faire ?');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].id).toBe('order-delay');
      expect(results[0].source).toBe('FAQ Commandes');
    });
  });

  describe('Paraphrased Questions', () => {
    test('retrieves order tracking with paraphrase: "Où puis-je voir le suivi de mon colis ?"', () => {
      const results = retrieveRelevantContext('Où puis-je voir le suivi de mon colis ?');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].id).toBe('order-tracking');
    });

    test('retrieves refund info with paraphrase: "Je veux récupérer mon argent après un retour"', () => {
      const results = retrieveRelevantContext('Je veux récupérer mon argent après un retour');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].id).toBe('refund');
    });

    test('retrieves password reset with paraphrase: "J\'ai oublié mon mot de passe"', () => {
      const results = retrieveRelevantContext('J\'ai oublié mon mot de passe');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].id).toBe('password-reset');
    });
  });

  describe('French Variations', () => {
    test('handles accents: "comment suivre ma commande"', () => {
      const results = retrieveRelevantContext('comment suivre ma commande');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].id).toBe('order-tracking');
    });

    test('handles punctuation: "Où est mon colis?!"', () => {
      const results = retrieveRelevantContext('Où est mon colis?!');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].id).toBe('order-tracking');
    });

    test('handles apostrophes: "J\'ai perdu mon mot de passe"', () => {
      const results = retrieveRelevantContext('J\'ai perdu mon mot de passe');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].id).toBe('password-reset');
    });

    test('handles uppercase: "COMMENT SUIVRE MA COMMANDE"', () => {
      const results = retrieveRelevantContext('COMMENT SUIVRE MA COMMANDE');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].id).toBe('order-tracking');
    });

    test('handles word variations: "Je veux me faire rembourser"', () => {
      const results = retrieveRelevantContext('Je veux me faire rembourser');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].id).toBe('refund');
    });
  });

  describe('Keywords and Synonyms', () => {
    test('retrieves via keyword: "livraison"', () => {
      const results = retrieveRelevantContext('ma livraison');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].id).toBe('order-tracking');
    });

    test('retrieves via keyword: "tracking"', () => {
      const results = retrieveRelevantContext('tracking');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].id).toBe('order-tracking');
    });

    test('retrieves via keyword: "argent"', () => {
      const results = retrieveRelevantContext('je veux mon argent');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].id).toBe('refund');
    });

    test('retrieves via keyword: "réduction"', () => {
      const results = retrieveRelevantContext('ma réduction ne marche pas');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].id).toBe('promo-code');
    });
  });

  describe('Negative Tests', () => {
    test('returns empty for weather questions', () => {
      const results = retrieveRelevantContext('Quelle est la météo demain ?');
      expect(results.length).toBe(0);
    });

    test('returns empty for sports questions', () => {
      const results = retrieveRelevantContext('Qui a gagné le match hier ?');
      expect(results.length).toBe(0);
    });

    test('returns empty for recipe questions', () => {
      const results = retrieveRelevantContext('Donne-moi une recette de pizza');
      expect(results.length).toBe(0);
    });

    test('returns empty for unrelated product questions', () => {
      const results = retrieveRelevantContext('Quel est le prix d\'un iPhone ?');
      expect(results.length).toBe(0);
    });

    test('returns empty for completely random text', () => {
      const results = retrieveRelevantContext('xyz123abc45632145');
      expect(results.length).toBe(0);
    });
  });

  describe('Ranking', () => {
    test('most relevant document has highest score for order tracking', () => {
      const results = retrieveRelevantContext('Comment suivre ma commande ?', 3);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].id).toBe('order-tracking');
      expect(results[0].score).toBeGreaterThan(results[1]?.score || 0);
    });

    test('most relevant document has highest score for refunds', () => {
      const results = retrieveRelevantContext('Je veux un remboursement', 3);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].id).toBe('refund');
      expect(results[0].score).toBeGreaterThan(results[1]?.score || 0);
    });
  });

  describe('Metadata', () => {
    test('returns documents with all required metadata', () => {
      const results = retrieveRelevantContext('Comment suivre ma commande ?');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0]).toHaveProperty('id');
      expect(results[0]).toHaveProperty('category');
      expect(results[0]).toHaveProperty('question');
      expect(results[0]).toHaveProperty('answer');
      expect(results[0]).toHaveProperty('source');
      expect(results[0]).toHaveProperty('score');
    });
  });
});

describe('Gemini Service', () => {
  describe('Greeting Handling', () => {
    test('handles "Bonjour" greeting', async () => {
      const response = await getAIResponse('Bonjour');
      expect(response).toContain('Bonjour');
      expect(response).toContain('Sinaps');
    });

    test('handles "Salut" greeting', async () => {
      const response = await getAIResponse('Salut');
      expect(response).toContain('Bonjour');
      expect(response).toContain('Sinaps');
    });

    test('handles "Merci" response', async () => {
      const response = await getAIResponse('Merci beaucoup');
      expect(response).toContain('Je vous en prie');
    });

    test('handles "Au revoir" farewell', async () => {
      const response = await getAIResponse('Au revoir');
      expect(response).toContain('Au revoir');
    });
  });

  describe('RAG Integration', () => {
    test('getAIResponse generates RAG answer with local fallback when GEMINI_API_KEY is empty', async () => {
      const response = await getAIResponse('Comment réinitialiser mon mot de passe ?');
      expect(response).toContain('Mot de passe oublié');
    });

    test('getAIResponse handles order tracking queries', async () => {
      const response = await getAIResponse('Comment suivre ma commande ?');
      expect(response).toBeTruthy();
      expect(response.length).toBeGreaterThan(0);
    });
  });
});
