const express = require('express');
const cors = require('cors');

const app = express();

// Middlewares obligatoires
app.use(cors());
app.use(express.json());

// Importation des routes
const authRoutes = require('./routes/auth');
const ticketRoutes = require('./routes/tickets');
const faqRoutes = require('./routes/faq');
const copilotRoutes = require('./routes/copilot');

// Activation des routes d'API
app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/faq', faqRoutes);
app.use('/api/copilot', copilotRoutes);

// Démarrage du serveur
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Serveur Backend démarré avec succès sur http://localhost:${PORT}`);
});