import { test, expect } from '@playwright/test';

const API_BASE = 'http://localhost:3001';
const FRONTEND_BASE = 'http://localhost:3000';

test.describe('GuinéaManager ERP - Audit End-to-End', () => {
  let authToken: string | null = null;

  test.beforeAll(async ({ request }) => {
    // Start services check
    console.log('Starting audit...');
  });

  test('01 - Backend Health Check', async ({ request }) => {
    const response = await request.get(`${API_BASE}/health`);
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.status).toBe('ok');
    console.log('✓ Backend health OK');
  });

  test('02 - Backend Root Endpoint', async ({ request }) => {
    const response = await request.get(`${API_BASE}/`);
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.name).toContain('GuinéaManager');
    console.log('✓ Backend root OK');
  });

  test('03 - Frontend Homepage', async ({ page }) => {
    await page.goto(FRONTEND_BASE);
    // Should show login page or dashboard
    await expect(page.locator('body')).toBeVisible();
    console.log('✓ Frontend accessible');
  });

  test('04 - Login with Demo Credentials', async ({ request }) => {
    const response = await request.post(`${API_BASE}/api/auth/login`, {
      data: {
        email: 'demo@guineamanager.com',
        password: 'demo123'
      }
    });
    
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.token).toBeDefined();
    authToken = data.token;
    console.log('✓ Login successful');
  });

  test('05 - Get Current User', async ({ request }) => {
    // Skip if no token
    if (!authToken) {
      test.skip();
      return;
    }

    const response = await request.get(`${API_BASE}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    });
    
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.email).toBe('demo@guineamanager.com');
    console.log('✓ User info retrieved');
  });

  test('06 - List Clients', async ({ request }) => {
    if (!authToken) test.skip();

    const response = await request.get(`${API_BASE}/api/clients`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    expect([200, 201]).toContain(response.status());
    console.log('✓ Clients list accessible');
  });

  test('07 - List Produits', async ({ request }) => {
    if (!authToken) test.skip();

    const response = await request.get(`${API_BASE}/api/produits`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    expect([200, 201]).toContain(response.status());
    console.log('✓ Produits list accessible');
  });

  test('08 - List Factures', async ({ request }) => {
    if (!authToken) test.skip();

    const response = await request.get(`${API_BASE}/api/factures`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    expect([200, 201]).toContain(response.status());
    console.log('✓ Factures list accessible');
  });

  test('09 - List Employés', async ({ request }) => {
    if (!authToken) test.skip();

    const response = await request.get(`${API_BASE}/api/employes`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    expect([200, 201]).toContain(response.status());
    console.log('✓ Employés list accessible');
  });

  test('10 - Dashboard Stats', async ({ request }) => {
    if (!authToken) test.skip();

    const response = await request.get(`${API_BASE}/api/dashboard/stats`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    expect([200, 201]).toContain(response.status());
    console.log('✓ Dashboard stats accessible');
  });

  test('11 - Plans List (Public)', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/plans`);
    
    expect([200]).toContain(response.status());
    const data = await response.json();
    expect(Array.isArray(data) || data.plans).toBeTruthy();
    console.log('✓ Plans list accessible');
  });

  test('12 - Unauthorized Access Blocked', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/clients`);
    expect(response.status()).toBe(401);
    console.log('✓ Unauthorized access properly blocked');
  });

  test('13 - Stock Overview', async ({ request }) => {
    if (!authToken) test.skip();

    const response = await request.get(`${API_BASE}/api/stock`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    expect([200, 201]).toContain(response.status());
    console.log('✓ Stock accessible');
  });

  test('14 - Fournisseurs List', async ({ request }) => {
    if (!authToken) test.skip();

    const response = await request.get(`${API_BASE}/api/fournisseurs`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    expect([200, 201]).toContain(response.status());
    console.log('✓ Fournisseurs accessible');
  });

  test('15 - Devis List', async ({ request }) => {
    if (!authToken) test.skip();

    const response = await request.get(`${API_BASE}/api/devis`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    expect([200, 201]).toContain(response.status());
    console.log('✓ Devis accessible');
  });

  test('16 - Commandes List', async ({ request }) => {
    if (!authToken) test.skip();

    const response = await request.get(`${API_BASE}/api/commandes`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    expect([200, 201]).toContain(response.status());
    console.log('✓ Commandes accessible');
  });

  test('17 - Dépenses List', async ({ request }) => {
    if (!authToken) test.skip();

    const response = await request.get(`${API_BASE}/api/depenses`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    expect([200, 201]).toContain(response.status());
    console.log('✓ Dépenses accessible');
  });

  test('18 - Comptabilité Plan', async ({ request }) => {
    if (!authToken) test.skip();

    const response = await request.get(`${API_BASE}/api/comptabilite/plan`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    expect([200, 201, 404]).toContain(response.status());
    console.log('✓ Comptabilité accessible');
  });

  test('19 - Mobile Money Overview', async ({ request }) => {
    if (!authToken) test.skip();

    const response = await request.get(`${API_BASE}/api/mobile-money/overview`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    expect([200, 201]).toContain(response.status());
    console.log('✓ Mobile Money accessible');
  });

  test('20 - Paie Config', async ({ request }) => {
    if (!authToken) test.skip();

    const response = await request.get(`${API_BASE}/api/paie/config`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    expect([200, 201]).toContain(response.status());
    console.log('✓ Paie config accessible');
  });

  test('21 - Frontend Login Page', async ({ page }) => {
    await page.goto(FRONTEND_BASE);
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Check if login form exists
    const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]');
    const passwordInput = page.locator('input[type="password"]');
    
    // Either login form is visible OR we're already logged in
    const hasLoginForm = await emailInput.count() > 0 && await passwordInput.count() > 0;
    const hasDashboard = await page.locator('[class*="sidebar"], nav, [class*="dashboard"]').count() > 0;
    
    expect(hasLoginForm || hasDashboard).toBeTruthy();
    console.log('✓ Frontend login page works');
  });
});
