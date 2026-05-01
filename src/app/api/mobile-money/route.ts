import { NextRequest, NextResponse } from 'next/server';

// Types for Mobile Money transactions
interface MobileMoneyTransaction {
  id: string;
  type: 'RECU' | 'ENVOYE' | 'RETRAIT' | 'DEPOT';
  operateur: 'ORANGE' | 'MTN' | 'WAVE';
  montant: number;
  frais: number;
  reference: string;
  statut: 'EN_ATTENTE' | 'CONFIRME' | 'ECHOUE' | 'ANNULE';
  dateTransaction: string;
  numeroExpediteur?: string;
  numeroDestinataire?: string;
  motif?: string;
}

// Orange Money API Integration (Guinée)
async function initOrangeMoneyPayment(data: {
  montant: number;
  telephone: string;
  reference: string;
  motif: string;
}) {
  // In production, use actual Orange Money API
  // Documentation: https://developer.orange.com/apis/om-wa-api-standard
  
  const ORANGE_MONEY_API = process.env.ORANGE_MONEY_API_URL || 'https://api.orange.com/om/v2';
  const ORANGE_MONEY_TOKEN = process.env.ORANGE_MONEY_TOKEN;
  
  try {
    // Simulate API call for demo
    const response = {
      success: true,
      transactionId: `OM_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'PENDING',
      message: 'Demande de paiement envoyée. Veuillez confirmer sur votre téléphone.',
      qrCode: `ORANGE_${data.reference}_${data.montant}`,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 min
    };
    
    return response;
  } catch (error) {
    console.error('Orange Money API error:', error);
    throw error;
  }
}

// MTN Mobile Money API Integration (Guinée)
async function initMTNPayment(data: {
  montant: number;
  telephone: string;
  reference: string;
  motif: string;
}) {
  // In production, use actual MTN MoMo API
  // Documentation: https://momodeveloper.mtn.com/
  
  const MTN_API = process.env.MTN_MONEY_API_URL || 'https://api.mtn.com/collection/v1';
  const MTN_TOKEN = process.env.MTN_MONEY_TOKEN;
  
  try {
    const response = {
      success: true,
      transactionId: `MTN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'PENDING',
      message: 'Demande de paiement MTN envoyée.',
      qrCode: `MTN_${data.reference}_${data.montant}`,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 min
    };
    
    return response;
  } catch (error) {
    console.error('MTN API error:', error);
    throw error;
  }
}

// Wave API Integration (Guinée)
async function initWavePayment(data: {
  montant: number;
  telephone: string;
  reference: string;
  motif: string;
}) {
  // In production, use actual Wave API
  // Wave has a more modern API with webhook support
  
  const WAVE_API = process.env.WAVE_API_URL || 'https://api.wave.com/v1';
  const WAVE_TOKEN = process.env.WAVE_API_TOKEN;
  
  try {
    const response = {
      success: true,
      transactionId: `WV_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'PENDING',
      message: 'Lien de paiement Wave généré.',
      qrCode: `WAVE_${data.reference}_${data.montant}`,
      paymentLink: `https://pay.wave.com/gn/${data.reference}`,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour
    };
    
    return response;
  } catch (error) {
    console.error('Wave API error:', error);
    throw error;
  }
}

// Check transaction status
async function checkTransactionStatus(operateur: string, transactionId: string) {
  // Simulate status check
  const statuses = ['PENDING', 'SUCCESS', 'FAILED'];
  const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
  
  return {
    transactionId,
    status: randomStatus,
    timestamp: new Date().toISOString(),
  };
}

