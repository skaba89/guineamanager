from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from reportlab.lib.units import cm, mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily
import os

# Register fonts
pdfmetrics.registerFont(TTFont('Times New Roman', '/usr/share/fonts/truetype/english/Times-New-Roman.ttf'))
pdfmetrics.registerFont(TTFont('SimHei', '/usr/share/fonts/truetype/chinese/SimHei.ttf'))
registerFontFamily('Times New Roman', normal='Times New Roman', bold='Times New Roman')
registerFontFamily('SimHei', normal='SimHei', bold='SimHei')

# Colors
TABLE_HEADER_COLOR = colors.HexColor('#1F4E79')
TABLE_ROW_ODD = colors.HexColor('#F5F5F5')
TABLE_ROW_EVEN = colors.white

# Document
pdf_filename = "/home/z/my-project/download/guineamanager_audit_complet.pdf"
doc = SimpleDocTemplate(
    pdf_filename,
    pagesize=A4,
    title="GuinéaManager ERP - Audit Complet",
    author='Z.ai',
    creator='Z.ai',
    subject='Audit complet du projet GuinéaManager ERP'
)

# Styles
styles = getSampleStyleSheet()

cover_title = ParagraphStyle(
    name='CoverTitle',
    fontName='Times New Roman',
    fontSize=36,
    leading=44,
    alignment=TA_CENTER,
    spaceAfter=36
)

cover_subtitle = ParagraphStyle(
    name='CoverSubtitle',
    fontName='Times New Roman',
    fontSize=18,
    leading=24,
    alignment=TA_CENTER,
    spaceAfter=24
)

h1_style = ParagraphStyle(
    name='H1Style',
    fontName='Times New Roman',
    fontSize=20,
    leading=28,
    alignment=TA_LEFT,
    spaceBefore=18,
    spaceAfter=12,
    textColor=colors.HexColor('#1F4E79')
)

h2_style = ParagraphStyle(
    name='H2Style',
    fontName='Times New Roman',
    fontSize=16,
    leading=22,
    alignment=TA_LEFT,
    spaceBefore=12,
    spaceAfter=8,
    textColor=colors.HexColor('#2E75B6')
)

h3_style = ParagraphStyle(
    name='H3Style',
    fontName='Times New Roman',
    fontSize=13,
    leading=18,
    alignment=TA_LEFT,
    spaceBefore=8,
    spaceAfter=6,
    textColor=colors.HexColor('#404040')
)

body_style = ParagraphStyle(
    name='BodyStyle',
    fontName='Times New Roman',
    fontSize=11,
    leading=16,
    alignment=TA_JUSTIFY,
    spaceAfter=8
)

# Table styles
header_style = ParagraphStyle(
    name='TableHeader',
    fontName='Times New Roman',
    fontSize=10,
    textColor=colors.white,
    alignment=TA_CENTER
)

cell_style = ParagraphStyle(
    name='TableCell',
    fontName='Times New Roman',
    fontSize=9,
    textColor=colors.black,
    alignment=TA_CENTER
)

cell_left = ParagraphStyle(
    name='TableCellLeft',
    fontName='Times New Roman',
    fontSize=9,
    textColor=colors.black,
    alignment=TA_LEFT
)

story = []

# ============== COVER PAGE ==============
story.append(Spacer(1, 120))
story.append(Paragraph("<b>GuinéaManager ERP</b>", cover_title))
story.append(Spacer(1, 24))
story.append(Paragraph("Audit Complet du Projet", cover_subtitle))
story.append(Spacer(1, 48))
story.append(Paragraph("État des Lieux | Boutons | Menus | Pages | Règles Métier", cover_subtitle))
story.append(Spacer(1, 120))
story.append(Paragraph("Version: 1.0", cover_subtitle))
story.append(Paragraph("Date: Mars 2026", cover_subtitle))
story.append(Paragraph("Auteur: Z.ai", cover_subtitle))
story.append(PageBreak())

# ============== TABLE OF CONTENTS ==============
story.append(Paragraph("<b>Table des Matières</b>", h1_style))
story.append(Spacer(1, 12))

toc_items = [
    ("1. Résumé Exécutif", "3"),
    ("2. Architecture du Projet", "4"),
    ("3. Audit des Pages Frontend", "5"),
    ("4. Audit des Menus et Navigation", "7"),
    ("5. Audit des Boutons et Interactions", "9"),
    ("6. Audit des Endpoints API Backend", "11"),
    ("7. Règles Métier et Permissions", "15"),
    ("8. Modèles de Base de Données", "18"),
    ("9. Statistiques Globales", "20"),
    ("10. Recommandations", "21"),
]

for title, page in toc_items:
    story.append(Paragraph(f"{title} {'.'*60} {page}", body_style))

story.append(PageBreak())

# ============== 1. RÉSUMÉ EXÉCUTIF ==============
story.append(Paragraph("<b>1. Résumé Exécutif</b>", h1_style))
story.append(Spacer(1, 12))

story.append(Paragraph(
    "GuinéaManager ERP est un système ERP SaaS multi-tenant conçu pour les PME d'Afrique de l'Ouest. "
    "L'application est construite avec une architecture moderne utilisant Next.js 16 pour le frontend "
    "et Express.js pour le backend, avec Prisma ORM et SQLite pour la persistance des données. "
    "Le projet supporte 7 pays africains (Guinée, Sénégal, Mali, Côte d'Ivoire, Burkina Faso, Bénin, Niger) "
    "avec des configurations fiscales spécifiques pour chaque pays, incluant les calculs CNSS et IPR.",
    body_style
))
story.append(Spacer(1, 8))

# Key metrics table
metrics_data = [
    [Paragraph('<b>Métrique</b>', header_style), Paragraph('<b>Valeur</b>', header_style)],
    [Paragraph('Pages Frontend', cell_style), Paragraph('19 composants', cell_style)],
    [Paragraph('Endpoints API', cell_style), Paragraph('130+ endpoints', cell_style)],
    [Paragraph('Modèles DB', cell_style), Paragraph('40+ modèles', cell_style)],
    [Paragraph('Composants UI', cell_style), Paragraph('54 composants shadcn/ui', cell_style)],
    [Paragraph('Gestionnaires onClick', cell_style), Paragraph('~175 handlers', cell_style)],
    [Paragraph('Pays Supportés', cell_style), Paragraph('7 pays', cell_style)],
    [Paragraph('Devises', cell_style), Paragraph('GNF, XOF, EUR, USD', cell_style)],
]

