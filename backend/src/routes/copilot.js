const express = require('express');
const router = express.Router();
const prisma = require('../prisma');
const { generateAgentSuggestion } = require('../services/aiService');

router.post('/suggest', async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Le message du client est requis' });
  }

  try {
    const faqArticles = await prisma.faqArticle.findMany();
    const suggestion = await generateAgentSuggestion(message, faqArticles);
    res.json({ suggestion });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur lors de la génération de la suggestion IA" });
  }
});

module.exports = router;