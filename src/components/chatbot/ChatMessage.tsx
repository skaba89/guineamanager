'use client';

import { useState, useEffect } from 'react';
import { Bot, User, Copy, Check, ChevronDown, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ChatMessageProps {
  message: {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  };
}

// Enhanced markdown-like parsing
function parseContent(content: string): string {
  return content
    // Headers
    .replace(/^### (.*$)/gm, '<h3 class="text-base font-bold text-slate-800 mt-3 mb-2">$1</h3>')
    .replace(/^## (.*$)/gm, '<h2 class="text-lg font-bold text-slate-800 mt-4 mb-2">$1</h2>')
    .replace(/^# (.*$)/gm, '<h1 class="text-xl font-bold text-slate-800 mt-4 mb-3">$1</h1>')
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-slate-800">$1</strong>')
    // Italic
    .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
    // Code blocks
    .replace(/```(\w*)\n?([\s\S]*?)```/g, '<pre class="bg-slate-800 text-slate-100 p-4 rounded-xl my-3 overflow-x-auto text-sm font-mono shadow-inner"><code>$2</code></pre>')
    // Inline code
    .replace(/`(.*?)`/g, '<code class="bg-slate-100 text-emerald-700 px-2 py-0.5 rounded-lg text-sm font-mono">$1</code>')
    // Unordered lists
    .replace(/^- (.*$)/gm, '<li class="ml-4 flex items-start gap-2 my-1"><span class="text-emerald-500 mt-1.5">•</span><span>$1</span></li>')
    // Ordered lists
    .replace(/^\d+\. (.*$)/gm, '<li class="ml-4 my-1">$1</li>')
    // Line breaks (but not after block elements)
    .replace(/\n\n/g, '</p><p class="my-2">')
    .replace(/\n/g, '<br/>');
}

export function ChatMessage({ message }: ChatMessageProps) {
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showFullContent, setShowFullContent] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const isUser = message.role === 'user';
  const parsedContent = parseContent(message.content);

  // Format time only on client to avoid hydration mismatch
  const formatTime = () => {
    if (!mounted) return '';
    return message.timestamp.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className={cn(
      "flex gap-3 group",
      isUser && "flex-row-reverse"
    )}>
      {/* Avatar */}
      <div className={cn(
        "w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm",
        isUser 
          ? "bg-gradient-to-br from-blue-500 to-blue-600" 
          : "bg-gradient-to-br from-emerald-100 to-emerald-200"
      )}>
        {isUser ? (
          <User className="w-5 h-5 text-white" />
        ) : (
          <Bot className="w-5 h-5 text-emerald-600" />
        )}
      </div>

      {/* Content */}
      <div className={cn(
        "max-w-[85%] relative",
        isUser && "text-right"
      )}>
        {/* Role label */}
        <div className={cn(
          "flex items-center gap-2 mb-1",
          isUser && "justify-end"
        )}>
          {isUser ? (
            <span className="text-xs font-medium text-blue-600">Vous</span>
          ) : (
            <span className="text-xs font-medium text-emerald-600 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Assistant
            </span>
          )}
        </div>

        <div 
          className={cn(
            "rounded-2xl px-4 py-3 text-sm leading-relaxed",
            isUser 
              ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-tr-md shadow-md" 
              : "bg-white border border-slate-200 text-slate-700 rounded-tl-md shadow-sm"
          )}
        >
          <div 
            className={cn(
              "prose prose-sm max-w-none",
              isUser ? "prose-invert" : "prose-slate",
              "[&>h1]:text-base [&>h1]:font-bold [&>h1]:text-slate-800 [&>h1]:mt-0",
              "[&>h2]:text-sm [&>h2]:font-bold [&>h2]:text-slate-800 [&>h2]:mt-2",
              "[&>h3]:text-sm [&>h3]:font-semibold [&>h3]:text-slate-700",
              "[&>p]:my-1",
              "[&>ul]:my-2 [&>ul]:list-none [&>ul]:pl-0",
              "[&>ol]:my-2 [&>ol]:list-decimal [&>ol]:pl-4",
              "[&>li]:my-0.5",
              "[&>pre]:my-3 [&>pre]:rounded-xl",
              "[&>code]:text-emerald-700",
              "[&>strong]:font-semibold",
              !isUser && "[&>strong]:text-slate-800"
            )}
            dangerouslySetInnerHTML={{ __html: parsedContent }}
          />
        </div>

        {/* Time and copy button */}
        <div className={cn(
          "flex items-center gap-2 mt-1.5 px-1",
          isUser ? "justify-end" : "justify-start"
        )}>
          {mounted && (
            <span className="text-xs text-slate-400 font-medium">
              {formatTime()}
            </span>
          )}
          
          {/* Copy button for assistant messages */}
          {!isUser && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-100"
              onClick={handleCopy}
              title="Copier"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-slate-400" />
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ChatMessage;
