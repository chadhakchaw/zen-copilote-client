const express = require('express');
const router = express.Router();
const prisma = require('../prisma');

const parseId = (id) => (isNaN(Number(id)) ? String(id) : Number(id));

// GET /api/tickets
router.get('/', async (req, res) => {
  try {
    const tickets = await prisma.ticket.findMany({
      include: { client: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/tickets/:id/messages
router.get('/:id/messages', async (req, res) => {
  const ticketId = parseId(req.params.id);

  try {
    const messages = await prisma.message.findMany({
      where: { ticketId },
      orderBy: { createdAt: 'asc' },
    });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/tickets/:id/messages
router.post('/:id/messages', async (req, res) => {
  const ticketId = parseId(req.params.id);
  const { content, senderRole } = req.body;

  try {
    const message = await prisma.message.create({
      data: {
        content,
        senderRole: senderRole || 'CLIENT',
        ticketId,
      },
    });
    res.json(message);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/tickets (Création de ticket)
router.post('/', async (req, res) => {
  const { subject, category, priority, clientName, clientEmail, initialMessage } = req.body;

  try {
    let client = await prisma.client.findFirst({
      where: { email: clientEmail },
    });

    if (!client) {
      client = await prisma.client.create({
        data: { name: clientName, email: clientEmail },
      });
    }

    const ticket = await prisma.ticket.create({
      data: {
        subject,
        category: category || 'GENERAL',
        priority: priority || 'MEDIUM',
        clientId: client.id,
        messages: initialMessage ? {
          create: [{ content: initialMessage, senderRole: 'CLIENT' }]
        } : undefined
      },
      include: { client: true, messages: true }
    });

    res.json(ticket);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;