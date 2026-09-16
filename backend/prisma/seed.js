const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Nettoyage complet
  await prisma.message.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.client.deleteMany();
  await prisma.faqArticle.deleteMany();

  // Création des clients
  const client1 = await prisma.client.create({
    data: { name: 'Jean Dupont', email: 'jean.dupont@email.com' },
  });

  const client2 = await prisma.client.create({
    data: { name: 'Sarra Benali', email: 'sarra.b@email.com' },
  });

  // Création des tickets avec qualification (W1)
  await prisma.ticket.create({
    data: {
      subject: 'Retard livraison commande #9482',
      channel: 'WHATSAPP',
      status: 'NEW',
      sentiment: 'ANGRY',
      priority: 'HIGH',
      language: 'FR',
      createdAt: new Date(Date.now() - 45 * 60 * 1000), // Créé il y a 45 min
      clientId: client1.id,
      messages: {
        create: [
          {
            content: 'Quels sont vos délais de livraison actuels ? Mon colis a du retard et je suis très mécontent.',
            senderRole: 'CLIENT',
            createdAt: new Date(Date.now() - 45 * 60 * 1000),
          },
        ],
      },
    },
  });

  await prisma.ticket.create({
    data: {
      subject: 'Problème de connexion compte',
      channel: 'EMAIL',
      status: 'NEW',
      sentiment: 'NEUTRAL',
      priority: 'MEDIUM',
      language: 'FR',
      createdAt: new Date(Date.now() - 180 * 60 * 1000), // Créé il y a 3 heures
      clientId: client2.id,
      messages: {
        create: [
          {
            content: 'Impossible de me connecter à mon espace client depuis ce matin. Comment réinitialiser mon mot de passe ?',
            senderRole: 'CLIENT',
            createdAt: new Date(Date.now() - 180 * 60 * 1000),
          },
        ],
      },
    },
  });

  // Création des articles FAQ
  await prisma.faqArticle.createMany({
    data: [
      {
        question: 'Quels sont les délais de livraison ?',
        answer: 'Les livraisons standard prennent entre 3 et 5 jours ouvrés.',
        category: 'LIVRAISON',
        status: 'PUBLISHED',
      },
      {
        question: 'Comment réinitialiser mon mot de passe ?',
        answer: "Cliquez sur 'Mot de passe oublié' sur la page de connexion pour recevoir un lien de réinitialisation.",
        category: 'COMPTE',
        status: 'PUBLISHED',
      },
    ],
  });

  console.log('✅ Base de données réinitialisée et rechargée avec succès !');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });