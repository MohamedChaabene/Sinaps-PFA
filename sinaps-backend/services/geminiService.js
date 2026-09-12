const { GoogleGenerativeAI } = require('@google/generative-ai');
const { retrieveRelevantContext } = require('./ragService');
const knowledgeBase = require('../data/knowledgeBase');

// Simple greeting detection
function isGreeting(message) {
  const greetings = [
    'bonjour', 'salut', 'bonsoir', 'hello', 'hi', 'hey',
    'merci', 'thanks', 'merci beaucoup', 'au revoir', 'bye',
    'bon matin', 'bonne journée', 'bonne soirée'
  ];
  const normalized = message.toLowerCase().trim();
  return greetings.some(greeting => normalized.includes(greeting) || normalized === greeting);
}

function getGreetingResponse(message) {
  const normalized = message.toLowerCase().trim();
  
  if (normalized.includes('merci') || normalized.includes('thanks')) {
    return "Je vous en prie ! 😊 N'hésitez pas si vous avez d'autres questions.";
  }
  if (normalized.includes('au revoir') || normalized.includes('bye')) {
    return "Au revoir ! 👋 Bonne journée et n'hésitez pas à revenir si vous avez besoin d'aide.";
  }
  
  return "Bonjour ! 👋 Je suis l'assistant IA de Sinaps. Comment puis-je vous aider aujourd'hui ?";
}

async function getAIResponse(userMessage) {
  // Handle greetings separately without RAG retrieval
  if (isGreeting(userMessage)) {
    return getGreetingResponse(userMessage);
  }

  // Step 1: RAG Retrieval Stage - Retrieve relevant knowledge snippets
  const retrievedDocs = retrieveRelevantContext(userMessage, 2);

  const apiKey = process.env.GEMINI_API_KEY;

  // Fallback if Gemini key is not provided or invalid
  if (!apiKey || apiKey === 'your_gemini_api_key' || apiKey.trim() === '') {
    if (retrievedDocs.length > 0) {
      return `${retrievedDocs[0].answer} 🤖`;
    }
    return "Je n'ai pas trouvé de réponse exacte dans ma base de connaissances. Je peux vous mettre en relation avec un agent de support humain si vous le souhaitez ! 👋";
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const candidateModels = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-flash-latest'];

    // Format retrieved knowledge snippets into context
    const contextText = retrievedDocs.length > 0
      ? retrievedDocs.map((doc) => `[SOURCE: ${doc.source}] Q: ${doc.question} => R: ${doc.answer}`).join('\n')
      : 'Aucun document spécifique trouvé dans la base de connaissances.';

    const prompt = `Tu es l'agent d'assistance client IA de la plateforme Sinaps.
Ton rôle: Répondre de manière chaleureuse, naturelle, serviable et professionnelle en français.

[BASE DE CONNAISSANCES SINAPS (RAG)]:
${contextText}

Message de l'utilisateur: "${userMessage}"

RÈGLES STRICTES - À RESPECTER IMPÉRATIVEMENT:

1. UTILISATION EXCLUSIVE DE LA BASE DE CONNAISSANCES:
   - Tu dois UNIQUEMENT utiliser les informations fournies dans la section [BASE DE CONNAISSANCES SINAPS (RAG)] ci-dessus.
   - Si l'information demandée n'est PAS dans la base de connaissances, dis clairement: "Je n'ai pas cette information dans ma base de connaissances."
   - N'INVENTE JAMAIS de politiques, de délais, de procédures ou de fonctionnalités qui ne sont pas explicitement mentionnées dans la base de connaissances.
   - N'invente PAS de délais de remboursement, de temps de livraison, ou de procédures de compte non documentés.

2. RÉPONSES GROUNDED:
   - Si la base de connaissances contient la réponse, utilise-la pour expliquer clairement la démarche en 2-3 phrases avec des emojis.
   - Reformule la réponse de manière naturelle en français, mais garde le sens exact et les informations factuelles.
   - N'ajoute PAS de détails non présents dans la source.

3. GESTION DES CAS SANS RÉPONSE:
   - Si aucune information pertinente n'est trouvée, propose gentiment de passer à un agent humain: "Je ne peux pas répondre à cette question avec les informations disponibles. Voulez-vous que je vous mette en relation avec un agent humain ?"
   - Pour les questions hors sujet (météo, sport, recettes, actualités, etc.), dis: "Cette question ne concerne pas les services Sinaps. Je suis spécialisé dans l'assistance pour vos commandes, retours et compte."

4. TON ET STYLE:
   - Sois chaleureux, professionnel et serviable.
   - Utilise des emojis appropriés pour rendre la conversation agréable.
   - Sois concis (2-3 phrases maximum quand possible).

5. VÉRIFICATION:
   - Avant de répondre, vérifie que chaque affirmation est soutenue par la base de connaissances.
   - Si tu n'es pas certain, préfère dire que tu ne sais pas plutôt que d'inventer.`;

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

    // Fallback if all models fail
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
