const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, 
        Header, Footer, AlignmentType, PageNumber, BorderStyle, WidthType, 
        HeadingLevel, ShadingType, VerticalAlign, LevelFormat, PageBreak } = require('docx');
const fs = require('fs');

// Color palette - "Midnight Code" for tech project
const colors = {
  primary: "020617",      // Midnight Black
  bodyText: "1E293B",     // Deep Slate Blue
  secondary: "64748B",    // Cool Blue-Gray
  accent: "94A3B8",       // Steady Silver
  tableBg: "F8FAFC",      // Glacial Blue-White
  headerBg: "0F172A",     // Dark header
  success: "059669",      // Green for success
  warning: "D97706",      // Orange for warning
  error: "DC2626"         // Red for error
};

// Table border style
const tableBorder = { style: BorderStyle.SINGLE, size: 12, color: colors.accent };
const cellBorders = { top: tableBorder, bottom: tableBorder, left: tableBorder, right: tableBorder };

const doc = new Document({
  styles: {
    default: { document: { run: { font: "Calibri", size: 22 } } },
    paragraphStyles: [
      { id: "Title", name: "Title", basedOn: "Normal",
        run: { size: 48, bold: true, color: colors.primary, font: "Times New Roman" },
        paragraph: { spacing: { before: 0, after: 200 }, alignment: AlignmentType.CENTER } },
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 32, bold: true, color: colors.primary, font: "Times New Roman" },
        paragraph: { spacing: { before: 400, after: 200 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 26, bold: true, color: colors.bodyText, font: "Times New Roman" },
        paragraph: { spacing: { before: 300, after: 150 }, outlineLevel: 1 } },
    ]
  },
  numbering: {
    config: [
      { reference: "bullet-list",
        levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "numbered-list",
        levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "rec-list",
        levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    ]
  },
  sections: [{
    properties: {
      page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } }
    },
    headers: {
      default: new Header({ children: [new Paragraph({ 
        alignment: AlignmentType.RIGHT,
        children: [new TextRun({ text: "GuinéaManager ERP - Rapport d'État", color: colors.secondary, size: 20 })]
      })] })
    },
    footers: {
      default: new Footer({ children: [new Paragraph({ 
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: "Page ", size: 20 }), 
          new TextRun({ children: [PageNumber.CURRENT], size: 20 }), 
          new TextRun({ text: " / ", size: 20 }), 
          new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 20 })
        ]
      })] })
    },
    children: [
      // Title
      new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun("RAPPORT D'ÉTAT DU PROJET")] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 400 },
        children: [new TextRun({ text: "GuinéaManager ERP - Système de Gestion pour PME Ouest-Africaines", size: 24, color: colors.secondary })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 600 },
        children: [new TextRun({ text: "Date: 26 Mars 2026", size: 22, color: colors.bodyText })] }),

      // Executive Summary
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("1. Résumé Exécutif")] }),
      new Paragraph({ spacing: { after: 200 }, children: [
        new TextRun("GuinéaManager ERP est un système de gestion d'entreprise multi-pays conçu spécifiquement pour les PME en Afrique de l'Ouest. Le projet a été développé avec une architecture moderne utilisant Next.js 16 pour le frontend et Express.js pour le backend, avec Prisma ORM et SQLite pour la base de données. Le système offre une gamme complète de fonctionnalités incluant la facturation, la gestion des stocks, la paie multi-pays conforme aux législations locales, la comptabilité OHADA, et l'intégration des paiements mobiles (Orange Money, MTN Money).")
      ]}),
      new Paragraph({ spacing: { after: 200 }, children: [
        new TextRun("Le projet a fait l'objet de nombreuses itérations de développement et de corrections pour le déploiement Docker. Plusieurs problèmes techniques ont été résolus, notamment les conflits de dépendances npm, les problèmes de build Docker, les erreurs de configuration PWA, et les problèmes d'authentification. Actuellement, le projet est fonctionnel à environ 85%, avec des problèmes résiduels au niveau de l'authentification et de la communication frontend-backend.")
      ]}),

      // Points Forts
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("2. Points Forts du Projet")] }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("2.1 Architecture Technique Moderne")] }),
      new Paragraph({ spacing: { after: 200 }, children: [
        new TextRun("Le projet utilise une stack technologique moderne et bien structurée. Le frontend Next.js 16 avec Turbopack offre des performances optimales et un excellent développement DX. Le backend Express.js est modulaire et bien organisé avec une séparation claire des responsabilités (controllers, services, routes, middlewares). L'utilisation de TypeScript assure une meilleure qualité de code et réduit les erreurs potentielles.")
      ]}),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("2.2 Fonctionnalités Métier Complètes")] }),
      new Paragraph({ spacing: { after: 100 }, children: [new TextRun("Le système couvre un large éventail de fonctionnalités métier essentielles pour les PME:")] }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun("Facturation et devis avec génération PDF automatique")] }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun("Gestion des clients et prospects (CRM)")] }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun("Gestion des stocks multi-entrepôts avec inventaires")] }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun("Paie multi-pays avec conformité fiscale (Guinée, Sénégal, Mali, Côte d'Ivoire)")] }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun("Comptabilité OHADA avec plan comptable Syscohada révisé")] }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun("Intégration paiements mobiles (Orange Money, MTN Money)")] }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { after: 200 }, children: [new TextRun("Tableaux de bord et rapports analytiques")] }),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("2.3 Schéma de Base de Données Robuste")] }),
      new Paragraph({ spacing: { after: 200 }, children: [
        new TextRun("Le schéma Prisma est extrêmement complet avec plus de 60 modèles couvrant tous les aspects de la gestion d'entreprise. Il inclut la gestion multi-sociétés, les plans d'abonnement, les audits, les notifications, et une traçabilité complète des opérations. Les relations sont bien définies avec des index appropriés pour optimiser les performances.")
      ]}),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("2.4 Interface Utilisateur Professionnelle")] }),
      new Paragraph({ spacing: { after: 200 }, children: [
        new TextRun("L'interface utilisateur est développée avec shadcn/ui et Tailwind CSS, offrant un design moderne et cohérent. Les composants sont bien structurés et réutilisables. Le système de navigation avec sidebar permet un accès rapide aux différentes fonctionnalités. L'interface est responsive et s'adapte aux différents formats d'écran.")
      ]}),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("2.5 Sécurité et Bonnes Pratiques")] }),
      new Paragraph({ spacing: { after: 200 }, children: [
        new TextRun("Le projet implémente plusieurs couches de sécurité: authentification JWT avec refresh tokens, hachage bcrypt des mots de passe, rate limiting pour prévenir les attaques brute force, validation des entrées avec Zod, middlewares d'authentification et d'autorisation, et support de l'authentification à deux facteurs (TOTP et SMS).")
      ]}),

      // Points Faibles
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("3. Points Faibles et Problèmes Identifiés")] }),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("3.1 Problèmes d'Authentification Critiques")] }),
      new Paragraph({ spacing: { after: 200 }, children: [
        new TextRun("Le problème majeur actuel est que l'authentification ne fonctionne pas correctement. L'API client frontend utilise une URL absolue ("),
        new TextRun({ text: "http://localhost:3001/api", bold: true }),
        new TextRun(") au lieu de passer par le proxy Next.js. Cela cause des échecs de connexion car en production Docker, le frontend et le backend tournent dans le même conteneur mais le frontend essaie de se connecter à localhost:3001 qui peut ne pas être accessible depuis le navigateur client. De plus, le backend TypeScript n'est pas correctement compilé - le fichier "),
        new TextRun({ text: "dist/index.js", bold: true }),
        new TextRun(" n'existe peut-être pas, ce qui empêche le backend de démarrer.")
      ]}),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("3.2 Problèmes de Build et Compilation")] }),
      new Paragraph({ spacing: { after: 200 }, children: [
        new TextRun("Le Dockerfile utilise "),
        new TextRun({ text: "npx tsc --skipLibCheck 2>&1 || true", bold: true }),
        new TextRun(" pour compiler le backend, mais l'option "),
        new TextRun({ text: "|| true", bold: true }),
        new TextRun(" masque les erreurs de compilation. Si la compilation TypeScript échoue, le dossier dist/ ne sera pas créé correctement, et le backend ne pourra pas démarrer. Cette approche n'est pas robuste pour un environnement de production.")
      ]}),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("3.3 Problèmes de Synchronisation Base de Données")] }),
      new Paragraph({ spacing: { after: 200 }, children: [
        new TextRun("L'initialisation de la base de données présente des problèmes de timing. Le script docker-entrypoint.sh vérifie si le fichier SQLite existe avant de lancer "),
        new TextRun({ text: "prisma db push", bold: true }),
        new TextRun(", mais cette vérification est insuffisante. La base de données peut exister mais être vide ou corrompue. L'initialisation des données de démo ("),
        new TextRun({ text: "demo@guineamanager.com / demo123", bold: true }),
        new TextRun(") se fait dans le code backend, mais si le backend ne démarre pas correctement, ces données ne seront jamais créées.")
      ]}),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("3.4 Configuration Next.js Standalone")] }),
      new Paragraph({ spacing: { after: 200 }, children: [
        new TextRun("Le Dockerfile tente d'exécuter "),
        new TextRun({ text: "node .next/standalone/server.js", bold: true }),
        new TextRun(", mais la configuration next.config.ts n'inclut pas "),
        new TextRun({ text: "output: 'standalone'", bold: true }),
        new TextRun(". Sans cette configuration, le dossier .next/standalone/ ne sera pas généré, et le serveur ne pourra pas démarrer en mode standalone.")
      ]}),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("3.5 Gestion des Erreurs et Logging")] }),
      new Paragraph({ spacing: { after: 200 }, children: [
        new TextRun("Le logging basique avec console.log n'est pas optimal pour un environnement de production. Il manque un système de logging structuré avec des niveaux (debug, info, warn, error), une rotation des logs, et une intégration possible avec des outils de monitoring. Les erreurs ne sont pas toujours correctement propagées au frontend, ce qui rend le débogage difficile.")
      ]}),

      // Tableau récapitulatif
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("4. Tableau Récapitulatif des Problèmes")] }),
      new Table({
        columnWidths: [2800, 2400, 4160],
        rows: [
          new TableRow({
            tableHeader: true,
            children: [
              new TableCell({ borders: cellBorders, shading: { fill: colors.headerBg, type: ShadingType.CLEAR }, verticalAlign: VerticalAlign.CENTER,
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Problème", bold: true, color: "FFFFFF" })] })] }),
              new TableCell({ borders: cellBorders, shading: { fill: colors.headerBg, type: ShadingType.CLEAR }, verticalAlign: VerticalAlign.CENTER,
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Sévérité", bold: true, color: "FFFFFF" })] })] }),
              new TableCell({ borders: cellBorders, shading: { fill: colors.headerBg, type: ShadingType.CLEAR }, verticalAlign: VerticalAlign.CENTER,
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Solution Recommandée", bold: true, color: "FFFFFF" })] })] }),
            ]
          }),
          new TableRow({
            children: [
              new TableCell({ borders: cellBorders, verticalAlign: VerticalAlign.CENTER,
                children: [new Paragraph({ children: [new TextRun("URL API incorrecte")] })] }),
              new TableCell({ borders: cellBorders, shading: { fill: "FEE2E2", type: ShadingType.CLEAR }, verticalAlign: VerticalAlign.CENTER,
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "CRITIQUE", bold: true, color: colors.error })] })] }),
              new TableCell({ borders: cellBorders, verticalAlign: VerticalAlign.CENTER,
                children: [new Paragraph({ children: [new TextRun("Utiliser '/api' comme URL relative")] })] }),
            ]
          }),
          new TableRow({
            children: [
              new TableCell({ borders: cellBorders, verticalAlign: VerticalAlign.CENTER,
                children: [new Paragraph({ children: [new TextRun("Backend non compilé")] })] }),
              new TableCell({ borders: cellBorders, shading: { fill: "FEE2E2", type: ShadingType.CLEAR }, verticalAlign: VerticalAlign.CENTER,
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "CRITIQUE", bold: true, color: colors.error })] })] }),
              new TableCell({ borders: cellBorders, verticalAlign: VerticalAlign.CENTER,
                children: [new Paragraph({ children: [new TextRun("Corriger compilation TypeScript")] })] }),
            ]
          }),
          new TableRow({
            children: [
              new TableCell({ borders: cellBorders, verticalAlign: VerticalAlign.CENTER,
                children: [new Paragraph({ children: [new TextRun("Mode standalone manquant")] })] }),
              new TableCell({ borders: cellBorders, shading: { fill: "FEF3C7", type: ShadingType.CLEAR }, verticalAlign: VerticalAlign.CENTER,
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "ÉLEVÉE", bold: true, color: colors.warning })] })] }),
              new TableCell({ borders: cellBorders, verticalAlign: VerticalAlign.CENTER,
                children: [new Paragraph({ children: [new TextRun("Ajouter output: 'standalone'")] })] }),
            ]
          }),
          new TableRow({
            children: [
              new TableCell({ borders: cellBorders, verticalAlign: VerticalAlign.CENTER,
                children: [new Paragraph({ children: [new TextRun("Initialisation DB")] })] }),
              new TableCell({ borders: cellBorders, shading: { fill: "FEF3C7", type: ShadingType.CLEAR }, verticalAlign: VerticalAlign.CENTER,
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "ÉLEVÉE", bold: true, color: colors.warning })] })] }),
              new TableCell({ borders: cellBorders, verticalAlign: VerticalAlign.CENTER,
                children: [new Paragraph({ children: [new TextRun("Améliorer le script d'entrée")] })] }),
            ]
          }),
          new TableRow({
            children: [
              new TableCell({ borders: cellBorders, verticalAlign: VerticalAlign.CENTER,
                children: [new Paragraph({ children: [new TextRun("Logging insuffisant")] })] }),
              new TableCell({ borders: cellBorders, shading: { fill: "D1FAE5", type: ShadingType.CLEAR }, verticalAlign: VerticalAlign.CENTER,
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "MOYENNE", bold: true, color: colors.success })] })] }),
              new TableCell({ borders: cellBorders, verticalAlign: VerticalAlign.CENTER,
                children: [new Paragraph({ children: [new TextRun("Implémenter logger structuré")] })] }),
            ]
          }),
        ]
      }),
      new Paragraph({ spacing: { after: 300 }, children: [] }),

      // Recommandations
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("5. Recommandations pour un Projet 100% Fonctionnel")] }),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("5.1 Corrections Immédiates (Priorité Critique)")] }),
      new Paragraph({ spacing: { after: 100 }, children: [new TextRun("Les corrections suivantes doivent être appliquées immédiatement pour rendre le système fonctionnel:")] }),
      new Paragraph({ numbering: { reference: "rec-list", level: 0 }, children: [new TextRun({ text: "Corriger l'URL de l'API: ", bold: true }), new TextRun("Modifier src/lib/api.ts pour utiliser '/api' au lieu de 'http://localhost:3001/api', ce qui permettra au frontend de passer par le proxy Next.js pour communiquer avec le backend.")] }),
      new Paragraph({ numbering: { reference: "rec-list", level: 0 }, children: [new TextRun({ text: "Activer le mode standalone: ", bold: true }), new TextRun("Ajouter 'output: \"standalone\"' dans next.config.ts pour que Next.js génère un serveur autonome.")] }),
      new Paragraph({ numbering: { reference: "rec-list", level: 0 }, children: [new TextRun({ text: "Corriger la compilation backend: ", bold: true }), new TextRun("Vérifier et corriger les erreurs TypeScript dans le backend, et s'assurer que le dossier dist/ est correctement généré. Retirer le '|| true' du Dockerfile pour voir les vraies erreurs.")] }),
      new Paragraph({ numbering: { reference: "rec-list", level: 0 }, spacing: { after: 200 }, children: [new TextRun({ text: "Améliorer le script d'entrée: ", bold: true }), new TextRun("Modifier docker-entrypoint.sh pour toujours exécuter 'prisma db push' et créer les données de démo via un script Node.js dédié plutôt que dans le code backend.")] }),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("5.2 Améliorations à Court Terme (1-2 Semaines)")] }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun("Implémenter un système de logging structuré avec Winston ou Pino")] }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun("Ajouter des tests automatisés pour les endpoints d'authentification")] }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun("Créer une documentation API complète avec Swagger/OpenAPI")] }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun("Configurer un pipeline CI/CD pour les builds automatisés")] }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { after: 200 }, children: [new TextRun("Mettre en place des health checks robustes pour Docker")] }),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("5.3 Améliorations à Moyen Terme (1-3 Mois)")] }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun("Migration vers PostgreSQL pour une meilleure scalabilité")] }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun("Implémentation de Redis pour le cache et les sessions")] }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun("Internationalisation complète (i18n) pour les pays francophones et anglophones")] }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun("Application mobile companion pour les entrepreneurs en déplacement")] }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { after: 200 }, children: [new TextRun("Intégration avec les services gouvernementaux (impôts, CNSS)")] }),

      // Conclusion
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("6. Conclusion")] }),
      new Paragraph({ spacing: { after: 200 }, children: [
        new TextRun("GuinéaManager ERP est un projet ambitieux et bien conçu qui répond à un besoin réel des PME en Afrique de l'Ouest. Les fondations techniques sont solides avec une architecture moderne et des fonctionnalités métier complètes. Cependant, plusieurs problèmes critiques empêchent actuellement le système d'être pleinement opérationnel.")
      ]}),
      new Paragraph({ spacing: { after: 200 }, children: [
        new TextRun("Les principaux obstacles sont liés à la configuration du déploiement Docker et à la communication entre le frontend et le backend. Ces problèmes sont résolubles avec les corrections identifiées dans ce rapport. Une fois ces corrections appliquées, le projet devrait atteindre un niveau de fonctionnalité de 95% ou plus.")
      ]}),
      new Paragraph({ spacing: { after: 200 }, children: [
        new TextRun("Le potentiel du projet est significatif, avec une opportunité réelle de devenir une solution de référence pour les PME en Afrique de l'Ouest. Les investissements supplémentaires recommandés dans ce rapport permettront de transformer ce prototype en un produit commercial viable et compétitif.")
      ]}),

      // Identifiants de démo
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("7. Informations de Connexion de Démonstration")] }),
      new Paragraph({ spacing: { after: 200 }, children: [
        new TextRun("Une fois le système fonctionnel, les identifiants de démonstration suivants pourront être utilisés pour tester l'application:")
      ]}),
      new Paragraph({ spacing: { after: 100 }, children: [
        new TextRun({ text: "Email: ", bold: true }),
        new TextRun("demo@guineamanager.com")
      ]}),
      new Paragraph({ spacing: { after: 300 }, children: [
        new TextRun({ text: "Mot de passe: ", bold: true }),
        new TextRun("demo123")
      ]}),
    ]
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("/home/z/my-project/download/guineamanager-status-report.docx", buffer);
  console.log("Report generated: /home/z/my-project/download/guineamanager-status-report.docx");
});
