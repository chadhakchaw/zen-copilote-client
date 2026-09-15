const express = require('express');
const router = express.Router();
const prisma = require('../prisma');

router.get('/', async (req, res) => {
  try {
    const tickets = await prisma.ticket.findMany({
      include: { customer: true, messages: true },
    });
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des tickets' });
  }
});

module.exports = router;