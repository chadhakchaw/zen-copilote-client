const express = require('express');
const router = express.Router();
const prisma = require('../prisma'); // Import de votre instance Prisma

router.post('/verify-role', async (req, res) => {
  const { role, password } = req.body;

  try {
    // Vérification du rôle et du mot de passe en BDD
    const roleConfig = await prisma.role.findUnique({
      where: { name: role },
    });

    if (roleConfig && roleConfig.password === password) {
      return res.json({ success: true, message: 'Accès autorisé' });
    }

    return res.status(401).json({ success: false, message: 'Mot de passe incorrect' });
  } catch (error) {
    console.error('Erreur authentification:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

module.exports = router;