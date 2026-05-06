# 🚀 GuinéaManager ERP - Documentation API

## 📋 Table des matières

1. [Introduction](#introduction)
2. [Authentification](#authentification)
3. [Endpoints](#endpoints)
4. [Codes d'erreur](#codes-derreur)
5. [Rate Limiting](#rate-limiting)
6. [Webhooks](#webhooks)

---

## Introduction

GuinéaManager ERP est une solution SaaS multi-tenant conçue pour les PME ouest-africaines, avec une attention particulière pour le marché guinéen.

### URL de base

```
Production: https://api.guineamanager.com/api
Développement: http://localhost:3001/api
```

### Format des données

- Toutes les requêtes et réponses utilisent le format JSON
- Les dates sont au format ISO 8601 (`YYYY-MM-DDTHH:mm:ss.sssZ`)
- Les montants monétaires sont en centimes (ex: 500000 = 5,000 GNF)

---

## Authentification

### Inscription

```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "entreprise@example.com",
  "password": "MotDePasse123!",
  "nom": "Diallo",
  "prenom": "Mamadou",
  "companyName": "Mon Entreprise SARL"
}
```

**Réponse:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "clx123...",
    "email": "entreprise@example.com",
    "nom": "Diallo",
    "prenom": "Mamadou",
    "role": "ADMIN"
  },
  "company": {
    "id": "clx456...",
    "nom": "Mon Entreprise SARL"
  }
}
```

### Connexion

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "entreprise@example.com",
  "password": "MotDePasse123!"
}
```

### Utilisation du token

Incluez le token dans l'en-tête `Authorization`:

```http
GET /api/clients
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

---

## Endpoints

### 🏠 Dashboard

#### GET /api/dashboard

Récupère les statistiques du tableau de bord.

**Réponse:**
```json
{
  "stats": {
    "clientsCount": 45,
    "produitsCount": 120,
    "facturesCount": 89,
    "caTotal": 45000000,
    "caMois": 8500000,
    "facturesEnAttente": 12
  },
  "recentActivity": [...],
  "alerts": [...]
}
```

---

### 👥 Clients

#### GET /api/clients

Liste tous les clients de l'entreprise.

**Paramètres de requête:**
| Paramètre | Type | Description |
|-----------|------|-------------|
| `page` | number | Numéro de page (défaut: 1) |
| `limit` | number | Éléments par page (défaut: 20) |
| `search` | string | Recherche par nom ou email |

**Réponse:**
```json
{
  "data": [
    {
      "id": "clx123...",
      "nom": "Client SARL",
      "email": "client@example.com",
      "telephone": "+224 620 00 00 00",
      "adresse": "Conakry, Guinea",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "total": 45,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

#### POST /api/clients

Crée un nouveau client.

```json
{
  "nom": "Nouveau Client",
  "email": "nouveau@example.com",
  "telephone": "+224 620 11 11 11",
  "adresse": "Kalinko, Guinea",
  "notes": "Client VIP"
}
```

#### GET /api/clients/:id

Récupère un client spécifique.

#### PUT /api/clients/:id

Met à jour un client.

#### DELETE /api/clients/:id

Supprime un client.

---

### 📦 Produits

#### GET /api/produits

Liste tous les produits.

**Paramètres de requête:**
| Paramètre | Type | Description |
|-----------|------|-------------|
| `categorie` | string | Filtrer par catégorie |
| `stockLow` | boolean | Produits avec stock bas |

**Réponse:**
```json
{
  "data": [
    {
      "id": "clx123...",
      "nom": "Produit A",
      "description": "Description du produit",
      "reference": "REF-001",
      "prix": 50000,
      "stock": 100,
      "stockMin": 10,
      "categorie": "Électronique",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

#### POST /api/produits

Crée un nouveau produit.

```json
{
  "nom": "Nouveau Produit",
  "description": "Description",
  "reference": "REF-002",
  "prix": 75000,
  "stock": 50,
  "stockMin": 5,
  "categorie": "Électronique"
}
```

---

### 📄 Factures

#### GET /api/factures

Liste toutes les factures.

**Paramètres de requête:**
| Paramètre | Type | Description |
|-----------|------|-------------|
| `status` | string | `EN_ATTENTE`, `PAYEE`, `ANNULEE` |
| `clientId` | string | Filtrer par client |
| `dateDebut` | string | Date de début (ISO 8601) |
| `dateFin` | string | Date de fin (ISO 8601) |

**Réponse:**
```json
{
  "data": [
    {
      "id": "clx123...",
      "numero": "FAC-2024-0001",
      "clientId": "clx456...",
      "client": { "nom": "Client SARL" },
      "date": "2024-01-15",
      "echeance": "2024-02-15",
      "status": "EN_ATTENTE",
      "total": 500000,
      "lignes": [
        {
          "description": "Service A",
          "quantite": 1,
          "prixUnitaire": 500000
        }
      ]
    }
  ]
}
```

#### POST /api/factures

Crée une nouvelle facture.

```json
{
  "clientId": "clx456...",
  "date": "2024-01-15",
  "echeance": "2024-02-15",
  "lignes": [
    {
      "description": "Service A",
      "quantite": 1,
      "prixUnitaire": 500000
    },
    {
      "description": "Service B",
      "quantite": 2,
      "prixUnitaire": 250000
    }
  ],
  "notes": "Merci pour votre confiance"
}
```

#### POST /api/factures/:id/pay

Marque une facture comme payée.

```json
{
  "methode": "ORANGE_MONEY",
  "reference": "OM123456789"
}
```

#### GET /api/factures/:id/pdf

Télécharge le PDF d'une facture.

---

### 👨‍💼 Employés

#### GET /api/employes

Liste tous les employés.

#### POST /api/employes

Crée un nouvel employé.

```json
{
  "nom": "Diallo",
  "prenom": "Fatou",
  "email": "fatou.diallo@company.com",
  "poste": "Comptable",
  "departement": "Finance",
  "salaire": 2500000,
  "dateEmbauche": "2024-01-15",
  "telephone": "+224 620 00 00 00"
}
```

---

### 💰 Paie

#### GET /api/paie

Liste les bulletins de paie.

#### POST /api/paie/calculer

Calcule un bulletin de paie selon la législation guinéenne.

```json
{
  "employeId": "clx123...",
  "mois": 1,
  "annee": 2024,
  "heuresSupplementaires": 10,
  "primeTransport": 100000,
  "primeLogement": 0,
  "avances": 0,
  "autresRetenues": 0
}
```

**Réponse:**
```json
{
  "salaireBase": 2500000,
  "heuresSupplementaires": 125000,
  "primes": 100000,
  "salaireBrut": 2725000,
  "cnss": 27250,
  "ipr": 285000,
  "salaireNet": 2412750,
  "details": {
    "tauxCNSS": "1%",
    "tranchesIPR": [...]
  }
}
```

---

### 📱 Mobile Money

#### GET /api/mobile-money/balance

Récupère le solde des comptes Mobile Money.

**Réponse:**
```json
{
  "orange": {
    "balance": 1500000,
    "lastSync": "2024-01-15T10:30:00Z"
  },
  "mtn": {
    "balance": 850000,
    "lastSync": "2024-01-15T10:30:00Z"
  },
  "wave": {
    "balance": 420000,
    "lastSync": "2024-01-15T10:30:00Z"
  }
}
```

#### POST /api/mobile-money/verify

Vérifie une transaction Mobile Money.

```json
{
  "operateur": "ORANGE",
  "transactionId": "OM123456789"
}
```

---

### 📊 Rapports

#### GET /api/rapports/ca

Rapport du chiffre d'affaires.

**Paramètres:**
| Paramètre | Type | Description |
|-----------|------|-------------|
| `periode` | string | `jour`, `mois`, `annee` |
| `dateDebut` | string | Date de début |
| `dateFin` | string | Date de fin |

#### GET /api/rapports/depenses

Rapport des dépenses.

#### GET /api/rapports/tresorerie

Rapport de trésorerie.

---

### ⚙️ Paramètres

#### GET /api/parametres

Récupère les paramètres de l'entreprise.

#### PUT /api/parametres

Met à jour les paramètres.

```json
{
  "nomEntreprise": "Mon Entreprise SARL",
  "adresse": "Conakry, Guinea",
  "telephone": "+224 620 00 00 00",
  "email": "contact@entreprise.com",
  "registreCommerce": "RC/12345",
  "NIF": "NIF/12345",
  "devise": "GNF",
  "tvaDefaut": 18
}
```

---

## Codes d'erreur

| Code | Description |
|------|-------------|
| 200 | Succès |
| 201 | Créé avec succès |
| 400 | Requête invalide |
| 401 | Non authentifié |
| 403 | Accès refusé |
| 404 | Ressource non trouvée |
| 409 | Conflit (ex: email déjà utilisé) |
| 422 | Données invalides |
| 429 | Trop de requêtes |
| 500 | Erreur serveur |

**Format d'erreur:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "L'email est invalide",
    "details": [...]
  }
}
```

---

## Rate Limiting

- **Limite standard:** 100 requêtes / minute
- **Limite auth:** 10 requêtes / minute (login, register)

Les en-têtes de réponse incluent:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642234567
```

---

## Webhooks

### Configuration

Configurez vos webhooks dans les paramètres de l'entreprise.

### Événements disponibles

| Événement | Description |
|-----------|-------------|
| `facture.creee` | Nouvelle facture créée |
| `facture.payee` | Facture marquée comme payée |
| `client.creee` | Nouveau client créé |
| `commande.creee` | Nouvelle commande créée |
| `paiement.recu` | Paiement Mobile Money reçu |

### Format du payload

```json
{
  "event": "facture.payee",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "id": "clx123...",
    "numero": "FAC-2024-0001",
    "total": 500000
  },
  "signature": "sha256=..."
}
```

---

## Plans d'abonnement

| Plan | Prix/mois | Fonctionnalités |
|------|-----------|-----------------|
| STARTER | 75,000 GNF | 1 utilisateur, 50 clients, factures basiques |
| BUSINESS | 250,000 GNF | 5 utilisateurs, 500 clients,Mobile Money |
| PREMIUM | 500,000 GNF | 20 utilisateurs, illimité, API, rapports |
| ENTERPRISE | 1,200,000 GNF | Illimité, support dédié, SLA |

---

## Support

- **Email:** support@guineamanager.com
- **Téléphone:** +224 620 00 00 00
- **Documentation:** https://docs.guineamanager.com
