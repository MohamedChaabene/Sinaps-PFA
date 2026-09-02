const { GoogleGenerativeAI } = require('@google/generative-ai');
const knowledgeBase = require('../data/knowledgeBase');

function getFallbackResponse(userMessage) {
  if (!userMessage) {
    return "Bonjour ! Comment puis-je vous aider aujourd'hui ? 😊";
  }

  const query = userMessage.toLowerCase().trim();

  let bestMatch = null;
  let maxScore = 0;

  // Stop words in French to ignore for matching
  const stopWords = new Set(['comment', 'faire', 'pour', 'quel', 'quelle', 'un', 'une', 'des', 'les', 'est', 'que', 'mon', 'ma', 'mes', 'du', 'de', 'la', 'le']);

  for (const item of knowledgeBase) {
    const qText = item.question.toLowerCase();
    const keywords = qText
      .split(/\s+/)
      .map((w) => w.replace(/[^a-z0-9àâäéèêëîïôöùûüç]/gi, ''))
      .filter((w) => w.length > 2 && !stopWords.has(w));

    let matchCount = 0;

    for (const kw of keywords) {
      if (query.includes(kw)) {
        matchCount++;
      }
    }

    if (matchCount > maxScore) {
      maxScore = matchCount;
      bestMatch = item;
    }
  }

  if (bestMatch && maxScore > 0) {
    return `${bestMatch.answer} 🤖`;
  }

  return "Je n'ai pas trouvé de réponse exacte dans ma base de connaissances. Je peux vous mettre en relation avec un agent de support humain si vous le souhaitez ! 👋";
}

async function getAIResponse(userMessage) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === 'your_gemini_api_key' || apiKey.trim() === '') {
    return getFallbackResponse(userMessage);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const context = knowledgeBase
      .map((item) => `Q: ${item.question}\nR: ${item.answer}`)
      .join('\n\n');

    const prompt = `Tu es un agent de support client sympathique et efficace, qui répond en français.
Utilise la base de connaissance ci-dessous pour répondre à la question du client.
Si la question ne correspond à aucune entrée, réponds poliment que tu vas transmettre la demande à un agent humain.
Reste bref (2-3 phrases max) et utilise des emojis avec modération.

Base de connaissance :
${context}

Question du client : ${userMessage}

Réponse :`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    if (text) return text;
    return getFallbackResponse(userMessage);
  } catch (err) {
    console.warn('Gemini API call failed, using local knowledge base fallback:', err.message);
    return getFallbackResponse(userMessage);
  }
}

module.exports = { getAIResponse, getFallbackResponse };
