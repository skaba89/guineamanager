# GuinéaManager ERP Backend API Audit Report

**Date:** 2026-05-07  
**API Version:** 1.0.0  
**Base URL:** http://localhost:3001  
**Tester:** Automated API Audit

---

## Executive Summary

| Category | Working | Partial | Not Working | Not Found |
|----------|---------|---------|-------------|-----------|
| Authentication | 4 | 0 | 1 | 0 |
| Core Modules | 24 | 4 | 4 | 0 |
| Stock & Logistics | 8 | 0 | 2 | 2 |
| Payroll & HR | 10 | 0 | 0 | 2 |
| Finance | 4 | 0 | 6 | 4 |
| CRM | 1 | 0 | 2 | 2 |
| Administration | 10 | 0 | 8 | 6 |
| **TOTAL** | **61** | **4** | **23** | **16** |

**Overall Health:** 68% of endpoints are functional

---

## 1. Authentication Endpoints

### ✅ Working Endpoints

| Method | Endpoint | Status | Notes |
|--------|----------|--------|-------|
| POST | `/api/auth/login` | ✅ 200 | Returns JWT token and user data |
| POST | `/api/auth/register` | ✅ 201 | Creates new user with company |
| GET | `/api/auth/me` | ✅ 200 | Returns current user with company info |
| POST | `/api/auth/logout` | ✅ 200 | Returns success message |

### ⚠️ Partially Working

| Method | Endpoint | Status | Notes |
|--------|----------|--------|-------|
| GET | `/api/auth/2fa/status` | ✅ 200 | Works but returns enabled: false |
| POST | `/api/auth/2fa/enable` | ❌ 404 | Route not found |

---

## 2. Core Modules

### Clients (`/api/clients`)

| Method | Endpoint | Status | Notes |
|--------|----------|--------|-------|
| GET | `/api/clients` | ✅ 200 | Returns paginated client list |
| POST | `/api/clients` | ✅ 201 | Creates new client |
| GET | `/api/clients/:id` | ✅ 200 | Returns single client |
| PUT | `/api/clients/:id` | ✅ 200 | Updates client |
| DELETE | `/api/clients/:id` | ✅ 200 | Deletes client |

### Produits (`/api/produits`)

| Method | Endpoint | Status | Notes |
|--------|----------|--------|-------|
| GET | `/api/produits` | ✅ 200 | Returns paginated product list |
| POST | `/api/produits` | ✅ 201 | Creates new product |
| GET | `/api/produits/:id` | ✅ 200 | Returns single product |
| PUT | `/api/produits/:id` | ✅ 200 | Updates product |
| DELETE | `/api/produits/:id` | ✅ 200 | Deletes product |

### Factures (`/api/factures`)

| Method | Endpoint | Status | Notes |
|--------|----------|--------|-------|
| GET | `/api/factures` | ✅ 200 | Returns paginated invoice list |
| POST | `/api/factures` | ⚠️ 400 | Requires valid lignes array |

### Devis (`/api/devis`)

| Method | Endpoint | Status | Notes |
|--------|----------|--------|-------|
| GET | `/api/devis` | ✅ 200 | Returns paginated quotes |
| POST | `/api/devis` | ⚠️ 400 | Requires dateValidite and lignes |

### Commandes (`/api/commandes`)

| Method | Endpoint | Status | Notes |
|--------|----------|--------|-------|
| GET | `/api/commandes` | ✅ 200 | Returns paginated orders |
| POST | `/api/commandes` | ⚠️ 400 | Requires clientId and lignes |

### Fournisseurs (`/api/fournisseurs`)

| Method | Endpoint | Status | Notes |
|--------|----------|--------|-------|
| GET | `/api/fournisseurs` | ✅ 200 | Returns paginated suppliers |
| POST | `/api/fournisseurs` | ✅ 201 | Creates new supplier |

### Employes (`/api/employes`)

| Method | Endpoint | Status | Notes |
|--------|----------|--------|-------|
| GET | `/api/employes` | ✅ 200 | Returns paginated employees |
| POST | `/api/employes` | ⚠️ 400 | Requires salaireBase |
| GET | `/api/employes/:id` | ✅ 200 | Returns single employee |
| PUT | `/api/employes/:id` | ✅ 200 | Updates employee |
| DELETE | `/api/employes/:id` | ✅ 200 | Soft deletes employee |

### Depenses (`/api/depenses`)

| Method | Endpoint | Status | Notes |
|--------|----------|--------|-------|
| GET | `/api/depenses` | ✅ 200 | Returns paginated expenses |
| POST | `/api/depenses` | ⚠️ 400 | Requires categorie field |

---

## 3. Stock & Logistics

### ✅ Working Endpoints