metrics_table = Table(metrics_data, colWidths=[8*cm, 6*cm])
metrics_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), TABLE_HEADER_COLOR),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('BACKGROUND', (0, 1), (-1, 1), TABLE_ROW_EVEN),
    ('BACKGROUND', (0, 2), (-1, 2), TABLE_ROW_ODD),
    ('BACKGROUND', (0, 3), (-1, 3), TABLE_ROW_EVEN),
    ('BACKGROUND', (0, 4), (-1, 4), TABLE_ROW_ODD),
    ('BACKGROUND', (0, 5), (-1, 5), TABLE_ROW_EVEN),
    ('BACKGROUND', (0, 6), (-1, 6), TABLE_ROW_ODD),
    ('BACKGROUND', (0, 7), (-1, 7), TABLE_ROW_EVEN),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('LEFTPADDING', (0, 0), (-1, -1), 8),
    ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ('TOPPADDING', (0, 0), (-1, -1), 6),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
]))
story.append(metrics_table)
story.append(Spacer(1, 18))

# ============== 2. ARCHITECTURE ==============
story.append(Paragraph("<b>2. Architecture du Projet</b>", h1_style))
story.append(Spacer(1, 12))

story.append(Paragraph("<b>2.1 Stack Technique</b>", h2_style))

stack_data = [
    [Paragraph('<b>Couche</b>', header_style), Paragraph('<b>Technologie</b>', header_style), Paragraph('<b>Version</b>', header_style)],
    [Paragraph('Frontend', cell_style), Paragraph('Next.js + React', cell_style), Paragraph('16.2.1', cell_style)],
    [Paragraph('Backend', cell_style), Paragraph('Express.js + TypeScript', cell_style), Paragraph('4.x', cell_style)],
    [Paragraph('Database', cell_style), Paragraph('SQLite + Prisma ORM', cell_style), Paragraph('5.x', cell_style)],
    [Paragraph('UI Library', cell_style), Paragraph('shadcn/ui + Tailwind CSS', cell_style), Paragraph('4.x', cell_style)],
    [Paragraph('State', cell_style), Paragraph('Zustand', cell_style), Paragraph('4.x', cell_style)],
    [Paragraph('Auth', cell_style), Paragraph('JWT + bcrypt', cell_style), Paragraph('-', cell_style)],
    [Paragraph('Container', cell_style), Paragraph('Docker + Docker Compose', cell_style), Paragraph('-', cell_style)],
]

stack_table = Table(stack_data, colWidths=[4*cm, 6*cm, 3*cm])
stack_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), TABLE_HEADER_COLOR),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('BACKGROUND', (0, 1), (-1, -1), TABLE_ROW_EVEN),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('LEFTPADDING', (0, 0), (-1, -1), 8),
    ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ('TOPPADDING', (0, 0), (-1, -1), 6),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
]))
story.append(stack_table)
story.append(Spacer(1, 18))

story.append(Paragraph("<b>2.2 Structure des Répertoires</b>", h2_style))
story.append(Paragraph(
    "Le projet suit une structure moderne avec séparation claire des responsabilités. "
    "Le frontend utilise l'App Router de Next.js avec des composants organisés par fonction. "
    "Le backend suit une architecture en couches avec routes, services et middlewares distincts.",
    body_style
))

# ============== 3. PAGES FRONTEND ==============
story.append(PageBreak())
story.append(Paragraph("<b>3. Audit des Pages Frontend</b>", h1_style))
story.append(Spacer(1, 12))

story.append(Paragraph("<b>3.1 Pages Principales (19 composants)</b>", h2_style))

pages_data = [
    [Paragraph('<b>Page</b>', header_style), Paragraph('<b>Fichier</b>', header_style), Paragraph('<b>Fonctionnalité</b>', header_style)],
    [Paragraph('Dashboard', cell_style), Paragraph('dashboard-page.tsx', cell_style), Paragraph('KPIs, graphiques, alertes stock', cell_left)],
    [Paragraph('Clients', cell_style), Paragraph('clients-page.tsx', cell_style), Paragraph('CRUD clients, recherche, filtres', cell_left)],
    [Paragraph('Produits', cell_style), Paragraph('produits-page.tsx', cell_style), Paragraph('Catalogue, stock, catégories', cell_left)],
    [Paragraph('Factures', cell_style), Paragraph('factures-page.tsx', cell_style), Paragraph('Facturation, TVA, paiements', cell_left)],
    [Paragraph('Devis', cell_style), Paragraph('devis-page.tsx', cell_style), Paragraph('Propositions commerciales', cell_left)],
    [Paragraph('Commandes', cell_style), Paragraph('commandes-page.tsx', cell_style), Paragraph('Suivi des commandes client', cell_left)],
    [Paragraph('Stock', cell_style), Paragraph('stock-page.tsx', cell_style), Paragraph('Gestion inventaire avancée', cell_left)],
    [Paragraph('Entrepôts', cell_style), Paragraph('entrepots-page.tsx', cell_style), Paragraph('Gestion des magasins', cell_left)],
    [Paragraph('Fournisseurs', cell_style), Paragraph('fournisseurs-page.tsx', cell_style), Paragraph('Gestion des fournisseurs', cell_left)],
    [Paragraph('CRM', cell_style), Paragraph('crm-page.tsx', cell_style), Paragraph('Prospects, opportunités', cell_left)],
    [Paragraph('Employés', cell_style), Paragraph('employes-page.tsx', cell_style), Paragraph('RH, contrats, départements', cell_left)],
    [Paragraph('Paie', cell_style), Paragraph('paie-page.tsx', cell_style), Paragraph('Bulletins, CNSS, IPR multi-pays', cell_left)],
    [Paragraph('Dépenses', cell_style), Paragraph('depenses-page.tsx', cell_style), Paragraph('Suivi des dépenses', cell_left)],
    [Paragraph('Comptabilité', cell_style), Paragraph('comptabilite-page.tsx', cell_style), Paragraph('Plan OHADA, écritures', cell_left)],
    [Paragraph('Devises', cell_style), Paragraph('devises-page.tsx', cell_style), Paragraph('Taux de change, conversion', cell_left)],
    [Paragraph('Rapports', cell_style), Paragraph('rapports-page.tsx', cell_style), Paragraph('Analyses et statistiques', cell_left)],
    [Paragraph('Paramètres', cell_style), Paragraph('settings-page.tsx', cell_style), Paragraph('Configuration société, 2FA', cell_left)],
    [Paragraph('Login', cell_style), Paragraph('login-page.tsx', cell_style), Paragraph('Authentification', cell_left)],
    [Paragraph('Inscription', cell_style), Paragraph('register-page.tsx', cell_style), Paragraph('Création compte/société', cell_left)],
]

