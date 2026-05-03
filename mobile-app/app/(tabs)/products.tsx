/**
 * GuinéaManager Mobile - Products Screen
 * Gestion des produits et stock
 */

import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, RefreshControl,
  StyleSheet, Alert, Modal
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Package, Plus, Search, Edit, Trash2, AlertTriangle,
  TrendingDown, TrendingUp, Filter, X
} from 'lucide-react-native';
import { useOfflineStore } from '@/stores/offline-store';
import { Produit } from '@/types';

export default function ProductsScreen() {
  const router = useRouter();
  const { produits, loadProduits, addProduit, updateProduit, deleteProduit, isOnline } = useOfflineStore();
  
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'low_stock' | 'out_of_stock'>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Produit | null>(null);

  useEffect(() => {
    loadProduits();
  }, [loadProduits]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadProduits();
    setRefreshing(false);
  }, [loadProduits]);

  const filteredProducts = produits.filter(p => {
    const matchesSearch = p.nom.toLowerCase().includes(search.toLowerCase()) ||
                         p.reference.toLowerCase().includes(search.toLowerCase());
    
    if (filter === 'low_stock') return matchesSearch && p.stock > 0 && p.stock <= 10;
    if (filter === 'out_of_stock') return matchesSearch && p.stock === 0;
    return matchesSearch;
  });

  const stats = {
    total: produits.length,
    lowStock: produits.filter(p => p.stock > 0 && p.stock <= 10).length,
    outOfStock: produits.filter(p => p.stock === 0).length,
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    setShowModal(true);
  };

  const handleEditProduct = (product: Produit) => {
    setEditingProduct(product);
    setShowModal(true);
  };

  const handleDeleteProduct = (product: Produit) => {
    Alert.alert(
      'Supprimer le produit',
      `Êtes-vous sûr de vouloir supprimer "${product.nom}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            await deleteProduit(product.id);
          },
        },
      ]
    );
  };

  const formatGNF = (amount: number) => {
    return new Intl.NumberFormat('fr-GN').format(amount) + ' GNF';
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Produits</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAddProduct}>
          <Plus size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <TouchableOpacity 
          style={[styles.statCard, filter === 'all' && styles.statCardActive]}
          onPress={() => setFilter('all')}
        >
          <Package size={20} color={filter === 'all' ? '#059669' : '#6b7280'} />
          <Text style={[styles.statValue, filter === 'all' && styles.statValueActive]}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.statCard, filter === 'low_stock' && styles.statCardWarning]}
          onPress={() => setFilter('low_stock')}
        >
          <TrendingDown size={20} color={filter === 'low_stock' ? '#d97706' : '#6b7280'} />
          <Text style={[styles.statValue, filter === 'low_stock' && styles.statValueWarning]}>{stats.lowStock}</Text>
          <Text style={styles.statLabel}>Stock bas</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.statCard, filter === 'out_of_stock' && styles.statCardDanger]}
          onPress={() => setFilter('out_of_stock')}
        >
          <AlertTriangle size={20} color={filter === 'out_of_stock' ? '#dc2626' : '#6b7280'} />
          <Text style={[styles.statValue, filter === 'out_of_stock' && styles.statValueDanger]}>{stats.outOfStock}</Text>
          <Text style={styles.statLabel}>Rupture</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Search size={20} color="#9ca3af" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Rechercher un produit..."
          placeholderTextColor="#9ca3af"
        />
      </View>

      {/* Products List */}
      <ScrollView
        style={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#059669']} />}
      >
        {filteredProducts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Package size={48} color="#d1d5db" />
            <Text style={styles.emptyText}>Aucun produit trouvé</Text>
            <TouchableOpacity style={styles.emptyButton} onPress={handleAddProduct}>
              <Text style={styles.emptyButtonText}>Ajouter un produit</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredProducts.map((product) => (
            <View key={product.id} style={styles.productCard}>
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{product.nom}</Text>
                <Text style={styles.productReference}>Réf: {product.reference}</Text>
                <View style={styles.productDetails}>
                  <Text style={styles.productPrice}>{formatGNF(product.prixUnitaire)}</Text>
                  <Text style={[
                    styles.productStock,
                    product.stock === 0 ? styles.stockDanger :
                    product.stock <= 10 ? styles.stockWarning : styles.stockOk
                  ]}>
                    Stock: {product.stock}
                  </Text>
                </View>
              </View>
              <View style={styles.productActions}>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => handleEditProduct(product)}
                >
                  <Edit size={18} color="#6b7280" />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => handleDeleteProduct(product)}
                >
                  <Trash2 size={18} color="#dc2626" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Product Modal */}
      <ProductModal
        visible={showModal}
        product={editingProduct}
        onClose={() => setShowModal(false)}
        onSave={async (product) => {
          if (editingProduct) {
            await updateProduit(product.id, product);
          } else {
            await addProduit({
              ...product,
              id: `prod_${Date.now()}`,
            } as Produit);
          }
          setShowModal(false);
        }}
      />
    </View>
  );
}

// Product Modal Component
interface ProductModalProps {
  visible: boolean;
  product: Produit | null;
  onClose: () => void;
  onSave: (product: Partial<Produit>) => void;
}

function ProductModal({ visible, product, onClose, onSave }: ProductModalProps) {
  const [nom, setNom] = useState('');
  const [reference, setReference] = useState('');
  const [prix, setPrix] = useState('');
  const [stock, setStock] = useState('');
  const [categorie, setCategorie] = useState('');

  useEffect(() => {
    if (product) {
      setNom(product.nom);
      setReference(product.reference);
      setPrix(product.prixUnitaire.toString());
      setStock(product.stock.toString());
      setCategorie(product.categorie || '');
    } else {
      setNom('');
      setReference('');
      setPrix('');
      setStock('');
      setCategorie('');
    }
  }, [product, visible]);

  const handleSave = () => {
    if (!nom.trim()) {
      Alert.alert('Erreur', 'Le nom du produit est requis');
      return;
    }

    onSave({
      nom: nom.trim(),
      reference: reference.trim() || `REF_${Date.now()}`,
      prixUnitaire: parseFloat(prix) || 0,
      stock: parseInt(stock, 10) || 0,
      categorie: categorie.trim() || undefined,
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {product ? 'Modifier le produit' : 'Nouveau produit'}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.inputLabel}>Nom du produit *</Text>
            <TextInput
              style={styles.textInput}
              value={nom}
              onChangeText={setNom}
              placeholder="Ex: Riz importé 50kg"
              placeholderTextColor="#9ca3af"
            />

            <Text style={styles.inputLabel}>Référence</Text>
            <TextInput
              style={styles.textInput}
              value={reference}
              onChangeText={setReference}
              placeholder="Ex: RIZ-50KG"
              placeholderTextColor="#9ca3af"
            />

            <Text style={styles.inputLabel}>Prix unitaire (GNF)</Text>
            <TextInput
              style={styles.textInput}
              value={prix}
              onChangeText={setPrix}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor="#9ca3af"
            />

            <Text style={styles.inputLabel}>Stock initial</Text>
            <TextInput
              style={styles.textInput}
              value={stock}
              onChangeText={setStock}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor="#9ca3af"
            />

            <Text style={styles.inputLabel}>Catégorie</Text>
            <TextInput
              style={styles.textInput}
              value={categorie}
              onChangeText={setCategorie}
              placeholder="Ex: Alimentaire"
              placeholderTextColor="#9ca3af"
            />
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Enregistrer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  addButton: {
    backgroundColor: '#059669',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  statCardActive: {
    borderColor: '#059669',
    backgroundColor: '#ecfdf5',
  },
  statCardWarning: {
    borderColor: '#d97706',
    backgroundColor: '#fffbeb',
  },
  statCardDanger: {
    borderColor: '#dc2626',
    backgroundColor: '#fef2f2',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 4,
  },
  statValueActive: {
    color: '#059669',
  },
  statValueWarning: {
    color: '#d97706',
  },
  statValueDanger: {
    color: '#dc2626',
  },
  statLabel: {
    fontSize: 10,
    color: '#6b7280',
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchIcon: {
    marginLeft: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    fontSize: 16,
    color: '#1f2937',
  },
  list: {
    flex: 1,
    padding: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 16,
    marginBottom: 16,
  },
  emptyButton: {
    backgroundColor: '#059669',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  emptyButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  productCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  productReference: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
  },
  productDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '500',
    color: '#059669',
    marginRight: 16,
  },
  productStock: {
    fontSize: 12,
    fontWeight: '500',
  },
  stockOk: {
    color: '#059669',
  },
  stockWarning: {
    color: '#d97706',
  },
  stockDanger: {
    color: '#dc2626',
  },
  productActions: {
    flexDirection: 'row',
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  modalContent: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#1f2937',
    marginBottom: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '500',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#059669',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