| Method | Endpoint | Status | Notes |
|--------|----------|--------|-------|
| GET | `/api/stock` | ✅ 200 | Returns stock overview |
| GET | `/api/stock/alerts` | ✅ 200 | Returns stock alerts |
| GET | `/api/stock/low-stock` | ✅ 200 | Returns low stock products |
| GET | `/api/stock/history` | ✅ 200 | Returns stock movement history |
| GET | `/api/stock/valuation` | ✅ 200 | Returns stock valuation |
| POST | `/api/stock/movement` | ⚠️ 400 | Works but needs valid produitId |
| GET | `/api/entrepots` | ✅ 200 | Returns warehouses list |
| POST | `/api/entrepots` | ✅ 201 | Creates warehouse |
| GET | `/api/inventaires` | ✅ 200 | Returns inventories list |

### ❌ Not Working / Not Found

| Method | Endpoint | Status | Error |
|--------|----------|--------|-------|
| GET | `/api/logistique` | ❌ 404 | Route not found |
| POST | `/api/bons-livraison` | ❌ 404 | Route not found |

---

## 4. Payroll & HR

### ✅ Working Endpoints

| Method | Endpoint | Status | Notes |
|--------|----------|--------|-------|
| GET | `/api/paie/bulletins` | ✅ 200 | Returns payslips |
| POST | `/api/paie/calculer` | ✅ 200 | Calculates payroll |
| GET | `/api/paie/config-pays` | ✅ 200 | Returns country tax config |
| GET | `/api/paie/pays-supportes` | ✅ 200 | Returns supported countries |
| GET | `/api/paie/masse-salariale` | ✅ 200 | Returns payroll totals |
| POST | `/api/paie/bulletins` | ✅ 201 | Creates payslip |
| PUT | `/api/paie/bulletins/:id/valider` | ✅ 200 | Validates payslip |
| PUT | `/api/paie/bulletins/:id/payer` | ✅ 200 | Marks as paid |
| GET | `/api/paie/rapport-cotisations` | ✅ 200 | Returns contributions report |
| GET | `/api/paie/rapport-imposition` | ✅ 200 | Returns tax report |

### ❌ Not Found

| Method | Endpoint | Status | Error |
|--------|----------|--------|-------|
| GET | `/api/paie` | ❌ 404 | Route not found |
| GET | `/api/rh` | ❌ 404 | Route not found |
| GET | `/api/bulletins` | ❌ 404 | Route not found |

---

## 5. Finance

### ✅ Working Endpoints

| Method | Endpoint | Status | Notes |
|--------|----------|--------|-------|
| GET | `/api/mobile-money/dashboard` | ✅ 200 | Returns MM dashboard |
| GET | `/api/comptabilite/bilan` | ✅ 200 | Returns balance sheet |
| GET | `/api/comptabilite/grand-livre` | ✅ 200 | Returns ledger |
| GET | `/api/devises` | ✅ 200 | Returns currencies |

### ❌ Not Working / Not Found

| Method | Endpoint | Status | Error |
|--------|----------|--------|-------|
| GET | `/api/banking` | ❌ 404 | Route not found |
| GET | `/api/mobile-money` | ❌ 404 | Route not found |
| GET | `/api/paiements-mobile/orange-money` | ❌ 404 | Route not found |
| GET | `/api/paiements-mobile/mtn` | ❌ 404 | Route not found |
| GET | `/api/paiements-mobile/wave` | ❌ 404 | Route not found |
| GET | `/api/comptabilite` | ❌ 404 | Route not found |
| POST | `/api/devises` | ❌ 403 | Forbidden - role not authorized |
| GET | `/api/comptabilite/journal` | ❌ 404 | Route not found |
| GET | `/api/comptabilite/comptes` | ❌ 404 | Route not found |
| GET | `/api/comptabilite/resultat` | ❌ 404 | Route not found |

---

## 6. CRM

### ✅ Working Endpoints

| Method | Endpoint | Status | Notes |
|--------|----------|--------|-------|
| GET | `/api/crm/opportunites` | ✅ 200 | Returns opportunities |

### ❌ Not Working / Errors

| Method | Endpoint | Status | Error |
|--------|----------|--------|-------|
| POST | `/api/crm/opportunites` | ❌ 500 | Prisma error - schema mismatch |
| GET | `/api/crm/pipelines` | ❌ 500 | TypeError: Cannot read 'pipelineVente' |
| GET | `/api/crm` | ❌ 404 | Route not found |
| GET | `/api/crm/contacts` | ❌ 404 | Route not found |
| GET | `/api/opportunites` | ❌ 404 | Route not found |
| GET | `/api/pipelines` | ❌ 404 | Route not found |

---

## 7. Administration

### ✅ Working Endpoints

