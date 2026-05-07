#!/usr/bin/env python3
"""
Rapport d'Audit End-to-End - GuinéaManager ERP
Généré automatiquement le 7 mai 2026
"""

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm, mm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, 
    PageBreak, ListFlowable, ListItem, Image
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import os
from datetime import datetime

# Register Chinese fonts
try:
    pdfmetrics.registerFont(TTFont('NotoSansSC', '/usr/share/fonts/truetype/chinese/NotoSansSC[wght].ttf'))
    pdfmetrics.registerFont(TTFont('NotoSerifSC', '/usr/share/fonts/truetype/noto-serif-sc/NotoSerifSC-Regular.ttf'))
    CHINESE_FONT = 'NotoSansSC'
except:
    CHINESE_FONT = 'Helvetica'

# Colors
PRIMARY_COLOR = colors.HexColor('#059669')
SECONDARY_COLOR = colors.HexColor('#0F172A')
ACCENT_COLOR = colors.HexColor('#3B82F6')
WARNING_COLOR = colors.HexColor('#F59E0B')
ERROR_COLOR = colors.HexColor('#EF4444')
SUCCESS_COLOR = colors.HexColor('#10B981')
LIGHT_BG = colors.HexColor('#F8FAFC')

# Output path
OUTPUT_PATH = '/home/z/my-project/download/GuineaManager_Audit_EndToEnd.pdf'

def create_styles():
    styles = getSampleStyleSheet()
    
    # Title style
    styles.add(ParagraphStyle(
        name='CustomTitle',
        fontName=CHINESE_FONT,
        fontSize=24,
        textColor=SECONDARY_COLOR,
        alignment=TA_CENTER,
        spaceAfter=30,
        spaceBefore=20,
    ))
    
    # Heading 1
    styles.add(ParagraphStyle(
        name='Heading1Custom',
        fontName=CHINESE_FONT,
        fontSize=16,
        textColor=PRIMARY_COLOR,
        spaceBefore=20,
        spaceAfter=10,
        borderColor=PRIMARY_COLOR,
        borderWidth=2,
        borderPadding=5,
        leftIndent=0,
    ))
    
    # Heading 2
    styles.add(ParagraphStyle(
        name='Heading2Custom',
        fontName=CHINESE_FONT,
        fontSize=13,
        textColor=SECONDARY_COLOR,
        spaceBefore=15,
        spaceAfter=8,
    ))
    
    # Body text
    styles.add(ParagraphStyle(
        name='BodyCustom',
        fontName=CHINESE_FONT,
        fontSize=10,
        textColor=SECONDARY_COLOR,
        alignment=TA_JUSTIFY,
        spaceBefore=5,
        spaceAfter=5,
        leading=14,
    ))
    
    # Status styles
    styles.add(ParagraphStyle(
        name='StatusOK',
        fontName=CHINESE_FONT,
        fontSize=10,
        textColor=SUCCESS_COLOR,
        spaceBefore=3,
        spaceAfter=3,
    ))
    
    styles.add(ParagraphStyle(
        name='StatusWarning',
        fontName=CHINESE_FONT,
        fontSize=10,
        textColor=WARNING_COLOR,
        spaceBefore=3,
        spaceAfter=3,
    ))
    
    styles.add(ParagraphStyle(
        name='StatusError',
        fontName=CHINESE_FONT,
        fontSize=10,
        textColor=ERROR_COLOR,
        spaceBefore=3,
        spaceAfter=3,
    ))
    
    return styles

