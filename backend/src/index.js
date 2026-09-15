const express = require('express');
const cors = require('cors');
require('dotenv').config();

const faqRoutes = require('./routes/faq');
const ticketRoutes = require('./routes/tickets');
const copilotRoutes = require('./routes/copilot');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api/faq', faqRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/copilot', copilotRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend Copilot opérationnel 🚀' });
});

app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});