pages_table = Table(pages_data, colWidths=[3*cm, 4.5*cm, 7*cm])
pages_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), TABLE_HEADER_COLOR),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('BACKGROUND', (0, 1), (-1, 1), TABLE_ROW_EVEN),
    ('BACKGROUND', (0, 2), (-1, 2), TABLE_ROW_ODD),
    ('BACKGROUND', (0, 3), (-1, 3), TABLE_ROW_EVEN),
    ('BACKGROUND', (0, 4), (-1, 4), TABLE_ROW_ODD),
    ('BACKGROUND', (0, 5), (-1, 5), TABLE_ROW_EVEN),
    ('BACKGROUND', (0, 6), (-1, 6), TABLE_ROW_ODD),
    ('BACKGROUND', (0, 7), (-1, 7), TABLE_ROW_EVEN),
    ('BACKGROUND', (0, 8), (-1, 8), TABLE_ROW_ODD),
    ('BACKGROUND', (0, 9), (-1, 9), TABLE_ROW_EVEN),
    ('BACKGROUND', (0, 10), (-1, 10), TABLE_ROW_ODD),
    ('BACKGROUND', (0, 11), (-1, 11), TABLE_ROW_EVEN),
    ('BACKGROUND', (0, 12), (-1, 12), TABLE_ROW_ODD),
    ('BACKGROUND', (0, 13), (-1, 13), TABLE_ROW_EVEN),
    ('BACKGROUND', (0, 14), (-1, 14), TABLE_ROW_ODD),
    ('BACKGROUND', (0, 15), (-1, 15), TABLE_ROW_EVEN),
    ('BACKGROUND', (0, 16), (-1, 16), TABLE_ROW_ODD),
    ('BACKGROUND', (0, 17), (-1, 17), TABLE_ROW_EVEN),
    ('BACKGROUND', (0, 18), (-1, 18), TABLE_ROW_ODD),
    ('BACKGROUND', (0, 19), (-1, 19), TABLE_ROW_EVEN),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('LEFTPADDING', (0, 0), (-1, -1), 6),
    ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ('TOPPADDING', (0, 0), (-1, -1), 4),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
]))
story.append(pages_table)
story.append(Spacer(1, 18))

# ============== 4. MENUS ET NAVIGATION ==============
story.append(PageBreak())
story.append(Paragraph("<b>4. Audit des Menus et Navigation</b>", h1_style))
story.append(Spacer(1, 12))

story.append(Paragraph("<b>4.1 Sidebar - Menu Principal (16 éléments)</b>", h2_style))

menu_data = [
    [Paragraph('<b>Menu</b>', header_style), Paragraph('<b>Icône</b>', header_style), Paragraph('<b>Accès</b>', header_style)],
    [Paragraph('Tableau de bord', cell_style), Paragraph('LayoutDashboard', cell_style), Paragraph('Tous', cell_style)],
    [Paragraph('Clients', cell_style), Paragraph('Users', cell_style), Paragraph('Tous', cell_style)],
    [Paragraph('Produits', cell_style), Paragraph('Package', cell_style), Paragraph('Tous', cell_style)],
    [Paragraph('Factures', cell_style), Paragraph('FileText', cell_style), Paragraph('Tous', cell_style)],
    [Paragraph('Devis', cell_style), Paragraph('FileSpreadsheet', cell_style), Paragraph('Tous', cell_style)],
    [Paragraph('Commandes', cell_style), Paragraph('ShoppingCart', cell_style), Paragraph('Tous', cell_style)],
    [Paragraph('Stock', cell_style), Paragraph('Warehouse', cell_style), Paragraph('Tous', cell_style)],
    [Paragraph('Entrepôts', cell_style), Paragraph('Building2', cell_style), Paragraph('Admin+', cell_style)],
    [Paragraph('Fournisseurs', cell_style), Paragraph('Truck', cell_style), Paragraph('Tous', cell_style)],
    [Paragraph('CRM', cell_style), Paragraph('Contact', cell_style), Paragraph('Tous', cell_style)],
    [Paragraph('Employés', cell_style), Paragraph('UserCog', cell_style), Paragraph('RH+', cell_style)],
    [Paragraph('Paie', cell_style), Paragraph('Wallet', cell_style), Paragraph('Comptable+', cell_style)],
    [Paragraph('Dépenses', cell_style), Paragraph('Receipt', cell_style), Paragraph('Tous', cell_style)],
    [Paragraph('Comptabilité', cell_style), Paragraph('Calculator', cell_style), Paragraph('Comptable+', cell_style)],
    [Paragraph('Rapports', cell_style), Paragraph('BarChart3', cell_style), Paragraph('Tous', cell_style)],
    [Paragraph('Paramètres', cell_style), Paragraph('Settings', cell_style), Paragraph('Admin+', cell_style)],
]

menu_table = Table(menu_data, colWidths=[5*cm, 4*cm, 4*cm])
menu_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), TABLE_HEADER_COLOR),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('BACKGROUND', (0, 1), (-1, -1), TABLE_ROW_EVEN),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('LEFTPADDING', (0, 0), (-1, -1), 8),
    ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ('TOPPADDING', (0, 0), (-1, -1), 5),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
]))
story.append(menu_table)
story.append(Spacer(1, 18))

story.append(Paragraph("<b>4.2 Header - Barre Supérieure</b>", h2_style))
story.append(Paragraph(
    "La barre supérieure contient un palette de commande (raccourci Ctrl+K), un centre de notifications "
    "avec compteur de non-lus, un menu déroulant de profil utilisateur avec options de déconnexion, "
    "et un thème clair/sombre. Les notifications supportent le push web avec VAPID.",
    body_style
))
story.append(Spacer(1, 12))

story.append(Paragraph("<b>4.3 Composants de Navigation UI</b>", h2_style))

