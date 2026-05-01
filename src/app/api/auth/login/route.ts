import { NextRequest, NextResponse } from 'next/server';

// Demo user data
const DEMO_USER = {
  id: 'demo-user-001',
  email: 'demo@guineamanager.com',
  nom: 'Demo',
  prenom: 'Admin',
  telephone: '+224 624 00 00 00',
  role: 'ADMIN',
  company: {
    id: 'demo-company-001',
    nom: 'Entreprise Demo SARL',
    email: 'demo@guineamanager.com',
    telephone: '+224 624 00 00 00',
    adresse: 'Conakry, Guinée',
    ville: 'Conakry',
    pays: 'Guinée',
    codePays: 'GN',
    devise: 'GNF',
    symboleDevise: 'GNF',
    planId: 'moyenne',
  }
};

// Generate a simple token
function createToken(user: any): string {
  const payload = Buffer.from(JSON.stringify({
    id: user.id,
    email: user.email,
    role: user.role,
    companyId: user.company.id,
    exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60
  })).toString('base64');
  return `demo-token-${payload}`;
}

export async function POST(request: NextRequest) {
  // Set CORS headers for preview environment
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  };

  // Handle preflight
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { status: 204, headers });
  }

  try {
    const body = await request.json();
    const { email, password } = body;

    // Check demo credentials directly
    if (email === 'demo@guineamanager.com' && password === 'demo123') {
      return NextResponse.json({
        success: true,
        data: {
          token: createToken(DEMO_USER),
          user: DEMO_USER
        }
      }, { headers });
    }

    // Try backend for other users
    const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const data = await response.json();
        return NextResponse.json(data, { headers });
      }
    } catch (e) {
      console.error('Backend error:', e);
    }

    return NextResponse.json({
      success: false,
      message: 'Email ou mot de passe incorrect'
    }, { status: 401, headers });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({
      success: false,
      message: 'Erreur serveur'
    }, { status: 500, headers });
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
