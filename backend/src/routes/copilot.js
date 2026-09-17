const express = require('express');
const router = express.Router();
const prisma = require('../prisma');
const Groq = require('groq-sdk');

router.post('/suggest', async (req, res) => {
  const { ticketId } = req.body;

  if (!ticketId) {
    return res.status(400).json({ error: 'Le ticketId est obligatoire' });
  }

  // 1. Récupération de la clé API
  const apiKey = process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY;

  if (!apiKey || apiKey.includes('votre_cle')) {
    return res.status(500).json({
      error: 'Clé API manquante dans .env (veillez à configurer GROQ_API_KEY="gsk_...")'
    });
  }

  try {
    const groq = new Groq({ apiKey });

    // 2. Recherche du ticket avec l'historique complet des messages
    const ticket = await prisma.ticket.findUnique({
      where: { id: String(ticketId) },
      include: {
        client: true,
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!ticket) {
      return res.status(404).json({ error: `Ticket ID "${ticketId}" introuvable en BDD.` });
    }

    // 3. Construction du contexte RAG (FAQ + Historique)
    let faqs = [];
    try {
      if (prisma.faq) {
        faqs = await prisma.faq.findMany();
      } else if (prisma.fAQ) {
        faqs = await prisma.fAQ.findMany();
      }
    } catch (e) {
      console.warn('Note : Table FAQ non consultable.');
    }

    const faqContext = faqs.length > 0
      ? faqs.map((f, i) => `${i + 1}. Q: ${f.question}\n   R: ${f.answer}`).join('\n')
      : 'Aucune FAQ disponible.';

    const discussionHistory = (ticket.messages && ticket.messages.length > 0)
      ? ticket.messages.map((m) => `[${m.senderRole}]: ${m.content}`).join('\n')
      : `[CLIENT]: ${ticket.subject}`;

    // 4. Prompt RAG
    const systemPrompt = `Tu es l'assistant IA "Zen Copilot" pour un support client.
Génère une réponse professionnelle, courte (2 à 3 phrases max) et courtoise pour l'Agent Support.

Sujet : ${ticket.subject}
Client : ${ticket.client?.name || 'Inconnu'}

Discussion actuelle :
${discussionHistory}

Base FAQ :
${faqContext}

Consigne : Donne uniquement le texte final à envoyer au client, sans introduction.`;

    // 5. Récupération dynamique des modèles disponibles sur la clé Groq
    let candidateModels = [];
    try {
      const modelsList = await groq.models.list();
      const allActiveIds = modelsList.data.map((m) => m.id);
      candidateModels = allActiveIds.filter(
        (id) => !id.includes('whisper') && !id.includes('guard') && !id.includes('orpheus')
      );
    } catch (listErr) {
      console.warn('⚠️ Liste dynamique indisponible, passage aux modèles de secours.');
    }

    if (candidateModels.length === 0) {
      candidateModels = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'llama3-8b-8192'];
    }

    // 6. Exécution de la requête avec fallback automatique
    let suggestionText = null;
    let lastError = null;

    for (const model of candidateModels) {
      try {
        const completion = await groq.chat.completions.create({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: 'Génère la suggestion de réponse.' }
          ],
          model: model,
          temperature: 0.3,
          max_tokens: 300,
        });

        suggestionText = completion.choices[0]?.message?.content;
        if (suggestionText) {
          console.log(`✅ Succès Groq avec le modèle : ${model}`);
          break;
        }
      } catch (err) {
        console.error(`❌ Échec avec le modèle ${model} :`, err.message);
        lastError = err;
      }
    }

    if (!suggestionText) {
      throw new Error(lastError?.message || "Aucun modèle Groq n'a pu répondre.");
    }

    return res.json({
      success: true,
      suggestion: suggestionText,
    });

  } catch (error) {
    console.error('❌ ERREUR GENERATION GROQ :', error.message);
    return res.status(500).json({
      error: error.message || 'Erreur interne du serveur IA.'
    });
  }
});

module.exports = router;