nav_components = [
    [Paragraph('<b>Composant</b>', header_style), Paragraph('<b>Fichier</b>', header_style), Paragraph('<b>Usage</b>', header_style)],
    [Paragraph('Sidebar', cell_style), Paragraph('sidebar.tsx', cell_style), Paragraph('Menu principal collapsible', cell_left)],
    [Paragraph('Header', cell_style), Paragraph('header.tsx', cell_style), Paragraph('Barre supérieure', cell_left)],
    [Paragraph('NotificationBell', cell_style), Paragraph('notification-bell.tsx', cell_style), Paragraph('Centre notifications', cell_left)],
    [Paragraph('NavigationMenu', cell_style), Paragraph('navigation-menu.tsx', cell_style), Paragraph('Primitive shadcn', cell_left)],
    [Paragraph('DropdownMenu', cell_style), Paragraph('dropdown-menu.tsx', cell_style), Paragraph('Menus contextuels', cell_left)],
    [Paragraph('Breadcrumb', cell_style), Paragraph('breadcrumb.tsx', cell_style), Paragraph('Fil d\'Ariane', cell_left)],
    [Paragraph('Menubar', cell_style), Paragraph('menubar.tsx', cell_style), Paragraph('Barre de menu', cell_left)],
]

nav_table = Table(nav_components, colWidths=[4*cm, 4.5*cm, 5*cm])
nav_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), TABLE_HEADER_COLOR),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('BACKGROUND', (0, 1), (-1, -1), TABLE_ROW_EVEN),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('LEFTPADDING', (0, 0), (-1, -1), 8),
    ('RIGHTPADDING', (0, 0), (-1, -1), 8),
]))
story.append(nav_table)
story.append(Spacer(1, 18))

# ============== 5. BOUTONS ==============
story.append(PageBreak())
story.append(Paragraph("<b>5. Audit des Boutons et Interactions</b>", h1_style))
story.append(Spacer(1, 12))

story.append(Paragraph("<b>5.1 Distribution des Boutons par Page</b>", h2_style))

buttons_data = [
    [Paragraph('<b>Page</b>', header_style), Paragraph('<b>Boutons</b>', header_style), Paragraph('<b>onClick</b>', header_style)],
    [Paragraph('Fournisseurs', cell_style), Paragraph('11', cell_style), Paragraph('17', cell_style)],
    [Paragraph('CRM', cell_style), Paragraph('14', cell_style), Paragraph('11', cell_style)],
    [Paragraph('Commandes', cell_style), Paragraph('10', cell_style), Paragraph('16', cell_style)],
    [Paragraph('Settings', cell_style), Paragraph('13', cell_style), Paragraph('14', cell_style)],
    [Paragraph('Stock', cell_style), Paragraph('12', cell_style), Paragraph('12', cell_style)],
    [Paragraph('Devis', cell_style), Paragraph('8', cell_style), Paragraph('13', cell_style)],
    [Paragraph('Header', cell_style), Paragraph('4', cell_style), Paragraph('6', cell_style)],
    [Paragraph('Clients', cell_style), Paragraph('9', cell_style), Paragraph('10', cell_style)],
    [Paragraph('Factures', cell_style), Paragraph('8', cell_style), Paragraph('11', cell_style)],
    [Paragraph('Employés', cell_style), Paragraph('7', cell_style), Paragraph('9', cell_style)],
]

buttons_table = Table(buttons_data, colWidths=[5*cm, 4*cm, 4*cm])
buttons_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), TABLE_HEADER_COLOR),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('BACKGROUND', (0, 1), (-1, 1), TABLE_ROW_EVEN),
    ('BACKGROUND', (0, 2), (-1, 2), TABLE_ROW_ODD),
    ('BACKGROUND', (0, 3), (-1, 3), TABLE_ROW_EVEN),
    ('BACKGROUND', (0, 4), (-1, 4), TABLE_ROW_ODD),
    ('BACKGROUND', (0, 5), (-1, 5), TABLE_ROW_EVEN),
    ('BACKGROUND', (0, 6), (-1, 6), TABLE_ROW_ODD),
    ('BACKGROUND', (0, 7), (-1, 7), TABLE_ROW_EVEN),
    ('BACKGROUND', (0, 8), (-1, 8), TABLE_ROW_ODD),
    ('BACKGROUND', (0, 9), (-1, 9), TABLE_ROW_EVEN),
    ('BACKGROUND', (0, 10), (-1, 10), TABLE_ROW_ODD),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('LEFTPADDING', (0, 0), (-1, -1), 8),
    ('RIGHTPADDING', (0, 0), (-1, -1), 8),
]))
story.append(buttons_table)
story.append(Spacer(1, 18))

story.append(Paragraph("<b>5.2 Types de Boutons Utilisés</b>", h2_style))

btn_types = [
    [Paragraph('<b>Type</b>', header_style), Paragraph('<b>Variant</b>', header_style), Paragraph('<b>Usage</b>', header_style)],
    [Paragraph('Button', cell_style), Paragraph('primary', cell_style), Paragraph('Actions principales (Sauvegarder, Créer)', cell_left)],
    [Paragraph('Button', cell_style), Paragraph('secondary', cell_style), Paragraph('Actions secondaires', cell_left)],
    [Paragraph('Button', cell_style), Paragraph('outline', cell_style), Paragraph('Boutons neutres, annuler', cell_left)],
    [Paragraph('Button', cell_style), Paragraph('ghost', cell_style), Paragraph('Boutons discrets, icônes', cell_left)],
    [Paragraph('Button', cell_style), Paragraph('destructive', cell_style), Paragraph('Suppressions, actions critiques', cell_left)],
    [Paragraph('AlertDialogAction', cell_style), Paragraph('-', cell_style), Paragraph('Confirmations critiques', cell_left)],
    [Paragraph('Button (icon)', cell_style), Paragraph('size=icon', cell_style), Paragraph('Boutons icônes (éditer, suppr.)', cell_left)],
]

btn_table = Table(btn_types, colWidths=[4*cm, 3*cm, 6*cm])
btn_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), TABLE_HEADER_COLOR),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('BACKGROUND', (0, 1), (-1, -1), TABLE_ROW_EVEN),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('LEFTPADDING', (0, 0), (-1, -1), 8),
    ('RIGHTPADDING', (0, 0), (-1, -1), 8),
]))
story.append(btn_table)
story.append(Spacer(1, 18))

# ============== 6. ENDPOINTS API ==============
story.append(PageBreak())
story.append(Paragraph("<b>6. Audit des Endpoints API Backend</b>", h1_style))
story.append(Spacer(1, 12))

