# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: audit.spec.ts >> GuinéaManager ERP - Audit End-to-End >> 11 - Plans List (Public)
- Location: e2e/audit.spec.ts:126:7

# Error details

```
Error: expect(received).toBeTruthy()

Received: undefined
```

# Test source

```ts
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
  45  |     expect(response.status()).toBe(200);
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
> 131 |     expect(Array.isArray(data) || data.plans).toBeTruthy();
      |                                               ^ Error: expect(received).toBeTruthy()
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
  146 |     });
  147 |     
  148 |     expect([200, 201]).toContain(response.status());
  149 |     console.log('✓ Stock accessible');
  150 |   });
  151 | 
  152 |   test('14 - Fournisseurs List', async ({ request }) => {
  153 |     if (!authToken) test.skip();
  154 | 
  155 |     const response = await request.get(`${API_BASE}/api/fournisseurs`, {
  156 |       headers: { Authorization: `Bearer ${authToken}` }
  157 |     });
  158 |     
  159 |     expect([200, 201]).toContain(response.status());
  160 |     console.log('✓ Fournisseurs accessible');
  161 |   });
  162 | 
  163 |   test('15 - Devis List', async ({ request }) => {
  164 |     if (!authToken) test.skip();
  165 | 
  166 |     const response = await request.get(`${API_BASE}/api/devis`, {
  167 |       headers: { Authorization: `Bearer ${authToken}` }
  168 |     });
  169 |     
  170 |     expect([200, 201]).toContain(response.status());
  171 |     console.log('✓ Devis accessible');
  172 |   });
  173 | 
  174 |   test('16 - Commandes List', async ({ request }) => {
  175 |     if (!authToken) test.skip();
  176 | 
  177 |     const response = await request.get(`${API_BASE}/api/commandes`, {
  178 |       headers: { Authorization: `Bearer ${authToken}` }
  179 |     });
  180 |     
  181 |     expect([200, 201]).toContain(response.status());
  182 |     console.log('✓ Commandes accessible');
  183 |   });
  184 | 
  185 |   test('17 - Dépenses List', async ({ request }) => {
  186 |     if (!authToken) test.skip();
  187 | 
  188 |     const response = await request.get(`${API_BASE}/api/depenses`, {
  189 |       headers: { Authorization: `Bearer ${authToken}` }
  190 |     });
  191 |     
  192 |     expect([200, 201]).toContain(response.status());
  193 |     console.log('✓ Dépenses accessible');
  194 |   });
  195 | 
  196 |   test('18 - Comptabilité Plan', async ({ request }) => {
  197 |     if (!authToken) test.skip();
  198 | 
  199 |     const response = await request.get(`${API_BASE}/api/comptabilite/plan`, {
  200 |       headers: { Authorization: `Bearer ${authToken}` }
  201 |     });
  202 |     
  203 |     expect([200, 201, 404]).toContain(response.status());
  204 |     console.log('✓ Comptabilité accessible');
  205 |   });
  206 | 
  207 |   test('19 - Mobile Money Overview', async ({ request }) => {
  208 |     if (!authToken) test.skip();
  209 | 
  210 |     const response = await request.get(`${API_BASE}/api/mobile-money/overview`, {
  211 |       headers: { Authorization: `Bearer ${authToken}` }
  212 |     });
  213 |     
  214 |     expect([200, 201]).toContain(response.status());
  215 |     console.log('✓ Mobile Money accessible');
  216 |   });
  217 | 
  218 |   test('20 - Paie Config', async ({ request }) => {
  219 |     if (!authToken) test.skip();
  220 | 
  221 |     const response = await request.get(`${API_BASE}/api/paie/config`, {
  222 |       headers: { Authorization: `Bearer ${authToken}` }
  223 |     });
  224 |     
  225 |     expect([200, 201]).toContain(response.status());
  226 |     console.log('✓ Paie config accessible');
  227 |   });
  228 | 
  229 |   test('21 - Frontend Login Page', async ({ page }) => {
  230 |     await page.goto(FRONTEND_BASE);
  231 |     
```