'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  MessageCircle, X, Send, Bot, User, Loader2, Sparkles, 
  RefreshCw, BarChart3, Wallet, FileText, Wrench, Package, 
  Users, DollarSign, HelpCircle, Maximize2, Minimize2,
  ChevronDown, Zap, TrendingUp, Receipt, Calculator
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ChatMessage } from './ChatMessage';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// Suggested questions for quick start
const SUGGESTED_QUESTIONS = [
  { icon: FileText, text: "Créer une facture", prompt: "Comment créer une facture avec plusieurs lignes ?", color: "from-blue-500 to-blue-600" },
  { icon: Calculator, text: "Calcul TVA", prompt: "Expliquer la TVA en Guinée et les taux applicables (18%, 7%, etc.)", color: "from-emerald-500 to-emerald-600" },
  { icon: Package, text: "Gestion stock", prompt: "Comment gérer les stocks et les alertes de rupture ?", color: "from-purple-500 to-purple-600" },
  { icon: Users, text: "Aide paie", prompt: "Aide pour le calcul de la paie et les charges sociales", color: "from-amber-500 to-amber-600" },
];

// Quick actions
const QUICK_ACTIONS = [
  { label: "Analyse ventes", icon: BarChart3, prompt: "Analyse mes ventes du mois dernier et donne-moi des recommandations", color: "bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200" },
  { label: "Trésorerie", icon: Wallet, prompt: "Comment optimiser ma trésorerie ?", color: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200" },
  { label: "Facturation", icon: Receipt, prompt: "Aide-moi à comprendre le système de facturation", color: "bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200" },
  { label: "Support", icon: Wrench, prompt: "J'ai besoin d'aide technique", color: "bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200" },
];

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Handle hydration
  useEffect(() => {
    setMounted(true);
    // Initialize with welcome message
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: `## Bienvenue ! 👋

Je suis votre **Assistant GuinéaManager** propulsé par **GLM-5**.

Je peux vous aider avec :

- **📄 Facturation & Devis** - Création, TVA, lignes multiples
- **📦 Gestion des stocks** - Alertes, inventaires
- **👥 Ressources humaines** - Paie, employés
- **💰 Comptabilité OHADA** - Plan comptable, déclarations
- **📱 Mobile Money** - Orange Money, MTN, Wave
- **📊 Analyses & Rapports** - Tableaux de bord, prédictions

Comment puis-je vous aider aujourd'hui ?`,
        timestamp: new Date(),
      }
    ]);
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    setShowSuggestions(false);
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Build conversation history for context
      const conversationHistory = messages.map(m => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...conversationHistory, { role: 'user', content: content.trim() }],
          context: {
            currentPage: window.location.pathname,
          },
        }),
      });

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.success ? data.message : data.fallbackMessage || "Désolé, une erreur s'est produite. Veuillez réessayer.",
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "⚠️ **Erreur de connexion**\n\nVeuillez vérifier votre connexion internet et réessayer.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleSuggestedQuestion = (prompt: string) => {
    sendMessage(prompt);
  };

  const clearConversation = () => {
    setShowSuggestions(true);
    setMessages([
      {
        id: Date.now().toString(),
        role: 'assistant',
        content: "🔄 **Conversation réinitialisée**\n\nComment puis-je vous aider ?",
        timestamp: new Date(),
      }
    ]);
  };

  if (!mounted) return null;

  return (
    <>
      {/* Floating Button */}
      <div className="fixed bottom-6 right-6 z-50">
        {/* Pulse animation ring */}
        {!isOpen && (
          <div className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-25" />
        )}
        
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "relative w-16 h-16 rounded-full shadow-2xl transition-all duration-300 group",
            isOpen 
              ? "bg-slate-700 hover:bg-slate-800" 
              : "bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-500 hover:from-emerald-600 hover:via-emerald-700 hover:to-teal-600 hover:scale-110"
          )}
          size="icon"
        >
          {isOpen ? (
            <X className="w-7 h-7 text-white" />
          ) : (
            <>
              <MessageCircle className="w-7 h-7 text-white" />
              <Sparkles className="w-3 h-3 text-amber-300 absolute -top-0.5 -right-0.5 animate-pulse" />
            </>
          )}
        </Button>
        
        {/* Notification badge */}
        {!isOpen && (
          <span className="absolute -top-1 -left-1 px-2 py-0.5 bg-gradient-to-r from-amber-400 to-amber-500 rounded-full text-xs font-bold text-white shadow-lg animate-bounce">
            IA
          </span>
        )}
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div className={cn(
          "fixed z-50 bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col",
          "animate-in slide-in-from-bottom-4 fade-in duration-300",
          isMaximized 
            ? "inset-4 lg:inset-8 rounded-2xl" 
            : "bottom-28 right-6 w-[440px] max-w-[calc(100vw-48px)] h-[650px] max-h-[calc(100vh-140px)]"
        )}>
          {/* Header */}
          <div className="relative bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 text-white p-5 flex-shrink-0 overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
            </div>
            
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/30">
                    <Bot className="w-7 h-7" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-emerald-600 flex items-center justify-center">
                    <Zap className="w-3 h-3 text-white" />
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-xl flex items-center gap-2">
                    Assistant IA
                    <Badge variant="secondary" className="bg-white/25 text-white text-xs border-0 font-medium px-2 py-0.5">
                      GLM-5
                    </Badge>
                  </h3>
                  <p className="text-sm text-white/80 flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400"></span>
                    </span>
                    En ligne - Prêt à vous aider
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-white/80 hover:text-white hover:bg-white/20 rounded-xl"
                  onClick={() => setIsMaximized(!isMaximized)}
                  title={isMaximized ? "Réduire" : "Agrandir"}
                >
                  {isMaximized ? (
                    <Minimize2 className="w-5 h-5" />
                  ) : (
                    <Maximize2 className="w-5 h-5" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-white/80 hover:text-white hover:bg-white/20 rounded-xl"
                  onClick={clearConversation}
                  title="Nouvelle conversation"
                >
                  <RefreshCw className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-slate-50 to-white"
          >
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            
            {/* Loading indicator */}
            {isLoading && (
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Bot className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-md px-5 py-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1.5">
                      <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                    <span className="text-sm text-slate-500 font-medium">Réflexion en cours...</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Start - Only show when few messages */}
          {messages.length <= 1 && !isLoading && showSuggestions && (
            <div className="px-4 py-3 border-t border-slate-100 bg-gradient-to-b from-white to-slate-50 flex-shrink-0">
              <p className="text-xs text-slate-500 mb-3 flex items-center gap-2 font-medium">
                <HelpCircle className="w-4 h-4" />
                Questions suggérées :
              </p>
              <div className="grid grid-cols-2 gap-2">
                {SUGGESTED_QUESTIONS.map((q, i) => {
                  const Icon = q.icon;
                  return (
                    <button
                      key={i}
                      onClick={() => handleSuggestedQuestion(q.prompt)}
                      className={cn(
                        "flex items-center gap-2 text-xs text-slate-700 px-3 py-2.5 rounded-xl transition-all text-left group border hover:shadow-md",
                        "bg-gradient-to-r hover:scale-[1.02]",
                        q.color
                      )}
                    >
                      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center bg-white shadow-sm group-hover:scale-110 transition-transform", q.color)}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <span className="font-medium">{q.text}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick Actions Bar */}
          <div className="px-4 py-2 border-t border-slate-100 flex gap-2 overflow-x-auto bg-white flex-shrink-0">
            {QUICK_ACTIONS.map((action, i) => {
              const Icon = action.icon;
              return (
                <button
                  key={i}
                  onClick={() => handleSuggestedQuestion(action.prompt)}
                  className={cn(
                    "flex-shrink-0 flex items-center gap-2 text-xs px-3 py-2 rounded-xl transition-all border",
                    action.color
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {action.label}
                </button>
              );
            })}
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-4 border-t border-slate-100 bg-white flex-shrink-0">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Posez votre question..."
                  className="w-full bg-slate-50 border-slate-200 focus:border-emerald-500 focus:ring-emerald-500 rounded-xl h-12 px-4 text-sm"
                  disabled={isLoading}
                />
              </div>
              <Button 
                type="submit" 
                disabled={!input.trim() || isLoading}
                className={cn(
                  "h-12 px-5 rounded-xl transition-all",
                  input.trim() && !isLoading
                    ? "bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white shadow-lg hover:shadow-xl"
                    : "bg-slate-200 text-slate-400"
                )}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </div>
            <p className="text-xs text-slate-400 mt-2 text-center flex items-center justify-center gap-2">
              <Sparkles className="w-3 h-3" />
              Appuyez sur Entrée pour envoyer
            </p>
          </form>
        </div>
      )}
    </>
  );
}

export default ChatWidget;