story.append(Paragraph("<b>6.1 Routes d'Authentification (/api/auth)</b>", h2_style))

auth_routes = [
    [Paragraph('<b>Méthode</b>', header_style), Paragraph('<b>Endpoint</b>', header_style), Paragraph('<b>Description</b>', header_style)],
    [Paragraph('POST', cell_style), Paragraph('/login', cell_style), Paragraph('Connexion utilisateur', cell_left)],
    [Paragraph('POST', cell_style), Paragraph('/register', cell_style), Paragraph('Inscription + création société', cell_left)],
    [Paragraph('GET', cell_style), Paragraph('/me', cell_style), Paragraph('Profil utilisateur actuel', cell_left)],
    [Paragraph('POST', cell_style), Paragraph('/logout', cell_style), Paragraph('Déconnexion', cell_left)],
    [Paragraph('POST', cell_style), Paragraph('/forgot-password', cell_style), Paragraph('Demande reset mot de passe', cell_left)],
    [Paragraph('POST', cell_style), Paragraph('/reset-password', cell_style), Paragraph('Reset avec token', cell_left)],
    [Paragraph('POST', cell_style), Paragraph('/2fa/setup/initiate', cell_style), Paragraph('Initier configuration 2FA', cell_left)],
    [Paragraph('POST', cell_style), Paragraph('/2fa/verify', cell_style), Paragraph('Vérification 2FA login', cell_left)],
]

auth_table = Table(auth_routes, colWidths=[2.5*cm, 4*cm, 6*cm])
auth_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), TABLE_HEADER_COLOR),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('BACKGROUND', (0, 1), (-1, -1), TABLE_ROW_EVEN),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('LEFTPADDING', (0, 0), (-1, -1), 6),
    ('RIGHTPADDING', (0, 0), (-1, -1), 6),
]))
story.append(auth_table)
story.append(Spacer(1, 12))

story.append(Paragraph("<b>6.2 Routes Factures (/api/factures)</b>", h2_style))

facture_routes = [
    [Paragraph('<b>Méthode</b>', header_style), Paragraph('<b>Endpoint</b>', header_style), Paragraph('<b>Middlewares</b>', header_style)],
    [Paragraph('GET', cell_style), Paragraph('/', cell_style), Paragraph('auth', cell_style)],
    [Paragraph('POST', cell_style), Paragraph('/', cell_style), Paragraph('auth, checkInvoiceLimit', cell_style)],
    [Paragraph('GET', cell_style), Paragraph('/:id', cell_style), Paragraph('auth', cell_style)],
    [Paragraph('PUT', cell_style), Paragraph('/:id', cell_style), Paragraph('auth', cell_style)],
    [Paragraph('DELETE', cell_style), Paragraph('/:id', cell_style), Paragraph('auth', cell_style)],
    [Paragraph('POST', cell_style), Paragraph('/:id/envoyer', cell_style), Paragraph('auth', cell_style)],
    [Paragraph('GET', cell_style), Paragraph('/:id/pdf', cell_style), Paragraph('auth, exportRateLimiter', cell_style)],
    [Paragraph('POST', cell_style), Paragraph('/:id/payer', cell_style), Paragraph('auth, paymentRateLimiter', cell_style)],
    [Paragraph('POST', cell_style), Paragraph('/:id/annuler', cell_style), Paragraph('auth', cell_style)],
]

facture_table = Table(facture_routes, colWidths=[2.5*cm, 4*cm, 6*cm])
facture_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), TABLE_HEADER_COLOR),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('BACKGROUND', (0, 1), (-1, -1), TABLE_ROW_EVEN),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('LEFTPADDING', (0, 0), (-1, -1), 6),
    ('RIGHTPADDING', (0, 0), (-1, -1), 6),
]))
story.append(facture_table)
story.append(Spacer(1, 12))

story.append(Paragraph("<b>6.3 Routes Paie (/api/paie)</b>", h2_style))

paie_routes = [
    [Paragraph('<b>Méthode</b>', header_style), Paragraph('<b>Endpoint</b>', header_style), Paragraph('<b>Description</b>', header_style)],
    [Paragraph('GET', cell_style), Paragraph('/config-pays', cell_style), Paragraph('Config fiscale par pays', cell_left)],
    [Paragraph('GET', cell_style), Paragraph('/pays-supportes', cell_style), Paragraph('Liste des 7 pays', cell_left)],
    [Paragraph('GET', cell_style), Paragraph('/bulletins', cell_style), Paragraph('Liste bulletins de paie', cell_left)],
    [Paragraph('POST', cell_style), Paragraph('/calculer', cell_style), Paragraph('Calcul salaire net', cell_left)],
    [Paragraph('POST', cell_style), Paragraph('/bulletins', cell_style), Paragraph('Créer bulletin', cell_left)],
    [Paragraph('PUT', cell_style), Paragraph('/bulletins/:id/valider', cell_style), Paragraph('Valider bulletin', cell_left)],
    [Paragraph('PUT', cell_style), Paragraph('/bulletins/:id/payer', cell_style), Paragraph('Marquer comme payé', cell_left)],
    [Paragraph('GET', cell_style), Paragraph('/masse-salariale', cell_style), Paragraph('Total masse salariale', cell_left)],
]

paie_table = Table(paie_routes, colWidths=[2.5*cm, 4.5*cm, 5.5*cm])
paie_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), TABLE_HEADER_COLOR),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('BACKGROUND', (0, 1), (-1, -1), TABLE_ROW_EVEN),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('LEFTPADDING', (0, 0), (-1, -1), 6),
    ('RIGHTPADDING', (0, 0), (-1, -1), 6),
]))
story.append(paie_table)
story.append(Spacer(1, 12))

story.append(Paragraph("<b>6.4 Routes CRM (/api/crm)</b>", h2_style))

crm_routes = [
    [Paragraph('<b>Méthode</b>', header_style), Paragraph('<b>Endpoint</b>', header_style), Paragraph('<b>Description</b>', header_style)],
    [Paragraph('GET', cell_style), Paragraph('/prospects', cell_style), Paragraph('Liste prospects', cell_left)],
    [Paragraph('POST', cell_style), Paragraph('/prospects', cell_style), Paragraph('Créer prospect', cell_left)],
    [Paragraph('PATCH', cell_style), Paragraph('/prospects/:id/statut', cell_style), Paragraph('Changer statut', cell_left)],
    [Paragraph('POST', cell_style), Paragraph('/prospects/:id/convertir', cell_style), Paragraph('Convertir en client', cell_left)],
    [Paragraph('GET', cell_style), Paragraph('/opportunites', cell_style), Paragraph('Liste opportunités', cell_left)],
    [Paragraph('POST', cell_style), Paragraph('/opportunites/:id/gagner', cell_style), Paragraph('Marquer gagnée', cell_left)],
    [Paragraph('POST', cell_style), Paragraph('/opportunites/:id/perdre', cell_style), Paragraph('Marquer perdue', cell_left)],
]

