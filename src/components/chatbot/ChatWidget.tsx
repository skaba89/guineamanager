'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  MessageCircle, X, Send, Bot, User, Loader2, Sparkles, 
  RefreshCw, BarChart3, Wallet, FileText, Wrench, Package, 
  Users, DollarSign, HelpCircle, Maximize2, Minimize2
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
  { icon: FileText, text: "Comment créer une facture ?", prompt: "Comment créer une facture ?" },
  { icon: DollarSign, text: "TVA en Guinée", prompt: "Expliquer la TVA en Guinée et les taux applicables" },
  { icon: Package, text: "Gestion des stocks", prompt: "Comment gérer les stocks efficacement ?" },
  { icon: Users, text: "Aide paie", prompt: "Aide pour la paie du mois" },
];

// Quick actions
const QUICK_ACTIONS = [
  { label: "Analyse ventes", icon: BarChart3, prompt: "Analyse mes ventes du mois dernier et donne-moi des recommandations", color: "bg-blue-50 text-blue-700 hover:bg-blue-100" },
  { label: "Trésorerie", icon: Wallet, prompt: "Comment optimiser ma trésorerie ?", color: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" },
  { label: "Rapport", icon: FileText, prompt: "Aide-moi à comprendre les rapports disponibles", color: "bg-amber-50 text-amber-700 hover:bg-amber-100" },
  { label: "Support", icon: Wrench, prompt: "J'ai besoin d'aide technique", color: "bg-purple-50 text-purple-700 hover:bg-purple-100" },
];

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
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
        content: "**Bienvenue ! 👋**\n\nJe suis votre assistant **GuinéaManager** propulsé par GLM-5.\n\nJe peux vous aider avec :\n• **Facturation & Devis**\n• **Gestion des stocks**\n• **Ressources humaines & Paie**\n• **Comptabilité OHADA**\n• **Analyses & Rapports**\n\nComment puis-je vous aider aujourd'hui ?",
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
        content: "⚠️ Une erreur de connexion s'est produite.\n\nVeuillez vérifier votre connexion internet et réessayer.",
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
    setMessages([
      {
        id: Date.now().toString(),
        role: 'assistant',
        content: "🔄 Conversation réinitialisée.\n\nComment puis-je vous aider ?",
        timestamp: new Date(),
      }
    ]);
  };

  if (!mounted) return null;

  return (
    <>
      {/* Floating Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "w-14 h-14 rounded-full shadow-xl transition-all duration-300",
            isOpen 
              ? "bg-slate-700 hover:bg-slate-800 rotate-0" 
              : "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 hover:scale-105"
          )}
          size="icon"
        >
          {isOpen ? (
            <X className="w-6 h-6 text-white" />
          ) : (
            <MessageCircle className="w-6 h-6 text-white" />
          )}
        </Button>
        
        {/* Notification badge */}
        {!isOpen && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
            <Sparkles className="w-3 h-3 text-white" />
          </span>
        )}
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div className={cn(
          "fixed z-50 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col",
          "animate-in slide-in-from-bottom-4 fade-in duration-300",
          isMaximized 
            ? "inset-4 lg:inset-8" 
            : "bottom-24 right-6 w-[420px] max-w-[calc(100vw-48px)] h-[600px] max-h-[calc(100vh-120px)]"
        )}>
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 text-white p-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    Assistant IA
                    <Badge variant="secondary" className="bg-white/25 text-white text-xs border-0 font-normal">
                      GLM-5
                    </Badge>
                  </h3>
                  <p className="text-sm text-white/80 flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                    En ligne
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/20"
                  onClick={() => setIsMaximized(!isMaximized)}
                  title={isMaximized ? "Réduire" : "Agrandir"}
                >
                  {isMaximized ? (
                    <Minimize2 className="w-4 h-4" />
                  ) : (
                    <Maximize2 className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/20"
                  onClick={clearConversation}
                  title="Nouvelle conversation"
                >
                  <RefreshCw className="w-4 h-4" />
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
                <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-emerald-600 animate-pulse" />
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-md px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                    <span className="text-sm text-slate-500">Réflexion en cours...</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Start - Only show when few messages */}
          {messages.length <= 1 && !isLoading && (
            <div className="px-4 py-3 border-t border-slate-100 bg-white flex-shrink-0">
              <p className="text-xs text-slate-500 mb-2 flex items-center gap-1">
                <HelpCircle className="w-3 h-3" />
                Questions suggérées :
              </p>
              <div className="grid grid-cols-2 gap-2">
                {SUGGESTED_QUESTIONS.map((q, i) => {
                  const Icon = q.icon;
                  return (
                    <button
                      key={i}
                      onClick={() => handleSuggestedQuestion(q.prompt)}
                      className="flex items-center gap-2 text-xs bg-slate-50 hover:bg-slate-100 text-slate-700 px-3 py-2 rounded-lg transition-colors text-left"
                    >
                      <Icon className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate">{q.text}</span>
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
                    "flex-shrink-0 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-colors",
                    action.color
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {action.label}
                </button>
              );
            })}
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-4 border-t border-slate-100 bg-white flex-shrink-0">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Posez votre question..."
                className="flex-1 bg-slate-50 border-slate-200 focus:border-emerald-500 focus:ring-emerald-500"
                disabled={isLoading}
              />
              <Button 
                type="submit" 
                disabled={!input.trim() || isLoading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-slate-400 mt-2 text-center">
              Appuyez sur Entrée pour envoyer
            </p>
          </form>
        </div>
      )}
    </>
  );
}

export default ChatWidget;
