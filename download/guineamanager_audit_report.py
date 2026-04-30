#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
GuinéaManager ERP - Rapport d'Audit Complet
Généré automatiquement par Z.ai
"""

from reportlab.lib.pagesizes import A4
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, 
    PageBreak, Image
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from reportlab.lib import colors
from reportlab.lib.units import cm, inch
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily
import os

# Enregistrement des polices
pdfmetrics.registerFont(TTFont('SimHei', '/usr/share/fonts/truetype/chinese/SimHei.ttf'))
pdfmetrics.registerFont(TTFont('Microsoft YaHei', '/usr/share/fonts/truetype/chinese/msyh.ttf'))
pdfmetrics.registerFont(TTFont('Times New Roman', '/usr/share/fonts/truetype/english/Times-New-Roman.ttf'))
registerFontFamily('Microsoft YaHei', normal='Microsoft YaHei', bold='Microsoft YaHei')
registerFontFamily('SimHei', normal='SimHei', bold='SimHei')
registerFontFamily('Times New Roman', normal='Times New Roman', bold='Times New Roman')

# Configuration du document
doc = SimpleDocTemplate(
    "/home/z/my-project/download/GuineaManager_Audit_Complet.pdf",
    pagesize=A4,
    rightMargin=2*cm,
    leftMargin=2*cm,
    topMargin=2*cm,
    bottomMargin=2*cm,
    title="GuinéaManager ERP - Rapport d'Audit Complet",
    author="Z.ai",
    creator="Z.ai",
    subject="Audit complet des boutons, menus, pages et règles métier"
)

# Styles
styles = getSampleStyleSheet()

# Styles personnalisés
cover_title = ParagraphStyle(
    'CoverTitle',
    parent=styles['Title'],
    fontName='Microsoft YaHei',
    fontSize=32,
    leading=40,
    alignment=TA_CENTER,
    textColor=colors.HexColor('#1F4E79'),
    spaceAfter=20
)

cover_subtitle = ParagraphStyle(
    'CoverSubtitle',
    parent=styles['Normal'],
    fontName='SimHei',
    fontSize=16,
    leading=24,
    alignment=TA_CENTER,
    textColor=colors.HexColor('#666666'),
    spaceAfter=10
)

h1_style = ParagraphStyle(
    'H1Style',
    parent=styles['Heading1'],
    fontName='Microsoft YaHei',
    fontSize=20,
    leading=28,
    textColor=colors.HexColor('#1F4E79'),
    spaceBefore=24,
    spaceAfter=12
)

h2_style = ParagraphStyle(
    'H2Style',
    parent=styles['Heading2'],
    fontName='Microsoft YaHei',
    fontSize=16,
    leading=22,
    textColor=colors.HexColor('#2E75B6'),
    spaceBefore=18,
    spaceAfter=8
)

h3_style = ParagraphStyle(
    'H3Style',
    parent=styles['Heading3'],
    fontName='SimHei',
    fontSize=14,
    leading=18,
    textColor=colors.HexColor('#333333'),
    spaceBefore=12,
    spaceAfter=6
)

body_style = ParagraphStyle(
    'BodyStyle',
    parent=styles['Normal'],
    fontName='SimHei',
    fontSize=11,
    leading=16,
    alignment=TA_LEFT,
    wordWrap='CJK',
    spaceAfter=8
)

header_style = ParagraphStyle(
    'TableHeader',
    fontName='Microsoft YaHei',
    fontSize=10,
    textColor=colors.white,
    alignment=TA_CENTER,
)

cell_style = ParagraphStyle(
    'TableCell',
    fontName='SimHei',
    fontSize=9,
    leading=12,
    alignment=TA_CENTER,
    wordWrap='CJK',
)

cell_left = ParagraphStyle(
    'TableCellLeft',
    fontName='SimHei',
    fontSize=9,
    leading=12,
    alignment=TA_LEFT,
    wordWrap='CJK',
)

# Construction du document
story = []

# ==================== PAGE DE COUVERTURE ====================
story.append(Spacer(1, 3*cm))
story.append(Paragraph("GuinéaManager ERP", cover_title))
story.append(Spacer(1, 0.5*cm))
story.append(Paragraph("Rapport d'Audit Complet", cover_subtitle))
story.append(Spacer(1, 0.5*cm))
story.append(Paragraph("État des lieux - Boutons, Menus, Pages et Règles Métier", cover_subtitle))
story.append(Spacer(1, 2*cm))

# Informations du projet
info_style = ParagraphStyle(
    'InfoStyle',
    parent=styles['Normal'],
    fontName='SimHei',
    fontSize=12,
    leading=18,
    alignment=TA_CENTER,
    textColor=colors.HexColor('#444444')
)
story.append(Paragraph("Version: 1.0.0", info_style))
story.append(Paragraph("Date: 28 Mars 2026", info_style))
story.append(Paragraph("Technologies: Next.js 16.2.1 | Express.js | Prisma | SQLite", info_style))
story.append(Spacer(1, 2*cm))

# Statut global
status_data = [
    [Paragraph('<b>Composant</b>', header_style), Paragraph('<b>Statut</b>', header_style), Paragraph('<b>Remarques</b>', header_style)],
    [Paragraph('Pages Frontend', cell_style), Paragraph('✓ Fonctionnel', cell_style), Paragraph('16 pages disponibles', cell_left)],
    [Paragraph('Routes API Backend', cell_style), Paragraph('✓ Fonctionnel', cell_style), Paragraph('25+ endpoints REST', cell_left)],
    [Paragraph('Authentification', cell_style), Paragraph('✓ Fonctionnel', cell_style), Paragraph('JWT + Demo user', cell_left)],
    [Paragraph('Navigation', cell_style), Paragraph('✓ Fonctionnel', cell_style), Paragraph('Sidebar + Header', cell_left)],
    [Paragraph('Base de données', cell_style), Paragraph('✓ Fonctionnel', cell_style), Paragraph('Prisma + SQLite + Seed', cell_left)],
    [Paragraph('Configuration Docker', cell_style), Paragraph('⚠ À vérifier', cell_style), Paragraph('Proxy API à tester', cell_left)],
]

status_table = Table(status_data, colWidths=[4*cm, 3*cm, 8*cm])
status_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1F4E79')),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('BACKGROUND', (0, 1), (-1, 1), colors.white),
    ('BACKGROUND', (0, 2), (-1, 2), colors.HexColor('#F5F5F5')),
    ('BACKGROUND', (0, 3), (-1, 3), colors.white),
    ('BACKGROUND', (0, 4), (-1, 4), colors.HexColor('#F5F5F5')),
    ('BACKGROUND', (0, 5), (-1, 5), colors.white),
    ('BACKGROUND', (0, 6), (-1, 6), colors.HexColor('#F5F5F5')),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('LEFTPADDING', (0, 0), (-1, -1), 8),
    ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ('TOPPADDING', (0, 0), (-1, -1), 6),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
]))
story.append(status_table)

story.append(PageBreak())

# ==================== TABLE DES MATIÈRES ====================
story.append(Paragraph("Table des Matières", h1_style))
story.append(Spacer(1, 0.5*cm))

toc_items = [
    ("1. Architecture du Projet", ""),
    ("2. Audit des Pages Frontend", ""),
    ("   2.1 Pages d'Authentification", ""),
    ("   2.2 Pages de Gestion", ""),
    ("   2.3 Pages de Paramètres", ""),
    ("3. Audit des Boutons", ""),
    ("   3.1 Boutons d'Action Principaux", ""),
    ("   3.2 Boutons de Formulaire", ""),
    ("   3.3 Boutons de Navigation", ""),
    ("4. Audit des Menus", ""),
    ("   4.1 Sidebar Navigation", ""),
    ("   4.2 Header Actions", ""),
    ("   4.3 Command Palette", ""),
    ("5. Règles Métier et Permissions", ""),
    ("   5.1 Système de Rôles", ""),
    ("   5.2 Middleware d'Authentification", ""),
    ("   5.3 Configuration Multi-Pays", ""),
    ("6. Recommandations", ""),
    ("7. Conclusion", ""),
]

for item, _ in toc_items:
    story.append(Paragraph(item, body_style))
story.append(Spacer(1, 0.5*cm))

story.append(PageBreak())

# ==================== 1. ARCHITECTURE ====================
story.append(Paragraph("1. Architecture du Projet", h1_style))

story.append(Paragraph("1.1 Vue d'ensemble", h2_style))
story.append(Paragraph(
    "GuinéaManager ERP est une application web moderne de type SaaS (Software as a Service) conçue pour les PME "
    "guinéennes et ouest-africaines. L'application adopte une architecture client-serveur avec une séparation "
    "claire entre le frontend (Next.js) et le backend (Express.js). Cette architecture permet une grande flexibilité "
    "de déploiement, notamment via Docker où le frontend et le backend peuvent être conteneurisés séparément.",
    body_style
))

story.append(Paragraph("1.2 Stack Technique", h2_style))

tech_data = [
    [Paragraph('<b>Couche</b>', header_style), Paragraph('<b>Technologie</b>', header_style), Paragraph('<b>Version</b>', header_style), Paragraph('<b>Description</b>', header_style)],
    [Paragraph('Frontend', cell_style), Paragraph('Next.js', cell_style), Paragraph('16.2.1', cell_style), Paragraph('Framework React avec Turbopack', cell_left)],
    [Paragraph('Backend', cell_style), Paragraph('Express.js', cell_style), Paragraph('4.x', cell_style), Paragraph('API REST Node.js', cell_left)],
    [Paragraph('ORM', cell_style), Paragraph('Prisma', cell_style), Paragraph('5.x', cell_style), Paragraph('ORM TypeScript pour bases de données', cell_left)],
    [Paragraph('Database', cell_style), Paragraph('SQLite', cell_style), Paragraph('3.x', cell_style), Paragraph('Base légère pour dev/demo', cell_left)],
    [Paragraph('UI', cell_style), Paragraph('shadcn/ui', cell_style), Paragraph('latest', cell_style), Paragraph('Composants Radix + Tailwind', cell_left)],
    [Paragraph('State', cell_style), Paragraph('Zustand', cell_style), Paragraph('4.x', cell_style), Paragraph('Gestion d\'état légère', cell_left)],
    [Paragraph('Auth', cell_style), Paragraph('JWT', cell_style), Paragraph('jsonwebtoken', cell_style), Paragraph('Authentification stateless', cell_left)],
    [Paragraph('Déploiement', cell_style), Paragraph('Docker', cell_style), Paragraph('multi-stage', cell_style), Paragraph('Conteneurisation', cell_left)],
]

tech_table = Table(tech_data, colWidths=[2.5*cm, 2.5*cm, 2.5*cm, 7.5*cm])
tech_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1F4E79')),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('BACKGROUND', (0, 1), (-1, 1), colors.white),
    ('BACKGROUND', (0, 2), (-1, 2), colors.HexColor('#F5F5F5')),
    ('BACKGROUND', (0, 3), (-1, 3), colors.white),
    ('BACKGROUND', (0, 4), (-1, 4), colors.HexColor('#F5F5F5')),
    ('BACKGROUND', (0, 5), (-1, 5), colors.white),
    ('BACKGROUND', (0, 6), (-1, 6), colors.HexColor('#F5F5F5')),
    ('BACKGROUND', (0, 7), (-1, 7), colors.white),
    ('BACKGROUND', (0, 8), (-1, 8), colors.HexColor('#F5F5F5')),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('LEFTPADDING', (0, 0), (-1, -1), 6),
    ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ('TOPPADDING', (0, 0), (-1, -1), 5),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
]))
story.append(tech_table)
story.append(Spacer(1, 0.5*cm))

story.append(Paragraph("1.3 Flux de Communication", h2_style))
story.append(Paragraph(
    "L'application utilise un pattern de proxy API pour la communication frontend-backend. Le frontend Next.js "
    "expose une route API dynamique (/api/[...path]) qui sert de proxy vers le backend Express. Cette architecture "
    "présente plusieurs avantages : elle évite les problèmes de CORS, permet un déploiement simplifié via Docker, "
    "et offre une couche d'abstraction pour les futures modifications d'architecture. Le proxy utilise une variable "
    "d'environnement BACKEND_URL (défaut: localhost:3001) pour déterminer l'adresse du backend.",
    body_style
))

story.append(PageBreak())

# ==================== 2. AUDIT DES PAGES ====================
story.append(Paragraph("2. Audit des Pages Frontend", h1_style))

story.append(Paragraph("2.1 Pages d'Authentification", h2_style))
story.append(Paragraph(
    "Le système d'authentification comprend deux pages principales : la page de connexion (login-page.tsx) et "
    "la page d'inscription (register-page.tsx). Ces pages sont affichées conditionnellement selon l'état "
    "d'authentification de l'utilisateur, géré par le store Zustand (auth-store.ts).",
    body_style
))

# Tableau des pages d'auth
auth_pages = [
    [Paragraph('<b>Page</b>', header_style), Paragraph('<b>Fichier</b>', header_style), Paragraph('<b>Boutons</b>', header_style), Paragraph('<b>Fonctionnalités</b>', header_style)],
    [Paragraph('Connexion', cell_style), Paragraph('login-page.tsx', cell_style), Paragraph('1 principal', cell_style), Paragraph('Soumission du formulaire, afficher/masquer mot de passe, lien inscription', cell_left)],
    [Paragraph('Inscription', cell_style), Paragraph('register-page.tsx', cell_style), Paragraph('1 principal', cell_style), Paragraph('Création compte + entreprise, sélection pays, redirection login', cell_left)],
]

auth_table = Table(auth_pages, colWidths=[2.5*cm, 3*cm, 2.5*cm, 7*cm])
auth_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1F4E79')),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('BACKGROUND', (0, 1), (-1, 1), colors.white),
    ('BACKGROUND', (0, 2), (-1, 2), colors.HexColor('#F5F5F5')),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('LEFTPADDING', (0, 0), (-1, -1), 6),
    ('RIGHTPADDING', (0, 0), (-1, -1), 6),
]))
story.append(auth_table)
story.append(Spacer(1, 0.5*cm))

story.append(Paragraph("2.2 Pages de Gestion", h2_style))
story.append(Paragraph(
    "L'application dispose de 14 pages de gestion métier, chacune correspondant à un module fonctionnel spécifique. "
    "Ces pages partagent une architecture commune avec une barre d'actions (recherche, filtres, bouton création), "
    "un tableau de données, et des dialogues modaux pour les opérations CRUD.",
    body_style
))

# Tableau des pages de gestion
gestion_pages = [
    [Paragraph('<b>Page</b>', header_style), Paragraph('<b>Module</b>', header_style), Paragraph('<b>Boutons Principaux</b>', header_style)],
    [Paragraph('Dashboard', cell_style), Paragraph('Tableau de bord', cell_style), Paragraph('Navigation, actualisation', cell_left)],
    [Paragraph('Clients', cell_style), Paragraph('CRM', cell_style), Paragraph('Nouveau client, Modifier, Supprimer', cell_left)],
    [Paragraph('Produits', cell_style), Paragraph('Catalogue', cell_style), Paragraph('Nouveau produit, Modifier, Supprimer', cell_left)],
    [Paragraph('Factures', cell_style), Paragraph('Facturation', cell_style), Paragraph('Nouvelle facture, Voir, Modifier, Supprimer', cell_left)],
    [Paragraph('Devis', cell_style), Paragraph('Commercial', cell_style), Paragraph('Nouveau devis, Convertir en facture', cell_left)],
    [Paragraph('Commandes', cell_style), Paragraph('Ventes', cell_style), Paragraph('Nouvelle commande, Suivi statut', cell_left)],
    [Paragraph('Stock', cell_style), Paragraph('Inventaire', cell_style), Paragraph('Alertes, Transferts, Inventaire', cell_left)],
    [Paragraph('Fournisseurs', cell_style), Paragraph('Achats', cell_style), Paragraph('Nouveau fournisseur, Commandes', cell_left)],
    [Paragraph('CRM', cell_style), Paragraph('Prospects', cell_style), Paragraph('Nouveau prospect, Pipeline', cell_left)],
    [Paragraph('Employés', cell_style), Paragraph('RH', cell_style), Paragraph('Nouvel employé, Modifier, Supprimer', cell_left)],
    [Paragraph('Paie', cell_style), Paragraph('Paye', cell_style), Paragraph('Nouveau bulletin, Valider, Payer', cell_left)],
    [Paragraph('Dépenses', cell_style), Paragraph('Comptabilité', cell_style), Paragraph('Nouvelle dépense, Catégories', cell_left)],
    [Paragraph('Comptabilité', cell_style), Paragraph('OHADA', cell_style), Paragraph('Plan comptable, Écritures', cell_left)],
    [Paragraph('Devises', cell_style), Paragraph('Multi-devises', cell_style), Paragraph('Taux de change, Conversion', cell_left)],
    [Paragraph('Rapports', cell_style), Paragraph('Analytics', cell_style), Paragraph('Générer, Exporter PDF/Excel', cell_left)],
]

gestion_table = Table(gestion_pages, colWidths=[3*cm, 3*cm, 9*cm])
gestion_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1F4E79')),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('BACKGROUND', (0, 1), (-1, 1), colors.white),
    ('BACKGROUND', (0, 2), (-1, 2), colors.HexColor('#F5F5F5')),
    ('BACKGROUND', (0, 3), (-1, 3), colors.white),
    ('BACKGROUND', (0, 4), (-1, 4), colors.HexColor('#F5F5F5')),
    ('BACKGROUND', (0, 5), (-1, 5), colors.white),
    ('BACKGROUND', (0, 6), (-1, 6), colors.HexColor('#F5F5F5')),
    ('BACKGROUND', (0, 7), (-1, 7), colors.white),
    ('BACKGROUND', (0, 8), (-1, 8), colors.HexColor('#F5F5F5')),
    ('BACKGROUND', (0, 9), (-1, 9), colors.white),
    ('BACKGROUND', (0, 10), (-1, 10), colors.HexColor('#F5F5F5')),
    ('BACKGROUND', (0, 11), (-1, 11), colors.white),
    ('BACKGROUND', (0, 12), (-1, 12), colors.HexColor('#F5F5F5')),
    ('BACKGROUND', (0, 13), (-1, 13), colors.white),
    ('BACKGROUND', (0, 14), (-1, 14), colors.HexColor('#F5F5F5')),
    ('BACKGROUND', (0, 15), (-1, 15), colors.white),
    ('BACKGROUND', (0, 16), (-1, 16), colors.HexColor('#F5F5F5')),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('LEFTPADDING', (0, 0), (-1, -1), 6),
    ('RIGHTPADDING', (0, 0), (-1, -1), 6),
]))
story.append(gestion_table)
story.append(Spacer(1, 0.5*cm))

story.append(PageBreak())

# ==================== 3. AUDIT DES BOUTONS ====================
story.append(Paragraph("3. Audit des Boutons", h1_style))

story.append(Paragraph("3.1 Boutons d'Action Principaux", h2_style))
story.append(Paragraph(
    "Les boutons d'action principaux sont identifiables par leur style distinctif : fond dégradé emerauld "
    "(bg-gradient-to-r from-emerald-600 to-emerald-500) avec une ombre portée (shadow-lg shadow-emerald-500/25). "
    "Ces boutons déclenchent les actions CRUD principales : création de nouvelles entités, validation de formulaires, "
    "et actions critiques. Ils sont généralement accompagnés d'une icône (Plus, Save, Check) pour améliorer "
    "l'expérience utilisateur.",
    body_style
))

story.append(Paragraph("3.2 Boutons de Formulaire", h2_style))
story.append(Paragraph(
    "Les formulaires utilisent généralement deux boutons en bas du dialogue : un bouton d'annulation (variant='outline') "
    "et un bouton de confirmation (couleur emerauld). Cette convention est respectée de manière cohérente à travers "
    "toutes les pages de l'application, offrant une expérience utilisateur prévisible.",
    body_style
))

story.append(Paragraph("3.3 Boutons de Navigation", h2_style))
story.append(Paragraph(
    "La navigation utilise principalement des boutons avec variant='ghost' ou 'outline' pour un aspect discret. "
    "Le header inclut un bouton d'actions rapides qui ouvre la palette de commande, permettant un accès rapide "
    "à toutes les fonctionnalités de l'application via le raccourci clavier Ctrl+K (ou Cmd+K sur Mac).",
    body_style
))

# Tableau récapitulatif des boutons
boutons_data = [
    [Paragraph('<b>Type</b>', header_style), Paragraph('<b>Style</b>', header_style), Paragraph('<b>Usage</b>', header_style), Paragraph('<b>Exemples</b>', header_style)],
    [Paragraph('Principal', cell_style), Paragraph('Emerald gradient', cell_style), Paragraph('Actions CRUD', cell_style), Paragraph('Nouveau client, Enregistrer, Valider', cell_left)],
    [Paragraph('Secondaire', cell_style), Paragraph('Outline', cell_style), Paragraph('Annulation', cell_style), Paragraph('Annuler, Fermer', cell_left)],
    [Paragraph('Tertiaire', cell_style), Paragraph('Ghost', cell_style), Paragraph('Actions légères', cell_style), Paragraph('Éditer, Voir, Icônes', cell_left)],
    [Paragraph('Destructeur', cell_style), Paragraph('Red/Danger', cell_style), Paragraph('Suppression', cell_style), Paragraph('Supprimer, Annuler commande', cell_left)],
    [Paragraph('Navigation', cell_style), Paragraph('Link style', cell_style), Paragraph('Redirections', cell_style), Paragraph('Créer un compte, Mot de passe oublié', cell_left)],
]

boutons_table = Table(boutons_data, colWidths=[2.5*cm, 3*cm, 3*cm, 6.5*cm])
boutons_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1F4E79')),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('BACKGROUND', (0, 1), (-1, 1), colors.white),
    ('BACKGROUND', (0, 2), (-1, 2), colors.HexColor('#F5F5F5')),
    ('BACKGROUND', (0, 3), (-1, 3), colors.white),
    ('BACKGROUND', (0, 4), (-1, 4), colors.HexColor('#F5F5F5')),
    ('BACKGROUND', (0, 5), (-1, 5), colors.white),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('LEFTPADDING', (0, 0), (-1, -1), 6),
    ('RIGHTPADDING', (0, 0), (-1, -1), 6),
]))
story.append(boutons_table)
story.append(Spacer(1, 0.5*cm))

story.append(PageBreak())

# ==================== 4. AUDIT DES MENUS ====================
story.append(Paragraph("4. Audit des Menus", h1_style))

story.append(Paragraph("4.1 Sidebar Navigation", h2_style))
story.append(Paragraph(
    "La sidebar (sidebar.tsx) constitue le principal élément de navigation de l'application. Elle présente une "
    "liste de 15 éléments de menu organisés de manière thématique. Chaque élément est associé à une icône colorée "
    "distinctive (LayoutDashboard, Users, Package, FileText, etc.) permettant une identification visuelle rapide. "
    "La sidebar supporte deux modes : étendu (w-64) et réduit (w-20), ce dernier n'affichant que les icônes. "
    "Sur mobile, la sidebar se transforme en menu coulissant avec overlay.",
    body_style
))

# Tableau des menus sidebar
sidebar_menus = [
    [Paragraph('<b>ID</b>', header_style), Paragraph('<b>Label</b>', header_style), Paragraph('<b>Icône</b>', header_style), Paragraph('<b>Couleur</b>', header_style)],
    [Paragraph('dashboard', cell_style), Paragraph('Tableau de bord', cell_style), Paragraph('LayoutDashboard', cell_style), Paragraph('emerald-500', cell_style)],
    [Paragraph('clients', cell_style), Paragraph('Clients', cell_style), Paragraph('Users', cell_style), Paragraph('blue-500', cell_style)],
    [Paragraph('produits', cell_style), Paragraph('Produits', cell_style), Paragraph('Package', cell_style), Paragraph('purple-500', cell_style)],
    [Paragraph('factures', cell_style), Paragraph('Factures', cell_style), Paragraph('FileText', cell_style), Paragraph('emerald-500', cell_style)],
    [Paragraph('devis', cell_style), Paragraph('Devis', cell_style), Paragraph('FileText', cell_style), Paragraph('amber-500', cell_style)],
    [Paragraph('commandes', cell_style), Paragraph('Commandes', cell_style), Paragraph('ShoppingCart', cell_style), Paragraph('pink-500', cell_style)],
    [Paragraph('stock', cell_style), Paragraph('Stock', cell_style), Paragraph('Warehouse', cell_style), Paragraph('orange-500', cell_style)],
    [Paragraph('fournisseurs', cell_style), Paragraph('Fournisseurs', cell_style), Paragraph('Truck', cell_style), Paragraph('teal-500', cell_style)],
    [Paragraph('crm', cell_style), Paragraph('CRM', cell_style), Paragraph('Target', cell_style), Paragraph('indigo-500', cell_style)],
    [Paragraph('employes', cell_style), Paragraph('Employés', cell_style), Paragraph('UserCog', cell_style), Paragraph('cyan-500', cell_style)],
    [Paragraph('paie', cell_style), Paragraph('Paie', cell_style), Paragraph('Calculator', cell_style), Paragraph('green-500', cell_style)],
    [Paragraph('depenses', cell_style), Paragraph('Dépenses', cell_style), Paragraph('Receipt', cell_style), Paragraph('red-500', cell_style)],
    [Paragraph('comptabilite', cell_style), Paragraph('Comptabilité OHADA', cell_style), Paragraph('BookOpen', cell_style), Paragraph('violet-500', cell_style)],
    [Paragraph('devises', cell_style), Paragraph('Multi-Devises', cell_style), Paragraph('DollarSign', cell_style), Paragraph('yellow-500', cell_style)],
    [Paragraph('rapports', cell_style), Paragraph('Rapports', cell_style), Paragraph('BarChart3', cell_style), Paragraph('slate-500', cell_style)],
]

sidebar_table = Table(sidebar_menus, colWidths=[3*cm, 4*cm, 3.5*cm, 3.5*cm])
sidebar_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1F4E79')),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('BACKGROUND', (0, 1), (-1, 1), colors.white),
    ('BACKGROUND', (0, 2), (-1, 2), colors.HexColor('#F5F5F5')),
    ('BACKGROUND', (0, 3), (-1, 3), colors.white),
    ('BACKGROUND', (0, 4), (-1, 4), colors.HexColor('#F5F5F5')),
    ('BACKGROUND', (0, 5), (-1, 5), colors.white),
    ('BACKGROUND', (0, 6), (-1, 6), colors.HexColor('#F5F5F5')),
    ('BACKGROUND', (0, 7), (-1, 7), colors.white),
    ('BACKGROUND', (0, 8), (-1, 8), colors.HexColor('#F5F5F5')),
    ('BACKGROUND', (0, 9), (-1, 9), colors.white),
    ('BACKGROUND', (0, 10), (-1, 10), colors.HexColor('#F5F5F5')),
    ('BACKGROUND', (0, 11), (-1, 11), colors.white),
    ('BACKGROUND', (0, 12), (-1, 12), colors.HexColor('#F5F5F5')),
    ('BACKGROUND', (0, 13), (-1, 13), colors.white),
    ('BACKGROUND', (0, 14), (-1, 14), colors.HexColor('#F5F5F5')),
    ('BACKGROUND', (0, 15), (-1, 15), colors.white),
    ('BACKGROUND', (0, 16), (-1, 16), colors.HexColor('#F5F5F5')),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('LEFTPADDING', (0, 0), (-1, -1), 5),
    ('RIGHTPADDING', (0, 0), (-1, -1), 5),
    ('FONTSIZE', (0, 0), (-1, -1), 8),
]))
story.append(sidebar_table)
story.append(Spacer(1, 0.5*cm))

story.append(Paragraph("4.2 Header Actions", h2_style))
story.append(Paragraph(
    "Le header (header.tsx) fournit un accès rapide aux fonctionnalités globales de l'application. Il comprend "
    "un breadcrumb de navigation, un bouton de recherche/recherche rapide (ouvrant la palette de commande), "
    "un bouton d'actions rapides, et une cloche de notifications avec indicateur de notifications non lues. "
    "Le header utilise un style semi-transparent avec effet de flou (bg-white/80 backdrop-blur-md) pour un "
    "effet moderne et élégant.",
    body_style
))

story.append(Paragraph("4.3 Command Palette", h2_style))
story.append(Paragraph(
    "La palette de commande est un dialogue modal accessible via le raccourci Ctrl+K ou le bouton de recherche "
    "dans le header. Elle permet de naviguer rapidement vers n'importe quelle page de l'application via une "
    "recherche fuzzy. Elle affiche également 6 actions rapides (Nouvelle facture, Nouveau client, Nouveau produit, "
    "Nouveau devis, Nouvelle commande, Nouveau prospect) qui redirigent vers les formulaires de création correspondants.",
    body_style
))

story.append(PageBreak())

# ==================== 5. RÈGLES MÉTIER ====================
story.append(Paragraph("5. Règles Métier et Permissions", h1_style))

story.append(Paragraph("5.1 Système de Rôles", h2_style))
story.append(Paragraph(
    "Le système d'autorisation est basé sur 4 rôles principaux : ADMIN (accès complet), MANAGER (gestion des "
    "opérations), COMPTABLE (facturation et paie), et EMPLOYE (consultation limitée). Le middleware requireRole() "
    "permet de restreindre l'accès aux routes selon le rôle de l'utilisateur. Les rôles sont stockés en majuscules "
    "dans la base de données pour assurer la cohérence.",
    body_style
))

# Tableau des rôles
roles_data = [
    [Paragraph('<b>Rôle</b>', header_style), Paragraph('<b>Permissions</b>', header_style), Paragraph('<b>Accès</b>', header_style)],
    [Paragraph('ADMIN', cell_style), Paragraph('Accès complet', cell_style), Paragraph('Toutes les fonctionnalités, gestion utilisateurs, paramètres', cell_left)],
    [Paragraph('MANAGER', cell_style), Paragraph('Gestion opérationnelle', cell_style), Paragraph('CRUD clients, produits, factures, commandes, rapports', cell_left)],
    [Paragraph('COMPTABLE', cell_style), Paragraph('Finance et paie', cell_style), Paragraph('Facturation, paie, dépenses, comptabilité, rapports', cell_left)],
    [Paragraph('EMPLOYE', cell_style), Paragraph('Consultation', cell_style), Paragraph('Lecture seule, profil personnel', cell_left)],
]

roles_table = Table(roles_data, colWidths=[3*cm, 4*cm, 7*cm])
roles_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1F4E79')),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('BACKGROUND', (0, 1), (-1, 1), colors.white),
    ('BACKGROUND', (0, 2), (-1, 2), colors.HexColor('#F5F5F5')),
    ('BACKGROUND', (0, 3), (-1, 3), colors.white),
    ('BACKGROUND', (0, 4), (-1, 4), colors.HexColor('#F5F5F5')),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('LEFTPADDING', (0, 0), (-1, -1), 6),
    ('RIGHTPADDING', (0, 0), (-1, -1), 6),
]))
story.append(roles_table)
story.append(Spacer(1, 0.5*cm))

story.append(Paragraph("5.2 Middleware d'Authentification", h2_style))
story.append(Paragraph(
    "Le middleware d'authentification (auth.middleware.ts) implémente la vérification des tokens JWT pour "
    "chaque requête protégée. Il vérifie la présence du header Authorization au format 'Bearer <token>', "
    "décode et valide le token, puis injecte les informations utilisateur (req.user) pour les handlers "
    "suivants. Un middleware optionalAuth permet également l'authentification optionnelle pour les routes "
    "publiques avec enrichissement conditionnel.",
    body_style
))

story.append(Paragraph("5.3 Configuration Multi-Pays", h2_style))
story.append(Paragraph(
    "L'application supporte 7 pays d'Afrique de l'Ouest avec des configurations fiscales spécifiques. Chaque pays "
    "dispose de taux CNSS (employé/employeur), plafonds de sécurité sociale, barèmes IR et taux TVA adaptés. "
    "La sélection du pays lors de l'inscription détermine automatiquement la devise (GNF pour la Guinée, XOF pour "
    "les pays de la zone CFA) et les paramètres fiscaux par défaut.",
    body_style
))

# Tableau des pays supportés
pays_data = [
    [Paragraph('<b>Pays</b>', header_style), Paragraph('<b>Code</b>', header_style), Paragraph('<b>Devise</b>', header_style), Paragraph('<b>CNSS Emp.</b>', header_style), Paragraph('<b>CNSS Patr.</b>', header_style), Paragraph('<b>TVA</b>', header_style)],
    [Paragraph('Guinée', cell_style), Paragraph('GN', cell_style), Paragraph('GNF', cell_style), Paragraph('5%', cell_style), Paragraph('18%', cell_style), Paragraph('18%', cell_style)],
    [Paragraph('Sénégal', cell_style), Paragraph('SN', cell_style), Paragraph('XOF', cell_style), Paragraph('5.6%', cell_style), Paragraph('20.9%', cell_style), Paragraph('18%', cell_style)],
    [Paragraph('Mali', cell_style), Paragraph('ML', cell_style), Paragraph('XOF', cell_style), Paragraph('5%', cell_style), Paragraph('17%', cell_style), Paragraph('18%', cell_style)],
    [Paragraph('Côte d\'Ivoire', cell_style), Paragraph('CI', cell_style), Paragraph('XOF', cell_style), Paragraph('6.3%', cell_style), Paragraph('11.7%', cell_style), Paragraph('18%', cell_style)],
    [Paragraph('Burkina Faso', cell_style), Paragraph('BF', cell_style), Paragraph('XOF', cell_style), Paragraph('5.5%', cell_style), Paragraph('16%', cell_style), Paragraph('18%', cell_style)],
    [Paragraph('Bénin', cell_style), Paragraph('BJ', cell_style), Paragraph('XOF', cell_style), Paragraph('4%', cell_style), Paragraph('14%', cell_style), Paragraph('18%', cell_style)],
    [Paragraph('Niger', cell_style), Paragraph('NE', cell_style), Paragraph('XOF', cell_style), Paragraph('4%', cell_style), Paragraph('15%', cell_style), Paragraph('18%', cell_style)],
]

pays_table = Table(pays_data, colWidths=[3*cm, 1.5*cm, 1.5*cm, 2.5*cm, 2.5*cm, 1.5*cm])
pays_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1F4E79')),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('BACKGROUND', (0, 1), (-1, 1), colors.white),
    ('BACKGROUND', (0, 2), (-1, 2), colors.HexColor('#F5F5F5')),
    ('BACKGROUND', (0, 3), (-1, 3), colors.white),
    ('BACKGROUND', (0, 4), (-1, 4), colors.HexColor('#F5F5F5')),
    ('BACKGROUND', (0, 5), (-1, 5), colors.white),
    ('BACKGROUND', (0, 6), (-1, 6), colors.HexColor('#F5F5F5')),
    ('BACKGROUND', (0, 7), (-1, 7), colors.white),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('LEFTPADDING', (0, 0), (-1, -1), 5),
    ('RIGHTPADDING', (0, 0), (-1, -1), 5),
]))
story.append(pays_table)
story.append(Spacer(1, 0.5*cm))

story.append(PageBreak())

# ==================== 6. RECOMMANDATIONS ====================
story.append(Paragraph("6. Recommandations", h1_style))

story.append(Paragraph("6.1 Corrections Prioritaires", h2_style))
story.append(Paragraph(
    "Plusieurs points nécessitent une attention immédiate pour assurer le bon fonctionnement de l'application "
    "en production. Premièrement, il est recommandé de vérifier que le proxy API Next.js communique correctement "
    "avec le backend Express, particulièrement dans un environnement Docker où les URLs relatives doivent être "
    "correctement résolues. Deuxièmement, les stores Zustand devraient être initialisés avec les données du "
    "backend au chargement de l'application pour éviter les états vides.",
    body_style
))

story.append(Paragraph("6.2 Améliorations Suggérées", h2_style))
story.append(Paragraph(
    "Pour améliorer l'expérience utilisateur, il serait bénéfique d'implémenter une validation côté client "
    "plus robuste dans les formulaires, avec des messages d'erreur en français. L'ajout de notifications "
    "toast pour les actions CRUD (succès/erreur) améliorerait le feedback utilisateur. Une pagination "
    "côté serveur pour les grandes listes de données optimiserait les performances.",
    body_style
))

story.append(Paragraph("6.3 Sécurité", h2_style))
story.append(Paragraph(
    "En termes de sécurité, il est recommandé d'implémenter une rotation des tokens JWT, d'ajouter une "
    "protection CSRF pour les formulaires, et de logger les tentatives d'authentification échouées. "
    "L'implémentation de 2FA (déjà présente dans le code) devrait être activée pour les comptes administrateurs. "
    "Enfin, un audit de sécurité complet du code est conseillé avant la mise en production.",
    body_style
))

story.append(Paragraph("6.4 Performance", h2_style))
story.append(Paragraph(
    "Pour optimiser les performances, il est recommandé d'implémenter le caching côté serveur avec Redis "
    "pour les données fréquemment accédées, d'ajouter des index sur les colonnes de base de données "
    "utilisées dans les requêtes de recherche, et d'optimiser les images et assets statiques. "
    "L'utilisation de React Query pour la gestion du cache côté client améliorerait également la réactivité.",
    body_style
))

# ==================== 7. CONCLUSION ====================
story.append(Paragraph("7. Conclusion", h1_style))

story.append(Paragraph(
    "Le projet GuinéaManager ERP présente une architecture solide et bien structurée, avec une séparation "
    "claire des responsabilités entre frontend et backend. L'interface utilisateur est moderne, responsive "
    "et cohérente grâce à l'utilisation de shadcn/ui. Le système d'authentification et les permissions "
    "sont correctement implémentés, avec un support multi-pays bien pensé pour le marché ouest-africain.",
    body_style
))

story.append(Paragraph(
    "L'application dispose de toutes les fonctionnalités essentielles d'un ERP moderne : gestion des clients, "
    "produits, factures, employés, paie, et comptabilité. Les 16 pages frontend et les 25+ endpoints API "
    "backend couvrent les besoins métier d'une PME typique. La configuration Docker permet un déploiement "
    "simplifié et reproductible.",
    body_style
))

story.append(Paragraph(
    "Les recommandations formulées dans ce rapport visent à améliorer la robustesse, la sécurité et les "
    "performances de l'application. Avec les corrections prioritaires appliquées, GuinéaManager ERP "
    "est prêt pour une phase de tests utilisateurs et, après validation, pour une mise en production.",
    body_style
))

# Construction du document
doc.build(story)

print("✓ Rapport d'audit généré: /home/z/my-project/download/GuineaManager_Audit_Complet.pdf")