crm_table = Table(crm_routes, colWidths=[2.5*cm, 5*cm, 5*cm])
crm_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), TABLE_HEADER_COLOR),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('BACKGROUND', (0, 1), (-1, -1), TABLE_ROW_EVEN),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('LEFTPADDING', (0, 0), (-1, -1), 6),
    ('RIGHTPADDING', (0, 0), (-1, -1), 6),
]))
story.append(crm_table)
story.append(Spacer(1, 18))

# ============== 7. RÈGLES MÉTIER ==============
story.append(PageBreak())
story.append(Paragraph("<b>7. Règles Métier et Permissions</b>", h1_style))
story.append(Spacer(1, 12))

story.append(Paragraph("<b>7.1 Rôles Utilisateurs (6 rôles)</b>", h2_style))

roles_data = [
    [Paragraph('<b>Rôle</b>', header_style), Paragraph('<b>Permissions</b>', header_style), Paragraph('<b>Accès</b>', header_style)],
    [Paragraph('OWNER', cell_style), Paragraph('Super admin, gestion abonnements', cell_left), Paragraph('Tout + Admin système', cell_style)],
    [Paragraph('ADMIN', cell_style), Paragraph('Administration société', cell_left), Paragraph('Tout sauf Admin système', cell_style)],
    [Paragraph('MANAGER', cell_style), Paragraph('Gestion operations', cell_left), Paragraph('Opérations + rapports', cell_style)],
    [Paragraph('COMPTABLE', cell_style), Paragraph('Comptabilité, paie', cell_left), Paragraph('Factures, Paie, Compta', cell_style)],
    [Paragraph('RH', cell_style), Paragraph('Ressources humaines', cell_left), Paragraph('Employés, Paie', cell_style)],
    [Paragraph('EMPLOYE', cell_style), Paragraph('Consultation limitée', cell_left), Paragraph('Lecture seule', cell_style)],
]

roles_table = Table(roles_data, colWidths=[3*cm, 5.5*cm, 4*cm])
roles_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), TABLE_HEADER_COLOR),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('BACKGROUND', (0, 1), (-1, -1), TABLE_ROW_EVEN),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('LEFTPADDING', (0, 0), (-1, -1), 8),
    ('RIGHTPADDING', (0, 0), (-1, -1), 8),
]))
story.append(roles_table)
story.append(Spacer(1, 18))

story.append(Paragraph("<b>7.2 Plans d'Abonnement</b>", h2_style))

plans_data = [
    [Paragraph('<b>Plan</b>', header_style), Paragraph('<b>Factures/mois</b>', header_style), Paragraph('<b>Utilisateurs</b>', header_style), Paragraph('<b>Prix</b>', header_style)],
    [Paragraph('PETITE', cell_style), Paragraph('50', cell_style), Paragraph('2', cell_style), Paragraph('50 000 GNF', cell_style)],
    [Paragraph('MOYENNE', cell_style), Paragraph('200', cell_style), Paragraph('5', cell_style), Paragraph('150 000 GNF', cell_style)],
    [Paragraph('GRANDE', cell_style), Paragraph('500', cell_style), Paragraph('15', cell_style), Paragraph('350 000 GNF', cell_style)],
    [Paragraph('ENTERPRISE', cell_style), Paragraph('Illimité', cell_style), Paragraph('Illimité', cell_style), Paragraph('Sur devis', cell_style)],
]

plans_table = Table(plans_data, colWidths=[3.5*cm, 3.5*cm, 3*cm, 3.5*cm])
plans_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), TABLE_HEADER_COLOR),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('BACKGROUND', (0, 1), (-1, -1), TABLE_ROW_EVEN),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('LEFTPADDING', (0, 0), (-1, -1), 8),
    ('RIGHTPADDING', (0, 0), (-1, -1), 8),
]))
story.append(plans_table)
story.append(Spacer(1, 18))

story.append(Paragraph("<b>7.3 Middlewares de Contrôle</b>", h2_style))

middleware_data = [
    [Paragraph('<b>Middleware</b>', header_style), Paragraph('<b>Fichier</b>', header_style), Paragraph('<b>Fonction</b>', header_style)],
    [Paragraph('authMiddleware', cell_style), Paragraph('auth.ts', cell_style), Paragraph('Vérification JWT avec cache Redis', cell_left)],
    [Paragraph('requireOwner', cell_style), Paragraph('auth.ts', cell_style), Paragraph('Accès OWNER uniquement', cell_left)],
    [Paragraph('requireAdmin', cell_style), Paragraph('auth.ts', cell_style), Paragraph('Accès ADMIN/OWNER', cell_left)],
    [Paragraph('requireAccountant', cell_style), Paragraph('auth.ts', cell_style), Paragraph('Accès COMPTABLE+', cell_left)],
    [Paragraph('checkInvoiceLimit', cell_style), Paragraph('plan.ts', cell_style), Paragraph('Vérifie limite factures', cell_left)],
    [Paragraph('checkUserLimit', cell_style), Paragraph('plan.ts', cell_style), Paragraph('Vérifie limite utilisateurs', cell_left)],
    [Paragraph('requireFeature', cell_style), Paragraph('plan.ts', cell_style), Paragraph('Vérifie fonctionnalité plan', cell_left)],
    [Paragraph('globalRateLimiter', cell_style), Paragraph('rateLimiter.ts', cell_style), Paragraph('10 req/sec global', cell_left)],
    [Paragraph('createRateLimiter', cell_style), Paragraph('rateLimiter.ts', cell_style), Paragraph('10 créations/min', cell_left)],
    [Paragraph('exportRateLimiter', cell_style), Paragraph('rateLimiter.ts', cell_style), Paragraph('5 exports/min', cell_left)],
]

