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
    const candidateModels = ['gemini-3.5-flash', 'gemini-3.6-flash', 'gemini-flash-latest'];

    // Format retrieved knowledge snippets into context
    const contextText = retrievedDocs.length > 0
      ? retrievedDocs.map((doc) => `[Savoir Pertinent]: Q: ${doc.question} => R: ${doc.answer}`).join('\n')
      : 'Aucun document spécifique trouvé dans la base de connaissances.';

    const prompt = `Tu es l'agent d'assistance client IA de la plateforme Sinaps.
Ton rôle: Répondre de manière chaleureuse, naturelle, serviable et professionnelle en français.

[BASE DE CONNAISSANCES SINAPS (RAG)]:
${contextText}

Message de l'utilisateur: "${userMessage}"

Consignes pour ta réponse:
- Si l'utilisateur salue simplement (ex: "Bonjour", "Salut"), salue-le cordialement, présente-toi brièvement comme l'assistant IA de Sinaps et demande-lui comment tu peux l'aider aujourd'hui avec un emoji amical 😊.
- Si le savoir pertinent ci-dessus contient la réponse exacte à sa question (commandes, retours, remboursements, mots de passe, facturation), utilise-le pour lui expliquer clairement la démarche en 2 à 3 phrases avec des emojis.
- Si l'utilisateur pose une question générale sur les services ou souhaite discuter, réponds-lui poliment, intelligemment et naturellement.
- Si sa demande nécessite une intervention manuelle sur son compte ou si tu ne connais pas la réponse, explique-lui gentiment et propose-lui de cliquer sur "Basculer vers un agent humain" en haut à droite pour parler à un opérateur.`;

    let text = null;
    for (const modelName of candidateModels) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        text = result.response.text();
        if (text) break;
      } catch (mErr) {
        console.warn(`Model ${modelName} call failed:`, mErr.message);
      }
    }

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
