const knowledgeBase = require('../data/knowledgeBase');

// Improved French text normalization for RAG
function normalizeText(text) {
  if (!text) return '';
  
  // Convert to lowercase
  let normalized = text.toLowerCase();
  
  // Remove accents but keep base characters
  const accentMap = {
    'à': 'a', 'â': 'a', 'ä': 'a',
    'é': 'e', 'è': 'e', 'ê': 'e', 'ë': 'e',
    'î': 'i', 'ï': 'i',
    'ô': 'o', 'ö': 'o',
    'ù': 'u', 'û': 'u', 'ü': 'u',
    'ç': 'c'
  };
  
  normalized = normalized.split('').map(char => accentMap[char] || char).join('');
  
  // Handle apostrophes (l' -> le, d' -> de, etc.)
  normalized = normalized.replace(/l'/g, 'le ')
    .replace(/d'/g, 'de ')
    .replace(/qu'/g, 'que ')
    .replace(/j'/g, 'je ')
    .replace(/n'/g, 'ne ')
    .replace(/s'/g, 'se ')
    .replace(/c'/g, 'ce ');
  
  // Replace punctuation with spaces
  normalized = normalized.replace(/[^\w\s]/g, ' ');
  
  // Remove extra spaces
  normalized = normalized.replace(/\s+/g, ' ').trim();
  
  return normalized;
}

// Extended French stop words
const stopWords = new Set([
  'le', 'la', 'les', 'de', 'du', 'des', 'un', 'une', 'en', 'et', 'a', 'est', 'que', 'qui', 'pour', 'pas', 'dans', 'sur', 'mon', 'ma', 'mes',
  'ton', 'ta', 'tes', 'son', 'sa', 'ses', 'notre', 'nos', 'votre', 'vos', 'leur', 'leurs',
  'je', 'tu', 'il', 'elle', 'nous', 'vous', 'ils', 'elles',
  'ce', 'cet', 'cette', 'ces', 'ca', 'ça',
  'avec', 'sans', 'par', 'pour', 'chez', 'vers',
  'mais', 'ou', 'où', 'donc', 'or', 'ni', 'car',
  'si', 'lorsque', 'puisque', 'comme', 'alors',
  'plus', 'moins', 'très', 'bien', 'aussi', 'trop',
  'tout', 'tous', 'toute', 'toutes', 'chaque', 'certains', 'certaines',
  'autre', 'autres', 'même', 'memes', 'autrefois',
  'avoir', 'être', 'faire', 'aller', 'voir', 'savoir', 'pouvoir', 'vouloir',
  'y', 'en', 'ne',
  'quel', 'quels', 'quelle', 'quelles',
  'demain', 'hier', 'aujourd',
  'prix', 'coût', 'cout',
  'peut', 'peux', 'peuvent',
  'veut', 'veux', 'veulent',
  'faut', 'fall',
  'dit', 'dis', 'disent',
  'prend', 'prendre',
  'donne', 'donner',
  'trouve', 'trouver',
  'cherch', 'chercher',
  'savoir', 'connaitre', 'connait',
  'faire', 'fait',
  'avoir', 'a',
  'être', 'est',
  'aller', 'va',
  'venir', 'vient',
  'mettre', 'met',
  'prendre', 'prend',
  'donner', 'donne',
  'voir', 'voit',
  'pouvoir', 'peut',
  'vouloir', 'veut',
  'devoir', 'doit',
  'savoir', 'sait',
  'connaitre', 'connait',
  'dire', 'dit',
  'écrire', 'ecrit',
  'lire', 'lit',
  'entendre', 'entend',
  'comprendre', 'comprend',
  'parler', 'parle',
  'répondre', 'repond',
  'demander', 'demande',
  'expliquer', 'explique',
  'montrer', 'montre',
  'indiquer', 'indique',
  'signaler', 'signale',
  'constater', 'constate',
  'remarquer', 'remarque',
  'noter', 'note',
  'observer', 'observe',
  'percevoir', 'percoit',
  'sentir', 'sent',
  'ressentir', 'ressent',
  'éprouver', 'eprouve',
  'ressembler', 'ressemble',
  'sembler', 'semble',
  'devenir', 'devient',
  'rester', 'reste',
  'demeurer', 'demeure',
  'apparaitre', 'apparait',
  'paraitre', 'parait',
  'disparaitre', 'disparait',
  'arriver', 'arrive',
  'partir', 'part',
  'sortir', 'sort',
  'entrer', 'entre',
  'rentrer', 'rentre',
  'venir', 'vient',
  'aller', 'va',
  'tomber', 'tombe',
  'monter', 'monte',
  'descendre', 'descend',
  'remonter', 'remonte',
  'redescendre', 'redescend',
  'avancer', 'avance',
  'reculer', 'recule',
  'tourner', 'tourne',
  'retourner', 'retourne',
  'changer', 'change',
  'transformer', 'transforme',
  'modifier', 'modifie',
  'adapter', 'adapte',
  'ajuster', 'ajuste',
  'régler', 'regler',
  'fixer', 'fixe',
  'déterminer', 'determine',
  'définir', 'definir',
  'préciser', 'preciser',
  'expliquer', 'explique',
  'décrire', 'decrire',
  'raconter', 'raconte',
  'narrer', 'narr',
  'relater', 'relate',
  'rapporter', 'rapporte',
  'informer', 'informe',
  'prévenir', 'prevenir',
  'avertir', 'avertit',
  'annoncer', 'annonce',
  'déclarer', 'declare',
  'affirmer', 'affirme',
  'asser', 'assert',
  'garantir', 'garantit',
  'promettre', 'promet',
  'jurer', 'jure',
  'parier', 'parie',
  'gager', 'gage',
  'parier', 'parie'
]);

// Simple French word variation handling (root-based normalization)
function normalizeVariations(word) {
  const variations = {
    'remboursement': 'rembours',
    'rembourser': 'rembours',
    'remboursé': 'rembours',
    'remboursee': 'rembours',
    'commande': 'command',
    'commandes': 'command',
    'livraison': 'livr',
    'livrer': 'livr',
    'livré': 'livr',
    'livree': 'livr',
    'livraisons': 'livr',
    'retard': 'retard',
    'retards': 'retard',
    'retour': 'retour',
    'retours': 'retour',
    'mot': 'mot',
    'mots': 'mot',
    'passe': 'pass',
    'password': 'pass',
    'promo': 'promo',
    'promotion': 'promo',
    'reduction': 'reduct',
    'code': 'code',
    'codes': 'code',
    'facture': 'factur',
    'facturation': 'factur',
    'payer': 'pay',
    'paie': 'pay',
    'prix': 'prix',
    'coût': 'cout',
    'cout': 'cout',
    'argent': 'argent',
    'compte': 'compt',
    'comptes': 'compt',
    'client': 'client',
    'clients': 'client',
    'colis': 'colis',
    'paquet': 'paquet',
    'paquets': 'paquet',
    'suivi': 'suiv',
    'suivre': 'suiv',
    'suivis': 'suiv',
    'email': 'email',
    'mail': 'email',
    'courriel': 'email',
    'connexion': 'connect',
    'connecter': 'connect',
    'connecté': 'connect',
    'connectee': 'connect'
  };
  
  return variations[word] || word;
}

function tokenize(text) {
  if (!text) return [];
  
  const normalized = normalizeText(text);
  
  return normalized
    .split(/\s+/)
    .map(word => normalizeVariations(word))
    .filter(word => word.length > 2 && !stopWords.has(word));
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

// Pre-index knowledge base documents with new structure
const indexedDocs = knowledgeBase.map((doc) => {
  const combinedText = `${doc.question} ${doc.answer} ${doc.keywords.join(' ')}`;
  const tokens = tokenize(combinedText);
  const questionTokens = tokenize(doc.question);
  const answerTokens = tokenize(doc.answer);
  const keywordTokens = tokenize(doc.keywords.join(' '));
  
  return {
    id: doc.id,
    category: doc.category,
    question: doc.question,
    answer: doc.answer,
    keywords: doc.keywords,
    source: doc.source,
    tokens,
    questionTokens,
    answerTokens,
    keywordTokens,
    tf: computeTermFrequency(tokens),
    questionTf: computeTermFrequency(questionTokens),
    answerTf: computeTermFrequency(answerTokens),
    keywordTf: computeTermFrequency(keywordTokens),
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
 * Enhanced RAG Retriever with multi-factor scoring
 */
function retrieveRelevantContext(query, topK = 2) {
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) return [];

  const queryTf = computeTermFrequency(queryTokens);
  const queryVec = docToVector(queryTf);
  const normalizedQuery = normalizeText(query);

  const scoredDocs = indexedDocs.map((doc) => {
    // Combined text similarity (question + answer + keywords)
    const docVec = docToVector(doc.tf);
    const combinedSimilarity = cosineSimilarity(queryVec, docVec);
    
    // Question-specific similarity
    const questionVec = docToVector(doc.questionTf);
    const questionSimilarity = cosineSimilarity(queryVec, questionVec);
    
    // Answer-specific similarity
    const answerVec = docToVector(doc.answerTf);
    const answerSimilarity = cosineSimilarity(queryVec, answerVec);
    
    // Keyword matching score
    const keywordVec = docToVector(doc.keywordTf);
    const keywordSimilarity = cosineSimilarity(queryVec, keywordVec);
    
    // Exact keyword matches (bonus)
    let exactMatchBonus = 0;
    const queryLower = normalizedQuery.toLowerCase();
    doc.keywords.forEach(keyword => {
      const normalizedKeyword = normalizeText(keyword);
      if (queryLower.includes(normalizedKeyword)) {
        exactMatchBonus += 0.2;
      }
      // Partial match (keyword contains query term or vice versa)
      if (normalizedKeyword.includes(queryLower.split(' ')[0]) || 
          queryLower.includes(normalizedKeyword.substring(0, 4))) {
        exactMatchBonus += 0.1;
      }
    });
    
    // Combined score with weighted factors
    // Weight question similarity higher as it's most important
    // Only count exact match bonus if we have meaningful keyword overlap
    const meaningfulOverlap = doc.keywords.some(k => normalizedQuery.includes(normalizeText(k)));
    const weightedBonus = meaningfulOverlap ? exactMatchBonus : 0;
    
    const combinedScore = (
      questionSimilarity * 0.5 +
      keywordSimilarity * 0.3 +
      combinedSimilarity * 0.1 +
      answerSimilarity * 0.05 +
      weightedBonus
    );
    
    return {
      id: doc.id,
      category: doc.category,
      question: doc.question,
      answer: doc.answer,
      source: doc.source,
      score: combinedScore
    };
  });

  scoredDocs.sort((a, b) => b.score - a.score);

  // Return top K documents if score > threshold (higher threshold for better precision)
  const relevant = scoredDocs.filter((d) => d.score > 0.35).slice(0, topK);
  return relevant;
}

module.exports = { retrieveRelevantContext, indexedDocs };