mw_table = Table(middleware_data, colWidths=[4*cm, 3.5*cm, 5*cm])
mw_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), TABLE_HEADER_COLOR),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('BACKGROUND', (0, 1), (-1, -1), TABLE_ROW_EVEN),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('LEFTPADDING', (0, 0), (-1, -1), 6),
    ('RIGHTPADDING', (0, 0), (-1, -1), 6),
]))
story.append(mw_table)
story.append(Spacer(1, 18))

story.append(Paragraph("<b>7.4 Validation des Données (Zod Schemas)</b>", h2_style))

validation_data = [
    [Paragraph('<b>Schema</b>', header_style), Paragraph('<b>Champs</b>', header_style), Paragraph('<b>Règles</b>', header_style)],
    [Paragraph('loginSchema', cell_style), Paragraph('email, password', cell_style), Paragraph('Email valide, password requis', cell_left)],
    [Paragraph('registerSchema', cell_style), Paragraph('email, password, nom, companyName', cell_style), Paragraph('Password min 6 chars', cell_left)],
    [Paragraph('clientSchema', cell_style), Paragraph('nom, email, telephone, type', cell_style), Paragraph('Type: PARTICULIER/ENTREPRISE', cell_left)],
    [Paragraph('produitSchema', cell_style), Paragraph('nom, prixUnitaire, stockActuel', cell_style), Paragraph('Prix >= 0, stock >= 0', cell_left)],
    [Paragraph('employeSchema', cell_style), Paragraph('matricule, nom, salaireBase', cell_style), Paragraph('Matricule unique/société', cell_left)],
    [Paragraph('depenseSchema', cell_style), Paragraph('description, montant, modePaiement', cell_style), Paragraph('Mode: ESPECES/VIREMENT/...', cell_left)],
]

val_table = Table(validation_data, colWidths=[3.5*cm, 4.5*cm, 4.5*cm])
val_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), TABLE_HEADER_COLOR),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('BACKGROUND', (0, 1), (-1, -1), TABLE_ROW_EVEN),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('LEFTPADDING', (0, 0), (-1, -1), 6),
    ('RIGHTPADDING', (0, 0), (-1, -1), 6),
]))
story.append(val_table)
story.append(Spacer(1, 18))

# ============== 8. MODÈLES DB ==============
story.append(PageBreak())
story.append(Paragraph("<b>8. Modèles de Base de Données</b>", h1_style))
story.append(Spacer(1, 12))

story.append(Paragraph("<b>8.1 Modèles Principaux (40+ modèles)</b>", h2_style))

models_data = [
    [Paragraph('<b>Catégorie</b>', header_style), Paragraph('<b>Modèles</b>', header_style)],
    [Paragraph('Core Business', cell_style), Paragraph('Company, User, Client, Produit, Facture, Employe, BulletinPaie, Depense', cell_left)],
    [Paragraph('Abonnements', cell_style), Paragraph('PlanAbonnement, HistoriqueAbonnement, PaiementAbonnement', cell_left)],
    [Paragraph('Inventaire', cell_style), Paragraph('Entrepot, StockEntrepot, TransfertStock, Inventaire', cell_left)],
    [Paragraph('CRM', cell_style), Paragraph('Prospect, Opportunite, ActiviteCRM, PipelineVente', cell_left)],
    [Paragraph('Comptabilité', cell_style), Paragraph('PlanComptableOHADA, ExerciceComptable, EcritureComptable', cell_left)],
    [Paragraph('Paiements Mobile', cell_style), Paragraph('OrangeMoneyAccount, OrangeMoneyTransaction, MtnMoneyAccount, MtnMoneyTransaction', cell_left)],
    [Paragraph('Support', cell_style), Paragraph('SupportTicket, TicketReponse, Notification, PushSubscription', cell_left)],
]

models_table = Table(models_data, colWidths=[3.5*cm, 9*cm])
models_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), TABLE_HEADER_COLOR),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('BACKGROUND', (0, 1), (-1, -1), TABLE_ROW_EVEN),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('LEFTPADDING', (0, 0), (-1, -1), 8),
    ('RIGHTPADDING', (0, 0), (-1, -1), 8),
]))
story.append(models_table)
story.append(Spacer(1, 18))

story.append(Paragraph("<b>8.2 Support Multi-Pays (7 pays)</b>", h2_style))

countries_data = [
    [Paragraph('<b>Pays</b>', header_style), Paragraph('<b>Code</b>', header_style), Paragraph('<b>Devise</b>', header_style), Paragraph('<b>CNSS</b>', header_style), Paragraph('<b>IPR</b>', header_style)],
    [Paragraph('Guinée', cell_style), Paragraph('GN', cell_style), Paragraph('GNF', cell_style), Paragraph('Oui', cell_style), Paragraph('Oui', cell_style)],
    [Paragraph('Sénégal', cell_style), Paragraph('SN', cell_style), Paragraph('XOF', cell_style), Paragraph('Oui', cell_style), Paragraph('Oui', cell_style)],
    [Paragraph('Mali', cell_style), Paragraph('ML', cell_style), Paragraph('XOF', cell_style), Paragraph('Oui', cell_style), Paragraph('Oui', cell_style)],
    [Paragraph('Côte d\'Ivoire', cell_style), Paragraph('CI', cell_style), Paragraph('XOF', cell_style), Paragraph('Oui', cell_style), Paragraph('Oui', cell_style)],
    [Paragraph('Burkina Faso', cell_style), Paragraph('BF', cell_style), Paragraph('XOF', cell_style), Paragraph('Oui', cell_style), Paragraph('Oui', cell_style)],
    [Paragraph('Bénin', cell_style), Paragraph('BJ', cell_style), Paragraph('XOF', cell_style), Paragraph('Oui', cell_style), Paragraph('Oui', cell_style)],
    [Paragraph('Niger', cell_style), Paragraph('NE', cell_style), Paragraph('XOF', cell_style), Paragraph('Oui', cell_style), Paragraph('Oui', cell_style)],
]

countries_table = Table(countries_data, colWidths=[3*cm, 2*cm, 2*cm, 2*cm, 2*cm])
countries_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), TABLE_HEADER_COLOR),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('BACKGROUND', (0, 1), (-1, -1), TABLE_ROW_EVEN),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('LEFTPADDING', (0, 0), (-1, -1), 6),
    ('RIGHTPADDING', (0, 0), (-1, -1), 6),
]))
story.append(countries_table)
story.append(Spacer(1, 18))

