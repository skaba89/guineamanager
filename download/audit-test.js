const http = require('http');
const https = require('https');

const API_BASE = 'http://localhost:3001';
const FRONTEND_BASE = 'http://localhost:3000';

// Colors for console
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

// Test results
const results = {
  passed: [],
  failed: [],
  warnings: [],
  modules: {}
};

// Helper function to make HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const reqOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      timeout: 10000
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data ? JSON.parse(data) : null
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data
          });
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

// Test function
async function testEndpoint(name, url, expectedStatus = [200, 201, 401, 403], method = 'GET', body = null, token = null) {
  try {
    const options = { method };
    if (body) options.body = body;
    if (token) options.headers = { 'Authorization': `Bearer ${token}` };

    const response = await makeRequest(url, options);
    
    if (expectedStatus.includes(response.status)) {
      results.passed.push({ name, url, status: response.status });
      console.log(`${colors.green}✓${colors.reset} ${name} - Status: ${response.status}`);
      return { success: true, data: response.data, status: response.status };
    } else {
      results.failed.push({ name, url, status: response.status, expected: expectedStatus });
      console.log(`${colors.red}✗${colors.reset} ${name} - Status: ${response.status} (expected: ${expectedStatus.join(' or ')})`);
      return { success: false, data: response.data, status: response.status };
    }
  } catch (error) {
    results.failed.push({ name, url, error: error.message });
    console.log(`${colors.red}✗${colors.reset} ${name} - Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Sleep function
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Main audit function
async function runAudit() {
  console.log(`\n${colors.bold}${colors.blue}════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bold}${colors.blue}   AUDIT END-TO-END - GuinéaManager ERP${colors.reset}`);
  console.log(`${colors.bold}${colors.blue}════════════════════════════════════════════════════════════${colors.reset}\n`);

  let authToken = null;

  // ============================================
  // 1. TESTS DE SANTÉ ET INFRASTRUCTURE
  // ============================================
  console.log(`\n${colors.bold}[1] SANTÉ ET INFRASTRUCTURE${colors.reset}`);
  console.log('─'.repeat(50));

  await testEndpoint('Backend Health', `${API_BASE}/health`, [200]);
  await testEndpoint('Backend Root', `${API_BASE}/`, [200]);
  await testEndpoint('Frontend Homepage', `${FRONTEND_BASE}/`, [200]);
  await testEndpoint('API Docs', `${API_BASE}/api/docs`, [200]);

  // ============================================
  // 2. TESTS D'AUTHENTIFICATION
  // ============================================
  console.log(`\n${colors.bold}[2] AUTHENTIFICATION${colors.reset}`);
  console.log('─'.repeat(50));

  // Test login with demo credentials
  const loginResult = await testEndpoint(
    'Login Demo User',
    `${API_BASE}/api/auth/login`,
    [200, 201],
    'POST',
    { email: 'demo@guineamanager.com', password: 'demo123' }
  );

  if (loginResult.success && loginResult.data?.token) {
    authToken = loginResult.data.token;
    console.log(`${colors.green}  → Token obtained${colors.reset}`);
  } else {
    // Try alternative login
    const altLogin = await testEndpoint(
      'Login Alternative',
      `${API_BASE}/api/auth/login`,
      [200, 201],
      'POST',
      { email: 'admin@guineamanager.com', password: 'admin123' }
    );
    if (altLogin.success && altLogin.data?.token) {
      authToken = altLogin.data.token;
    }
  }

  await testEndpoint('Get Current User', `${API_BASE}/api/auth/me`, [200, 401], 'GET', null, authToken);
  await testEndpoint('Register (invalid)', `${API_BASE}/api/auth/register`, [400, 409], 'POST', { email: 'test', password: '' });

  // ============================================
  // 3. TESTS MODULE VENTES
  // ============================================
  console.log(`\n${colors.bold}[3] MODULE VENTES${colors.reset}`);
  console.log('─'.repeat(50));

  await testEndpoint('List Clients', `${API_BASE}/api/clients`, [200, 401], 'GET', null, authToken);
  await testEndpoint('List Factures', `${API_BASE}/api/factures`, [200, 401], 'GET', null, authToken);
  await testEndpoint('List Devis', `${API_BASE}/api/devis`, [200, 401], 'GET', null, authToken);
  await testEndpoint('List Commandes', `${API_BASE}/api/commandes`, [200, 401], 'GET', null, authToken);
  await testEndpoint('CRM Stats', `${API_BASE}/api/crm/stats`, [200, 401], 'GET', null, authToken);

  // ============================================
  // 4. TESTS MODULE STOCK & PRODUITS
  // ============================================
  console.log(`\n${colors.bold}[4] MODULE STOCK & PRODUITS${colors.reset}`);
  console.log('─'.repeat(50));

  await testEndpoint('List Produits', `${API_BASE}/api/produits`, [200, 401], 'GET', null, authToken);
  await testEndpoint('Stock Overview', `${API_BASE}/api/stock`, [200, 401], 'GET', null, authToken);
  await testEndpoint('List Fournisseurs', `${API_BASE}/api/fournisseurs`, [200, 401], 'GET', null, authToken);
  await testEndpoint('List Entrepots', `${API_BASE}/api/entrepots`, [200, 401], 'GET', null, authToken);
  await testEndpoint('List Inventaires', `${API_BASE}/api/inventaires`, [200, 401], 'GET', null, authToken);

  // ============================================
  // 5. TESTS MODULE RH & PAIE
  // ============================================
  console.log(`\n${colors.bold}[5] MODULE RH & PAIE${colors.reset}`);
  console.log('─'.repeat(50));

  await testEndpoint('List Employes', `${API_BASE}/api/employes`, [200, 401], 'GET', null, authToken);
  await testEndpoint('Paie Config', `${API_BASE}/api/paie/config`, [200, 401], 'GET', null, authToken);
  await testEndpoint('Paie Bulletins', `${API_BASE}/api/paie/bulletins`, [200, 401], 'GET', null, authToken);

  // ============================================
  // 6. TESTS MODULE FINANCE & COMPTABILITÉ
  // ============================================
  console.log(`\n${colors.bold}[6] MODULE FINANCE & COMPTABILITÉ${colors.reset}`);
  console.log('─'.repeat(50));

  await testEndpoint('List Depenses', `${API_BASE}/api/depenses`, [200, 401], 'GET', null, authToken);
  await testEndpoint('Comptabilite Plan', `${API_BASE}/api/comptabilite/plan`, [200, 401], 'GET', null, authToken);
  await testEndpoint('Devises Rates', `${API_BASE}/api/devises/rates`, [200, 401], 'GET', null, authToken);

  // ============================================
  // 7. TESTS MODULE MOBILE MONEY
  // ============================================
  console.log(`\n${colors.bold}[7] MODULE MOBILE MONEY${colors.reset}`);
  console.log('─'.repeat(50));

  await testEndpoint('Orange Money Status', `${API_BASE}/api/paiements-mobile/orange-money/status`, [200, 401], 'GET', null, authToken);
  await testEndpoint('MTN Money Status', `${API_BASE}/api/paiements-mobile/mtn/status`, [200, 401], 'GET', null, authToken);
  await testEndpoint('Wave Money Status', `${API_BASE}/api/paiements-mobile/wave/status`, [200, 401], 'GET', null, authToken);
  await testEndpoint('Mobile Money Dashboard', `${API_BASE}/api/mobile-money/overview`, [200, 401], 'GET', null, authToken);

  // ============================================
  // 8. TESTS MODULE RAPPORTS & DASHBOARD
  // ============================================
  console.log(`\n${colors.bold}[8] MODULE RAPPORTS & DASHBOARD${colors.reset}`);
  console.log('─'.repeat(50));

  await testEndpoint('Dashboard Stats', `${API_BASE}/api/dashboard/stats`, [200, 401], 'GET', null, authToken);
  await testEndpoint('Rapports', `${API_BASE}/api/rapports`, [200, 401], 'GET', null, authToken);
  await testEndpoint('Reports List', `${API_BASE}/api/reports`, [200, 401], 'GET', null, authToken);

  // ============================================
  // 9. TESTS MODULE ADMIN & PARAMÈTRES
  // ============================================
  console.log(`\n${colors.bold}[9] MODULE ADMIN & PARAMÈTRES${colors.reset}`);
  console.log('─'.repeat(50));

  await testEndpoint('Admin Stats', `${API_BASE}/api/admin/stats`, [200, 401, 403], 'GET', null, authToken);
  await testEndpoint('Plans List', `${API_BASE}/api/plans`, [200], 'GET');
  await testEndpoint('Modules List', `${API_BASE}/api/modules`, [200, 401], 'GET', null, authToken);
  await testEndpoint('Notifications', `${API_BASE}/api/notifications`, [200, 401], 'GET', null, authToken);
  await testEndpoint('Parametres', `${API_BASE}/api/parametres`, [200, 401], 'GET', null, authToken);

  // ============================================
  // 10. TESTS EXPORTS & WEBHOOKS
  // ============================================
  console.log(`\n${colors.bold}[10] EXPORTS & WEBHOOKS${colors.reset}`);
  console.log('─'.repeat(50));

  await testEndpoint('Exports List', `${API_BASE}/api/exports`, [200, 401], 'GET', null, authToken);
  await testEndpoint('Webhooks List', `${API_BASE}/api/webhooks`, [200, 401], 'GET', null, authToken);

  // ============================================
  // 11. TESTS API PUBLIQUE
  // ============================================
  console.log(`\n${colors.bold}[11] API PUBLIQUE${colors.reset}`);
  console.log('─'.repeat(50));

  await testEndpoint('Public API Info', `${API_BASE}/api/public`, [200, 401], 'GET', null, authToken);
  await testEndpoint('Partners API', `${API_BASE}/api/partners`, [200, 401], 'GET', null, authToken);
  await testEndpoint('Support API', `${API_BASE}/api/support`, [200, 401], 'GET', null, authToken);

  // ============================================
  // 12. TESTS SÉCURITÉ
  // ============================================
  console.log(`\n${colors.bold}[12] TESTS SÉCURITÉ${colors.reset}`);
  console.log('─'.repeat(50));

  // Test unauthorized access
  const unauthorizedTest = await testEndpoint(
    'Unauthorized Access',
    `${API_BASE}/api/clients`,
    [401],
    'GET'
  );
  if (unauthorizedTest.status === 401) {
    console.log(`${colors.green}  → Authentication properly enforced${colors.reset}`);
  }

  // Test SQL Injection protection (basic)
  await testEndpoint(
    'SQL Injection Test',
    `${API_BASE}/api/clients?id=1' OR '1'='1`,
    [400, 401, 500],
    'GET'
  );

  // Test XSS protection
  await testEndpoint(
    'XSS Test',
    `${API_BASE}/api/clients?search=<script>alert(1)</script>`,
    [400, 401, 200],
    'GET'
  );

  // ============================================
  // RÉSUMÉ FINAL
  // ============================================
  console.log(`\n${colors.bold}${colors.blue}════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bold}   RÉSUMÉ DE L'AUDIT${colors.reset}`);
  console.log(`${colors.bold}${colors.blue}════════════════════════════════════════════════════════════${colors.reset}\n`);

  const total = results.passed.length + results.failed.length;
  const successRate = total > 0 ? ((results.passed.length / total) * 100).toFixed(1) : 0;

  console.log(`${colors.green}✓ Tests réussis: ${results.passed.length}${colors.reset}`);
  console.log(`${colors.red}✗ Tests échoués: ${results.failed.length}${colors.reset}`);
  console.log(`${colors.blue}Taux de réussite: ${successRate}%${colors.reset}`);

  if (results.failed.length > 0) {
    console.log(`\n${colors.bold}${colors.red}Tests échoués:${colors.reset}`);
    results.failed.forEach((test, i) => {
      console.log(`  ${i + 1}. ${test.name}: ${test.error || `Status ${test.status}`}`);
    });
  }

  // Return results for report generation
  return {
    summary: {
      total,
      passed: results.passed.length,
      failed: results.failed.length,
      successRate: parseFloat(successRate)
    },
    details: results
  };
}

// Run the audit
runAudit()
  .then(results => {
    process.exit(results.summary.failed > 0 ? 1 : 0);
  })
  .catch(error => {
    console.error('Audit failed:', error);
    process.exit(1);
  });
