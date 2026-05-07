# GuinéaManager ERP - Guide de Déploiement Production

## 🚀 Déploiement en Production

Ce guide vous accompagne dans le déploiement de GuinéaManager en production.

---

## Prérequis

### Serveur
- **OS**: Ubuntu 22.04 LTS ou supérieur
- **RAM**: Minimum 4 Go (8 Go recommandé)
- **Stockage**: 50 Go minimum
- **CPU**: 2 vCPU minimum

### Logiciels
- Docker & Docker Compose
- Git
- Curl

---

## 1. Installation de Docker

```bash
# Mise à jour du système
sudo apt update && sudo apt upgrade -y

# Installation de Docker
curl -fsSL https://get.docker.com | sh

# Ajout de l'utilisateur au groupe docker
sudo usermod -aG docker $USER

# Déconnexion et reconnexion pour appliquer les changements
```

---

## 2. Récupération du Code

```bash
# Cloner le repository
git clone https://github.com/votre-repo/guineamanager.git
cd guineamanager
```

---

## 3. Configuration des Variables d'Environnement

Créez un fichier `.env` à la racine du projet :

```env
# Base de données PostgreSQL
POSTGRES_USER=guineamanager
POSTGRES_PASSWORD=VOTRE_MOT_DE_PASSE_SECURISE
POSTGRES_DB=guineamanager

# JWT (générez une clé secrète forte)
JWT_SECRET=votre-cle-jwt-tres-securise-minimum-64-caracteres

# Domaine
DOMAIN=votre-domaine.com
NEXT_PUBLIC_APP_URL=https://votre-domaine.com

# Email (optionnel)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre-email@gmail.com
SMTP_PASS=votre-mot-de-passe-app

# Mobile Money (optionnel)
ORANGE_MONEY_CLIENT_ID=
ORANGE_MONEY_CLIENT_SECRET=
MTN_MONEY_SUBSCRIPTION_KEY=
MTN_MONEY_API_KEY=

# Monitoring (optionnel)
SENTRY_DSN=
```

---

## 4. Configuration du Domaine

### Mise à jour du Caddyfile

Remplacez `guineamanager.com` par votre domaine :

```bash
sed -i 's/guineamanager.com/votre-domaine.com/g' Caddyfile
```

### Configuration DNS

Ajoutez les enregistrements DNS suivants :

| Type | Nom | Valeur |
|------|-----|--------|
| A | @ | IP_DE_VOTRE_SERVEUR |
| A | www | IP_DE_VOTRE_SERVEUR |

---

## 5. Démarrage de l'Application

### Première installation

```bash
# Construction et démarrage
docker compose -f docker-compose.prod.yml up -d --build

# Vérification des logs
docker compose -f docker-compose.prod.yml logs -f
```

### Vérification

```bash
# Vérifier que tous les services sont démarrés
docker compose -f docker-compose.prod.yml ps

# Devrait afficher 5 services : app, postgres, redis, caddy, backup
```

---

## 6. Initialisation de la Base de Données

```bash
# Exécuter les migrations
docker compose -f docker-compose.prod.yml exec app npx prisma migrate deploy

# Créer les données initiales
docker compose -f docker-compose.prod.yml exec app npx prisma db seed
```

---

## 7. Vérification SSL

Le certificat SSL est automatiquement généré par Caddy. Vérifiez :

```bash
# Vérifier les logs Caddy pour le SSL
docker compose -f docker-compose.prod.yml logs caddy | grep -i ssl
```

Votre site devrait être accessible sur `https://votre-domaine.com`

---

## 8. Sauvegardes Automatiques

Les sauvegardes sont configurées automatiquement :
- **Fréquence**: Toutes les nuits à 2h00
- **Rétention**: 30 jours
- **Emplacement**: Volume Docker `guineamanager-backups`

### Restauration d'une sauvegarde

```bash
# Lister les sauvegardes
docker compose -f docker-compose.prod.yml exec backup ls -la /backups

# Restaurer une sauvegarde spécifique
docker compose -f docker-compose.prod.yml exec -T postgres \
  psql -U guineamanager -d guineamanager < /backups/guineamanager_2024-01-15.sql
```

---

## 9. Commandes Utiles

### Gestion des services

```bash
# Démarrer
docker compose -f docker-compose.prod.yml up -d

# Arrêter
docker compose -f docker-compose.prod.yml down

# Redémarrer
docker compose -f docker-compose.prod.yml restart

# Voir les logs
docker compose -f docker-compose.prod.yml logs -f [service]
```

### Mise à jour

```bash
# Récupérer les dernières modifications
git pull

# Reconstruire et redémarrer
docker compose -f docker-compose.prod.yml up -d --build
```

### Monitoring

```bash
# État des services
docker compose -f docker-compose.prod.yml ps

# Utilisation des ressources
docker stats

# Santé de l'application
curl https://votre-domaine.com/api/health
```

---

## 10. Sécurité

### Firewall (UFW)

```bash
# Activer le firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Autoriser SSH, HTTP, HTTPS
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Activer
sudo ufw enable
```

### Fail2Ban

```bash
# Installation
sudo apt install fail2ban -y

# Configuration pour SSH
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

---

## 11. Monitoring Production

### Logs Centralisés

```bash
# Voir les logs de l'application
docker compose -f docker-compose.prod.yml logs -f app

# Voir les logs Nginx/Caddy
docker compose -f docker-compose.prod.yml logs -f caddy
```

### Alertes

Configurez des alertes pour :
- CPU > 80%
- RAM > 90%
- Espace disque < 10 Go
- Services down

---

## Support

En cas de problème :

1. **Vérifiez les logs** : `docker compose logs -f`
2. **Redémarrez les services** : `docker compose restart`
3. **Contactez le support** : support@guineamanager.com

---

## Checklist Post-Déploiement

- [ ] Application accessible sur https://votre-domaine.com
- [ ] Certificat SSL valide
- [ ] Création de compte fonctionne
- [ ] Email de confirmation reçu
- [ ] Sauvegardes configurées
- [ ] Monitoring en place
- [ ] Firewall activé

---

**Félicitations ! Votre instance GuinéaManager est opérationnelle.** 🎉
