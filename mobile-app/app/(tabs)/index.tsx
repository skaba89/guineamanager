/**
 * GuinéaManager Mobile - Dashboard Screen
 */

import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { 
  TrendingUp, TrendingDown, Users, FileText, Wallet, 
  Smartphone, ArrowUpRight, ArrowDownLeft, ChevronRight,
  AlertCircle, CheckCircle, Clock
} from 'lucide-react-native';
import { useAuthStore } from '@/stores/auth-store';

// Mock data
const mockStats = {
  chiffreAffairesJour: 2500000,
  chiffreAffairesMois: 45000000,
  facturesImpayees: 8,
  clientsActifs: 45,
  transactionsJour: 12,
  soldeOrange: 15250000,
  soldeMTN: 8750000,
  soldeWave: 22000000,
};

const mockRecentTransactions = [
  { id: '1', type: 'RECU', operateur: 'ORANGE', montant: 500000, client: 'Mamadou Diallo', date: '10:30' },
  { id: '2', type: 'RECU', operateur: 'MTN', montant: 750000, client: 'Fatou Camara', date: '11:15' },
  { id: '3', type: 'ENVOYE', operateur: 'WAVE', montant: 200000, client: 'Fournisseur X', date: '14:00' },
];

const mockFacturesEnRetard = [
  { id: '1', numero: 'F-2024-001', client: 'Alpha Condé', montant: 1500000, joursRetard: 15 },
  { id: '2', numero: 'F-2024-005', client: 'Mariama Soumah', montant: 850000, joursRetard: 7 },
];

