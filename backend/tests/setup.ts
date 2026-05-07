// Setup pour les tests GuinéaManager

import { beforeAll, afterAll } from 'vitest';
import prisma from '../src/utils/prisma';

// Configuration globale pour les tests
beforeAll(async () => {
  // Définir les variables d'environnement de test
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-purposes-only-32chars';
  process.env.JWT_EXPIRES_IN = '15m';
  process.env.JWT_REFRESH_EXPIRES_IN = '7d';
  
  // Vérifier la connexion à la base de données de test
  try {
    await prisma.$connect();
    console.log('✅ Connexion à la base de données de test établie');
    
    // Créer les plans d'abonnement par défaut si'ils n'existent pas
    const plans = [
      { id: 'free', nom: 'FREE', description: 'Plan gratuit', prixMensuel: 0, prixAnnuel: 0 },
      { id: 'standard', nom: 'STANDARD', description: 'Plan standard', prixMensuel: 50000_00, prixAnnuel: 500000_00 },
      { id: 'premium', nom: 'PREMIUM', description: 'Plan premium', prixMensuel: 150000_00, prixAnnuel: 1500000_00 }
    ];
    
    for (const plan of plans) {
      await prisma.planAbonnement.upsert({
        where: { id: plan.id },
        update: {},
        create: plan
      });
    }
    console.log('✅ Plans d\'abonnement de test créés');
  } catch (error) {
    console.error('❌ Erreur de connexion à la base de données:', error);
    throw error;
  }
});

afterAll(async () => {
  // Fermer les connexions
  await prisma.$disconnect();
  console.log('🔌 Connexion à la base de données fermée');
});
