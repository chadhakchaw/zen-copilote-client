const express = require('express');
const router = express.Router();
const prisma = require('../prisma');

// Récupérer tous les tickets
router.get('/', async (req, res) => {
  try {
    const tickets = await prisma.ticket.findMany({
      include: {
        client: true,
        messages: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(tickets);
  } catch (error) {
    console.error('Erreur récupération tickets:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Créer un nouveau ticket (Client)
router.post('/', async (req, res) => {
  const { subject, channel, priority, description } = req.body;

  if (!subject || !description) {
    return res.status(400).json({ message: 'Le sujet et la description sont requis.' });
  }

  try {
    // Récupérer un client existant ou en créer un par défaut
    let client = await prisma.client.findFirst();
    if (!client) {
      client = await prisma.client.create({
        data: {
          name: 'Client Utilisateur',
          email: 'client@example.com',
        },
      });
    }

    const newTicket = await prisma.ticket.create({
      data: {
        subject,
        channel: channel || 'WEB',
        priority: priority || 'MEDIUM',
        status: 'OPEN',
        clientId: client.id,
        messages: {
          create: {
            content: description,
            senderRole: 'CLIENT',
          },
        },
      },
      include: {
        client: true,
        messages: true,
      },
    });

    res.status(201).json(newTicket);
  } catch (error) {
    console.error('Erreur création ticket:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la création du ticket.' });
  }
});

// Ajouter un message à un ticket
router.post('/:id/messages', async (req, res) => {
  const { id } = req.params;
  const { content, senderRole, status } = req.body;

  try {
    const message = await prisma.message.create({
      data: {
        ticketId: parseInt(id),
        content,
        senderRole,
      },
    });

    if (status) {
      await prisma.ticket.update({
        where: { id: parseInt(id) },
        data: { status },
      });
    }

    const updatedTicket = await prisma.ticket.findUnique({
      where: { id: parseInt(id) },
      include: { client: true, messages: true },
    });

    res.json(updatedTicket);
  } catch (error) {
    console.error('Erreur ajout message:', error);
    res.status(500).json({ error: 'Erreur lors de l\'envoi du message' });
  }
});

module.exports = router;