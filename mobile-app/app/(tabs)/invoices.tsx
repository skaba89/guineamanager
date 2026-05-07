/**
 * GuinéaManager Mobile - Invoices Screen
 */

import { View, Text, FlatList, TouchableOpacity, RefreshControl, TextInput } from 'react-native';
import { useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { Search, Filter, Plus, FileText, AlertCircle, CheckCircle, Clock, Send } from 'lucide-react-native';

// Mock data
const mockFactures = [
  { id: '1', numero: 'F-2024-001', client: 'Mamadou Diallo', montant: 1500000, statut: 'PAYEE', date: '2024-05-01' },
  { id: '2', numero: 'F-2024-002', client: 'Fatou Camara', montant: 850000, statut: 'ENVOYEE', date: '2024-05-02' },
  { id: '3', numero: 'F-2024-003', client: 'Alpha Condé', montant: 2200000, statut: 'EN_RETARD', date: '2024-04-15' },
  { id: '4', numero: 'F-2024-004', client: 'Mariama Soumah', montant: 450000, statut: 'BROUILLON', date: '2024-05-03' },
  { id: '5', numero: 'F-2024-005', client: 'Ibrahima Sow', montant: 1800000, statut: 'PAYEE', date: '2024-05-01' },
];

const formatGNF = (amount: number) => {
  return new Intl.NumberFormat('fr-GN').format(amount) + ' GNF';
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('fr-GN', { day: 'numeric', month: 'short', year: 'numeric' });
};

export default function InvoicesScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<string | null>(null);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  }, []);

  const getStatutConfig = (statut: string) => {
    switch (statut) {
      case 'PAYEE':
        return { label: 'Payée', color: '#059669', bgColor: '#ecfdf5', icon: CheckCircle };
      case 'ENVOYEE':
        return { label: 'Envoyée', color: '#2563eb', bgColor: '#eff6ff', icon: Send };
      case 'EN_RETARD':
        return { label: 'En retard', color: '#dc2626', bgColor: '#fef2f2', icon: AlertCircle };
      case 'BROUILLON':
        return { label: 'Brouillon', color: '#6b7280', bgColor: '#f3f4f6', icon: Clock };
      default:
        return { label: statut, color: '#6b7280', bgColor: '#f3f4f6', icon: FileText };
    }
  };

  const filteredFactures = mockFactures.filter(f => {
    const matchSearch = f.numero.toLowerCase().includes(search.toLowerCase()) ||
                        f.client.toLowerCase().includes(search.toLowerCase());
    const matchFilter = !filter || f.statut === filter;
    return matchSearch && matchFilter;
  });

  const renderFacture = ({ item }: { item: typeof mockFactures[0] }) => {
    const config = getStatutConfig(item.statut);
    const Icon = config.icon;

    return (
      <TouchableOpacity 
        style={{ 
          backgroundColor: 'white', 
          borderRadius: 12, 
          padding: 16,
          marginBottom: 12,
          flexDirection: 'row',
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 2,
          elevation: 1,
        }}
        onPress={() => router.push(`/invoice/${item.id}`)}
      >
        <View style={{ 
          width: 48, 
          height: 48, 
          borderRadius: 12,
          backgroundColor: config.bgColor,
          justifyContent: 'center',
          alignItems: 'center',
          marginRight: 12,
        }}>
          <Icon size={24} color={config.color} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontWeight: '600', color: '#1f2937' }}>{item.numero}</Text>
            <Text style={{ fontWeight: 'bold', color: '#1f2937' }}>{formatGNF(item.montant)}</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
            <Text style={{ color: '#6b7280', fontSize: 14 }}>{item.client}</Text>
            <Text style={{ color: config.color, fontSize: 12, fontWeight: '500' }}>{config.label}</Text>
          </View>
          <Text style={{ color: '#9ca3af', fontSize: 12, marginTop: 2 }}>{formatDate(item.date)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      {/* Search Bar */}
      <View style={{ paddingHorizontal: 20, paddingVertical: 16, backgroundColor: 'white' }}>
        <View style={{ 
          flexDirection: 'row', 
          alignItems: 'center', 
          backgroundColor: '#f3f4f6', 
          borderRadius: 12,
          paddingHorizontal: 12,
        }}>
          <Search size={20} color="#9ca3af" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Rechercher une facture..."
            style={{ flex: 1, paddingVertical: 12, paddingHorizontal: 8, fontSize: 16 }}
          />
        </View>

        {/* Filters */}
        <View style={{ flexDirection: 'row', marginTop: 12, gap: 8 }}>
          {['PAYEE', 'ENVOYEE', 'EN_RETARD', 'BROUILLON'].map((statut) => {
            const config = getStatutConfig(statut);
            return (
              <TouchableOpacity
                key={statut}
                onPress={() => setFilter(filter === statut ? null : statut)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 20,
                  backgroundColor: filter === statut ? config.color : '#f3f4f6',
                }}
              >
                <Text style={{ 
                  color: filter === statut ? 'white' : config.color, 
                  fontWeight: '500',
                  fontSize: 12,
                }}>
                  {config.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Invoices List */}
      <FlatList
        data={filteredFactures}
        renderItem={renderFacture}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 20 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#059669']} />}
        showsVerticalScrollIndicator={false}
      />

      {/* Add Button */}
      <TouchableOpacity 
        style={{ 
          position: 'absolute',
          right: 20,
          bottom: 20,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: '#059669',
          justifyContent: 'center',
          alignItems: 'center',
          shadowColor: '#059669',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 4,
        }}
      >
        <Plus size={24} color="white" />
      </TouchableOpacity>
    </View>
  );
}
