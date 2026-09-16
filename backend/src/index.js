require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');
const prisma = require('./prisma');

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY || 'dummy_key',
  baseURL: 'https://api.groq.com/openai/v1',
});

// GET /api/tickets
app.get('/api/tickets', async (req, res) => {
  try {
    const tickets = await prisma.ticket.findMany({
      include: {
        client: true,
        messages: { orderBy: { createdAt: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/faq
app.get('/api/faq', async (req, res) => {
  try {
    const faqs = await prisma.faqArticle.findMany();
    res.json(faqs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/copilot/suggest
app.post('/api/copilot/suggest', async (req, res) => {
  const { ticketId } = req.body;

  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { client: true, messages: { orderBy: { createdAt: 'asc' } } },
    });
    const faqs = await prisma.faqArticle.findMany();

    if (!ticket || !ticket.messages.length) {
      return res.status(404).json({ error: 'Ticket introuvable' });
    }

    const lastMessage = ticket.messages[ticket.messages.length - 1].content;
    const faqContext = faqs.map((f) => `Q: ${f.question}\nR: ${f.answer}`).join('\n\n');

    // 1. Tentative d'appel Groq AI
    if (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.startsWith('gsk_')) {
      try {
        const completion = await openai.chat.completions.create({
          model: 'llama-3.1-8b-instant',
          messages: [
            {
              role: 'system',
              content: `Tu es un copilote de service client courtois. Réponds en français en te basant sur cette FAQ :\n${faqContext}`,
            },
            {
              role: 'user',
              content: `Message client (${ticket.client.name}) : "${lastMessage}"`,
            },
          ],
          temperature: 0.2,
        });

        return res.json({ suggestion: completion.choices[0].message.content });
      } catch (groqErr) {
        console.warn('⚠️ Problème Clé/API Groq, basculement en mode BDD local :', groqErr.message);
      }
    }

    // 2. Mode secours automatique (Correspondance FAQ BDD)
    const lowerMsg = lastMessage.toLowerCase();
    const matchedFaq = faqs.find((f) => {
      const keywords = f.question.toLowerCase().split(' ');
      return keywords.some((kw) => kw.length > 3 && lowerMsg.includes(kw));
    });

    const fallbackSuggestion = matchedFaq
      ? `Bonjour ${ticket.client.name}, concernant votre demande : ${matchedFaq.answer}`
      : `Bonjour ${ticket.client.name}, nous avons bien reçu votre demande et notre équipe la traite dans les plus brefs délais.`;

    res.json({ suggestion: fallbackSuggestion });
  } catch (error) {
    console.error('❌ Erreur générale :', error.message);
    res.status(500).json({ error: 'Erreur lors de la génération' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Serveur backend démarré sur http://localhost:${PORT}`);
});

// POST /api/tickets/:id/messages (Enregistrer la réponse agent + Résoudre le ticket)
app.post('/api/tickets/:id/messages', async (req, res) => {
  const { id } = req.params;
  const { content, status } = req.body;

  try {
    // 1. Sauvegarder le message de l'agent en BDD
    await prisma.message.create({
      data: {
        ticketId: id,
        content,
        senderRole: 'AGENT',
      },
    });

    // 2. Mettre à jour le statut du ticket (ex: RESOLVED)
    const updatedTicket = await prisma.ticket.update({
      where: { id },
      data: { status: status || 'RESOLVED' },
      include: {
        client: true,
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });

    res.json(updatedTicket);
  } catch (error) {
    console.error('❌ Erreur envoi message :', error);
    res.status(500).json({ error: error.message });
  }
});