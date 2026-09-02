const { GoogleGenerativeAI } = require('@google/generative-ai');
const knowledgeBase = require('../data/knowledgeBase');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function getAIResponse(userMessage) {
    const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });

    // Construire le contexte depuis la base de connaissance
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
    return result.response.text();
}

module.exports = { getAIResponse };