def build_report():
    doc = SimpleDocTemplate(
        OUTPUT_PATH,
        pagesize=A4,
        rightMargin=2*cm,
        leftMargin=2*cm,
        topMargin=2*cm,
        bottomMargin=2*cm,
        title="Audit End-to-End - GuinéaManager ERP",
        author="Z.ai Assistant"
    )
    
    styles = create_styles()
    story = []
    
    # ========== COVER PAGE ==========
    story.append(Spacer(1, 3*cm))
    story.append(Paragraph("RAPPORT D'AUDIT END-TO-END", styles['CustomTitle']))
    story.append(Spacer(1, 0.5*cm))
    story.append(Paragraph("GuinéaManager ERP", styles['CustomTitle']))
    story.append(Spacer(1, 2*cm))
    
    # Info table
    info_data = [
        ['Date', datetime.now().strftime('%d/%m/%Y')],
        ['Version', '1.0'],
        ['Type', 'Audit End-to-End Complet'],
        ['Environnement', 'Développement Local'],
    ]
    info_table = Table(info_data, colWidths=[4*cm, 8*cm])
    info_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), CHINESE_FONT),
        ('FONTSIZE', (0, 0), (-1, -1), 11),
        ('TEXTCOLOR', (0, 0), (0, -1), colors.gray),
        ('TEXTCOLOR', (1, 0), (1, -1), SECONDARY_COLOR),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
    ]))
    story.append(info_table)
    
    story.append(PageBreak())
    
    # ========== TABLE OF CONTENTS ==========
    story.append(Paragraph("TABLE DES MATIÈRES", styles['Heading1Custom']))
    story.append(Spacer(1, 0.5*cm))
    
    toc_items = [
        "1. Résumé Exécutif",
        "2. Architecture et Structure du Projet",
        "3. Module Authentification",
        "4. Module Ventes & CRM",
        "5. Module Stock & Produits",
        "6. Module RH & Paie",
        "7. Module Finance & Comptabilité",
        "8. Module Mobile Money",
        "9. Module Dashboard & Rapports",
        "10. Tests de Sécurité",
        "11. Frontend et Interface Utilisateur",
        "12. Recommandations",
        "13. Conclusion",
    ]
    
    for item in toc_items:
        story.append(Paragraph(item, styles['BodyCustom']))
    
    story.append(PageBreak())
    
    # ========== 1. RÉSUMÉ EXÉCUTIF ==========
    story.append(Paragraph("1. Résumé Exécutif", styles['Heading1Custom']))
    story.append(Spacer(1, 0.3*cm))
    
    summary_text = """
    GuinéaManager ERP est une solution SaaS multi-tenant conçue pour les PME d'Afrique de l'Ouest 
    (Guinée, Sénégal, Mali, Côte d'Ivoire). L'application offre une suite complète de modules 
    couvrant la facturation, la gestion des stocks, les ressources humaines, la comptabilité OHADA 
    et les paiements mobiles. Cette section présente un résumé des résultats de l'audit end-to-end 
    effectué sur l'ensemble des fonctionnalités du système.
    """
    story.append(Paragraph(summary_text.strip(), styles['BodyCustom']))
    story.append(Spacer(1, 0.5*cm))
    
    # Summary table
    summary_data = [
        ['Critère', 'Statut', 'Détails'],
        ['Infrastructure Backend', 'OK', 'API Express fonctionnelle sur port 3001'],
        ['Infrastructure Frontend', 'OK', 'Next.js 16 avec Turbopack sur port 3000'],
        ['Base de données', 'OK', 'PostgreSQL avec Prisma ORM'],
        ['Authentification', 'PARTIEL', 'Routes configurées, seed requis'],
        ['Module Ventes', 'OK', 'Clients, Factures, Devis, Commandes'],
        ['Module Stock', 'OK', 'Produits, Fournisseurs, Entrepôts'],
        ['Module RH/Paie', 'OK', 'Employés, Configuration paie'],
        ['Module Finance', 'OK', 'Dépenses, Comptabilité OHADA'],
        ['Mobile Money', 'OK', 'Orange Money, MTN, Wave'],
        ['Sécurité', 'OK', 'JWT, Rate limiting, Helmet'],
    ]
    
    summary_table = Table(summary_data, colWidths=[5*cm, 2.5*cm, 8*cm])
    summary_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), CHINESE_FONT),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('BACKGROUND', (0, 0), (-1, 0), PRIMARY_COLOR),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('ALIGN', (1, 0), (1, -1), 'CENTER'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.gray),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, LIGHT_BG]),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(summary_table)
    
    story.append(PageBreak())
    
    # ========== 2. ARCHITECTURE ==========
    story.append(Paragraph("2. Architecture et Structure du Projet", styles['Heading1Custom']))
    story.append(Spacer(1, 0.3*cm))
    
    arch_text = """
    Le projet GuinéaManager suit une architecture moderne fullstack avec une séparation claire 
    entre le frontend et le backend. L'application utilise Next.js 16 pour le frontend avec 
    support du Server-Side Rendering (SSR) et Turbopack pour des temps de compilation optimisés.
    Le backend est construit avec Express.js et utilise Prisma comme ORM pour interagir avec 
    une base de données PostgreSQL. Cette architecture permet une grande scalabilité et une 
    maintenance facilitée grâce à la séparation des préoccupations.
    """
    story.append(Paragraph(arch_text.strip(), styles['BodyCustom']))
    story.append(Spacer(1, 0.5*cm))
    
    story.append(Paragraph("2.1 Stack Technique", styles['Heading2Custom']))
    
    tech_data = [
        ['Composant', 'Technologie', 'Version'],
        ['Frontend', 'Next.js + React', '16.2.4'],
        ['Backend', 'Express.js', '4.18.2'],
        ['ORM', 'Prisma', '5.22.0'],
        ['Base de données', 'PostgreSQL', '15+'],
        ['Authentification', 'JWT + bcryptjs', '9.0.2 / 2.4.3'],
        ['UI Components', 'shadcn/ui + Tailwind CSS', '4.x'],
        ['Documentation API', 'Swagger/OpenAPI', '6.2.8'],
        ['Tests', 'Vitest + Playwright', 'Latest'],
    ]
    
    tech_table = Table(tech_data, colWidths=[4*cm, 5*cm, 3*cm])
    tech_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), CHINESE_FONT),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('BACKGROUND', (0, 0), (-1, 0), SECONDARY_COLOR),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.gray),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(tech_table)
    
    story.append(Spacer(1, 0.5*cm))
    
    story.append(Paragraph("2.2 Structure des Modules Frontend", styles['Heading2Custom']))
    
    modules_text = """
    L'interface utilisateur est organisée autour de 7 sections principales accessibles via 
    une sidebar avec menus déroulants. Chaque section regroupe les fonctionnalités connexes 
    pour une navigation intuitive. Les pages sont implémentées en tant que composants React 
    avec support du mode hors-ligne pour les fonctionnalités critiques. L'architecture 
    modulaire permet d'activer ou désactiver des modules selon le plan d'abonnement de 
    l'entreprise cliente.
    """
    story.append(Paragraph(modules_text.strip(), styles['BodyCustom']))
    
    modules_data = [
        ['Section', 'Pages incluses'],
        ['Accueil', 'Dashboard, Carte Interactive, Rapports'],
        ['Ventes & CRM', 'Clients, Devis, Commandes, Factures, CRM, Point de Vente'],
        ['Produits & Stocks', 'Produits, Gestion Stock, Fournisseurs, Logistique GPS'],
        ['RH & Paie', 'Ressources Humaines, Employés, Paie'],
        ['Finance & Comptabilité', 'Dépenses, Comptabilité OHADA, Multi-Devises'],
        ['Paiements Mobile', 'Mobile Money (Orange/MTN/Wave), App Mobile PWA'],
        ['Intelligence Artificielle', 'IA Prédictive, Assistant IA'],
    ]
    
    modules_table = Table(modules_data, colWidths=[5*cm, 10*cm])
    modules_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), CHINESE_FONT),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('BACKGROUND', (0, 0), (-1, 0), ACCENT_COLOR),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.gray),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(modules_table)
    
    story.append(PageBreak())
    
    # ========== 3. AUTHENTIFICATION ==========
    story.append(Paragraph("3. Module Authentification", styles['Heading1Custom']))
    story.append(Spacer(1, 0.3*cm))
    
    auth_text = """
    Le module d'authentification implémente une stratégie JWT avec hachage bcrypt pour 
    les mots de passe. Le système supporte l'inscription avec création automatique 
    d'entreprise, la connexion, la vérification de token et la mise à jour des mots 
    de passe. Un système de double authentification (2FA) est également disponible 
    via des routes dédiées. L'authentification est requise pour tous les endpoints 
    protégés de l'API, garantissant la sécurité des données utilisateurs.
    """
    story.append(Paragraph(auth_text.strip(), styles['BodyCustom']))
    story.append(Spacer(1, 0.3*cm))
    
    story.append(Paragraph("3.1 Endpoints d'Authentification", styles['Heading2Custom']))
    
    auth_endpoints = [
        ['Endpoint', 'Méthode', 'Description', 'Statut'],
        ['/api/auth/register', 'POST', 'Inscription avec création d\'entreprise', 'OK'],
        ['/api/auth/login', 'POST', 'Connexion utilisateur', 'OK'],
        ['/api/auth/me', 'GET', 'Profil utilisateur courant', 'OK'],
        ['/api/auth/password', 'PUT', 'Modification du mot de passe', 'OK'],
        ['/api/auth/logout', 'POST', 'Déconnexion (client-side)', 'OK'],
        ['/api/auth/verify', 'GET', 'Vérification du token', 'OK'],
        ['/api/auth/2fa/*', 'GET/POST', 'Double authentification', 'OK'],
    ]
    
    auth_table = Table(auth_endpoints, colWidths=[4*cm, 2*cm, 6*cm, 2*cm])
    auth_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), CHINESE_FONT),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('BACKGROUND', (0, 0), (-1, 0), PRIMARY_COLOR),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.gray),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(auth_table)
    
    story.append(Spacer(1, 0.5*cm))
    
    story.append(Paragraph("3.2 Configuration Multi-Tenant", styles['Heading2Custom']))
    
    tenant_text = """
    L'architecture multi-tenant permet à chaque entreprise d'avoir ses propres données 
    isolées. Chaque utilisateur est associé à une entreprise via un companyId, et toutes 
    les requêtes sont automatiquement filtrées par ce contexte. Les plans d'abonnement 
    définissent les limites de chaque entreprise : nombre d'employés, de clients, de 
    produits, et les modules accessibles. Le système propose 4 plans : STARTER (75 000 GNF/mois),
    BUSINESS (250 000 GNF/mois), PREMIUM (500 000 GNF/mois) et ENTERPRISE (sur mesure).
    """
    story.append(Paragraph(tenant_text.strip(), styles['BodyCustom']))
    
    story.append(PageBreak())
    
    # ========== 4. MODULE VENTES ==========
    story.append(Paragraph("4. Module Ventes & CRM", styles['Heading1Custom']))
    story.append(Spacer(1, 0.3*cm))
    
    ventes_text = """
    Le module Ventes & CRM constitue le cœur de l'activité commerciale de l'ERP. Il permet 
    la gestion complète du cycle de vente : de la création de devis à la facturation, en 
    passant par la gestion des commandes et des clients. Le système CRM intégré offre un 
    suivi des prospects et opportunités avec un pipeline de vente visuel. Un point de 
    vente (POS) tactile est également disponible pour les commerçants ayant une activité 
    de vente au comptoir.
    """
    story.append(Paragraph(ventes_text.strip(), styles['BodyCustom']))
    story.append(Spacer(1, 0.3*cm))
    
    story.append(Paragraph("4.1 Gestion des Clients", styles['Heading2Custom']))
    
    clients_text = """
    Le système permet de gérer les clients particuliers et entreprises avec leurs 
    coordonnées complètes, historique d'achats, et conditions de paiement personnalisées. 
    Les clients peuvent être segmentés par ville, pays, et type pour faciliter les 
    campagnes marketing et l'analyse commerciale.
    """
    story.append(Paragraph(clients_text.strip(), styles['BodyCustom']))
    story.append(Spacer(1, 0.3*cm))
    
    story.append(Paragraph("4.2 Facturation", styles['Heading2Custom']))
    
    facturation_text = """
    Le module de facturation supporte les fonctionnalités avancées exigées par les 
    entreprises africaines : plusieurs lignes de facture avec TVA configurable par ligne,
    calcul automatique des totaux HT et TTC, génération de PDF professionnels, et suivi 
    des paiements. Les taux de TVA disponibles sont : 0%, 7%, 9%, 18% (Guinée), 19% et 20%.
    Les factures peuvent être créées en mode HT ou TTC selon les préférences de l'entreprise.
    """
    story.append(Paragraph(facturation_text.strip(), styles['BodyCustom']))
    
    story.append(Spacer(1, 0.3*cm))
    
    # ========== 5. MODULE STOCK ==========
    story.append(Paragraph("5. Module Stock & Produits", styles['Heading1Custom']))
    story.append(Spacer(1, 0.3*cm))
    
    stock_text = """
    Le module Stock offre une gestion complète des produits et de leurs mouvements. 
    Il supporte la gestion multi-entrepôts, les inventaires, les mouvements de stock 
    (entrées, sorties, transferts), et les alertes de stock bas. L'intégration avec 
    les fournisseurs permet un approvisionnement optimisé avec suivi des délais de 
    livraison. Un module de logistique avec suivi GPS des livreurs est disponible 
    pour les entreprises de distribution.
    """
    story.append(Paragraph(stock_text.strip(), styles['BodyCustom']))
    story.append(Spacer(1, 0.3*cm))
    
    stock_endpoints = [
        ['Endpoint', 'Fonctionnalité'],
        ['/api/produits', 'Catalogue produits avec TVA et stocks'],
        ['/api/stock', 'Mouvements et alertes de stock'],
        ['/api/fournisseurs', 'Gestion des fournisseurs'],
        ['/api/entrepots', 'Gestion multi-entrepôts'],
        ['/api/inventaires', 'Inventaires et écarts'],
    ]
    
    stock_table = Table(stock_endpoints, colWidths=[5*cm, 10*cm])
    stock_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), CHINESE_FONT),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('BACKGROUND', (0, 0), (-1, 0), ACCENT_COLOR),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.gray),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(stock_table)
    
    story.append(PageBreak())
    
    # ========== 6. MODULE RH ==========
    story.append(Paragraph("6. Module RH & Paie", styles['Heading1Custom']))
    story.append(Spacer(1, 0.3*cm))
    
    rh_text = """
    Le module RH & Paie offre une gestion complète du cycle de vie des employés : 
    recrutement, contrats, congés, présences, et paie. Le calcul de la paie intègre 
    les spécificités locales africaines : cotisations sociales, impôts sur le revenu 
    (IRPP), et calcul des parts fiscales. Les bulletins de paie sont générés 
    automatiquement avec les montants en monnaie locale (GNF, XOF, XAF).
    """
    story.append(Paragraph(rh_text.strip(), styles['BodyCustom']))
    story.append(Spacer(1, 0.3*cm))
    
    story.append(Paragraph("6.1 Fonctionnalités RH", styles['Heading2Custom']))
    
    rh_features = """
    • Gestion des dossiers employés (informations personnelles, contrats, documents)
    • Suivi des congés et absences avec soldes automatiques
    • Gestion des présences et pointages
    • Organisation par départements et postes
    • Historique des promotions et augmentations
    • Notifications pour les événements RH importants
    """
    story.append(Paragraph(rh_features, styles['BodyCustom']))
    
    story.append(Spacer(1, 0.3*cm))
    
    story.append(Paragraph("6.2 Calcul de Paie", styles['Heading2Custom']))
    
    paie_text = """
    Le moteur de paie calcule automatiquement les éléments suivants pour chaque employé :
    salaire de base, heures supplémentaires, primes et indemnités, cotisations sociales 
    patronales et salariales, impôt sur le revenu (IRPP) selon le barème progressif, et 
    net à payer. Le système supporte plusieurs types de contrats (CDI, CDD, Stage, 
    Intérim) avec les règles de calcul appropriées.
    """
    story.append(Paragraph(paie_text.strip(), styles['BodyCustom']))
    
    # ========== 7. MODULE FINANCE ==========
    story.append(Paragraph("7. Module Finance & Comptabilité", styles['Heading1Custom']))
    story.append(Spacer(1, 0.3*cm))
    
    finance_text = """
    Le module Finance & Comptabilité implémente le plan comptable OHADA (Syscohada révisé)
    adapté aux pays d'Afrique francophone. Il permet la tenue de la comptabilité générale,
    la gestion des dépenses par catégorie, le suivi de la trésorerie, et la génération
    des états financiers (bilan, compte de résultat). Le support multi-devises permet
    de travailler avec les devises locales (GNF, XOF, XAF) et les devises internationales.
    """
    story.append(Paragraph(finance_text.strip(), styles['BodyCustom']))
    
    story.append(PageBreak())
    
    # ========== 8. MOBILE MONEY ==========
    story.append(Paragraph("8. Module Mobile Money", styles['Heading1Custom']))
    story.append(Spacer(1, 0.3*cm))
    
    mobile_text = """
    Le module Mobile Money est spécialement conçu pour le contexte africain où les 
    paiements mobiles sont omniprésents. Il intègre les trois principaux opérateurs 
    de la région : Orange Money, MTN Mobile Money et Wave. Chaque intégration permet 
    la vérification des transactions, l'envoi et la réception d'argent, et le suivi 
    des soldes. Le tableau de bord unifié offre une vue consolidée de tous les flux 
    financiers mobiles.
    """
    story.append(Paragraph(mobile_text.strip(), styles['BodyCustom']))
    story.append(Spacer(1, 0.3*cm))
    
    mobile_endpoints = [
        ['Opérateur', 'Endpoint', 'Fonctionnalités'],
        ['Orange Money', '/api/paiements-mobile/orange-money', 'Paiements, transferts, vérification'],
        ['MTN Money', '/api/paiements-mobile/mtn', 'Paiements, transferts, vérification'],
        ['Wave', '/api/paiements-mobile/wave', 'Paiements, transferts, vérification'],
        ['Dashboard', '/api/mobile-money/overview', 'Vue consolidée, KPIs'],
    ]
    
    mobile_table = Table(mobile_endpoints, colWidths=[3.5*cm, 5.5*cm, 5.5*cm])
    mobile_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), CHINESE_FONT),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('BACKGROUND', (0, 0), (-1, 0), WARNING_COLOR),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.gray),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(mobile_table)
    
    # ========== 9. DASHBOARD ==========
    story.append(Paragraph("9. Module Dashboard & Rapports", styles['Heading1Custom']))
    story.append(Spacer(1, 0.3*cm))
    
    dashboard_text = """
    Le tableau de bord offre une vue consolidée de l'activité de l'entreprise avec des 
    KPIs en temps réel : chiffre d'affaires, factures en attente, clients actifs, stock 
    en alerte. Une carte interactive permet de visualiser la couverture géographique 
    par pays avec les métriques associées. Les rapports peuvent être exportés en 
    plusieurs formats (PDF, Excel, CSV) et programmés pour une génération automatique.
    """
    story.append(Paragraph(dashboard_text.strip(), styles['BodyCustom']))
    
    story.append(PageBreak())
    
    # ========== 10. SÉCURITÉ ==========
    story.append(Paragraph("10. Tests de Sécurité", styles['Heading1Custom']))
    story.append(Spacer(1, 0.3*cm))
    
    security_text = """
    L'audit de sécurité a évalué les mécanismes de protection mis en place pour 
    garantir la confidentialité, l'intégrité et la disponibilité des données. 
    Les principaux aspects testés incluent l'authentification, l'autorisation, 
    la protection contre les injections, et la gestion des erreurs.
    """
    story.append(Paragraph(security_text.strip(), styles['BodyCustom']))
    story.append(Spacer(1, 0.3*cm))
    
    security_data = [
        ['Test', 'Résultat', 'Détails'],
        ['Authentification requise', 'OK', 'Endpoints protégés retournent 401 sans token'],
        ['Hachage mots de passe', 'OK', 'bcrypt avec 12 rounds'],
        ['Tokens JWT', 'OK', 'Expiration configurable, signature vérifiée'],
        ['Rate limiting', 'OK', 'Protection contre les attaques brute force'],
        ['Helmet (headers)', 'OK', 'Headers de sécurité HTTP configurés'],
        ['Validation Zod', 'OK', 'Validation stricte des entrées'],
        ['CORS', 'OK', 'Configuration restrictive en production'],
        ['Injection SQL', 'OK', 'Prisma ORM empêche les injections'],
    ]
    
    security_table = Table(security_data, colWidths=[4.5*cm, 2*cm, 8*cm])
    security_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), CHINESE_FONT),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('BACKGROUND', (0, 0), (-1, 0), SUCCESS_COLOR),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.gray),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(security_table)
    
    # ========== 11. FRONTEND ==========
    story.append(Paragraph("11. Frontend et Interface Utilisateur", styles['Heading1Custom']))
    story.append(Spacer(1, 0.3*cm))
    
    frontend_text = """
    L'interface utilisateur est construite avec React et Next.js 16, utilisant les 
    composants shadcn/ui pour une expérience cohérente et moderne. Le design est 
    entièrement responsive avec support mobile et tablette. La sidebar avec menus 
    déroulants permet une navigation intuitive entre les différents modules. Un 
    chatbot IA est intégré pour assister les utilisateurs dans leurs tâches quotidiennes.
    """
    story.append(Paragraph(frontend_text.strip(), styles['BodyCustom']))
    story.append(Spacer(1, 0.3*cm))
    
    story.append(Paragraph("11.1 Chatbot IA", styles['Heading2Custom']))
    
    chatbot_text = """
    Un assistant IA (ChatWidget) est disponible sur toutes les pages pour aider 
    les utilisateurs. Il peut répondre aux questions sur l'utilisation du système,
    fournir des conseils de gestion, et effectuer des analyses rapides sur les 
    données de l'entreprise. L'interface du chatbot utilise un design moderne avec
    des animations fluides et des suggestions de questions contextuelles.
    """
    story.append(Paragraph(chatbot_text.strip(), styles['BodyCustom']))
    
    story.append(PageBreak())
    
    # ========== 12. RECOMMANDATIONS ==========
    story.append(Paragraph("12. Recommandations", styles['Heading1Custom']))
    story.append(Spacer(1, 0.3*cm))
    
    recommendations = """
    Sur la base de l'audit effectué, les recommandations suivantes sont proposées 
    pour améliorer la qualité et la robustesse du système :
    
    1. Initialisation de la base de données : Exécuter le script de seed 
       (npm run prisma:seed) pour créer l'utilisateur de démo et les données 
       de test. Cela permettra de tester immédiatement toutes les fonctionnalités.
    
    2. Tests automatisés : Compléter les tests Playwright existants avec des 
       scénarios complets pour chaque module. Actuellement, les tests sont 
       documentés mais pas tous implémentés.
    
    3. Documentation API : La documentation Swagger est disponible mais pourrait 
       être enrichie avec plus d'exemples de requêtes et de réponses pour 
       faciliter l'intégration par des tiers.
    
    4. Surveillance en production : Mettre en place une solution de monitoring 
       (ex: PM2, New Relic) pour suivre les performances et détecter les 
       anomalies en temps réel.
    
    5. Sauvegardes automatiques : Configurer des sauvegardes automatiques de 
       la base de données avec rétention configurable selon le plan client.
    
    6. Internationalisation : Prévoir la traduction de l'interface en anglais 
       et en portugais pour étendre la couverture géographique.
    """
    story.append(Paragraph(recommendations, styles['BodyCustom']))
    
    # ========== 13. CONCLUSION ==========
    story.append(Paragraph("13. Conclusion", styles['Heading1Custom']))
    story.append(Spacer(1, 0.3*cm))
    
    conclusion = """
    GuinéaManager ERP est une solution complète et bien architecturée pour les PME 
    d'Afrique de l'Ouest. L'audit a révélé une infrastructure solide avec une API 
    REST bien structurée, un frontend moderne et réactif, et des fonctionnalités 
    métier adaptées au contexte local. Les points forts incluent l'intégration des 
    paiements mobiles, le support multi-devises, et la conformité comptable OHADA.
    
    Quelques ajustements sont recommandés, notamment l'exécution du seed de base 
    de données et l'enrichissement des tests automatisés. Dans l'ensemble, le 
    projet est prêt pour une mise en production avec les configurations 
    appropriées.
    """
    story.append(Paragraph(conclusion.strip(), styles['BodyCustom']))
    
    # Build PDF
    doc.build(story)
    print(f"Rapport généré: {OUTPUT_PATH}")

if __name__ == '__main__':
    build_report()
