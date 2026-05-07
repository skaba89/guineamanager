import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// System prompt for GuinéaManager ERP assistant
const SYSTEM_PROMPT = `Tu es l'assistant intelligent de GuinéaManager, un ERP pour PME en Afrique de l'Ouest (Guinée, Sénégal, Mali, Côte d'Ivoire, Burkina Faso, Bénin, Niger).

Tu aides les utilisateurs avec:
- La gestion des factures, devis et commandes
- La comptabilité OHADA (plan comptable Syscohada révisé)
- La gestion des stocks et inventaires
- La paie et les ressources humaines
- Les analyses financières et rapports
- La gestion multi-devises (GNF, XOF, XAF, EUR, USD)
- Les intégrations mobile money (Orange Money, MTN Money)

Tu réponds de manière professionnelle, concise et en français.
Tu peux donner des conseils de gestion adaptés au contexte africain.
Tu connais les taux de change actuels approximatifs.

Format de réponse:
- Utilise du markdown pour structurer tes réponses
- Sois précis et actionable
- Propose des solutions concrètes quand c'est possible`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, context } = body as { 
      messages: ChatMessage[]; 
      context?: {
        currentPage?: string;
        userData?: any;
        companyData?: any;
      };
    };

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages are required' },
        { status: 400 }
      );
    }

    // Initialize ZAI SDK
    const zai = await ZAI.create();

    // Build system prompt with context
    let systemPrompt = SYSTEM_PROMPT;
    if (context) {
      if (context.currentPage) {
        systemPrompt += `\n\nL'utilisateur est actuellement sur la page: ${context.currentPage}`;
      }
      if (context.companyData) {
        systemPrompt += `\n\nEntreprise: ${context.companyData.nom || 'Non définie'}`;
      }
    }

    // Prepare messages for the API
    const apiMessages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))
    ];

    // Call GLM-5 via z-ai-web-dev-sdk
    const response = await zai.chat.completions.create({
      messages: apiMessages,
      model: 'glm-5', // Using GLM-5
      stream: false,
      temperature: 0.7,
      max_tokens: 2000,
    });

    const assistantMessage = response.choices?.[0]?.message?.content;

    if (!assistantMessage) {
      throw new Error('No response from GLM-5');
    }

    return NextResponse.json({
      success: true,
      message: assistantMessage,
      model: 'glm-5',
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('Chat API error:', error);
    
    // Fallback response if API fails
    const fallbackResponses = [
      "Je suis désolé, je rencontre des difficultés techniques. Veuillez réessayer dans quelques instants.",
      "Une erreur s'est produite. Je vous invite à contacter le support si le problème persiste.",
      "Impossible de traiter votre demande actuellement. Veuillez rafraîchir la page et réessayer."
    ];
    
    return NextResponse.json({
      success: false,
      error: error.message || 'An error occurred',
      fallbackMessage: fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)],
    }, { status: 500 });
  }
}

// Streaming endpoint for real-time responses
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json({ error: 'Query parameter required' }, { status: 400 });
  }

  try {
    const zai = await ZAI.create();

    const response = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: query }
      ],
      model: 'glm-5',
      stream: false,
    });

    const content = response.choices?.[0]?.message?.content;

    return NextResponse.json({
      success: true,
      message: content,
      model: 'glm-5',
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}