# ============== 9. STATISTIQUES ==============
story.append(PageBreak())
story.append(Paragraph("<b>9. Statistiques Globales</b>", h1_style))
story.append(Spacer(1, 12))

stats_data = [
    [Paragraph('<b>Catégorie</b>', header_style), Paragraph('<b>Quantité</b>', header_style)],
    [Paragraph('Pages Frontend', cell_style), Paragraph('19', cell_style)],
    [Paragraph('Endpoints API', cell_style), Paragraph('130+', cell_style)],
    [Paragraph('Modèles de Base de Données', cell_style), Paragraph('40+', cell_style)],
    [Paragraph('Composants UI shadcn', cell_style), Paragraph('54', cell_style)],
    [Paragraph('Fichiers de Routes Backend', cell_style), Paragraph('35', cell_style)],
    [Paragraph('Fichiers de Services', cell_style), Paragraph('23', cell_style)],
    [Paragraph('Fichiers de Middleware', cell_style), Paragraph('9', cell_style)],
    [Paragraph('Rôles Utilisateurs', cell_style), Paragraph('6', cell_style)],
    [Paragraph('Pays Supportés', cell_style), Paragraph('7', cell_style)],
    [Paragraph('Plans d\'Abonnement', cell_style), Paragraph('4', cell_style)],
    [Paragraph('Gestionnaires onClick', cell_style), Paragraph('~175', cell_style)],
    [Paragraph('Éléments de Menu', cell_style), Paragraph('16', cell_style)],
    [Paragraph('Méthodes API Client', cell_style), Paragraph('100+', cell_style)],
]

stats_table = Table(stats_data, colWidths=[8*cm, 4*cm])
stats_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), TABLE_HEADER_COLOR),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('BACKGROUND', (0, 1), (-1, 1), TABLE_ROW_EVEN),
    ('BACKGROUND', (0, 2), (-1, 2), TABLE_ROW_ODD),
    ('BACKGROUND', (0, 3), (-1, 3), TABLE_ROW_EVEN),
    ('BACKGROUND', (0, 4), (-1, 4), TABLE_ROW_ODD),
    ('BACKGROUND', (0, 5), (-1, 5), TABLE_ROW_EVEN),
    ('BACKGROUND', (0, 6), (-1, 6), TABLE_ROW_ODD),
    ('BACKGROUND', (0, 7), (-1, 7), TABLE_ROW_EVEN),
    ('BACKGROUND', (0, 8), (-1, 8), TABLE_ROW_ODD),
    ('BACKGROUND', (0, 9), (-1, 9), TABLE_ROW_EVEN),
    ('BACKGROUND', (0, 10), (-1, 10), TABLE_ROW_ODD),
    ('BACKGROUND', (0, 11), (-1, 11), TABLE_ROW_EVEN),
    ('BACKGROUND', (0, 12), (-1, 12), TABLE_ROW_ODD),
    ('BACKGROUND', (0, 13), (-1, 13), TABLE_ROW_EVEN),
    ('BACKGROUND', (0, 14), (-1, 14), TABLE_ROW_ODD),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('LEFTPADDING', (0, 0), (-1, -1), 8),
    ('RIGHTPADDING', (0, 0), (-1, -1), 8),
]))
story.append(stats_table)
story.append(Spacer(1, 18))

# ============== 10. RECOMMANDATIONS ==============
story.append(Paragraph("<b>10. Recommandations</b>", h1_style))
story.append(Spacer(1, 12))

story.append(Paragraph("<b>10.1 Points Forts</b>", h2_style))
story.append(Paragraph(
    "Le projet présente une architecture solide et moderne avec une séparation claire des responsabilités. "
    "L'utilisation de Next.js 16 avec l'App Router et de Prisma ORM garantit une base technique pérenne. "
    "Le support multi-pays avec configurations fiscales spécifiques est un atout majeur pour le marché cible. "
    "L'intégration des paiements mobiles (Orange Money, MTN Money) est particulièrement pertinente pour l'Afrique de l'Ouest.",
    body_style
))
story.append(Spacer(1, 12))

story.append(Paragraph("<b>10.2 Améliorations Suggérées</b>", h2_style))

improvements = [
    [Paragraph('<b>Domaine</b>', header_style), Paragraph('<b>Recommandation</b>', header_style), Paragraph('<b>Priorité</b>', header_style)],
    [Paragraph('Sécurité', cell_style), Paragraph('Ajouter signature des requêtes webhooks', cell_left), Paragraph('Haute', cell_style)],
    [Paragraph('Sécurité', cell_style), Paragraph('Implémenter CSP headers', cell_left), Paragraph('Moyenne', cell_style)],
    [Paragraph('Audit', cell_style), Paragraph('Logging des opérations sensibles', cell_left), Paragraph('Haute', cell_style)],
    [Paragraph('API', cell_style), Paragraph('Authentification par clé API pour intégrations', cell_left), Paragraph('Moyenne', cell_style)],
    [Paragraph('Tests', cell_style), Paragraph('Augmenter couverture de tests unitaires', cell_left), Paragraph('Moyenne', cell_style)],
    [Paragraph('Performance', cell_style), Paragraph('Mise en cache des requêtes fréquentes', cell_left), Paragraph('Basse', cell_style)],
    [Paragraph('Docs', cell_style), Paragraph('Documentation API OpenAPI/Swagger', cell_left), Paragraph('Basse', cell_style)],
]

impr_table = Table(improvements, colWidths=[3*cm, 7*cm, 2.5*cm])
impr_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), TABLE_HEADER_COLOR),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('BACKGROUND', (0, 1), (-1, -1), TABLE_ROW_EVEN),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('LEFTPADDING', (0, 0), (-1, -1), 6),
    ('RIGHTPADDING', (0, 0), (-1, -1), 6),
]))
story.append(impr_table)
story.append(Spacer(1, 18))

story.append(Paragraph("<b>10.3 État de Prêt au Déploiement</b>", h2_style))
story.append(Paragraph(
    "Le projet est fonctionnel et prêt pour un déploiement en production. Les configurations Docker et docker-compose "
    "sont en place. L'authentification JWT, le 2FA, et le système de permissions garantissent une sécurité adéquate. "
    "Les identifiants de démonstration (demo@guineamanager.com / demo123) permettent de tester l'application. "
    "Le code est versionné sur GitHub et synchronisé avec le repository distant.",
    body_style
))

# Build PDF
doc.build(story)
print(f"PDF créé: {pdf_filename}")
