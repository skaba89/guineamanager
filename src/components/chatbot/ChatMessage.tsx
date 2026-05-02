'use client';

import { useState, useEffect } from 'react';
import { Bot, User, Copy, Check, ChevronDown } from 'lucide-react';
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

// Simple markdown-like parsing
function parseContent(content: string): string {
  return content
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Code blocks
    .replace(/```([\s\S]*?)```/g, '<pre class="bg-slate-100 p-3 rounded-lg my-2 overflow-x-auto text-sm"><code>$1</code></pre>')
    // Inline code
    .replace(/`(.*?)`/g, '<code class="bg-slate-100 px-1.5 py-0.5 rounded text-sm">$1</code>')
    // Lists
    .replace(/^- (.*$)/gm, '<li class="ml-4">$1</li>')
    // Line breaks
    .replace(/\n/g, '<br/>');
}

export function ChatMessage({ message }: ChatMessageProps) {
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);

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
      "flex gap-3",
      isUser && "flex-row-reverse"
    )}>
      {/* Avatar */}
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
        isUser 
          ? "bg-blue-100" 
          : "bg-emerald-100"
      )}>
        {isUser ? (
          <User className="w-4 h-4 text-blue-600" />
        ) : (
          <Bot className="w-4 h-4 text-emerald-600" />
        )}
      </div>

      {/* Content */}
      <div className={cn(
        "max-w-[80%] group relative",
        isUser && "text-right"
      )}>
        <div 
          className={cn(
            "rounded-2xl px-4 py-3 text-sm",
            isUser 
              ? "bg-blue-600 text-white rounded-tr-md" 
              : "bg-slate-100 text-slate-800 rounded-tl-md"
          )}
        >
          <div 
            className={cn(
              "prose prose-sm max-w-none",
              isUser ? "prose-invert" : ""
            )}
            dangerouslySetInnerHTML={{ __html: parsedContent }}
          />
        </div>

        {/* Time and copy button */}
        <div className={cn(
          "flex items-center gap-2 mt-1 px-1",
          isUser ? "justify-end" : "justify-start"
        )}>
          {mounted && (
            <span className="text-xs text-slate-400">
              {formatTime()}
            </span>
          )}
          
          {/* Copy button for assistant messages */}
          {!isUser && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handleCopy}
            >
              {copied ? (
                <Check className="w-3 h-3 text-emerald-600" />
              ) : (
                <Copy className="w-3 h-3 text-slate-400" />
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ChatMessage;
