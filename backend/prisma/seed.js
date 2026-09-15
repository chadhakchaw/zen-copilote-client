const prisma = require('../src/prisma');

async function main() {
  await prisma.auditLog.deleteMany();
  await prisma.message.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.faqArticle.deleteMany();
  await prisma.user.deleteMany();

  const agent = await prisma.user.create({
    data: {
      email: 'agent@zen.com',
      name: 'Sarah Agent',
      password: 'password123',
      role: 'AGENT',
    },
  });

  const client = await prisma.user.create({
    data: {
      email: 'client@zen.com',
      name: 'Jean Dupont',
      password: 'password123',
      role: 'CLIENT',
    },
  });

  await prisma.faqArticle.createMany({
    data: [
      {
        question: "Comment réinitialiser mon mot de passe ?",
        answer: "Cliquez sur 'Mot de passe oublié' sur la page de connexion.",
        category: "Compte",
      },
      {
        question: "Quels sont les délais de livraison ?",
        answer: "Les livraisons standard prennent entre 3 et 5 jours ouvrés.",
        category: "Livraison",
      },
    ],
  });

  console.log('✅ Base de données initialisée avec des données de test !');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });