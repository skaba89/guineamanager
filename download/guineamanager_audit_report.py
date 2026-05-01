#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
GuinéaManager ERP - Audit Technique Complet
Généré automatiquement par Z.ai
"""

import sys
import os

# Add skills path
sys.path.insert(0, '/home/z/my-project/skills/pdf/scripts')

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, cm
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, Image, ListFlowable, ListItem
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily

# ============================================================================
# COLOR PALETTE (from pdf.py palette.generate)
# ============================================================================
ACCENT       = colors.HexColor('#af293f')
TEXT_PRIMARY = colors.HexColor('#18191a')
TEXT_MUTED   = colors.HexColor('#80888c')
BG_SURFACE   = colors.HexColor('#e1e6e9')
BG_PAGE      = colors.HexColor('#eceff1')

TABLE_HEADER_COLOR = ACCENT
TABLE_HEADER_TEXT  = colors.white
TABLE_ROW_EVEN     = colors.white
TABLE_ROW_ODD      = BG_SURFACE

# ============================================================================
# FONT REGISTRATION
# ============================================================================
pdfmetrics.registerFont(TTFont('NotoSerifSC', '/usr/share/fonts/truetype/noto-serif-sc/NotoSerifSC-Regular.ttf'))
pdfmetrics.registerFont(TTFont('NotoSerifSC-Bold', '/usr/share/fonts/truetype/noto-serif-sc/NotoSerifSC-Bold.ttf'))
pdfmetrics.registerFont(TTFont('SarasaMonoSC', '/usr/share/fonts/truetype/chinese/SarasaMonoSC-Regular.ttf'))
pdfmetrics.registerFont(TTFont('DejaVuSans', '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf'))

registerFontFamily('NotoSerifSC', normal='NotoSerifSC', bold='NotoSerifSC-Bold')

# ============================================================================
# STYLES
# ============================================================================
styles = getSampleStyleSheet()

# Title styles
styles.add(ParagraphStyle(
    name='MainTitle',
    fontName='NotoSerifSC',
    fontSize=28,
    leading=36,
    textColor=ACCENT,
    alignment=TA_CENTER,
    spaceAfter=20,
))

styles.add(ParagraphStyle(
    name='Subtitle',
    fontName='NotoSerifSC',
    fontSize=14,
    leading=20,
    textColor=TEXT_MUTED,
    alignment=TA_CENTER,
    spaceAfter=30,
))

styles.add(ParagraphStyle(
    name='H1',
    fontName='NotoSerifSC',
    fontSize=18,
    leading=26,
    textColor=ACCENT,
    spaceBefore=24,
    spaceAfter=12,
))

styles.add(ParagraphStyle(
    name='H2',
    fontName='NotoSerifSC',
    fontSize=14,
    leading=20,
    textColor=TEXT_PRIMARY,
    spaceBefore=18,
    spaceAfter=8,
))

styles.add(ParagraphStyle(
    name='H3',
    fontName='NotoSerifSC',
    fontSize=12,
    leading=18,
    textColor=TEXT_PRIMARY,
    spaceBefore=12,
    spaceAfter=6,
))

styles.add(ParagraphStyle(
    name='Body',
    fontName='NotoSerifSC',
    fontSize=10.5,
    leading=18,
    textColor=TEXT_PRIMARY,
    alignment=TA_LEFT,
    wordWrap='CJK',
    spaceBefore=0,
    spaceAfter=8,
))

styles.add(ParagraphStyle(
    name='BodyJustify',
    fontName='NotoSerifSC',
    fontSize=10.5,
    leading=18,
    textColor=TEXT_PRIMARY,
    alignment=TA_JUSTIFY,
    wordWrap='CJK',
    spaceBefore=0,
    spaceAfter=8,
))

styles.add(ParagraphStyle(
    name='TableCell',
    fontName='NotoSerifSC',
    fontSize=9,
    leading=14,
    textColor=TEXT_PRIMARY,
    alignment=TA_CENTER,
    wordWrap='CJK',
))

styles.add(ParagraphStyle(
    name='TableHeader',
    fontName='NotoSerifSC',
    fontSize=9,
    leading=14,
    textColor=colors.white,
    alignment=TA_CENTER,
))

styles.add(ParagraphStyle(
    name='Caption',
    fontName='NotoSerifSC',
    fontSize=9,
    leading=14,
    textColor=TEXT_MUTED,
    alignment=TA_CENTER,
    spaceBefore=4,
    spaceAfter=12,
))

styles.add(ParagraphStyle(
    name='StatusOK',
    fontName='NotoSerifSC',
    fontSize=10,
    leading=16,
    textColor=colors.HexColor('#16a34a'),
))

styles.add(ParagraphStyle(
    name='StatusWarning',
    fontName='NotoSerifSC',
    fontSize=10,
    leading=16,
    textColor=colors.HexColor('#d97706'),
))

styles.add(ParagraphStyle(
    name='StatusError',
    fontName='NotoSerifSC',
    fontSize=10,
    leading=16,
    textColor=colors.HexColor('#dc2626'),
))

# ============================================================================
# DOCUMENT SETUP
# ============================================================================
output_path = '/home/z/my-project/download/Guineamanager_ERP_Audit_Technique.pdf'
doc = SimpleDocTemplate(
    output_path,
    pagesize=A4,
    leftMargin=2*cm,
    rightMargin=2*cm,
    topMargin=2*cm,
    bottomMargin=2*cm,
)

story = []

# ============================================================================
# COVER PAGE
# ============================================================================
story.append(Spacer(1, 80))
story.append(Paragraph('GUINÉAMANAGER ERP', styles['MainTitle']))
story.append(Paragraph('Audit Technique Complet', styles['Subtitle']))
story.append(Spacer(1, 30))
story.append(Paragraph('Rapport d\'analyse, points forts, points faibles', styles['Subtitle']))
story.append(Paragraph('et plan d\'évolution avec roadmap', styles['Subtitle']))
story.append(Spacer(1, 60))

# Metadata table
meta_data = [
    [Paragraph('<b>Version</b>', styles['TableCell']), Paragraph('1.0', styles['TableCell'])],
    [Paragraph('<b>Date</b>', styles['TableCell']), Paragraph('01 Mai 2026', styles['TableCell'])],
    [Paragraph('<b>Technologies</b>', styles['TableCell']), Paragraph('Next.js 16, React 19, Express.js, Prisma, SQLite', styles['TableCell'])],
    [Paragraph('<b>Repository</b>', styles['TableCell']), Paragraph('github.com/skaba89/guineamanager', styles['TableCell'])],
]
meta_table = Table(meta_data, colWidths=[120, 300])
meta_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, -1), BG_PAGE),
    ('GRID', (0, 0), (-1, -1), 0.5, TEXT_MUTED),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('LEFTPADDING', (0, 0), (-1, -1), 12),
    ('RIGHTPADDING', (0, 0), (-1, -1), 12),
    ('TOPPADDING', (0, 0), (-1, -1), 8),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
]))
story.append(meta_table)

story.append(PageBreak())

# ============================================================================
# TABLE OF CONTENTS
# ============================================================================
story.append(Paragraph('TABLE DES MATIÈRES', styles['H1']))
story.append(Spacer(1, 12))

toc_items = [
    ('1. Résumé Exécutif', 'Vue d\'ensemble de l\'état du projet'),
    ('2. Architecture Technique', 'Stack technologique et structure'),
    ('3. Audit Frontend', 'Pages, composants, API calls'),
    ('4. Audit Backend', 'Endpoints, authentification, validation'),
    ('5. Audit Base de Données', 'Modèles Prisma, relations, index'),
    ('6. Points Forts', 'Ce qui fonctionne bien'),
    ('7. Points Faibles', 'Ce qui nécessite attention'),
    ('8. Fonctionnalités Manquantes', 'Pages et actions non implémentées'),
    ('9. Plan de Correction', 'Actions prioritaires'),
    ('10. Roadmap d\'Évolution', 'Phases de développement'),
]

for title, desc in toc_items:
    story.append(Paragraph(f'<b>{title}</b>', styles['Body']))
    story.append(Paragraph(f'    {desc}', styles['Body']))
    story.append(Spacer(1, 4))

story.append(PageBreak())

# ============================================================================
# 1. RÉSUMÉ EXÉCUTIF
# ============================================================================
story.append(Paragraph('1. RÉSUMÉ EXÉCUTIF', styles['H1']))

story.append(Paragraph(
    'GuinéaManager ERP est un système de gestion d\'entreprise multi-pays conçu pour le marché ouest-africain, '
    'avec une attention particulière pour la Guinée. L\'application adopte une architecture moderne avec Next.js 16 '
    'pour le frontend et Express.js pour le backend, utilisant Prisma comme ORM et SQLite comme base de données. '
    'Ce rapport d\'audit identifie les forces et faiblesses du système actuel, les fonctionnalités manquantes, '
    'et propose un plan d\'évolution structuré avec une roadmap détaillée.',
    styles['BodyJustify']
))

story.append(Paragraph('1.1 Statistiques Clés', styles['H2']))

stats_data = [
    [Paragraph('<b>Catégorie</b>', styles['TableHeader']),
     Paragraph('<b>Quantité</b>', styles['TableHeader']),
     Paragraph('<b>État</b>', styles['TableHeader'])],
    [Paragraph('Pages Frontend', styles['TableCell']),
     Paragraph('29 pages', styles['TableCell']),
     Paragraph('23 routes actives', styles['TableCell'])],
    [Paragraph('Composants UI', styles['TableCell']),
     Paragraph('53 composants', styles['TableCell']),
     Paragraph('shadcn/ui', styles['TableCell'])],
    [Paragraph('Endpoints Backend', styles['TableCell']),
     Paragraph('~170 endpoints', styles['TableCell']),
     Paragraph('95% implémentés', styles['TableCell'])],
    [Paragraph('Modèles Prisma', styles['TableCell']),
     Paragraph('59 modèles', styles['TableCell']),
     Paragraph('Migration en attente', styles['TableCell'])],
    [Paragraph('Console.log', styles['TableCell']),
     Paragraph('~75 statements', styles['TableCell']),
     Paragraph('À nettoyer', styles['TableCell'])],
    [Paragraph('Mock Data', styles['TableCell']),
     Paragraph('8+ générateurs', styles['TableCell']),
     Paragraph('À remplacer', styles['TableCell'])],
]

stats_table = Table(stats_data, colWidths=[180, 120, 140])
stats_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), TABLE_HEADER_COLOR),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('BACKGROUND', (0, 1), (-1, -1), colors.white),
    ('BACKGROUND', (0, 2), (-1, 2), TABLE_ROW_ODD),
    ('BACKGROUND', (0, 4), (-1, 4), TABLE_ROW_ODD),
    ('BACKGROUND', (0, 6), (-1, 6), TABLE_ROW_ODD),
    ('GRID', (0, 0), (-1, -1), 0.5, TEXT_MUTED),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('LEFTPADDING', (0, 0), (-1, -1), 8),
    ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ('TOPPADDING', (0, 0), (-1, -1), 6),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
]))
story.append(stats_table)
story.append(Paragraph('Tableau 1 : Statistiques clés du projet', styles['Caption']))

story.append(PageBreak())

# ============================================================================
# 2. ARCHITECTURE TECHNIQUE
# ============================================================================
story.append(Paragraph('2. ARCHITECTURE TECHNIQUE', styles['H1']))

story.append(Paragraph('2.1 Stack Technologique', styles['H2']))

story.append(Paragraph(
    'L\'application utilise une architecture moderne séparant clairement le frontend du backend. '
    'Le frontend est construit avec Next.js 16 utilisant Turbopack, React 19, Tailwind CSS 4, et shadcn/ui '
    'pour les composants d\'interface. Le backend utilise Express.js avec TypeScript, Prisma ORM, et SQLite '
    'pour la persistance des données. Cette séparation permet une maintenance indépendante des deux couches '
    'et facilite les déploiements scalables. L\'authentification est gérée via JWT avec support du 2FA (TOTP et SMS), '
    'et le caching utilise Redis pour optimiser les performances des requêtes fréquentes.',
    styles['BodyJustify']
))

story.append(Paragraph('2.2 Structure du Projet', styles['H2']))

structure_data = [
    [Paragraph('<b>Répertoire</b>', styles['TableHeader']),
     Paragraph('<b>Contenu</b>', styles['TableHeader'])],
    [Paragraph('src/components/pages/', styles['TableCell']),
     Paragraph('29 composants de page (dashboard, clients, factures, etc.)', styles['TableCell'])],
    [Paragraph('src/components/ui/', styles['TableCell']),
     Paragraph('53 composants UI réutilisables (shadcn/ui)', styles['TableCell'])],
    [Paragraph('src/lib/', styles['TableCell']),
     Paragraph('API client, stores Zustand, utilitaires', styles['TableCell'])],
    [Paragraph('backend/src/routes/', styles['TableCell']),
     Paragraph('28 fichiers de routes API', styles['TableCell'])],
    [Paragraph('backend/prisma/', styles['TableCell']),
     Paragraph('Schéma Prisma, migrations, seed', styles['TableCell'])],
]

structure_table = Table(structure_data, colWidths=[160, 280])
structure_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), TABLE_HEADER_COLOR),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('BACKGROUND', (0, 1), (-1, -1), colors.white),
    ('BACKGROUND', (0, 2), (-1, 2), TABLE_ROW_ODD),
    ('BACKGROUND', (0, 4), (-1, 4), TABLE_ROW_ODD),
    ('GRID', (0, 0), (-1, -1), 0.5, TEXT_MUTED),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('LEFTPADDING', (0, 0), (-1, -1), 8),
    ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ('TOPPADDING', (0, 0), (-1, -1), 6),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
]))
story.append(structure_table)
story.append(Paragraph('Tableau 2 : Structure des répertoires principaux', styles['Caption']))

story.append(PageBreak())

# ============================================================================
# 3. AUDIT FRONTEND
# ============================================================================
story.append(Paragraph('3. AUDIT FRONTEND', styles['H1']))

story.append(Paragraph('3.1 Pages Implémentées', styles['H2']))

story.append(Paragraph(
    'Le frontend compte 29 composants de page couvrant les fonctionnalités essentielles d\'un ERP moderne. '
    'La navigation est gérée via une sidebar avec 23 routes actives. Chaque page implémente des fonctionnalités '
    'spécifiques avec des formulaires, des tableaux de données, et des actions CRUD. Les pages principales '
    'incluent le tableau de bord avec KPIs et graphiques, la gestion des clients avec filtres et recherche, '
    'la facturation avec calcul TVA et export PDF, et les modules RH avec gestion des congés et de la paie.',
    styles['BodyJustify']
))

story.append(Paragraph('3.2 Inventaire des Pages', styles['H2']))

pages_data = [
    [Paragraph('<b>Module</b>', styles['TableHeader']),
     Paragraph('<b>Pages</b>', styles['TableHeader']),
     Paragraph('<b>Fonctionnalités</b>', styles['TableHeader'])],
    [Paragraph('Core', styles['TableCell']),
     Paragraph('Dashboard, Settings', styles['TableCell']),
     Paragraph('KPIs, configuration, profil', styles['TableCell'])],
    [Paragraph('Ventes', styles['TableCell']),
     Paragraph('Clients, Factures, Devis, Commandes', styles['TableCell']),
     Paragraph('CRUD, TVA, PDF, workflow', styles['TableCell'])],
    [Paragraph('Achats', styles['TableCell']),
     Paragraph('Fournisseurs, Commandes Fournisseur', styles['TableCell']),
     Paragraph('Gestion fournisseurs, réception', styles['TableCell'])],
    [Paragraph('Stock', styles['TableCell']),
     Paragraph('Produits, Stock, Entrepôts, Inventaires', styles['TableCell']),
     Paragraph('Alertes, transferts, valorisation', styles['TableCell'])],
    [Paragraph('RH', styles['TableCell']),
     Paragraph('Employés, Paie, Dépenses', styles['TableCell']),
     Paragraph('Congés, bulletins, cotisations', styles['TableCell'])],
    [Paragraph('Finance', styles['TableCell']),
     Paragraph('Comptabilité, Devises, Rapports', styles['TableCell']),
     Paragraph('OHADA, multi-devises, exports', styles['TableCell'])],
    [Paragraph('CRM', styles['TableCell']),
     Paragraph('CRM, Logistique', styles['TableCell']),
     Paragraph('Prospects, opportunités, livraisons', styles['TableCell'])],
    [Paragraph('IA', styles['TableCell']),
     Paragraph('AI Predictive, AI Assistant', styles['TableCell']),
     Paragraph('Prédictions, classification OHADA', styles['TableCell'])],
    [Paragraph('Mobile', styles['TableCell']),
     Paragraph('POS, Mobile App, Mobile Money', styles['TableCell']),
     Paragraph('Vente, PWA, Orange/MTN/Wave', styles['TableCell'])],
]

pages_table = Table(pages_data, colWidths=[80, 150, 210])
pages_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), TABLE_HEADER_COLOR),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('BACKGROUND', (0, 1), (-1, -1), colors.white),
    ('BACKGROUND', (0, 2), (-1, 2), TABLE_ROW_ODD),
    ('BACKGROUND', (0, 4), (-1, 4), TABLE_ROW_ODD),
    ('BACKGROUND', (0, 6), (-1, 6), TABLE_ROW_ODD),
    ('BACKGROUND', (0, 8), (-1, 8), TABLE_ROW_ODD),
    ('GRID', (0, 0), (-1, -1), 0.5, TEXT_MUTED),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('LEFTPADDING', (0, 0), (-1, -1), 6),
    ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ('TOPPADDING', (0, 0), (-1, -1), 5),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
]))
story.append(pages_table)
story.append(Paragraph('Tableau 3 : Inventaire des pages par module', styles['Caption']))

story.append(Paragraph('3.3 Problèmes Identifiés dans le Frontend', styles['H2']))

story.append(Paragraph(
    'L\'audit a révélé plusieurs problèmes nécessitant attention. Premièrement, environ 75 statements console.log '
    'sont présents dans le code de production, principalement dans les pages settings, commandes, et crm. '
    'Ces statements doivent être remplacés par un service de logging approprié. Deuxièmement, plusieurs générateurs '
    'de données mock sont utilisés dans les modules IA et RH, simulant des réponses au lieu d\'appeler de vraies APIs. '
    'Troisièmement, des pages dupliquées existent : login-page.tsx vs simple-login-page.tsx, factures-page.tsx vs '
    'factures-enhanced-page.tsx, suggérant une refactorisation incomplète.',
    styles['BodyJustify']
))

story.append(PageBreak())

# ============================================================================
# 4. AUDIT BACKEND
# ============================================================================
story.append(Paragraph('4. AUDIT BACKEND', styles['H1']))

story.append(Paragraph('4.1 Endpoints API', styles['H2']))

story.append(Paragraph(
    'Le backend expose environ 170 endpoints répartis en 28 fichiers de routes. L\'authentification couvre '
    '14 endpoints incluant login, register, 2FA (setup, verify, disable), et récupération de mot de passe. '
    'Les routes métier incluent la gestion des clients (7 endpoints), des produits (9 endpoints), des factures '
    '(9 endpoints), des employés (7 endpoints), et de la paie (9 endpoints). Le module de comptabilité OHADA '
    'implémente 13 endpoints pour la tenue des livres comptables. L\'API REST est bien structurée avec une '
    'séparation claire des responsabilités par domaine fonctionnel.',
    styles['BodyJustify']
))

story.append(Paragraph('4.2 Authentification et Autorisation', styles['H2']))

story.append(Paragraph(
    'Le système d\'authentification utilise JWT avec bcrypt pour le hachage des mots de passe. Le 2FA est '
    'implémenté via TOTP (compatible Google Authenticator) et SMS OTP. Cependant, l\'intégration du SMS gateway '
    'n\'est pas complétée (3 commentaires TODO identifiés). Le contrôle d\'accès basé sur les rôles (RBAC) '
    'définit 5 niveaux : OWNER (accès complet), ADMIN (configuration), COMPTABLE (paie, dépenses), MANAGER '
    '(opérations), et EMPLOYE (lecture limitée). Le middleware d\'authentification valide systématiquement '
    'le token et vérifie le statut actif de l\'utilisateur avant d\'autoriser l\'accès.',
    styles['BodyJustify']
))

story.append(Paragraph('4.3 Endpoints Partiellement Implémentés', styles['H2']))

endpoints_issues = [
    [Paragraph('<b>Fichier</b>', styles['TableHeader']),
     Paragraph('<b>Ligne</b>', styles['TableHeader']),
     Paragraph('<b>Problème</b>', styles['TableHeader'])],
    [Paragraph('devis.routes.ts', styles['TableCell']),
     Paragraph('229', styles['TableCell']),
     Paragraph('Génération PDF non implémentée', styles['TableCell'])],
    [Paragraph('devis.routes.ts', styles['TableCell']),
     Paragraph('262', styles['TableCell']),
     Paragraph('Envoi email avec PDF non implémenté', styles['TableCell'])],
    [Paragraph('auth-2fa.routes.ts', styles['TableCell']),
     Paragraph('170, 406', styles['TableCell']),
     Paragraph('Intégration SMS gateway manquante', styles['TableCell'])],
    [Paragraph('auth-2fa.routes.ts', styles['TableCell']),
     Paragraph('658', styles['TableCell']),
     Paragraph('Envoi email de vérification manquant', styles['TableCell'])],
]

endpoints_table = Table(endpoints_issues, colWidths=[140, 60, 250])
endpoints_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), TABLE_HEADER_COLOR),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('BACKGROUND', (0, 1), (-1, -1), colors.white),
    ('BACKGROUND', (0, 2), (-1, 2), TABLE_ROW_ODD),
    ('BACKGROUND', (0, 4), (-1, 4), TABLE_ROW_ODD),
    ('GRID', (0, 0), (-1, -1), 0.5, TEXT_MUTED),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('LEFTPADDING', (0, 0), (-1, -1), 8),
    ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ('TOPPADDING', (0, 0), (-1, -1), 6),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
]))
story.append(endpoints_table)
story.append(Paragraph('Tableau 4 : Endpoints partiellement implémentés', styles['Caption']))

story.append(PageBreak())

# ============================================================================
# 5. AUDIT BASE DE DONNÉES
# ============================================================================
story.append(Paragraph('5. AUDIT BASE DE DONNÉES', styles['H1']))

story.append(Paragraph('5.1 Modèles Prisma', styles['H2']))

story.append(Paragraph(
    'Le schéma Prisma définit 59 modèles couvrant tous les domaines fonctionnels de l\'ERP. Les modèles core '
    'incluent Company (tenant), User, Client, et Produit. Les modèles de facturation couvrent Facture, LigneFacture, '
    'Devis, LigneDevis, et Paiement. Le module RH inclut Employe, Conge, et BulletinPaie. La comptabilité OHADA '
    'est bien représentée avec PlanComptableOHADA, ExerciceComptable, JournalComptable, EcritureComptable, '
    'et les modèles de bilan. Cette modélisation complète permet une gestion intégrée de tous les processus métier.',
    styles['BodyJustify']
))

story.append(Paragraph('5.2 Problèmes Critiques Identifiés', styles['H2']))

story.append(Paragraph(
    'Un problème critique a été identifié dans le schéma Prisma : une erreur de syntaxe à la ligne 316 dans '
    'la définition du modèle Employe. L\'expression @@unique(atricule, companyId]) contient deux erreurs : '
    'le nom de champ devrait être "matricule" et le crochet fermant est mal positionné. Cette erreur peut '
    'empêcher la migration de s\'appliquer correctement. De plus, la migration initiale existe mais n\'a pas '
    'été appliquée à la base de données, ce qui signifie que le schéma réel peut différer du schéma Prisma.',
    styles['BodyJustify']
))

story.append(Paragraph('5.3 Index Manquants', styles['H2']))

story.append(Paragraph(
    'Plusieurs champs fréquemment utilisés dans les requêtes ne disposent pas d\'index, ce qui peut impacter '
    'les performances sur de grands volumes de données. Les champs suivants bénéficieraient d\'un index : '
    'clientId sur Facture (filtrage par client), dateEcheance sur Facture (factures en retard), date sur Paiement, '
    'valide sur Depense (workflow d\'approbation), actif sur Employe et Produit (filtrage des actifs), et '
    'createdAt sur SupportTicket (ordre chronologique). L\'ajout de ces index améliorerait significativement '
    'les temps de réponse des pages listes.',
    styles['BodyJustify']
))

story.append(PageBreak())

# ============================================================================
# 6. POINTS FORTS
# ============================================================================
story.append(Paragraph('6. POINTS FORTS', styles['H1']))

story.append(Paragraph(
    'L\'audit a mis en évidence plusieurs points forts significatifs qui constituent une base solide pour '
    'le développement futur de l\'application. Ces éléments témoignent d\'une architecture bien pensée et '
    'd\'une implémentation de qualité sur de nombreux aspects.',
    styles['BodyJustify']
))

story.append(Paragraph('6.1 Architecture Moderne et Scalable', styles['H2']))

story.append(Paragraph(
    'L\'application adopte une architecture moderne avec une séparation claire entre frontend et backend. '
    'L\'utilisation de Next.js 16 avec Turbopack pour le frontend et Express.js avec TypeScript pour le backend '
    'permet une évolution indépendante des deux couches. Le choix de Prisma comme ORM facilite les opérations '
    'de base de données et garantit la cohérence du typage. Cette architecture permet une mise à l\'échelle '
    'horizontale et facilite les déploiements dans des environnements cloud.',
    styles['BodyJustify']
))

story.append(Paragraph('6.2 Couverture Fonctionnelle Complète', styles['H2']))

story.append(Paragraph(
    'L\'ERP couvre l\'ensemble des fonctionnalités attendues pour la gestion d\'une entreprise : '
    'facturation avec calcul TVA et workflow de validation, gestion des stocks avec alertes et transferts '
    'inter-entrepôts, ressources humaines avec congés et paie, comptabilité conforme au plan OHADA, et '
    'CRM avec pipeline de vente. Cette couverture fonctionnelle complète permet à l\'application de répondre '
    'aux besoins des PME ouest-africaines sans nécessiter de solutions complémentaires.',
    styles['BodyJustify']
))

story.append(Paragraph('6.3 Focus Marché Local', styles['H2']))

story.append(Paragraph(
    'L\'application démontre une attention particulière au marché ouest-africain avec l\'intégration des '
    'paiements Mobile Money (Orange Money, MTN Money, Wave), le support multi-devises avec taux de change, '
    'et la conformité comptable OHADA. L\'adaptation aux spécificités locales (congés, cotisations sociales, '
    'jours fériés) par pays renforce la pertinence de la solution pour le marché cible. Cette localisation '
    'constitue un avantage compétitif significatif face aux solutions internationales génériques.',
    styles['BodyJustify']
))

story.append(Paragraph('6.4 Expérience Utilisateur Professionnelle', styles['H2']))

story.append(Paragraph(
    'L\'interface utilisateur utilise shadcn/ui pour des composants modernes et accessibles. Le design '
    'a été récemment amélioré avec le remplacement des emojis par des icônes SVG (lucide-react) pour '
    'un rendu plus professionnel. Les formulaires disposent de validations côté client et les actions '
    'sont accompagnées de feedback visuel (toasts, états de chargement). L\'application est responsive '
    'et adaptée à différents formats d\'écran.',
    styles['BodyJustify']
))

story.append(PageBreak())

# ============================================================================
# 7. POINTS FAIBLES
# ============================================================================
story.append(Paragraph('7. POINTS FAIBLES', styles['H1']))

story.append(Paragraph(
    'L\'audit a également identifié des points faibles nécessitant correction pour garantir la stabilité '
    'et la maintenabilité de l\'application. Ces éléments sont classés par niveau de priorité pour faciliter '
    'la planification des corrections.',
    styles['BodyJustify']
))

story.append(Paragraph('7.1 Problèmes Critiques', styles['H2']))

critical_data = [
    [Paragraph('<b>Problème</b>', styles['TableHeader']),
     Paragraph('<b>Impact</b>', styles['TableHeader']),
     Paragraph('<b>Fichiers</b>', styles['TableHeader'])],
    [Paragraph('Méthodes API manquantes', styles['TableCell']),
     Paragraph('Erreurs runtime sur settings', styles['TableCell']),
     Paragraph('src/lib/api.ts', styles['TableCell'])],
    [Paragraph('Erreur syntaxe Prisma', styles['TableCell']),
     Paragraph('Migration impossible', styles['TableCell']),
     Paragraph('prisma/schema.prisma:316', styles['TableCell'])],
    [Paragraph('SMS gateway non intégré', styles['TableCell']),
     Paragraph('2FA SMS non fonctionnel', styles['TableCell']),
     Paragraph('auth-2fa.routes.ts', styles['TableCell'])],
    [Paragraph('Migration non appliquée', styles['TableCell']),
     Paragraph('Schéma DB désynchronisé', styles['TableCell']),
     Paragraph('prisma/migrations/', styles['TableCell'])],
]

critical_table = Table(critical_data, colWidths=[170, 140, 150])
critical_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#dc2626')),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('BACKGROUND', (0, 1), (-1, -1), colors.white),
    ('BACKGROUND', (0, 2), (-1, 2), TABLE_ROW_ODD),
    ('BACKGROUND', (0, 4), (-1, 4), TABLE_ROW_ODD),
    ('GRID', (0, 0), (-1, -1), 0.5, TEXT_MUTED),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('LEFTPADDING', (0, 0), (-1, -1), 8),
    ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ('TOPPADDING', (0, 0), (-1, -1), 6),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
]))
story.append(critical_table)
story.append(Paragraph('Tableau 5 : Problèmes critiques identifiés', styles['Caption']))

story.append(Paragraph('7.2 Problèmes Moyens', styles['H2']))

story.append(Paragraph(
    'Plusieurs problèmes de priorité moyenne ont été identifiés. Le code de production contient environ '
    '75 statements console.log qui doivent être remplacés par un service de logging structuré. Les modules '
    'IA (ai-assistant-page.tsx et ai-predictive-page.tsx) utilisent des données mock au lieu d\'appeler '
    'de vraies APIs d\'intelligence artificielle. Les méthodes API client utilisent le type "any" à de '
    'nombreux endroits, réduisant les bénéfices du typage TypeScript. Enfin, les réponses d\'erreur API '
    'ne sont pas standardisées, mélangeant les formats {success, message} et {error}.',
    styles['BodyJustify']
))

story.append(Paragraph('7.3 Problèmes Mineurs', styles['H2']))

story.append(Paragraph(
    'Des pages dupliquées suggèrent une refactorisation incomplète : login-page.tsx vs simple-login-page.tsx, '
    'factures-page.tsx vs factures-enhanced-page.tsx, employes-page.tsx vs employes-enhanced-page.tsx. '
    'La génération de QR codes dans mobile-money-page.tsx utilise un canvas aléatoire au lieu d\'une vraie '
    'bibliothèque QR. Le placeholder de carte dans logistique-page.tsx (ligne 421) n\'est pas implémenté. '
    'Ces éléments mineurs n\'empêchent pas le fonctionnement mais dégradent la qualité perçue.',
    styles['BodyJustify']
))

story.append(PageBreak())

# ============================================================================
# 8. FONCTIONNALITÉS MANQUANTES
# ============================================================================
story.append(Paragraph('8. FONCTIONNALITÉS MANQUANTES', styles['H1']))

story.append(Paragraph('8.1 Méthodes API Client Manquantes', styles['H2']))

story.append(Paragraph(
    'L\'audit de l\'API client a révélé que plusieurs méthodes appelées par le frontend n\'existent pas '
    'dans la classe ApiClient. Ces méthodes manquantes causent des erreurs TypeError à l\'exécution lorsque '
    'les pages correspondantes sont chargées. Les méthodes génériques get(), post(), put(), delete() sont '
    'appelées par de nombreuses pages mais ne sont pas définies, ce qui oblige à utiliser request() avec '
    'des paramètres verbeux.',
    styles['BodyJustify']
))

missing_api = [
    [Paragraph('<b>Méthode</b>', styles['TableHeader']),
     Paragraph('<b>Page appelante</b>', styles['TableHeader']),
     Paragraph('<b>Route backend</b>', styles['TableHeader'])],
    [Paragraph('api.get()', styles['TableCell']),
     Paragraph('devises, crm, comptabilite', styles['TableCell']),
     Paragraph('Générique GET', styles['TableCell'])],
    [Paragraph('api.post()', styles['TableCell']),
     Paragraph('devises, crm, comptabilite', styles['TableCell']),
     Paragraph('Générique POST', styles['TableCell'])],
    [Paragraph('getCommandesFournisseur()', styles['TableCell']),
     Paragraph('fournisseurs-page.tsx:185', styles['TableCell']),
     Paragraph('/fournisseurs/commandes/all', styles['TableCell'])],
    [Paragraph('createCommandeFournisseur()', styles['TableCell']),
     Paragraph('fournisseurs-page.tsx:235', styles['TableCell']),
     Paragraph('/fournisseurs/commandes', styles['TableCell'])],
    [Paragraph('createTransfert()', styles['TableCell']),
     Paragraph('stock-page.tsx:245', styles['TableCell']),
     Paragraph('/entrepots/transferts', styles['TableCell'])],
]

missing_table = Table(missing_api, colWidths=[150, 150, 160])
missing_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), TABLE_HEADER_COLOR),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('BACKGROUND', (0, 1), (-1, -1), colors.white),
    ('BACKGROUND', (0, 2), (-1, 2), TABLE_ROW_ODD),
    ('BACKGROUND', (0, 4), (-1, 4), TABLE_ROW_ODD),
    ('GRID', (0, 0), (-1, -1), 0.5, TEXT_MUTED),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('LEFTPADDING', (0, 0), (-1, -1), 6),
    ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ('TOPPADDING', (0, 0), (-1, -1), 5),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
]))
story.append(missing_table)
story.append(Paragraph('Tableau 6 : Méthodes API client manquantes', styles['Caption']))

story.append(Paragraph('8.2 Pages et Actions Non Fonctionnelles', styles['H2']))

story.append(Paragraph(
    'Plusieurs pages présentent des fonctionnalités partiellement implémentées. La page de paramètres '
    '(settings-page.tsx) appelle des méthodes API inexistantes (getPlans, getAbonnementActuel, get2FAStatus, '
    'getMobileMoneyConfig, initiate2FASetup) causant des erreurs console. La page CRM (crm-page.tsx) utilise '
    'api.get() et api.post() non définis pour les prospects, opportunités et activités. La page de devises '
    '(devises-page.tsx) ne peut pas charger les taux de change ni effectuer de conversions. La page de '
    'comptabilité (comptabilite-page.tsx) a des appels API similaires non fonctionnels.',
    styles['BodyJustify']
))

story.append(Paragraph('8.3 Backend Routes Sans Frontend', styles['H2']))

story.append(Paragraph(
    'Inversement, plusieurs routes backend bien implémentées n\'ont pas de méthodes correspondantes dans '
    'l\'API client frontend. Les routes /devis/* (stats, convert, send) sont implémentées côté serveur '
    'mais non exposées au frontend. Les routes /commandes/* (cancel, facture, livraison) nécessitent des '
    'méthodes dédiées. Les routes /support/* (tickets, faq, stats) sont complètement implémentées mais '
    'inaccessibles depuis l\'interface. Cette lacune prive les utilisateurs de fonctionnalités pourtant '
    'développées.',
    styles['BodyJustify']
))

story.append(PageBreak())

# ============================================================================
# 9. PLAN DE CORRECTION
# ============================================================================
story.append(Paragraph('9. PLAN DE CORRECTION', styles['H1']))

story.append(Paragraph(
    'Le plan de correction est organisé en trois phases selon la priorité des corrections. Les actions '
    'de priorité haute doivent être réalisées immédiatement car elles bloquent des fonctionnalités critiques. '
    'Les actions de priorité moyenne améliorent la qualité et la maintenabilité. Les actions de priorité '
    'basse concernent les optimisations et améliorations cosmétiques.',
    styles['BodyJustify']
))

story.append(Paragraph('9.1 Priorité Haute (Immédiat)', styles['H2']))

high_priority = [
    [Paragraph('<b>#</b>', styles['TableHeader']),
     Paragraph('<b>Action</b>', styles['TableHeader']),
     Paragraph('<b>Effort</b>', styles['TableHeader']),
     Paragraph('<b>Impact</b>', styles['TableHeader'])],
    [Paragraph('1', styles['TableCell']),
     Paragraph('Ajouter méthodes get/post/put/delete génériques à ApiClient', styles['TableCell']),
     Paragraph('1h', styles['TableCell']),
     Paragraph('Critique', styles['TableCell'])],
    [Paragraph('2', styles['TableCell']),
     Paragraph('Corriger erreur syntaxe Prisma (schema.prisma:316)', styles['TableCell']),
     Paragraph('15min', styles['TableCell']),
     Paragraph('Critique', styles['TableCell'])],
    [Paragraph('3', styles['TableCell']),
     Paragraph('Appliquer migration Prisma en attente', styles['TableCell']),
     Paragraph('15min', styles['TableCell']),
     Paragraph('Critique', styles['TableCell'])],
    [Paragraph('4', styles['TableCell']),
     Paragraph('Ajouter méthodes API manquantes (fournisseurs, stock)', styles['TableCell']),
     Paragraph('2h', styles['TableCell']),
     Paragraph('Élevé', styles['TableCell'])],
    [Paragraph('5', styles['TableCell']),
     Paragraph('Intégrer SMS gateway pour 2FA (Twilio ou équivalent local)', styles['TableCell']),
     Paragraph('4h', styles['TableCell']),
     Paragraph('Élevé', styles['TableCell'])],
]

high_table = Table(high_priority, colWidths=[30, 250, 60, 80])
high_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#dc2626')),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('BACKGROUND', (0, 1), (-1, -1), colors.white),
    ('BACKGROUND', (0, 2), (-1, 2), TABLE_ROW_ODD),
    ('BACKGROUND', (0, 4), (-1, 4), TABLE_ROW_ODD),
    ('GRID', (0, 0), (-1, -1), 0.5, TEXT_MUTED),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('LEFTPADDING', (0, 0), (-1, -1), 6),
    ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ('TOPPADDING', (0, 0), (-1, -1), 5),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
]))
story.append(high_table)
story.append(Paragraph('Tableau 7 : Actions de priorité haute', styles['Caption']))

story.append(Paragraph('9.2 Priorité Moyenne (Court terme)', styles['H2']))

story.append(Paragraph(
    'Les actions de priorité moyenne incluent : le nettoyage des 75 statements console.log et leur '
    'remplacement par un service de logging (pino ou winston), le remplacement des générateurs de données '
    'mock par de vraies intégrations API dans les modules IA, l\'ajout d\'interfaces TypeScript pour '
    'remplacer les types "any" dans l\'API client, la standardisation du format des réponses d\'erreur API, '
    'et la suppression des pages dupliquées en conservant les versions "enhanced". L\'effort total estimé '
    'pour ces corrections est de 2-3 jours de développement.',
    styles['BodyJustify']
))

story.append(Paragraph('9.3 Priorité Basse (Moyen terme)', styles['H2']))

story.append(Paragraph(
    'Les actions de priorité basse concernent l\'amélioration continue de la qualité. L\'ajout d\'index '
    'sur les champs fréquemment requêtés améliorera les performances. L\'intégration d\'une vraie bibliothèque '
    'QR code remplacera le générateur aléatoire. L\'implémentation de la carte dans le module logistique '
    'nécessite une intégration avec un service de cartographie (Mapbox, OpenStreetMap). L\'ajout d\'audit '
    'logging sur les opérations sensibles renforcera la traçabilité. Ces améliorations peuvent être planifiées '
    'sur plusieurs sprints.',
    styles['BodyJustify']
))

story.append(PageBreak())

# ============================================================================
# 10. ROADMAP D'ÉVOLUTION
# ============================================================================
story.append(Paragraph('10. ROADMAP D\'ÉVOLUTION', styles['H1']))

story.append(Paragraph(
    'La roadmap d\'évolution propose un plan de développement structuré sur 6 mois, organisé en sprints '
    'de 2 semaines. Chaque phase inclut des objectifs spécifiques, des livrables mesurables, et des '
    'critères de validation. Cette approche permet une livraison incrémentale de valeur tout en maintenant '
    'la qualité du code.',
    styles['BodyJustify']
))

story.append(Paragraph('10.1 Phase 1 : Stabilisation (S1-S2, 1 mois)', styles['H2']))

story.append(Paragraph(
    'La première phase se concentre sur la correction des problèmes critiques identifiés dans l\'audit. '
    'Le sprint 1 est dédié à la correction de l\'API client (ajout des méthodes manquantes, typage TypeScript), '
    'la correction du schéma Prisma et l\'application des migrations. Le sprint 2 couvre l\'intégration '
    'du SMS gateway, le nettoyage du code (console.log), et la mise en place d\'un service de logging '
    'structuré. À l\'issue de cette phase, toutes les pages doivent être fonctionnelles sans erreur console.',
    styles['BodyJustify']
))

story.append(Paragraph('10.2 Phase 2 : Qualité (S3-S4, 1 mois)', styles['H2']))

story.append(Paragraph(
    'La deuxième phase améliore la qualité globale du code. Le sprint 3 inclut l\'ajout de tests unitaires '
    'pour les services critiques (auth, facturation, paie), l\'implémentation de tests d\'intégration pour '
    'les API principales, et la documentation Swagger des endpoints. Le sprint 4 couvre le remplacement '
    'des mocks par de vraies APIs (GLM-5 pour l\'assistant IA), l\'ajout d\'index base de données, et '
    'l\'optimisation des requêtes N+1. Cette phase porte la couverture de tests à 60% minimum.',
    styles['BodyJustify']
))

story.append(Paragraph('10.3 Phase 3 : Fonctionnalités (S5-S8, 2 mois)', styles['H2']))

story.append(Paragraph(
    'La troisième phase enrichit les fonctionnalités existantes. Le sprint 5 implémente l\'intégration '
    'complète Orange Money avec webhooks, et l\'intégration MTN Money. Le sprint 6 ajoute le module de '
    'rapports avancés avec exports Excel/PDF personnalisables. Le sprint 7 développe le tableau de bord '
    'analytique avec KPIs personnalisables. Le sprint 8 intègre un système de notifications temps réel '
    'via WebSockets. Chaque sprint livre une fonctionnalité complète et testée.',
    styles['BodyJustify']
))

story.append(Paragraph('10.4 Phase 4 : Mobile & Excellence (S9-S12, 2 mois)', styles['H2']))

story.append(Paragraph(
    'La quatrième phase finalise l\'application mobile PWA et optimise l\'expérience utilisateur. '
    'Le sprint 9 améliore la PWA avec mode offline complet et synchronisation. Le sprint 10 intègre '
    'la géolocalisation pour le module logistique. Le sprint 11 optimise les performances (lazy loading, '
    'code splitting, caching avancé). Le sprint 12 finalise avec une passe UX/UI, l\'accessibilité (WCAG), '
    'et la documentation utilisateur. Cette phase prépare le produit pour une commercialisation.',
    styles['BodyJustify']
))

story.append(Spacer(1, 20))

# Roadmap summary table
roadmap_data = [
    [Paragraph('<b>Phase</b>', styles['TableHeader']),
     Paragraph('<b>Durée</b>', styles['TableHeader']),
     Paragraph('<b>Objectifs</b>', styles['TableHeader']),
     Paragraph('<b>Livrables</b>', styles['TableHeader'])],
    [Paragraph('1. Stabilisation', styles['TableCell']),
     Paragraph('1 mois', styles['TableCell']),
     Paragraph('Corrections critiques', styles['TableCell']),
     Paragraph('API complète, DB migrée', styles['TableCell'])],
    [Paragraph('2. Qualité', styles['TableCell']),
     Paragraph('1 mois', styles['TableCell']),
     Paragraph('Tests, documentation', styles['TableCell']),
     Paragraph('60% coverage, Swagger', styles['TableCell'])],
    [Paragraph('3. Fonctionnalités', styles['TableCell']),
     Paragraph('2 mois', styles['TableCell']),
     Paragraph('Mobile Money, rapports', styles['TableCell']),
     Paragraph('Intégrations, analytics', styles['TableCell'])],
    [Paragraph('4. Excellence', styles['TableCell']),
     Paragraph('2 mois', styles['TableCell']),
     Paragraph('PWA, UX, perf', styles['TableCell']),
     Paragraph('Produit commercialisable', styles['TableCell'])],
]

roadmap_table = Table(roadmap_data, colWidths=[100, 70, 130, 140])
roadmap_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), TABLE_HEADER_COLOR),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('BACKGROUND', (0, 1), (-1, -1), colors.white),
    ('BACKGROUND', (0, 2), (-1, 2), TABLE_ROW_ODD),
    ('BACKGROUND', (0, 4), (-1, 4), TABLE_ROW_ODD),
    ('GRID', (0, 0), (-1, -1), 0.5, TEXT_MUTED),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('LEFTPADDING', (0, 0), (-1, -1), 8),
    ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ('TOPPADDING', (0, 0), (-1, -1), 6),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
]))
story.append(roadmap_table)
story.append(Paragraph('Tableau 8 : Résumé de la roadmap d\'évolution', styles['Caption']))

story.append(PageBreak())

# ============================================================================
# CONCLUSION
# ============================================================================
story.append(Paragraph('CONCLUSION', styles['H1']))

story.append(Paragraph(
    'GuinéaManager ERP présente une architecture solide et une couverture fonctionnelle remarquable pour '
    'un système de gestion d\'entreprise. Les points forts identifiés - architecture moderne, couverture '
    'complète, focus marché local, et UX professionnelle - constituent des fondations solides pour le '
    'développement futur. Cependant, l\'audit a révélé plusieurs problèmes critiques nécessitant une '
    'attention immédiate : méthodes API manquantes, erreur de syntaxe Prisma, migration non appliquée, '
    'et intégration SMS gateway incomplète.',
    styles['BodyJustify']
))

story.append(Paragraph(
    'Les recommandations prioritaires sont les suivantes : corriger immédiatement l\'API client pour '
    'rétablir la fonctionnalité des pages settings, CRM, et devises ; appliquer la migration Prisma '
    'après correction de l\'erreur de syntaxe ; intégrer un SMS gateway pour activer le 2FA par SMS ; '
    'et nettoyer le code de production (console.log, mocks, types any). La roadmap proposée permet de '
    'planifier ces corrections tout en continuant le développement de nouvelles fonctionnalités.',
    styles['BodyJustify']
))

story.append(Paragraph(
    'Avec un effort estimé de 6 mois suivant la roadmap proposée, GuinéaManager ERP peut atteindre un '
    'niveau de qualité et de fonctionnalités adapté à une commercialisation sur le marché ouest-africain. '
    'La priorisation des corrections et l\'approche incrémentale permettent de livrer de la valeur à '
    'chaque phase tout en améliorant continuellement la qualité du produit.',
    styles['BodyJustify']
))

# Build PDF
doc.build(story)
print(f"PDF généré: {output_path}")
