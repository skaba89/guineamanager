-- Migration: Optimisation des performances avec des indexes
-- GuinéaManager ERP - Phase 2 Stabilisation

-- Indexes pour la table des clients
CREATE INDEX IF NOT EXISTS "Client_companyId_idx" ON "Client"("companyId");
CREATE INDEX IF NOT EXISTS "Client_email_idx" ON "Client"("email");
CREATE INDEX IF NOT EXISTS "Client_nom_idx" ON "Client"("nom");
CREATE INDEX IF NOT EXISTS "Client_companyId_createdAt_idx" ON "Client"("companyId", "createdAt");

-- Indexes pour la table des produits
CREATE INDEX IF NOT EXISTS "Produit_companyId_idx" ON "Produit"("companyId");
CREATE INDEX IF NOT EXISTS "Produit_reference_idx" ON "Produit"("reference");
CREATE INDEX IF NOT EXISTS "Produit_categorie_idx" ON "Produit"("categorie");
CREATE INDEX IF NOT EXISTS "Produit_companyId_stock_idx" ON "Produit"("companyId", "stock");

-- Indexes pour la table des factures
CREATE INDEX IF NOT EXISTS "Facture_companyId_idx" ON "Facture"("companyId");
CREATE INDEX IF NOT EXISTS "Facture_clientId_idx" ON "Facture"("clientId");
CREATE INDEX IF NOT EXISTS "Facture_status_idx" ON "Facture"("status");
CREATE INDEX IF NOT EXISTS "Facture_date_idx" ON "Facture"("date");
CREATE INDEX IF NOT EXISTS "Facture_companyId_date_idx" ON "Facture"("companyId", "date");
CREATE INDEX IF NOT EXISTS "Facture_companyId_status_idx" ON "Facture"("companyId", "status");

-- Indexes pour la table des employés
CREATE INDEX IF NOT EXISTS "Employe_companyId_idx" ON "Employe"("companyId");
CREATE INDEX IF NOT EXISTS "Employe_email_idx" ON "Employe"("email");
CREATE INDEX IF NOT EXISTS "Employe_poste_idx" ON "Employe"("poste");
CREATE INDEX IF NOT EXISTS "Employe_companyId_statut_idx" ON "Employe"("companyId", "statut");

-- Indexes pour la table des dépenses
CREATE INDEX IF NOT EXISTS "Depense_companyId_idx" ON "Depense"("companyId");
CREATE INDEX IF NOT EXISTS "Depense_categorie_idx" ON "Depense"("categorie");
CREATE INDEX IF NOT EXISTS "Depense_date_idx" ON "Depense"("date");
CREATE INDEX IF NOT EXISTS "Depense_companyId_date_idx" ON "Depense"("companyId", "date");

-- Indexes pour la table des utilisateurs
CREATE INDEX IF NOT EXISTS "User_email_idx" ON "User"("email");
CREATE INDEX IF NOT EXISTS "User_companyId_idx" ON "User"("companyId");
CREATE INDEX IF NOT EXISTS "User_role_idx" ON "User"("role");

-- Indexes pour la table des entreprises
CREATE INDEX IF NOT EXISTS "Company_email_idx" ON "Company"("email");
CREATE INDEX IF NOT EXISTS "Company_planId_idx" ON "Company"("planId");
CREATE INDEX IF NOT EXISTS "Company_statut_idx" ON "Company"("statut");

-- Indexes pour les bulletins de paie
CREATE INDEX IF NOT EXISTS "BulletinPaie_employeId_idx" ON "BulletinPaie"("employeId");
CREATE INDEX IF NOT EXISTS "BulletinPaie_companyId_idx" ON "BulletinPaie"("companyId");
CREATE INDEX IF NOT EXISTS "BulletinPaie_mois_annee_idx" ON "BulletinPaie"("mois", "annee");

-- Indexes pour les transactions mobile money
CREATE INDEX IF NOT EXISTS "TransactionMobileMoney_companyId_idx" ON "TransactionMobileMoney"("companyId");
CREATE INDEX IF NOT EXISTS "TransactionMobileMoney_status_idx" ON "TransactionMobileMoney"("status");
CREATE INDEX IF NOT EXISTS "TransactionMobileMoney_operateur_idx" ON "TransactionMobileMoney"("operateur");
CREATE INDEX IF NOT EXISTS "TransactionMobileMoney_date_idx" ON "TransactionMobileMoney"("date");

-- Indexes pour les stocks et mouvements
CREATE INDEX IF NOT EXISTS "MouvementStock_produitId_idx" ON "MouvementStock"("produitId");
CREATE INDEX IF NOT EXISTS "MouvementStock_companyId_idx" ON "MouvementStock"("companyId");
CREATE INDEX IF NOT EXISTS "MouvementStock_date_idx" ON "MouvementStock"("date");
CREATE INDEX IF NOT EXISTS "MouvementStock_type_idx" ON "MouvementStock"("type");

-- Indexes pour les devis
CREATE INDEX IF NOT EXISTS "Devis_companyId_idx" ON "Devis"("companyId");
CREATE INDEX IF NOT EXISTS "Devis_clientId_idx" ON "Devis"("clientId");
CREATE INDEX IF NOT EXISTS "Devis_status_idx" ON "Devis"("status");
CREATE INDEX IF NOT EXISTS "Devis_date_idx" ON "Devis"("date");

-- Indexes pour les notifications
CREATE INDEX IF NOT EXISTS "Notification_userId_idx" ON "Notification"("userId");
CREATE INDEX IF NOT EXISTS "Notification_lu_idx" ON "Notification"("lu");
CREATE INDEX IF NOT EXISTS "Notification_userId_lu_idx" ON "Notification"("userId", "lu");
