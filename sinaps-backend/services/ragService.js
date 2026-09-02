const knowledgeBase = require('../data/knowledgeBase');

// Simple TF-IDF & Cosine Similarity based vector retriever for RAG
function tokenize(text) {
  if (!text) return [];
  const stopWords = new Set(['le', 'la', 'les', 'de', 'du', 'des', 'un', 'une', 'en', 'et', 'a', 'est', 'que', 'qui', 'pour', 'pas', 'dans', 'sur', 'mon', 'ma', 'mes']);
  return text
    .toLowerCase()
    .replace(/[^a-z0-9àâäéèêëîïôöùûüç]/gi, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1 && !stopWords.has(w));
}

function computeTermFrequency(tokens) {
  const tf = {};
  for (const t of tokens) {
    tf[t] = (tf[t] || 0) + 1;
  }
  for (const t in tf) {
    tf[t] = tf[t] / tokens.length;
  }
  return tf;
}

// Pre-index knowledge base documents
const indexedDocs = knowledgeBase.map((doc, index) => {
  const combinedText = `${doc.question} ${doc.answer}`;
  const tokens = tokenize(combinedText);
  return {
    id: index,
    question: doc.question,
    answer: doc.answer,
    tokens,
    tf: computeTermFrequency(tokens),
  };
});

// Compute Inverse Document Frequency (IDF)
const docCount = indexedDocs.length;
const df = {};
for (const doc of indexedDocs) {
  const uniqueTokens = new Set(doc.tokens);
  for (const t of uniqueTokens) {
    df[t] = (df[t] || 0) + 1;
  }
}

const idf = {};
for (const t in df) {
  idf[t] = Math.log((docCount + 1) / (df[t] + 1)) + 1;
}

function docToVector(docTf) {
  const vec = {};
  for (const t in docTf) {
    vec[t] = docTf[t] * (idf[t] || 1);
  }
  return vec;
}

function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (const t in vecA) {
    normA += vecA[t] * vecA[t];
    if (vecB[t]) {
      dotProduct += vecA[t] * vecB[t];
    }
  }

  for (const t in vecB) {
    normB += vecB[t] * vecB[t];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * RAG Retriever: Retrieves the top-K relevant documents from knowledge base
 */
function retrieveRelevantContext(query, topK = 2) {
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) return [];

  const queryTf = computeTermFrequency(queryTokens);
  const queryVec = docToVector(queryTf);

  const scoredDocs = indexedDocs.map((doc) => {
    const docVec = docToVector(doc.tf);
    const score = cosineSimilarity(queryVec, docVec);
    return { ...doc, score };
  });

  scoredDocs.sort((a, b) => b.score - a.score);

  // Return top K documents if score > threshold
  const relevant = scoredDocs.filter((d) => d.score > 0.05).slice(0, topK);
  return relevant;
}

module.exports = { retrieveRelevantContext, indexedDocs };
