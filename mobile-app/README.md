# GuinéaManager Mobile App

Application mobile pour GuinéaManager ERP - Solution PWA/React Native pour les entrepreneurs guinéens.

## Architecture

Cette application mobile est conçue comme une Progressive Web App (PWA) avec une base de code React Native/Expo pour une compilation native future.

### Stack Technique

- **Framework**: React 18 + TypeScript
- **Mobile**: React Native / Expo SDK 50+
- **Navigation**: Expo Router (file-based routing)
- **State Management**: Zustand + React Query
- **UI Components**: Tamagui (cross-platform)
- **Offline**: AsyncStorage + SQLite
- **Push Notifications**: Expo Notifications

## Structure du Projet

```
mobile-app/
├── src/
│   ├── components/       # Composants réutilisables
│   ├── screens/          # Écrans de l'application
│   ├── services/         # Services API et intégrations
│   ├── hooks/            # Hooks personnalisés
│   ├── context/          # Context React (Auth, Theme)
│   ├── utils/            # Utilitaires et helpers
│   ├── navigation/       # Configuration de navigation
│   └── types/            # Types TypeScript
├── assets/               # Images, fonts, icônes
├── app.json              # Configuration Expo
├── package.json
└── eas.json              # Configuration EAS Build
```

## Fonctionnalités

### Phase 1 (MVP)
- ✅ Authentification (login, register)
- ✅ Dashboard avec KPIs
- ✅ Gestion des factures
- ✅ Liste des clients
- ✅ Notifications push

### Phase 2
- 🔄 Paiements Mobile Money (Orange, MTN, Wave)
- 🔄 Gestion des stocks
- 🔄 Rapports et analytics
- 🔄 Mode hors-ligne

### Phase 3
- 📋 Paie et employés
- 📋 Multi-société
- 📋 Signature électronique

## Installation

```bash
# Installer les dépendances
npm install

# Démarrer en développement
npx expo start

# Démarrer sur Android
npx expo start --android

# Démarrer sur iOS
npx expo start --ios

# Démarrer en mode web (PWA)
npx expo start --web
```

## Build et Déploiement

```bash
# Build Android APK
eas build --platform android --profile preview

# Build iOS
eas build --platform ios --profile preview

# Build PWA
npx expo export:web
```

## Configuration de l'API

L'application se connecte à l'API GuinéaManager:

- **Production**: https://api.guineamanager.com
- **Staging**: https://staging-api.guineamanager.com
- **Développement**: http://localhost:3001

## Permissions Requises

### Android
- `INTERNET` - Connexion API
- `ACCESS_NETWORK_STATE` - État réseau
- `VIBRATE` - Notifications
- `RECEIVE_BOOT_COMPLETED` - Notifications au démarrage

### iOS
- Notifications Push
- App Transport Security

## Licence

MIT © GuinéaManager Team
