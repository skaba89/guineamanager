/**
 * GuinéaManager Mobile - Settings Screen
 * Paramètres de l'application
 */

import { View, Text, TouchableOpacity, ScrollView, Alert, Switch, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { 
  User, Building2, Bell, Shield, Smartphone, Globe, 
  Moon, HelpCircle, LogOut, ChevronRight, Wallet,
  FileText, Database, RefreshCw, Trash2, Cloud, CloudOff,
  CheckCircle, AlertCircle
} from 'lucide-react-native';
import { useAuthStore } from '@/stores/auth-store';
import { useOfflineStore } from '@/stores/offline-store';
import { syncService } from '@/lib/sync-service';
import { offlineDB } from '@/lib/offline-db';

interface SettingItemProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  danger?: boolean;
}

function SettingItem({ icon, title, subtitle, onPress, rightElement, danger }: SettingItemProps) {
  return (
    <TouchableOpacity 
      style={{ 
        flexDirection: 'row', 
        alignItems: 'center', 
        paddingVertical: 16,
        paddingHorizontal: 4,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
      }}
      onPress={onPress}
      disabled={!onPress && !rightElement}
    >
      <View style={{ 
        width: 40, 
        height: 40, 
        borderRadius: 10,
        backgroundColor: danger ? '#fef2f2' : '#f3f4f6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
      }}>
        {icon}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontWeight: '500', color: danger ? '#dc2626' : '#1f2937' }}>{title}</Text>
        {subtitle && <Text style={{ color: '#6b7280', fontSize: 12, marginTop: 2 }}>{subtitle}</Text>}
      </View>
      {rightElement || (onPress && <ChevronRight size={20} color="#9ca3af" />)}
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { isOnline, isSyncing, lastSync, pendingCount, sync, loadAll } = useOfflineStore();
  const [notifications, setNotifications] = useState(true);
  const [biometric, setBiometric] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [storageSize, setStorageSize] = useState('0 Mo');
  const [isSyncingNow, setIsSyncingNow] = useState(false);

  useEffect(() => {
    calculateStorageSize();
  }, []);

  const calculateStorageSize = async () => {
    const info = await offlineDB.getStorageInfo();
    const totalBytes = info.reduce((sum, item) => sum + item.size, 0);
    const totalMB = (totalBytes / (1024 * 1024)).toFixed(1);
    setStorageSize(`${totalMB} Mo`);
  };

  const formatLastSync = (timestamp: number | null): string => {
    if (!timestamp) return 'Jamais synchronisé';
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `Il y a ${days} jour${days > 1 ? 's' : ''}`;
    if (hours > 0) return `Il y a ${hours}h`;
    if (minutes > 0) return `Il y a ${minutes}min`;
    return 'À l\'instant';
  };

  const handleSync = async () => {
    if (!isOnline) {
      Alert.alert('Hors-ligne', 'Connectez-vous à Internet pour synchroniser vos données.');
      return;
    }
    
    setIsSyncingNow(true);
    try {
      await sync();
      await loadAll();
      await calculateStorageSize();
      Alert.alert('Synchronisation', 'Vos données ont été synchronisées avec succès.');
    } catch (error) {
      Alert.alert('Erreur', 'Une erreur est survenue lors de la synchronisation.');
    } finally {
      setIsSyncingNow(false);
    }
  };

  const handleClearOfflineData = () => {
    Alert.alert(
      'Effacer les données hors-ligne',
      'Cette action supprimera toutes les données stockées localement. Vos données restent sur le serveur.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Effacer',
          style: 'destructive',
          onPress: async () => {
            await offlineDB.clearAll();
            await loadAll();
            await calculateStorageSize();
            Alert.alert('Succès', 'Les données locales ont été effacées.');
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Déconnexion', 
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          }
        },
      ]
    );
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      {/* Profile Card */}
      <View style={{ 
        backgroundColor: 'white', 
        margin: 20, 
        borderRadius: 16, 
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ 
            width: 64, 
            height: 64, 
            borderRadius: 32,
            backgroundColor: '#059669',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <Text style={{ fontSize: 28, fontWeight: 'bold', color: 'white' }}>
              {user?.prenom?.charAt(0) || 'U'}
            </Text>
          </View>
          <View style={{ marginLeft: 16, flex: 1 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: '#1f2937' }}>
              {user?.prenom} {user?.nom}
            </Text>
            <Text style={{ color: '#6b7280', marginTop: 2 }}>{user?.email}</Text>
            <Text style={{ color: '#059669', fontSize: 12, marginTop: 4, fontWeight: '500' }}>
              {user?.entrepriseNom}
            </Text>
          </View>
        </View>
      </View>

      {/* Sync Status Card */}
      <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
        <View style={{ 
          backgroundColor: isOnline ? '#ecfdf5' : '#fef3c7', 
          borderRadius: 16,
          padding: 16,
          borderWidth: 1,
          borderColor: isOnline ? '#d1fae5' : '#fde68a',
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            {isOnline ? (
              <Cloud size={24} color="#059669" />
            ) : (
              <CloudOff size={24} color="#d97706" />
            )}
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={{ fontWeight: '600', color: '#1f2937' }}>
                {isOnline ? 'En ligne' : 'Mode hors-ligne'}
              </Text>
              <Text style={{ color: '#6b7280', fontSize: 12 }}>
                Dernière sync: {formatLastSync(lastSync)}
              </Text>
            </View>
            {isSyncingNow && <ActivityIndicator color="#059669" />}
          </View>

          {pendingCount > 0 && (
            <View style={{ 
              backgroundColor: '#fffbeb', 
              borderRadius: 8, 
              padding: 10, 
              marginBottom: 12,
              flexDirection: 'row',
              alignItems: 'center',
            }}>
              <AlertCircle size={16} color="#d97706" style={{ marginRight: 8 }} />
              <Text style={{ color: '#92400e', fontSize: 12, flex: 1 }}>
                {pendingCount} opération{pendingCount > 1 ? 's' : ''} en attente de synchronisation
              </Text>
            </View>
          )}

          <TouchableOpacity 
            onPress={handleSync}
            disabled={!isOnline || isSyncingNow}
            style={{ 
              backgroundColor: isOnline ? '#059669' : '#9ca3af', 
              borderRadius: 10,
              paddingVertical: 12,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <RefreshCw size={18} color="white" style={{ marginRight: 8 }} />
            <Text style={{ color: 'white', fontWeight: '600' }}>
              {isSyncingNow ? 'Synchronisation...' : 'Synchroniser maintenant'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Account Settings */}
      <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
        <Text style={{ color: '#6b7280', fontWeight: '500', marginBottom: 8, marginLeft: 4 }}>
          COMPTE
        </Text>
        <View style={{ 
          backgroundColor: 'white', 
          borderRadius: 16,
          paddingHorizontal: 16,
        }}>
          <SettingItem 
            icon={<User size={20} color="#059669" />}
            title="Mon profil"
            subtitle="Modifier vos informations personnelles"
            onPress={() => {}}
          />
          <SettingItem 
            icon={<Building2 size={20} color="#059669" />}
            title="Mon entreprise"
            subtitle="Gérer les informations de l'entreprise"
            onPress={() => {}}
          />
          <SettingItem 
            icon={<Shield size={20} color="#059669" />}
            title="Sécurité"
            subtitle="Mot de passe, authentification 2FA"
            onPress={() => {}}
          />
          <View style={{ borderBottomWidth: 0 }}>
            <SettingItem 
              icon={<Smartphone size={20} color="#059669" />}
              title="Authentification biométrique"
              subtitle="Face ID / Empreinte digitale"
              rightElement={
                <Switch
                  value={biometric}
                  onValueChange={setBiometric}
                  trackColor={{ false: '#e5e7eb', true: '#a7f3d0' }}
                  thumbColor={biometric ? '#059669' : '#f4f3f4'}
                />
              }
            />
          </View>
        </View>
      </View>

      {/* Mobile Money */}
      <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
        <Text style={{ color: '#6b7280', fontWeight: '500', marginBottom: 8, marginLeft: 4 }}>
          MOBILE MONEY
        </Text>
        <View style={{ 
          backgroundColor: 'white', 
          borderRadius: 16,
          paddingHorizontal: 16,
        }}>
          <SettingItem 
            icon={<Wallet size={20} color="#f97316" />}
            title="Orange Money"
            subtitle="622 12 34 56 • Connecté"
            onPress={() => {}}
          />
          <SettingItem 
            icon={<Wallet size={20} color="#eab308" />}
            title="MTN Mobile Money"
            subtitle="664 98 76 54 • Connecté"
            onPress={() => {}}
          />
          <View style={{ borderBottomWidth: 0 }}>
            <SettingItem 
              icon={<Wallet size={20} color="#00b8c8" />}
              title="Wave"
              subtitle="622 55 55 55 • Connecté"
              onPress={() => {}}
            />
          </View>
        </View>
      </View>

      {/* App Settings */}
      <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
        <Text style={{ color: '#6b7280', fontWeight: '500', marginBottom: 8, marginLeft: 4 }}>
          APPLICATION
        </Text>
        <View style={{ 
          backgroundColor: 'white', 
          borderRadius: 16,
          paddingHorizontal: 16,
        }}>
          <SettingItem 
            icon={<Bell size={20} color="#6366f1" />}
            title="Notifications"
            rightElement={
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: '#e5e7eb', true: '#a7f3d0' }}
                thumbColor={notifications ? '#059669' : '#f4f3f4'}
              />
            }
          />
          <SettingItem 
            icon={<Moon size={20} color="#6366f1" />}
            title="Mode sombre"
            rightElement={
              <Switch
                value={darkMode}
                onValueChange={setDarkMode}
                trackColor={{ false: '#e5e7eb', true: '#a7f3d0' }}
                thumbColor={darkMode ? '#059669' : '#f4f3f4'}
              />
            }
          />
          <SettingItem 
            icon={<Globe size={20} color="#6366f1" />}
            title="Langue"
            subtitle="Français"
            onPress={() => {}}
          />
          <SettingItem 
            icon={<Database size={20} color="#6366f1" />}
            title="Données hors-ligne"
            subtitle={`${storageSize} utilisés • ${pendingCount} en attente`}
            onPress={() => {}}
          />
          <View style={{ borderBottomWidth: 0 }}>
            <SettingItem 
              icon={<Trash2 size={20} color="#dc2626" />}
              title="Effacer les données locales"
              subtitle="Libérer de l'espace de stockage"
              onPress={handleClearOfflineData}
              danger
            />
          </View>
        </View>
      </View>

      {/* Support */}
      <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
        <Text style={{ color: '#6b7280', fontWeight: '500', marginBottom: 8, marginLeft: 4 }}>
          SUPPORT
        </Text>
        <View style={{ 
          backgroundColor: 'white', 
          borderRadius: 16,
          paddingHorizontal: 16,
        }}>
          <SettingItem 
            icon={<HelpCircle size={20} color="#6b7280" />}
            title="Centre d'aide"
            onPress={() => {}}
          />
          <View style={{ borderBottomWidth: 0 }}>
            <SettingItem 
              icon={<FileText size={20} color="#6b7280" />}
              title="Conditions d'utilisation"
              onPress={() => {}}
            />
          </View>
        </View>
      </View>

      {/* Logout */}
      <View style={{ paddingHorizontal: 20, marginBottom: 40 }}>
        <View style={{ 
          backgroundColor: 'white', 
          borderRadius: 16,
          paddingHorizontal: 16,
        }}>
          <View style={{ borderBottomWidth: 0 }}>
            <SettingItem 
              icon={<LogOut size={20} color="#dc2626" />}
              title="Déconnexion"
              onPress={handleLogout}
              danger
            />
          </View>
        </View>
      </View>

      {/* Version */}
      <View style={{ alignItems: 'center', paddingBottom: 20 }}>
        <Text style={{ color: '#9ca3af', fontSize: 12 }}>GuinéaManager v1.0.0</Text>
        <Text style={{ color: '#d1d5db', fontSize: 10, marginTop: 4 }}>© 2024 GuinéaManager SARL</Text>
      </View>
    </ScrollView>
  );
}
