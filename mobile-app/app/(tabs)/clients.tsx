/**
 * GuinéaManager Mobile - Clients Screen
 */

import { View, Text, FlatList, TouchableOpacity, RefreshControl, TextInput } from 'react-native';
import { useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { Search, Plus, Users, Phone, Mail, ChevronRight } from 'lucide-react-native';

// Mock data
const mockClients = [
  { id: '1', nom: 'Mamadou Diallo', telephone: '622 00 00 01', email: 'mamadou@email.com', totalAchats: 5000000, statut: 'ACTIF' },
  { id: '2', nom: 'Fatou Camara', telephone: '664 00 00 02', email: 'fatou@email.com', totalAchats: 3500000, statut: 'ACTIF' },
  { id: '3', nom: 'Alpha Condé', telephone: '625 00 00 03', email: 'alpha@email.com', totalAchats: 8500000, statut: 'ACTIF' },
  { id: '4', nom: 'Mariama Soumah', telephone: '622 00 00 04', email: null, totalAchats: 1200000, statut: 'INACTIF' },
  { id: '5', nom: 'Ibrahima Sow', telephone: '666 00 00 05', email: 'ibrahima@email.com', totalAchats: 4200000, statut: 'ACTIF' },
];

const formatGNF = (amount: number) => {
  return new Intl.NumberFormat('fr-GN').format(amount) + ' GNF';
};

export default function ClientsScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  }, []);

  const filteredClients = mockClients.filter(c => 
    c.nom.toLowerCase().includes(search.toLowerCase()) ||
    c.telephone.includes(search)
  );

  const renderClient = ({ item }: { item: typeof mockClients[0] }) => (
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
    >
      {/* Avatar */}
      <View style={{ 
        width: 48, 
        height: 48, 
        borderRadius: 24,
        backgroundColor: item.statut === 'ACTIF' ? '#ecfdf5' : '#f3f4f6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
      }}>
        <Text style={{ 
          fontSize: 18, 
          fontWeight: 'bold',
          color: item.statut === 'ACTIF' ? '#059669' : '#6b7280',
        }}>
          {item.nom.charAt(0)}
        </Text>
      </View>

      {/* Info */}
      <View style={{ flex: 1 }}>
        <Text style={{ fontWeight: '600', color: '#1f2937', marginBottom: 4 }}>
          {item.nom}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Phone size={12} color="#6b7280" />
            <Text style={{ color: '#6b7280', fontSize: 12, marginLeft: 4 }}>{item.telephone}</Text>
          </View>
          {item.email && (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Mail size={12} color="#6b7280" />
              <Text style={{ color: '#6b7280', fontSize: 12, marginLeft: 4 }}>{item.email}</Text>
            </View>
          )}
        </View>
        <Text style={{ color: '#059669', fontSize: 12, marginTop: 4, fontWeight: '500' }}>
          Achats: {formatGNF(item.totalAchats)}
        </Text>
      </View>

      <ChevronRight size={20} color="#9ca3af" />
    </TouchableOpacity>
  );

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
            placeholder="Rechercher un client..."
            style={{ flex: 1, paddingVertical: 12, paddingHorizontal: 8, fontSize: 16 }}
          />
        </View>

        {/* Stats */}
        <View style={{ flexDirection: 'row', marginTop: 16, gap: 12 }}>
          <View style={{ flex: 1, backgroundColor: '#f3f4f6', borderRadius: 12, padding: 12, alignItems: 'center' }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1f2937' }}>{mockClients.length}</Text>
            <Text style={{ color: '#6b7280', fontSize: 12 }}>Total</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: '#ecfdf5', borderRadius: 12, padding: 12, alignItems: 'center' }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#059669' }}>
              {mockClients.filter(c => c.statut === 'ACTIF').length}
            </Text>
            <Text style={{ color: '#6b7280', fontSize: 12 }}>Actifs</Text>
          </View>
        </View>
      </View>

      {/* Clients List */}
      <FlatList
        data={filteredClients}
        renderItem={renderClient}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 20 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#059669']} />}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <Users size={48} color="#d1d5db" />
            <Text style={{ color: '#6b7280', marginTop: 12 }}>Aucun client trouvé</Text>
          </View>
        }
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
