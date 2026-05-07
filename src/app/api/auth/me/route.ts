import { NextRequest, NextResponse } from 'next/server';

// Demo user data (same as login route)
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

function verifyDemoToken(token: string): any | null {
  // Check if it's a demo token
  if (token.startsWith('demo-token-')) {
    try {
      const payload = token.replace('demo-token-', '');
      const decoded = JSON.parse(Buffer.from(payload, 'base64').toString());
      
      // Check expiration
      if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
        return null;
      }
      
      return decoded;
    } catch {
      return null;
    }
  }
  return null;
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({
        success: false,
        message: 'Token non fourni'
      }, { status: 401 });
    }
    
    // Check if it's a demo token
    const demoPayload = verifyDemoToken(token);
    if (demoPayload) {
      return NextResponse.json({
        success: true,
        data: DEMO_USER
      });
    }
    
    // Try backend for real tokens
    const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        return NextResponse.json(await response.json());
      }
    } catch (e) {
      // Backend unavailable
    }
    
    return NextResponse.json({
      success: false,
      message: 'Token invalide ou expiré'
    }, { status: 401 });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Erreur serveur'
    }, { status: 500 });
  }
}
