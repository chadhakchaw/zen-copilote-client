require('dotenv').config(); // <-- Indispensable pour charger la clé GROQ_API_KEY du .env

const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require('./routes/auth');
const ticketRoutes = require('./routes/tickets');
const faqRoutes = require('./routes/faq');
const copilotRoutes = require('./routes/copilot');

app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/faq', faqRoutes);
app.use('/api/copilot', copilotRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Serveur Backend démarré sur http://localhost:${PORT}`);
});