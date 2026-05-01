'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { ToastProvider } from '@/components/ui/toast-provider';

// Custom theme context to avoid next-themes script injection issues
type ThemeContextType = {
  theme: string;
  setTheme: (theme: string) => void;
};

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  setTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    // Get initial theme from localStorage or system preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.className = savedTheme;
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
      document.documentElement.className = 'dark';
    }
  }, []);

  const handleSetTheme = (newTheme: string) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.className = newTheme;
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme: handleSetTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ToastProvider>
          {children}
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