// POST - Create payment request
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, operateur, montant, telephone, reference, motif } = body;
    
    if (action === 'create_payment') {
      if (!operateur || !montant || !telephone) {
        return NextResponse.json(
          { error: 'Missing required fields: operateur, montant, telephone' },
          { status: 400 }
        );
      }
      
      let result;
      
      switch (operateur.toUpperCase()) {
        case 'ORANGE':
          result = await initOrangeMoneyPayment({ montant, telephone, reference, motif });
          break;
        case 'MTN':
          result = await initMTNPayment({ montant, telephone, reference, motif });
          break;
        case 'WAVE':
          result = await initWavePayment({ montant, telephone, reference, motif });
          break;
        default:
          return NextResponse.json(
            { error: 'Unsupported operator. Use ORANGE, MTN, or WAVE' },
            { status: 400 }
          );
      }
      
      return NextResponse.json({
        success: true,
        data: result,
      });
    }
    
    if (action === 'check_status') {
      const { transactionId } = body;
      
      if (!transactionId) {
        return NextResponse.json(
          { error: 'Missing transactionId' },
          { status: 400 }
        );
      }
      
      const status = await checkTransactionStatus(operateur, transactionId);
      
      return NextResponse.json({
        success: true,
        data: status,
      });
    }
    
    // Sync account balance
    if (action === 'sync_balance') {
      // In production, fetch actual balance from operator API
      const mockBalance = {
        operateur,
        solde: Math.floor(Math.random() * 50000000) + 5000000,
        lastSync: new Date().toISOString(),
        currency: 'GNF',
      };
      
      return NextResponse.json({
        success: true,
        data: mockBalance,
      });
    }
    
    return NextResponse.json(
      { error: 'Invalid action. Use: create_payment, check_status, or sync_balance' },
      { status: 400 }
    );
    
  } catch (error) {
    console.error('Mobile Money API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - Get transactions
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const operateur = searchParams.get('operateur');
  const statut = searchParams.get('statut');
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');
  
  // In production, fetch from database
  const mockTransactions: MobileMoneyTransaction[] = [
    {
      id: 'tx_1',
      type: 'RECU',
      operateur: 'ORANGE',
      montant: 500000,
      frais: 0,
      reference: 'OM2405A1B2C3',
      statut: 'CONFIRME',
      dateTransaction: new Date().toISOString(),
      numeroExpediteur: '622000001',
      motif: 'Paiement facture F-2024-001',
    },
    {
      id: 'tx_2',
      type: 'RECU',
      operateur: 'MTN',
      montant: 750000,
      frais: 0,
      reference: 'MTN2405X1Y2Z3',
      statut: 'CONFIRME',
      dateTransaction: new Date(Date.now() - 3600000).toISOString(),
      numeroExpediteur: '664000002',
      motif: 'Acompte commande',
    },
    {
      id: 'tx_3',
      type: 'ENVOYE',
      operateur: 'WAVE',
      montant: 1200000,
      frais: 24000,
      reference: 'WV2405P1Q2R3',
      statut: 'CONFIRME',
      dateTransaction: new Date(Date.now() - 7200000).toISOString(),
      numeroDestinataire: '622000003',
      motif: 'Transfert fournisseur',
    },
  ];
  
  let filtered = mockTransactions;
  
  if (operateur) {
    filtered = filtered.filter(t => t.operateur === operateur.toUpperCase());
  }
  
  if (statut) {
    filtered = filtered.filter(t => t.statut === statut.toUpperCase());
  }
  
  return NextResponse.json({
    success: true,
    data: filtered.slice(offset, offset + limit),
    total: filtered.length,
    limit,
    offset,
  });
}

// Webhook handler for payment notifications
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { event, data } = body;
    
    // Verify webhook signature (in production)
    // const signature = request.headers.get('x-webhook-signature');
    
    console.log('Mobile Money Webhook:', event, data);
    
    switch (event) {
      case 'payment.success':
        // Update transaction status to CONFIRME
        // Link to invoice if reference matches
        console.log('Payment confirmed:', data.transactionId);
        break;
        
      case 'payment.failed':
        // Update transaction status to ECHOUE
        console.log('Payment failed:', data.transactionId);
        break;
        
      case 'payment.expired':
        // Update transaction status to ANNULE
        console.log('Payment expired:', data.transactionId);
        break;
        
      default:
        console.log('Unknown event:', event);
    }
    
    return NextResponse.json({ received: true });
    
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
