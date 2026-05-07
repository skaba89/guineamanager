import { NextRequest, NextResponse } from 'next/server';

// Simple ID generator
function generateId(): string {
  return 'user-' + Math.random().toString(36).substring(2, 15);
}

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

// Country configurations
const COUNTRY_CONFIG: Record<string, { devise: string; symbole: string }> = {
  'GN': { devise: 'GNF', symbole: 'GNF' },
  'SN': { devise: 'XOF', symbole: 'FCFA' },
  'ML': { devise: 'XOF', symbole: 'FCFA' },
  'CI': { devise: 'XOF', symbole: 'FCFA' },
  'BF': { devise: 'XOF', symbole: 'FCFA' },
  'BJ': { devise: 'XOF', symbole: 'FCFA' },
  'NE': { devise: 'XOF', symbole: 'FCFA' },
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, nom, prenom, telephone, companyName, pays, codePays } = body;

    // Validation
    if (!email || !password || !nom || !prenom || !companyName) {
      return NextResponse.json({
        success: false,
        message: 'Tous les champs obligatoires doivent être remplis'
      }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({
        success: false,
        message: 'Le mot de passe doit contenir au moins 6 caractères'
      }, { status: 400 });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({
        success: false,
        message: 'Email invalide'
      }, { status: 400 });
    }

    // Try backend first
    const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        return NextResponse.json(await response.json());
      }
    } catch (e) {
      // Backend unavailable, use demo mode
    }

    // Demo mode - create a mock user
    const countryCode = codePays || 'GN';
    const countryConfig = COUNTRY_CONFIG[countryCode] || COUNTRY_CONFIG['GN'];
    
    const newUser = {
      id: generateId(),
      email: email,
      nom: nom,
      prenom: prenom,
      telephone: telephone || null,
      role: 'ADMIN',
      company: {
        id: 'company-' + generateId(),
        nom: companyName,
        email: email,
        telephone: telephone || null,
        adresse: null,
        ville: null,
        pays: pays || 'Guinée',
        codePays: countryCode,
        devise: countryConfig.devise,
        symboleDevise: countryConfig.symbole,
        planId: 'petite',
      }
    };

    // In demo mode, we simulate successful registration
    // In production, this would create an actual account in the database
    console.log('[Demo Mode] Registration request for:', email);

    return NextResponse.json({
      success: true,
      message: 'Compte créé avec succès (mode démo)',
      data: {
        token: createToken(newUser),
        user: newUser
      }
    });

  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({
      success: false,
      message: 'Erreur serveur'
    }, { status: 500 });
  }
}
