'use client';

import { useState } from 'react';
import { Building2, Eye, EyeOff, Loader2, Shield, Sparkles, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function SimpleLoginPage() {
  const [email, setEmail] = useState('demo@guineamanager.com');
  const [password, setPassword] = useState('demo123');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [debugInfo, setDebugInfo] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    setDebugInfo('Starting login...');

    try {
      setDebugInfo('Sending request to /api/auth/login');
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      setDebugInfo(`Response status: ${response.status}`);

      const data = await response.json();
      setDebugInfo(`Response: ${JSON.stringify(data).substring(0, 200)}`);

      if (data.success && data.data?.token) {
        // Store token
        localStorage.setItem('guineamanager-token', data.data.token);
        setDebugInfo('Login successful! Redirecting...');
        
        // Force page reload to dashboard
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err: any) {
      setDebugInfo(`Error: ${err.message}`);
      setError('Erreur de connexion au serveur');
    }
    
    setIsLoading(false);
  };

  const features = [
    'Facturation & Devis professionnels',
    'Gestion de la paie multi-pays',
    'Comptabilité OHADA conforme',
    'Tableaux de bord analytiques'
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[url('/images/grid-pattern.svg')] opacity-5" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl" />
        
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
          {/* Logo */}
          <div className="flex items-center gap-4 mb-12">
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <Building2 className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">GuinéaManager</h1>
              <p className="text-emerald-400 text-sm">ERP pour PME en Afrique</p>
            </div>
          </div>

          {/* Value Proposition */}
          <h2 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-6">
            Gérez votre entreprise{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-300">
              avec confiance
            </span>
          </h2>
          <p className="text-slate-300 text-lg mb-10 max-w-md">
            La solution ERP complète adaptée aux réalités des entreprises africaines. 
            Facturation, paie, comptabilité et bien plus.
          </p>

          {/* Features List */}
          <div className="space-y-4">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-3 text-slate-200">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <span>{feature}</span>
              </div>
            ))}
          </div>

          {/* Trust Badge */}
          <div className="mt-12 flex items-center gap-2 text-slate-400 text-sm">
            <Shield className="w-4 h-4" />
            <span>Données sécurisées et chiffrées</span>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center bg-slate-50 px-6 py-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl mb-4 shadow-lg shadow-emerald-500/30">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">GuinéaManager</h1>
            <p className="text-slate-500 mt-1">ERP pour PME en Afrique</p>
          </div>

          {/* Login Card */}
          <Card className="border-0 shadow-xl bg-white">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-xl font-semibold text-slate-900">Connexion</CardTitle>
              <CardDescription className="text-slate-500">
                Accédez à votre espace entreprise
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-700 font-medium">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="votre@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-11 border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-slate-700 font-medium">Mot de passe</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-11 pr-10 border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-start gap-2">
                    <span className="font-medium">Erreur:</span>
                    <span>{error}</span>
                  </div>
                )}

                {debugInfo && (
                  <div className="text-xs text-slate-600 bg-slate-100 border border-slate-200 rounded-lg px-4 py-2 font-mono">
                    {debugInfo}
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full h-11 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white font-medium shadow-lg shadow-emerald-500/25 transition-all"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Connexion en cours...
                    </>
                  ) : (
                    'Se connecter'
                  )}
                </Button>
              </form>

              {/* Demo Credentials */}
              <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2 text-slate-600 text-sm mb-2">
                  <Sparkles className="w-4 h-4 text-emerald-500" />
                  <span className="font-medium">Compte de démonstration</span>
                </div>
                <div className="text-sm text-slate-500">
                  <span className="font-mono text-slate-700">demo@guineamanager.com</span>
                  <span className="mx-2">/</span>
                  <span className="font-mono text-slate-700">demo123</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <p className="text-center text-slate-400 text-sm mt-8">
            © 2024 GuinéaManager - Tous droits réservés
          </p>
        </div>
      </div>
    </div>
  );
}
