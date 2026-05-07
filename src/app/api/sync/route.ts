/**
 * GuinéaManager - Sync API Endpoint
 * API pour la synchronisation des données offline
 */

import { NextRequest, NextResponse } from 'next/server';

// GET: Récupérer les dernières données pour synchronisation
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');
    const since = searchParams.get('since');

    // TODO: Récupérer les données depuis la base de données
    // Pour l'instant, retourner une réponse de succès
    const response = {
      success: true,
      timestamp: Date.now(),
      data: [],
      message: 'Synchronisation réussie'
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[API Sync] Erreur:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la synchronisation' },
      { status: 500 }
    );
  }
}

// POST: Recevoir les données synchronisées depuis le client
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data, clientId } = body;

    console.log('[API Sync] Données reçues:', { type, clientId, count: Array.isArray(data) ? data.length : 1 });

    // TODO: Sauvegarder les données dans la base de données
    // Pour l'instant, retourner une réponse de succès

    return NextResponse.json({
      success: true,
      timestamp: Date.now(),
      message: 'Données synchronisées avec succès'
    });
  } catch (error) {
    console.error('[API Sync] Erreur:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la synchronisation' },
      { status: 500 }
    );
  }
}
