'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Users, Building2, Shield, Smartphone, TrendingUp, Clock, Gift } from 'lucide-react';

export default function BetaLandingPage() {
  const [formData, setFormData] = useState({
    email: '',
    nom: '',
    prenom: '',
    entreprise: '',
    telephone: '',
    secteur: '',
    tailleEntreprise: '',
    fonction: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/beta/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
      } else {
        setError(data.error || 'Une erreur est survenue');
      }
    } catch {
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  const avantages = [
    {
      icon: <Gift className="h-6 w-6 text-orange-500" />,
      title: '3 mois gratuits',
      description: 'Accès complet à toutes les fonctionnalités Premium sans frais'
    },
    {
      icon: <Users className="h-6 w-6 text-blue-500" />,
      title: 'Support prioritaire',
      description: 'Une équipe dédiée pour vous accompagner dans la prise en main'
    },
    {
      icon: <TrendingUp className="h-6 w-6 text-green-500" />,
      title: 'Influencez le produit',
      description: 'Vos retours façonnent les futures fonctionnalités'
    },
    {
      icon: <Shield className="h-6 w-6 text-purple-500" />,
      title: 'Tarifs préférentiels',
      description: '50% de réduction sur votre abonnement après la période beta'
    }
  ];

  const fonctionnalites = [
    { icon: <Building2 className="h-5 w-5" />, text: 'Facturation professionnelle' },
    { icon: <Users className="h-5 w-5" />, text: 'Gestion des clients & prospects' },
    { icon: <TrendingUp className="h-5 w-5" />, text: 'Tableaux de bord analytiques' },
    { icon: <Smartphone className="h-5 w-5" />, text: 'Paiements Mobile Money' },
    { icon: <Clock className="h-5 w-5" />, text: 'Paie conforme Guinée' },
    { icon: <Shield className="h-5 w-5" />, text: 'Comptabilité OHADA' }
  ];

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8 pb-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Inscription confirmée !
            </h2>
            <p className="text-gray-600 mb-4">
              Merci pour votre intérêt pour GuinéaManager. Vous recevrez un email de confirmation sous 24h avec vos accès à la version Beta.
            </p>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              🎉 Bienvenue dans le programme Beta
            </Badge>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 via-yellow-500 to-green-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">GM</span>
            </div>
            <span className="font-bold text-xl">GuinéaManager</span>
          </div>
          <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200">
            🚀 Programme Beta
          </Badge>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 py-16 md:py-24">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-green-100 text-green-800 hover:bg-green-100">
            ✨ Places limitées - 100 beta testeurs recherchés
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            L&apos;ERP conçu pour les
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-yellow-600 to-green-600">
              {' '}PME guinéennes
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Facturation, paie, comptabilité OHADA, Mobile Money — Tout ce dont vous avez besoin pour gérer votre entreprise, adapté aux réalités locales.
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-16 max-w-4xl mx-auto">
          {fonctionnalites.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2 bg-white rounded-lg p-3 shadow-sm border">
              <div className="text-blue-600">{item.icon}</div>
              <span className="text-sm font-medium text-gray-700">{item.text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Beta Signup Section */}
      <section className="bg-gradient-to-br from-slate-900 to-slate-800 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Avantages */}
            <div>
              <h2 className="text-3xl font-bold text-white mb-8">
                Pourquoi devenir beta testeur ?
              </h2>
              <div className="space-y-6">
                {avantages.map((item, idx) => (
                  <div key={idx} className="flex gap-4">
                    <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center shrink-0">
                      {item.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{item.title}</h3>
                      <p className="text-gray-400">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Formulaire */}
            <Card className="border-0 shadow-2xl">
              <CardHeader>
                <CardTitle className="text-2xl">Rejoindre le programme Beta</CardTitle>
                <CardDescription>
                  Inscrivez-vous pour être parmi les premiers à tester GuinéaManager
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="prenom">Prénom *</Label>
                      <Input
                        id="prenom"
                        name="prenom"
                        value={formData.prenom}
                        onChange={handleChange}
                        required
                        placeholder="Mamadou"
                      />
                    </div>
                    <div>
                      <Label htmlFor="nom">Nom *</Label>
                      <Input
                        id="nom"
                        name="nom"
                        value={formData.nom}
                        onChange={handleChange}
                        required
                        placeholder="Diallo"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email">Email professionnel *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      placeholder="m.diallo@entreprise.com"
                    />
                  </div>

                  <div>
                    <Label htmlFor="entreprise">Nom de l&apos;entreprise</Label>
                    <Input
                      id="entreprise"
                      name="entreprise"
                      value={formData.entreprise}
                      onChange={handleChange}
                      placeholder="Mon Entreprise SARL"
                    />
                  </div>

                  <div>
                    <Label htmlFor="telephone">Téléphone</Label>
                    <Input
                      id="telephone"
                      name="telephone"
                      value={formData.telephone}
                      onChange={handleChange}
                      placeholder="+224 620 00 00 00"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="secteur">Secteur d&apos;activité</Label>
                      <select
                        id="secteur"
                        name="secteur"
                        value={formData.secteur}
                        onChange={handleChange}
                        className="w-full h-10 px-3 border rounded-md"
                      >
                        <option value="">Sélectionner</option>
                        <option value="commerce">Commerce</option>
                        <option value="services">Services</option>
                        <option value="industrie">Industrie</option>
                        <option value="agriculture">Agriculture</option>
                        <option value="transport">Transport</option>
                        <option value="sante">Santé</option>
                        <option value="education">Éducation</option>
                        <option value="autre">Autre</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="tailleEntreprise">Taille</Label>
                      <select
                        id="tailleEntreprise"
                        name="tailleEntreprise"
                        value={formData.tailleEntreprise}
                        onChange={handleChange}
                        className="w-full h-10 px-3 border rounded-md"
                      >
                        <option value="">Sélectionner</option>
                        <option value="1-5">1-5 employés</option>
                        <option value="6-20">6-20 employés</option>
                        <option value="21-50">21-50 employés</option>
                        <option value="51-100">51-100 employés</option>
                        <option value="100+">Plus de 100</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="fonction">Votre fonction</Label>
                    <Input
                      id="fonction"
                      name="fonction"
                      value={formData.fonction}
                      onChange={handleChange}
                      placeholder="Directeur, Comptable, Gérant..."
                    />
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                      {error}
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-red-600 via-yellow-600 to-green-600 hover:opacity-90"
                    disabled={loading}
                  >
                    {loading ? 'Inscription en cours...' : 'Rejoindre le programme Beta'}
                  </Button>

                  <p className="text-xs text-center text-gray-500">
                    En vous inscrivant, vous acceptez de recevoir des communications de GuinéaManager.
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-gray-900">7+</div>
              <div className="text-gray-600">Pays supportés</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900">15+</div>
              <div className="text-gray-600">Devises africaines</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900">50+</div>
              <div className="text-gray-600">Fonctionnalités</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900">100%</div>
              <div className="text-gray-600">Conforme OHADA</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-gray-400 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p>© 2024 GuinéaManager. Fait avec ❤️ pour les entreprises africaines.</p>
          <p className="text-sm mt-2">Conakry, Guinée • support@guineamanager.com</p>
        </div>
      </footer>
    </div>
  );
}
