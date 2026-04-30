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

// Simple JWT-like token
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
  try {
    const body = await request.json();
    const { email, password } = body;

    // Check demo credentials
    if (email === 'demo@guineamanager.com' && password === 'demo123') {
      return NextResponse.json({
        success: true,
        data: {
          token: createToken(DEMO_USER),
          user: DEMO_USER
        }
      });
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
        return NextResponse.json(await response.json());
      }
    } catch (e) {
      // Backend unavailable
    }

    return NextResponse.json({
      success: false,
      message: 'Email ou mot de passe incorrect'
    }, { status: 401 });

  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Erreur serveur'
    }, { status: 500 });
  }
}
