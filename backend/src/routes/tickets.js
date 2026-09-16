const express = require('express');
const router = express.Router();
const prisma = require('../prisma');

router.get('/', async (req, res) => {
  try {
    const tickets = await prisma.ticket.findMany({
      include: {
        client: true,
        messages: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    res.json(tickets);
  } catch (error) {
    console.error('Erreur API Tickets:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des tickets' });
  }
});

module.exports = router;