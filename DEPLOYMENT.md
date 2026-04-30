# GuinéaManager ERP - Guide de Déploiement

## 🚀 Déploiement Rapide avec Docker

### Prérequis
- Docker et Docker Compose installés
- Au moins 2GB de RAM disponible
- Ports 3000 et 3001 disponibles

### Installation en 3 étapes

```bash
# 1. Cloner le repository
git clone https://github.com/skaba89/guineemenages.git
cd guineemenages

# 2. Configurer l'environnement
cp .env.example .env
# Editer .env avec vos paramètres (optionnel pour test)

# 3. Lancer avec Docker Compose
docker-compose up -d --build
```

### Accès à l'application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Documentation API**: http://localhost:3001/api/docs

### Identifiants de démonstration

- **Email**: demo@guineamanager.com
- **Mot de passe**: demo123

---

## 📋 Configuration de Production

### Variables d'environnement obligatoires

```bash
# Sécurité
JWT_SECRET=votre-secret-jwt-securise-minimum-32-caracteres

# URL de l'application
NEXT_PUBLIC_APP_URL=https://votre-domaine.com
```

### Variables optionnelles

```bash
# Email (pour notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre-email@gmail.com
SMTP_PASS=votre-mot-de-passe-application

# Orange Money (paiements)
ORANGE_MONEY_CLIENT_ID=...
ORANGE_MONEY_CLIENT_SECRET=...

# MTN Money (paiements)
MTN_MONEY_SUBSCRIPTION_KEY=...
MTN_MONEY_API_KEY=...
```

---

## 🐳 Commandes Docker

```bash
# Démarrer les services
docker-compose up -d

# Voir les logs
docker-compose logs -f

# Arrêter les services
docker-compose down

# Reconstruire les images
docker-compose up -d --build

# Voir le statut
docker-compose ps
```

---

## 🔧 Développement Local

### Prérequis
- Node.js 20+
- npm ou bun

### Installation

```bash
# Installer les dépendances
npm install
cd backend && npm install && cd ..

# Base de données
cd backend && npx prisma db push && cd ..

# Démarrer en développement
./start-dev.sh
```

Ou manuellement:

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
npm run dev
```

---

## 📦 Structure du Projet

```
guineamanager/
├── src/                    # Frontend Next.js
│   ├── app/               # Pages et routes
│   ├── components/        # Composants React
│   ├── lib/              # Utilitaires et API client
│   └── stores/           # État global (Zustand)
├── backend/               # API Express.js
│   ├── src/
│   │   ├── routes/       # Routes API
│   │   ├── services/     # Logique métier
│   │   ├── middlewares/  # Auth, validation, etc.
│   │   └── utils/        # Utilitaires
│   └── prisma/           # Schéma base de données
├── Dockerfile            # Image Docker
├── docker-compose.yml    # Orchestration
└── docker-entrypoint.sh  # Script de démarrage
```

---

## 🔐 Sécurité

### En production, assurez-vous de:

1. **Changer le JWT_SECRET** par une chaîne aléatoire de 32+ caractères
2. **Configurer HTTPS** avec un reverse proxy (Caddy, Nginx)
3. **Restreindre les ports** exposés si possible
4. **Configurer les sauvegardes** de la base de données

---

## 📊 Monitoring

### Health Check

```bash
# Vérifier la santé de l'application
curl http://localhost:3000/api/health
```

### Logs

```bash
# Logs Docker
docker-compose logs -f app

# Logs backend
docker exec guineamanager cat /app/data/logs.txt 2>/dev/null || echo "No logs file"
```

---

## 🆘 Support

- **Documentation**: `/docs` (à venir)
- **Issues**: https://github.com/skaba89/guineemenages/issues
- **Email**: support@guineamanager.com

---

## 📜 Licence

Propriétaire - Tous droits réservés