// Format GNF
const formatGNF = (amount: number) => {
  return new Intl.NumberFormat('fr-GN', {
    style: 'decimal',
    minimumFractionDigits: 0,
  }).format(amount) + ' GNF';
};

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Simuler un rechargement
    setTimeout(() => setRefreshing(false), 1500);
  }, []);

  const getOperateurColor = (operateur: string) => {
    switch (operateur) {
      case 'ORANGE': return '#f97316';
      case 'MTN': return '#ffcc00';
      case 'WAVE': return '#00b8c8';
      default: return '#6b7280';
    }
  };

  return (
    <ScrollView 
      style={{ flex: 1, backgroundColor: '#f5f5f5' }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#059669']} />}
    >
      {/* Welcome Banner */}
      <View style={{ 
        backgroundColor: '#059669', 
        paddingHorizontal: 20, 
        paddingVertical: 24,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
      }}>
        <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>
          Bienvenue,
        </Text>
        <Text style={{ color: 'white', fontSize: 24, fontWeight: 'bold', marginBottom: 8 }}>
          {user?.prenom || 'Utilisateur'} {user?.nom || ''}
        </Text>
        <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>
          {user?.entrepriseNom || 'Mon Entreprise'}
        </Text>
      </View>

      {/* Quick Stats */}
      <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', color: '#1f2937' }}>Aujourd'hui</Text>
          <TouchableOpacity onPress={() => router.push('/invoices')}>
            <Text style={{ color: '#059669', fontWeight: '500' }}>Voir tout</Text>
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ 
            flex: 1, 
            backgroundColor: 'white', 
            borderRadius: 16, 
            padding: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 4,
            elevation: 2,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <View style={{ 
                backgroundColor: '#ecfdf5', 
                borderRadius: 8, 
                padding: 8,
                marginRight: 8,
              }}>
                <TrendingUp size={20} color="#059669" />
              </View>
              <Text style={{ color: '#6b7280', fontSize: 12 }}>Revenus</Text>
            </View>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1f2937' }}>
              {formatGNF(mockStats.chiffreAffairesJour)}
            </Text>
          </View>

          <View style={{ 
            flex: 1, 
            backgroundColor: 'white', 
            borderRadius: 16, 
            padding: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 4,
            elevation: 2,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <View style={{ 
                backgroundColor: '#fef3c7', 
                borderRadius: 8, 
                padding: 8,
                marginRight: 8,
              }}>
                <FileText size={20} color="#d97706" />
              </View>
              <Text style={{ color: '#6b7280', fontSize: 12 }}>Transactions</Text>
            </View>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1f2937' }}>
              {mockStats.transactionsJour} aujourd'hui
            </Text>
          </View>
        </View>
      </View>

      {/* Mobile Money Balances */}
      <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
        <Text style={{ fontSize: 18, fontWeight: '600', color: '#1f2937', marginBottom: 12 }}>
          Soldes Mobile Money
        </Text>

        <View style={{ flexDirection: 'row', gap: 12 }}>
          {/* Orange Money */}
          <View style={{ 
            flex: 1, 
            backgroundColor: '#fff7ed', 
            borderRadius: 16, 
            padding: 16,
            borderLeftWidth: 4,
            borderLeftColor: '#f97316',
          }}>
            <Text style={{ color: '#f97316', fontWeight: '600', marginBottom: 4 }}>Orange</Text>
            <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#1f2937' }}>
              {formatGNF(mockStats.soldeOrange)}
            </Text>
          </View>

          {/* MTN */}
          <View style={{ 
            flex: 1, 
            backgroundColor: '#fefce8', 
            borderRadius: 16, 
            padding: 16,
            borderLeftWidth: 4,
            borderLeftColor: '#ffcc00',
          }}>
            <Text style={{ color: '#ca8a04', fontWeight: '600', marginBottom: 4 }}>MTN</Text>
            <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#1f2937' }}>
              {formatGNF(mockStats.soldeMTN)}
            </Text>
          </View>

          {/* Wave */}
          <View style={{ 
            flex: 1, 
            backgroundColor: '#ecfeff', 
            borderRadius: 16, 
            padding: 16,
            borderLeftWidth: 4,
            borderLeftColor: '#00b8c8',
          }}>
            <Text style={{ color: '#00b8c8', fontWeight: '600', marginBottom: 4 }}>Wave</Text>
            <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#1f2937' }}>
              {formatGNF(mockStats.soldeWave)}
            </Text>
          </View>
        </View>
      </View>

      {/* Factures en retard */}
      {mockFacturesEnRetard.length > 0 && (
        <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <AlertCircle size={20} color="#dc2626" style={{ marginRight: 8 }} />
            <Text style={{ fontSize: 18, fontWeight: '600', color: '#1f2937' }}>
              Factures en retard
            </Text>
          </View>

          {mockFacturesEnRetard.map((facture) => (
            <TouchableOpacity 
              key={facture.id}
              style={{ 
                backgroundColor: '#fef2f2', 
                borderRadius: 12, 
                padding: 16,
                marginBottom: 8,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
              onPress={() => router.push(`/invoice/${facture.id}`)}
            >
              <View>
                <Text style={{ fontWeight: '600', color: '#1f2937' }}>{facture.numero}</Text>
                <Text style={{ color: '#6b7280', fontSize: 12 }}>{facture.client}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontWeight: 'bold', color: '#dc2626' }}>{formatGNF(facture.montant)}</Text>
                <Text style={{ color: '#dc2626', fontSize: 12 }}>{facture.joursRetard} jours</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Recent Transactions */}
      <View style={{ paddingHorizontal: 20, marginTop: 24, marginBottom: 24 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', color: '#1f2937' }}>
            Transactions récentes
          </Text>
          <TouchableOpacity>
            <Text style={{ color: '#059669', fontWeight: '500' }}>Voir tout</Text>
          </TouchableOpacity>
        </View>

        {mockRecentTransactions.map((tx) => (
          <View 
            key={tx.id}
            style={{ 
              backgroundColor: 'white', 
              borderRadius: 12, 
              padding: 16,
              marginBottom: 8,
              flexDirection: 'row',
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 2,
              elevation: 1,
            }}
          >
            <View style={{ 
              width: 40, 
              height: 40, 
              borderRadius: 20,
              backgroundColor: tx.type === 'RECU' ? '#ecfdf5' : '#fef2f2',
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 12,
            }}>
              {tx.type === 'RECU' ? (
                <ArrowDownLeft size={20} color="#059669" />
              ) : (
                <ArrowUpRight size={20} color="#dc2626" />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '500', color: '#1f2937' }}>{tx.client}</Text>
              <Text style={{ color: '#6b7280', fontSize: 12 }}>
                {tx.operateur} • {tx.date}
              </Text>
            </View>
            <Text style={{ 
              fontWeight: 'bold',
              color: tx.type === 'RECU' ? '#059669' : '#dc2626',
            }}>
              {tx.type === 'RECU' ? '+' : '-'}{formatGNF(tx.montant)}
            </Text>
          </View>
        ))}
      </View>

      {/* Quick Actions */}
      <View style={{ paddingHorizontal: 20, paddingBottom: 24 }}>
        <Text style={{ fontSize: 18, fontWeight: '600', color: '#1f2937', marginBottom: 12 }}>
          Actions rapides
        </Text>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          <TouchableOpacity 
            style={{ 
              flex: 1,
              minWidth: '45%',
              backgroundColor: '#059669', 
              borderRadius: 16, 
              padding: 20,
              alignItems: 'center',
            }}
            onPress={() => router.push('/scan')}
          >
            <Smartphone size={28} color="white" />
            <Text style={{ color: 'white', fontWeight: '600', marginTop: 8 }}>Scanner QR</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={{ 
              flex: 1,
              minWidth: '45%',
              backgroundColor: '#f97316', 
              borderRadius: 16, 
              padding: 20,
              alignItems: 'center',
            }}
          >
            <Wallet size={28} color="white" />
            <Text style={{ color: 'white', fontWeight: '600', marginTop: 8 }}>Paiement</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={{ 
              flex: 1,
              minWidth: '45%',
              backgroundColor: '#6366f1', 
              borderRadius: 16, 
              padding: 20,
              alignItems: 'center',
            }}
          >
            <FileText size={28} color="white" />
            <Text style={{ color: 'white', fontWeight: '600', marginTop: 8 }}>Nouvelle facture</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={{ 
              flex: 1,
              minWidth: '45%',
              backgroundColor: '#8b5cf6', 
              borderRadius: 16, 
              padding: 20,
              alignItems: 'center',
            }}
          >
            <Users size={28} color="white" />
            <Text style={{ color: 'white', fontWeight: '600', marginTop: 8 }}>Nouveau client</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}