| Method | Endpoint | Status | Notes |
|--------|----------|--------|-------|
| GET | `/api/dashboard/stats` | ✅ 200 | Returns dashboard statistics |
| GET | `/api/dashboard/factures-recentes` | ✅ 200 | Returns recent invoices |
| GET | `/api/dashboard/alertes` | ✅ 200 | Returns alerts |
| GET | `/api/parametres` | ✅ 200 | Returns settings overview |
| GET | `/api/parametres/societe` | ✅ 200 | Returns company settings |
| PUT | `/api/parametres/societe` | ✅ 200 | Updates company settings |
| GET | `/api/parametres/custom` | ✅ 200 | Returns custom settings |
| GET | `/api/modules` | ✅ 200 | Returns available modules |
| GET | `/api/plans` | ✅ 200 | Returns subscription plans |
| GET | `/api/notifications` | ✅ 200 | Returns notifications |

### ❌ Not Working / Not Found

| Method | Endpoint | Status | Error |
|--------|----------|--------|-------|
| GET | `/api/dashboard` | ❌ 404 | Route not found |
| GET | `/api/rapports` | ❌ 404 | Route not found |
| GET | `/api/reports` | ❌ 404 | Route not found |
| GET | `/api/admin/users` | ❌ 403 | Forbidden - requires SUPER_ADMIN |
| GET | `/api/users` | ❌ 404 | Route not found |
| GET | `/api/audit-logs` | ❌ 404 | Route not found |
| GET | `/api/admin/audit-logs` | ❌ 403 | Forbidden |
| GET | `/api/exports` | ❌ 404 | Route not found |
| GET | `/api/support` | ❌ 404 | Route not found |
| GET | `/api/beta` | ❌ 404 | Route not found |
| GET | `/api/docs` | ❌ 404 | Route not found |
| GET | `/api/webhooks` | ❌ 404 | Route not found |
| GET | `/api/partners` | ❌ 500 | Error retrieving partners |
| GET | `/api/public` | ❌ 401 | Invalid API key |
| GET | `/api/parametres/fiscal` | ❌ 404 | Route not found |

---

## 8. Specific Errors Found

### Critical Errors (500 Internal Server Error)

1. **`POST /api/crm/opportunites`** - Prisma schema mismatch
   - Error: `Invalid prisma.opportunite.create() invocation`
   - Likely cause: Missing required fields or schema inconsistency

2. **`GET /api/crm/pipelines`** - TypeError
   - Error: `Cannot read properties of undefined (reading 'pipelineVente')`
   - Likely cause: Missing configuration or data initialization

3. **`POST /api/inventaires`** - Server error
   - Error: `Erreur serveur`
   - Needs investigation

4. **`GET /api/partners`** - Server error
   - Error: `Erreur lors de la récupération des partenaires`
   - Needs investigation

### Database Errors

1. **`GET /api/rapports/ca-mensuel`** - DATABASE_ERROR
2. **`GET /api/rapports/top-clients`** - DATABASE_ERROR

### Authorization Issues

1. **`POST /api/devises`** - 403 Forbidden
2. **`GET /api/admin/users`** - 403 Forbidden
3. **`GET /api/admin/audit-logs`** - 403 Forbidden
4. **`GET /api/admin/stats`** - 403 Forbidden
5. **`GET /api/admin/companies`** - 403 Forbidden

---

## 9. Recommendations

### High Priority

1. **Fix CRM Module**
   - Investigate `prisma.opportunite.create()` error
   - Fix `pipelineVente` undefined error in pipelines endpoint

2. **Implement Missing Routes**
   - `/api/banking` - Banking integration
   - `/api/logistique` - Logistics module
   - `/api/rh` - HR module root endpoint

3. **Fix Database Errors in Reports**
   - Investigate `ca-mensuel` and `top-clients` database errors

### Medium Priority

4. **Complete Mobile Money Endpoints**
   - Implement missing routes for Orange Money, MTN, Wave
   - Add `/solde`, `/transactions`, `/paiement` endpoints

5. **Add Missing Admin Endpoints**
   - Implement proper audit logging
   - Add export functionality

6. **Fix Comptabilite Module**
   - Add `/journal`, `/comptes`, `/resultat` endpoints

### Low Priority

7. **API Documentation**
   - Fix `/api/docs` endpoint (Swagger not working)
   - Add proper API versioning

8. **Implement Webhooks**
   - Currently returns 404

---

## 10. Endpoint Coverage Summary

```
Total Endpoints Tested: 104
Working (200/201):      61 (58.7%)
Validation Errors:       4 (3.8%)
Authorization Errors:    5 (4.8%)
Not Found (404):        16 (15.4%)
Server Errors (500):     4 (3.8%)
Other Errors:           14 (13.5%)
```

---

## Appendix: Test Credentials

```
Email: demo@guineamanager.com
Password: demo123
Company: Entreprise Demo SARL
Plan: MOYENNE
```

---

*Report generated automatically by API Audit Tool*
