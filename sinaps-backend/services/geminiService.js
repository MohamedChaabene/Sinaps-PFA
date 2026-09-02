const { GoogleGenerativeAI } = require('@google/generative-ai');
const { retrieveRelevantContext } = require('./ragService');
const knowledgeBase = require('../data/knowledgeBase');

async function getAIResponse(userMessage) {
  // Step 1: RAG Retrieval Stage - Retrieve relevant knowledge snippets
  const retrievedDocs = retrieveRelevantContext(userMessage, 2);

  const apiKey = process.env.GEMINI_API_KEY;

  // Fallback if Gemini key is not provided or invalid
  if (!apiKey || apiKey === 'your_gemini_api_key' || apiKey.trim() === '') {
    if (retrievedDocs.length > 0) {
      return `${retrievedDocs[0].answer} 🤖 (RAG Source: ${retrievedDocs[0].question})`;
    }
    return "Je n'ai pas trouvé de réponse exacte dans ma base de connaissances. Je peux vous mettre en relation avec un agent de support humain si vous le souhaitez ! 👋";
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Format retrieved knowledge snippets into context
    const contextText = retrievedDocs.length > 0
      ? retrievedDocs.map((doc) => `[Savoir Pertinent]: Q: ${doc.question} => R: ${doc.answer}`).join('\n')
      : 'Aucun document pertinent trouvé dans la base de connaissances.';

    const prompt = `Tu es un agent de support client IA pour la plateforme Sinaps.
Rôle: Répondre de manière claire, concise et amicale en français.

[RAG CONTEXT RETRIEVED]:
${contextText}

Question de l'utilisateur: "${userMessage}"

Consignes:
- Base-toi prioritairement sur le savoir pertinent extrait ci-dessus.
- Si le savoir extrait permet de répondre, réponds clairement en 2-3 phrases maximum avec emojis.
- Si aucun savoir pertinent n'est extrait ou suffisant, informe l'utilisateur poliment et propose-lui d'escalader vers un agent humain.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    if (text) return text;

    if (retrievedDocs.length > 0) {
      return `${retrievedDocs[0].answer} 🤖`;
    }
    return "Je n'ai pas trouvé de réponse exacte dans ma base de connaissances. Je peux vous mettre en relation avec un agent de support humain si vous le souhaitez ! 👋";
  } catch (err) {
    console.warn('Gemini API call failed, using local RAG fallback:', err.message);
    if (retrievedDocs.length > 0) {
      return `${retrievedDocs[0].answer} 🤖`;
    }
    return "Je n'ai pas trouvé de réponse exacte dans ma base de connaissances. Je peux vous mettre en relation avec un agent de support humain si vous le souhaitez ! 👋";
  }
}

module.exports = { getAIResponse };
