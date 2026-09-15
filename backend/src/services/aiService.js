async function generateAgentSuggestion(ticketContext, faqArticles) {
  // Simulation de réponse sans appel API payant
  return `[IA Copilot] Voici une proposition de réponse pour : "${ticketContext}". Merci de contacter le support si besoin.`;
}

module.exports = { generateAgentSuggestion };