# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: audit.spec.ts >> GuinéaManager ERP - Audit End-to-End >> 04 - Login with Demo Credentials
- Location: e2e/audit.spec.ts:37:7

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 200
Received: 401
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | const API_BASE = 'http://localhost:3001';
  4   | const FRONTEND_BASE = 'http://localhost:3000';
  5   | 
  6   | test.describe('GuinéaManager ERP - Audit End-to-End', () => {
  7   |   let authToken: string | null = null;
  8   | 
  9   |   test.beforeAll(async ({ request }) => {
  10  |     // Start services check
  11  |     console.log('Starting audit...');
  12  |   });
  13  | 
  14  |   test('01 - Backend Health Check', async ({ request }) => {
  15  |     const response = await request.get(`${API_BASE}/health`);
  16  |     expect(response.status()).toBe(200);
  17  |     const data = await response.json();
  18  |     expect(data.status).toBe('ok');
  19  |     console.log('✓ Backend health OK');
  20  |   });
  21  | 
  22  |   test('02 - Backend Root Endpoint', async ({ request }) => {
  23  |     const response = await request.get(`${API_BASE}/`);
  24  |     expect(response.status()).toBe(200);
  25  |     const data = await response.json();
  26  |     expect(data.name).toContain('GuinéaManager');
  27  |     console.log('✓ Backend root OK');
  28  |   });
  29  | 
  30  |   test('03 - Frontend Homepage', async ({ page }) => {
  31  |     await page.goto(FRONTEND_BASE);
  32  |     // Should show login page or dashboard
  33  |     await expect(page.locator('body')).toBeVisible();
  34  |     console.log('✓ Frontend accessible');
  35  |   });
  36  | 
  37  |   test('04 - Login with Demo Credentials', async ({ request }) => {
  38  |     const response = await request.post(`${API_BASE}/api/auth/login`, {
  39  |       data: {
  40  |         email: 'demo@guineamanager.com',
  41  |         password: 'demo123'
  42  |       }
  43  |     });
  44  |     
> 45  |     expect(response.status()).toBe(200);
      |                               ^ Error: expect(received).toBe(expected) // Object.is equality
  46  |     const data = await response.json();
  47  |     expect(data.token).toBeDefined();
  48  |     authToken = data.token;
  49  |     console.log('✓ Login successful');
  50  |   });
  51  | 
  52  |   test('05 - Get Current User', async ({ request }) => {
  53  |     // Skip if no token
  54  |     if (!authToken) {
  55  |       test.skip();
  56  |       return;
  57  |     }
  58  | 
  59  |     const response = await request.get(`${API_BASE}/api/auth/me`, {
  60  |       headers: {
  61  |         Authorization: `Bearer ${authToken}`
  62  |       }
  63  |     });
  64  |     
  65  |     expect(response.status()).toBe(200);
  66  |     const data = await response.json();
  67  |     expect(data.email).toBe('demo@guineamanager.com');
  68  |     console.log('✓ User info retrieved');
  69  |   });
  70  | 
  71  |   test('06 - List Clients', async ({ request }) => {
  72  |     if (!authToken) test.skip();
  73  | 
  74  |     const response = await request.get(`${API_BASE}/api/clients`, {
  75  |       headers: { Authorization: `Bearer ${authToken}` }
  76  |     });
  77  |     
  78  |     expect([200, 201]).toContain(response.status());
  79  |     console.log('✓ Clients list accessible');
  80  |   });
  81  | 
  82  |   test('07 - List Produits', async ({ request }) => {
  83  |     if (!authToken) test.skip();
  84  | 
  85  |     const response = await request.get(`${API_BASE}/api/produits`, {
  86  |       headers: { Authorization: `Bearer ${authToken}` }
  87  |     });
  88  |     
  89  |     expect([200, 201]).toContain(response.status());
  90  |     console.log('✓ Produits list accessible');
  91  |   });
  92  | 
  93  |   test('08 - List Factures', async ({ request }) => {
  94  |     if (!authToken) test.skip();
  95  | 
  96  |     const response = await request.get(`${API_BASE}/api/factures`, {
  97  |       headers: { Authorization: `Bearer ${authToken}` }
  98  |     });
  99  |     
  100 |     expect([200, 201]).toContain(response.status());
  101 |     console.log('✓ Factures list accessible');
  102 |   });
  103 | 
  104 |   test('09 - List Employés', async ({ request }) => {
  105 |     if (!authToken) test.skip();
  106 | 
  107 |     const response = await request.get(`${API_BASE}/api/employes`, {
  108 |       headers: { Authorization: `Bearer ${authToken}` }
  109 |     });
  110 |     
  111 |     expect([200, 201]).toContain(response.status());
  112 |     console.log('✓ Employés list accessible');
  113 |   });
  114 | 
  115 |   test('10 - Dashboard Stats', async ({ request }) => {
  116 |     if (!authToken) test.skip();
  117 | 
  118 |     const response = await request.get(`${API_BASE}/api/dashboard/stats`, {
  119 |       headers: { Authorization: `Bearer ${authToken}` }
  120 |     });
  121 |     
  122 |     expect([200, 201]).toContain(response.status());
  123 |     console.log('✓ Dashboard stats accessible');
  124 |   });
  125 | 
  126 |   test('11 - Plans List (Public)', async ({ request }) => {
  127 |     const response = await request.get(`${API_BASE}/api/plans`);
  128 |     
  129 |     expect([200]).toContain(response.status());
  130 |     const data = await response.json();
  131 |     expect(Array.isArray(data) || data.plans).toBeTruthy();
  132 |     console.log('✓ Plans list accessible');
  133 |   });
  134 | 
  135 |   test('12 - Unauthorized Access Blocked', async ({ request }) => {
  136 |     const response = await request.get(`${API_BASE}/api/clients`);
  137 |     expect(response.status()).toBe(401);
  138 |     console.log('✓ Unauthorized access properly blocked');
  139 |   });
  140 | 
  141 |   test('13 - Stock Overview', async ({ request }) => {
  142 |     if (!authToken) test.skip();
  143 | 
  144 |     const response = await request.get(`${API_BASE}/api/stock`, {
  145 |       headers: { Authorization: `Bearer ${authToken}` }
```