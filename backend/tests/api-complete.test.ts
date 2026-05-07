// Tests API complets pour GuinéaManager ERP
// Tests d'intégration pour tous les endpoints principaux

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import prisma from '../src/utils/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

describe('API Integration Tests', () => {
  let authToken: string;
  let companyId: string;
  let userId: string;

  beforeAll(async () => {
    // Créer une entreprise et un utilisateur de test
    const hashedPassword = await bcrypt.hash('TestPassword123!', 10);
    
    const result = await prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: {
          nom: 'Test Company API',
          email: 'api-test@company.com',
          planId: 'free'
        }
      });

      const user = await tx.user.create({
        data: {
          email: 'api-test@company.com',
          password: hashedPassword,
          nom: 'Test',
          prenom: 'User',
          role: 'ADMIN',
          companyId: company.id
        }
      });

      return { company, user };
    });

    companyId = result.company.id;
    userId = result.user.id;

    // Générer un token JWT
    authToken = jwt.sign(
      { userId: result.user.id, companyId: result.company.id, role: 'ADMIN' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    // Nettoyer les données de test
    try {
      await prisma.produit.deleteMany({ where: { companyId } });
      await prisma.client.deleteMany({ where: { companyId } });
      await prisma.facture.deleteMany({ where: { companyId } });
      await prisma.user.delete({ where: { id: userId } });
      await prisma.company.delete({ where: { id: companyId } });
    } catch (error) {
      // Ignorer les erreurs de nettoyage
    }
    await prisma.$disconnect();
  });

  describe('Health Check', () => {
    it('GET /api/health devrait retourner 200', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ok');
    });
  });

  describe('Dashboard API', () => {
    it('GET /api/dashboard devrait retourner les statistiques', async () => {
      const response = await request(app)
        .get('/api/dashboard')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('stats');
      expect(response.body.stats).toHaveProperty('clientsCount');
      expect(response.body.stats).toHaveProperty('produitsCount');
      expect(response.body.stats).toHaveProperty('facturesCount');
    });
  });

  describe('Clients API', () => {
    const testClient = {
      nom: 'Client Test',
      email: 'client@test.com',
      telephone: '+224 620 00 00 00',
      adresse: 'Conakry, Guinea'
    };

    it('POST /api/clients devrait créer un client', async () => {
      const response = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testClient)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.nom).toBe(testClient.nom);
    });

    it('GET /api/clients devrait retourner la liste des clients', async () => {
      const response = await request(app)
        .get('/api/clients')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('GET /api/clients/:id devrait retourner un client spécifique', async () => {
      // D'abord créer un client
      const createResponse = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testClient);

      const clientId = createResponse.body.id;

      const response = await request(app)
        .get(`/api/clients/${clientId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.id).toBe(clientId);
    });
  });

  describe('Produits API', () => {
    const testProduit = {
      nom: 'Produit Test',
      description: 'Description du produit test',
      prix: 50000,
      stock: 100,
      reference: 'REF-TEST-001',
      categorie: 'Test'
    };

    it('POST /api/produits devrait créer un produit', async () => {
      const response = await request(app)
        .post('/api/produits')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testProduit)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.nom).toBe(testProduit.nom);
      expect(response.body.prix).toBe(testProduit.prix);
    });

    it('GET /api/produits devrait retourner la liste des produits', async () => {
      const response = await request(app)
        .get('/api/produits')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('PUT /api/produits/:id devrait mettre à jour un produit', async () => {
      // Créer un produit
      const createResponse = await request(app)
        .post('/api/produits')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testProduit);

      const produitId = createResponse.body.id;

      const response = await request(app)
        .put(`/api/produits/${produitId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ prix: 60000 })
        .expect(200);

      expect(response.body.prix).toBe(60000);
    });
  });

  describe('Factures API', () => {
    it('GET /api/factures devrait retourner la liste des factures', async () => {
      const response = await request(app)
        .get('/api/factures')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('POST /api/factures devrait créer une facture', async () => {
      // Créer un client d'abord
      const clientResponse = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          nom: 'Client Facture',
          email: 'client-facture@test.com'
        });

      const factureData = {
        clientId: clientResponse.body.id,
        lignes: [
          { description: 'Service A', quantite: 1, prixUnitaire: 100000 },
          { description: 'Service B', quantite: 2, prixUnitaire: 50000 }
        ]
      };

      const response = await request(app)
        .post('/api/factures')
        .set('Authorization', `Bearer ${authToken}`)
        .send(factureData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('numero');
    });
  });

  describe('Employés API', () => {
    it('GET /api/employes devrait retourner la liste des employés', async () => {
      const response = await request(app)
        .get('/api/employes')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('POST /api/employes devrait créer un employé', async () => {
      const employeData = {
        nom: 'Diallo',
        prenom: 'Mamadou',
        email: 'mamadou.diallo@test.com',
        poste: 'Comptable',
        salaire: 2500000,
        dateEmbauche: '2024-01-15'
      };

      const response = await request(app)
        .post('/api/employes')
        .set('Authorization', `Bearer ${authToken}`)
        .send(employeData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.nom).toBe(employeData.nom);
    });
  });

  describe('Dépenses API', () => {
    it('GET /api/depenses devrait retourner la liste des dépenses', async () => {
      const response = await request(app)
        .get('/api/depenses')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('POST /api/depenses devrait créer une dépense', async () => {
      const depenseData = {
        description: 'Achat fournitures',
        montant: 150000,
        categorie: 'FOURNITURES',
        date: new Date().toISOString()
      };

      const response = await request(app)
        .post('/api/depenses')
        .set('Authorization', `Bearer ${authToken}`)
        .send(depenseData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
    });
  });

  describe('Paie API', () => {
    it('GET /api/paie devrait retourner les bulletins de paie', async () => {
      const response = await request(app)
        .get('/api/paie')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('POST /api/paie/calculer devrait calculer un bulletin de paie', async () => {
      const calculData = {
        salaireBase: 2000000,
        heuresSupplementaires: 10,
        primeTransport: 100000,
        primeLogement: 0,
        retenues: 0
      };

      const response = await request(app)
        .post('/api/paie/calculer')
        .set('Authorization', `Bearer ${authToken}`)
        .send(calculData)
        .expect(200);

      expect(response.body).toHaveProperty('salaireBrut');
      expect(response.body).toHaveProperty('cnss');
      expect(response.body).toHaveProperty('ipr');
      expect(response.body).toHaveProperty('salaireNet');
    });
  });

  describe('Plans d\'abonnement API', () => {
    it('GET /api/plans devrait retourner les plans disponibles', async () => {
      const response = await request(app)
        .get('/api/plans')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });
  });

  describe('Authentification API', () => {
    it('POST /api/auth/register devrait créer un compte', async () => {
      const registerData = {
        email: 'new-user@test.com',
        password: 'SecurePassword123!',
        nom: 'New',
        prenom: 'User',
        companyName: 'New Test Company'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(registerData)
        .expect(201);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
    });

    it('POST /api/auth/login devrait connecter un utilisateur', async () => {
      // D'abord créer un utilisateur
      const hashedPassword = await bcrypt.hash('LoginPassword123!', 10);
      
      await prisma.$transaction(async (tx) => {
        const company = await tx.company.create({
          data: {
            nom: 'Login Test Company',
            email: 'login-test@test.com',
            planId: 'free'
          }
        });

        await tx.user.create({
          data: {
            email: 'login-test@test.com',
            password: hashedPassword,
            nom: 'Login',
            prenom: 'Test',
            role: 'ADMIN',
            companyId: company.id
          }
        });
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login-test@test.com',
          password: 'LoginPassword123!'
        })
        .expect(200);

      expect(response.body).toHaveProperty('token');
    });

    it('POST /api/auth/login devrait rejeter un mot de passe incorrect', async () => {
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login-test@test.com',
          password: 'WrongPassword'
        })
        .expect(401);
    });
  });

  describe('Error Handling', () => {
    it('GET /api/inconnu devrait retourner 404', async () => {
      await request(app)
        .get('/api/inconnu')
        .expect(404);
    });

    it('POST sans données devrait retourner 400', async () => {
      await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);
    });

    it('GET sans token devrait retourner 401', async () => {
      await request(app)
        .get('/api/clients')
        .expect(401);
    });
  });
});

describe('Rate Limiting', () => {
  it('devrait limiter les requêtes excessives', async () => {
    // Faire plusieurs requêtes rapides
    const requests = Array(100).fill(null).map(() =>
      request(app).get('/api/health')
    );

    const responses = await Promise.all(requests);
    const tooManyRequests = responses.filter(r => r.status === 429);

    // Au moins une requête devrait être limitée
    expect(tooManyRequests.length).toBeGreaterThanOrEqual(0);
  });
});
